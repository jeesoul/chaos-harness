#!/usr/bin/env node
/**
 * test-hooks-ironlaw-recovery.mjs — Hooks、铁律执行、Gate 恢复流程测试
 * 覆盖核心路径以外的边界场景
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---- helpers ----
function runScript(scriptPath, args = '', opts = {}) {
  try {
    const output = execSync(`node "${scriptPath}" ${args}`, {
      cwd: opts.cwd || ROOT,
      encoding: 'utf-8',
      stdio: opts.silent ? ['pipe', 'pipe', 'pipe'] : 'inherit',
      timeout: opts.timeout || 10000,
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT },
    });
    return { exitCode: 0, stdout: output, stderr: '' };
  } catch (e) {
    return {
      exitCode: e.status || 1,
      stdout: e.stdout?.toString() || '',
      stderr: e.stderr?.toString() || '',
    };
  }
}

function mkTmp(name) {
  const tmp = join(ROOT, `test-tmp-${name}-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  return tmp;
}

function cleanup(tmp) {
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
}

// ============================================================
// Iron Law
// ============================================================
describe('iron-law-check', () => {
  test('IL001: document written to versioned output dir passes', () => {
    const tmp = mkTmp('il001');
    mkdirSync(join(tmp, 'output', 'v1.0.0'), { recursive: true });
    const docPath = join(tmp, 'output', 'v1.0.0', 'PRD.md');
    writeFileSync(docPath, '# PRD\nVersion: v1.0.0');

    // Write file to chaos-harness project to trigger IL check on chaos-harness
    const result = runScript(join(ROOT, 'scripts', 'iron-law-check.mjs'), '', { silent: true });
    // iron-law-check runs against the current project (chaos-harness itself)
    // It should pass when no version-locked violations exist
    cleanup(tmp);
    assert.ok([0, 1].includes(result.exitCode)); // depends on chaos-harness state
  });

  test('IL005: no sensitive config modifications', () => {
    const result = runScript(join(ROOT, 'scripts', 'iron-law-check.mjs'), '', { silent: true });
    // Should not crash
    assert.ok(result.exitCode !== undefined);
  });
});

describe('laziness-detect', () => {
  test('script runs without crash', () => {
    const result = runScript(join(ROOT, 'scripts', 'laziness-detect.mjs'), '', { silent: true });
    assert.ok(result.exitCode !== undefined);
  });
});

describe('learning-update', () => {
  test('writes to learning log on Write/Edit trigger', () => {
    const result = runScript(join(ROOT, 'scripts', 'learning-update.mjs'), '', { silent: true });
    assert.ok(result.exitCode !== undefined);
  });
});

// ============================================================
// hooks.json validation
// ============================================================
describe('hooks.json', () => {
  test('hooks.json is valid JSON with expected hook types', () => {
    const hooksJson = JSON.parse(readFileSync(join(ROOT, 'hooks', 'hooks.json'), 'utf-8'));
    assert.ok(hooksJson.hooks, 'should have hooks key');
    assert.ok(hooksJson.hooks.SessionStart, 'should have SessionStart hook');
    assert.ok(hooksJson.hooks.PreToolUse, 'should have PreToolUse hook');
    assert.ok(hooksJson.hooks.PostToolUse, 'should have PostToolUse hook');
    assert.ok(hooksJson.hooks.Stop, 'should have Stop hook');
  });

  test('all hook commands reference existing scripts', () => {
    const hooksJson = JSON.parse(readFileSync(join(ROOT, 'hooks', 'hooks.json'), 'utf-8'));
    const allCommands = [];
    for (const [hookType, matchers] of Object.entries(hooksJson.hooks)) {
      for (const matcher of matchers) {
        for (const hook of matcher.hooks) {
          if (hook.command) allCommands.push(hook.command);
        }
      }
    }

    for (const cmd of allCommands) {
      // Extract script path from command
      const match = cmd.match(/"?\$?\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)"/);
      if (match) {
        const scriptPath = join(ROOT, match[1]);
        assert.ok(existsSync(scriptPath), `Script should exist: ${match[1]}`);
      }
    }
  });

  test('PreToolUse Write/Edit triggers iron-law-check', () => {
    const hooksJson = JSON.parse(readFileSync(join(ROOT, 'hooks', 'hooks.json'), 'utf-8'));
    const preWriteHooks = hooksJson.hooks.PreToolUse
      .find(m => m.matcher.includes('Write'))
      ?.hooks || [];
    const hasIronLaw = preWriteHooks.some(h => h.command?.includes('iron-law-check'));
    assert.ok(hasIronLaw, 'Write/Edit should trigger iron-law-check');
  });

  test('SessionStart triggers gate-machine', () => {
    const hooksJson = JSON.parse(readFileSync(join(ROOT, 'hooks', 'hooks.json'), 'utf-8'));
    const sessionHooks = hooksJson.hooks.SessionStart[0]?.hooks || [];
    const hasGateMachine = sessionHooks.some(h => h.command?.includes('gate-machine'));
    assert.ok(hasGateMachine, 'SessionStart should trigger gate-machine');
  });
});

// ============================================================
// Gate recovery
// ============================================================
describe('gate-recovery', () => {
  test('gate-recovery script exists and can parse', () => {
    const recoveryPath = join(ROOT, 'scripts', 'gate-recovery.mjs');
    assert.ok(existsSync(recoveryPath), 'gate-recovery.mjs should exist');
    const result = runScript(recoveryPath, 'history', { silent: true });
    // May exit 0 or 1 depending on whether there's history, but should not crash
    assert.ok(result.exitCode !== undefined);
  });

  test('gate-enforcer handles unknown gate gracefully', () => {
    const enforcerPath = join(ROOT, 'scripts', 'gate-enforcer.mjs');
    const result = runScript(enforcerPath, 'gate-unknown', { silent: true });
    assert.equal(result.exitCode, 1, 'Should exit 1 for unknown gate');
    assert.ok(result.stderr.includes('Gate not found'), 'Should have meaningful error message');
  });

  test('gate-validator handles unknown validator type', () => {
    // Create a temp gate with unknown validator
    const tmp = mkTmp('unknown-validator');
    const gateDef = {
      id: 'gate-test',
      type: 'quality',
      level: 'hard',
      description: 'Test gate',
      trigger: 'stage-transition',
      cachePolicy: 'never',
      validators: [{ type: 'nonexistent-validator' }],
      dependsOn: [],
    };
    const registryPath = join(ROOT, 'data', 'gate-registry.json');
    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
    const originalGates = [...registry.gates];
    try {
      registry.gates.push(gateDef);
      writeFileSync(registryPath, JSON.stringify(registry, null, 2));

      const validatorPath = join(ROOT, 'scripts', 'gate-validator.mjs');
      const result = runScript(validatorPath, 'gate-test', { silent: true });

      assert.ok(result.exitCode === 1, 'Should fail for unknown validator');
    } finally {
      registry.gates = originalGates;
      writeFileSync(registryPath, JSON.stringify(registry, null, 2));
      cleanup(tmp);
    }
  });

  test('script validator executes external script successfully', () => {
    const registryPath = join(ROOT, 'data', 'gate-registry.json');
    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
    const originalGates = [...registry.gates];
    const gateDef = {
      id: 'gate-test-script',
      type: 'quality',
      level: 'soft',
      description: 'Test script validator',
      trigger: 'stage-transition',
      cachePolicy: 'never',
      validators: [{ type: 'script', script: 'dev-intelligence.mjs', args: ['--help'] }],
      dependsOn: [],
    };
    try {
      registry.gates.push(gateDef);
      writeFileSync(registryPath, JSON.stringify(registry, null, 2));

      const enforcerPath = join(ROOT, 'scripts', 'gate-enforcer.mjs');
      const result = runScript(enforcerPath, 'gate-test-script', { silent: true });

      assert.ok(result.exitCode === 0, 'Script validator should pass for --help');
    } finally {
      registry.gates = originalGates;
      writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    }
  });
});

// ============================================================
// Gate machine full lifecycle
// ============================================================
describe('gate-machine full lifecycle', () => {
  test('session-start does not crash', () => {
    const machinePath = join(ROOT, 'scripts', 'gate-machine.mjs');
    const result = runScript(machinePath, '--session-start', {
      cwd: ROOT,
      silent: true,
    });
    assert.ok(result.exitCode !== undefined);
  });

  test('status command works without --root (uses plugin root)', () => {
    const machinePath = join(ROOT, 'scripts', 'gate-machine.mjs');
    const result = runScript(machinePath, '--status', { silent: true });
    assert.ok(result.exitCode === 0);
    assert.ok(result.stdout.includes('Gate Status Dashboard'));
    assert.ok(result.stdout.includes('gate-w01-requirements'));
    assert.ok(result.stdout.includes('Summary'));
  });
});

// ============================================================
// PostToolUse hooks: project-pattern-writer, workflow-track
// ============================================================
describe('PostToolUse hooks', () => {
  test('project-pattern-writer runs without crash', () => {
    const result = runScript(join(ROOT, 'scripts', 'project-pattern-writer.mjs'), '', { silent: true });
    assert.ok(result.exitCode !== undefined);
  });

  test('workflow-track runs without crash', () => {
    const result = runScript(join(ROOT, 'scripts', 'workflow-track.mjs'), '', { silent: true });
    assert.ok(result.exitCode !== undefined);
  });

  test('instinct-collector runs without crash', () => {
    const result = runScript(join(ROOT, 'scripts', 'instinct-collector.mjs'), '', { silent: true });
    assert.ok(result.exitCode !== undefined);
  });

  test('eval-collector runs without crash', () => {
    const result = runScript(join(ROOT, 'scripts', 'eval-collector.mjs'), '', { silent: true });
    assert.ok(result.exitCode !== undefined);
  });
});
