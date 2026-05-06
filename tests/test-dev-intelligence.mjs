import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, unlinkSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCRIPT = join(ROOT, 'scripts', 'dev-intelligence.mjs');

function runCli(args) {
  try {
    const output = execSync(`node "${SCRIPT}" ${args}`, { cwd: ROOT, encoding: 'utf-8' });
    return { stdout: output, exitCode: 0 };
  } catch (e) {
    return { stdout: e.stdout?.toString() || '', stderr: e.stderr?.toString() || '', exitCode: e.status || 1 };
  }
}

describe('dev-intelligence CLI', () => {
  describe('search mode', () => {
    test('query returns results', () => {
      const r = runCli('--query "测试" --domain gate-patterns');
      assert.equal(r.exitCode, 0);
      assert.ok(r.stdout.includes('PRD') || r.stdout.includes('gate') || r.stdout.includes('GP'));
    });

    test('unknown domain returns error', () => {
      const r = runCli('--query "test" --domain unknown');
      // CLI outputs human-readable text, JSON goes to intelligence-result.json
      assert.ok(r.stdout.includes('错误') || r.stdout.includes('error') || r.stderr.length > 0,
        'should indicate error for unknown domain');
    });
  });

  describe('persist mode', () => {
    test('write and read decision', () => {
      const r = runCli('persist --type decision --subject "test" --value "test-value" --evidence "test"');
      assert.equal(r.exitCode, 0);
      const decisionsPath = join(ROOT, '.chaos-harness', 'intelligence-decisions.jsonl');
      assert.ok(existsSync(decisionsPath), 'decisions file should exist');
      const lastLine = readFileSync(decisionsPath, 'utf-8').trim().split('\n').pop();
      const decision = JSON.parse(lastLine);
      assert.equal(decision.subject, 'test');
      assert.equal(decision.value, 'test-value');
    });
  });

  describe('generate-gate mode', () => {
    test('generates valid gate JSON for vue/testing', () => {
      const r = runCli('generate-gate --stage testing --stack vue --level hard');
      assert.equal(r.exitCode, 0);
      // Find the generated file
      const match = r.stdout.match(/Gate generated: (.+)/);
      assert.ok(match, 'should output generated path');
      const filePath = match[1].trim();
      assert.ok(existsSync(filePath), 'gate file should exist');
      const gate = JSON.parse(readFileSync(filePath, 'utf-8'));
      // Validate required gate schema fields
      assert.ok(gate.id, 'gate should have id');
      assert.equal(gate.type, 'quality', 'gate type should be quality');
      assert.ok(['hard', 'soft'].includes(gate.level), 'gate level should be hard or soft');
      assert.ok(Array.isArray(gate.validators), 'gate should have validators array');
      assert.ok(Array.isArray(gate.dependsOn), 'gate should have dependsOn array');
    });
  });

  describe('fallback behavior', () => {
    test('python fallback works when search.py missing', () => {
      // Temporarily rename search.py
      const searchPy = join(ROOT, 'scripts', 'search.py');
      const backupPy = join(ROOT, 'scripts', 'search.py.bak');
      const hasSearchPy = existsSync(searchPy);
      if (hasSearchPy) {
        renameSync(searchPy, backupPy);
      }
      try {
        const r = runCli('--query "test" --domain gate-patterns');
        // Should still return results via keyword fallback
        assert.ok(r.stdout.includes('results') || r.stdout.includes('gate') || r.stdout.includes('GP'));
      } finally {
        if (existsSync(backupPy)) {
          renameSync(backupPy, searchPy);
        }
      }
    });
  });
});
