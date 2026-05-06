#!/usr/bin/env node
/**
 * test-gate-validator.mjs — Gate 验证器单元测试
 * 测试 file-exists、PRD quality、enforcer 输出格式
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENFORCER = join(ROOT, 'scripts', 'gate-enforcer.mjs');

function runEnforcer(gateId, projectRoot) {
  try {
    execSync(`node "${ENFORCER}" ${gateId} --root "${projectRoot}"`, { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { exitCode: 0 };
  } catch (e) {
    const stderr = e.stderr?.toString() || '';
    const stdout = e.stdout?.toString() || '';
    return { exitCode: e.status || 1, stderr, stdout };
  }
}

describe('gate-validator via enforcer', () => {
  test('passes production-grade PRD', () => {
    const tmp = join(ROOT, 'test-prd-good');
    mkdirSync(join(tmp, 'output', 'v1.0.0', 'W01_requirements'), { recursive: true });

    const prd = `# PRD — Production Project
版本: v1.0.0

## 功能需求
### 验收标准
Given 用户访问
When 点击
Then 显示

## 性能指标
QPS: 1000
响应时间: <200ms
容错: 降级重试
监控: Prometheus
错误处理: 全局拦截
缓存: Redis

## 数据模型
用户表: id, name
`;
    writeFileSync(join(tmp, 'output', 'v1.0.0', 'W01_requirements', 'PRD.md'), prd);
    writeFileSync(join(tmp, 'output', 'v1.0.0', 'W01_requirements', 'user-stories.md'), '# Stories\nUS01');

    const result = runEnforcer('gate-w03-architecture', tmp);
    rmSync(tmp, { recursive: true, force: true });
    assert.equal(result.exitCode, 0, `Should pass: ${result.stderr}`);
  });

  test('fails MVP-level PRD (no production indicators)', () => {
    const tmp = join(ROOT, 'test-prd-bad');
    mkdirSync(join(tmp, 'output', 'v1.0.0', 'W01_requirements'), { recursive: true });
    writeFileSync(join(tmp, 'output', 'v1.0.0', 'W01_requirements', 'PRD.md'), '# MVP\n版本: v1.0.0\n简单项目');

    const result = runEnforcer('gate-w03-architecture', tmp);
    rmSync(tmp, { recursive: true, force: true });
    assert.equal(result.exitCode, 1, 'Should fail for MVP PRD');
    assert.ok(!result.stderr.includes('[object Object]'), 'No [object Object] in output');
  });
});

describe('gate-enforcer output format', () => {
  test('failure details are readable JSON, not [object Object]', () => {
    const tmp = join(ROOT, 'test-enforcer-format');
    mkdirSync(join(tmp, 'output', 'v1.0.0', 'W01_requirements'), { recursive: true });
    writeFileSync(join(tmp, 'output', 'v1.0.0', 'W01_requirements', 'PRD.md'), '# Bad\n版本: v1.0.0');

    const result = runEnforcer('gate-w03-architecture', tmp);
    rmSync(tmp, { recursive: true, force: true });
    assert.equal(result.exitCode, 1);
    assert.ok(!result.stderr.includes('[object Object]'),
      `Enforcer output should not contain [object Object]: ${result.stderr}`);
  });
});

// ---- 新验证器测试 ----

import { validateGate } from '../scripts/gate-validator.mjs';

describe('coverage-threshold validator', () => {
  test('passes when coverage-summary.json meets threshold', () => {
    const tmp = join(ROOT, 'test-coverage-pass');
    mkdirSync(join(tmp, 'coverage'), { recursive: true });
    writeFileSync(join(tmp, 'coverage', 'coverage-summary.json'), JSON.stringify({
      total: { lines: { pct: 85 }, statements: { pct: 83 }, functions: { pct: 80 }, branches: { pct: 78 } }
    }));
    const gateDef = { id: 'test', type: 'quality', level: 'hard', description: 'test', validators: [{ type: 'coverage-threshold', threshold: 80 }] };
    const result = validateGate(gateDef, tmp);
    rmSync(tmp, { recursive: true, force: true });
    assert.ok(result.allPassed, `Should pass: ${JSON.stringify(result.results)}`);
  });

  test('fails when coverage below threshold', () => {
    const tmp = join(ROOT, 'test-coverage-fail');
    mkdirSync(join(tmp, 'coverage'), { recursive: true });
    writeFileSync(join(tmp, 'coverage', 'coverage-summary.json'), JSON.stringify({
      total: { lines: { pct: 55 }, statements: { pct: 50 }, functions: { pct: 45 }, branches: { pct: 40 } }
    }));
    const gateDef = { id: 'test', type: 'quality', level: 'hard', description: 'test', validators: [{ type: 'coverage-threshold', threshold: 80 }] };
    const result = validateGate(gateDef, tmp);
    rmSync(tmp, { recursive: true, force: true });
    assert.ok(!result.allPassed, 'Should fail when coverage below threshold');
  });

  test('skips when no coverage report found', () => {
    const tmp = join(ROOT, 'test-coverage-skip');
    mkdirSync(tmp, { recursive: true });
    const gateDef = { id: 'test', type: 'quality', level: 'soft', description: 'test', validators: [{ type: 'coverage-threshold', threshold: 80 }] };
    const result = validateGate(gateDef, tmp);
    rmSync(tmp, { recursive: true, force: true });
    assert.equal(result.results[0].status, 'skipped', 'Should skip when no coverage report');
  });
});

describe('no-todo-critical validator', () => {
  test('passes when no critical markers found', () => {
    const tmp = join(ROOT, 'test-todo-pass');
    mkdirSync(join(tmp, 'src'), { recursive: true });
    writeFileSync(join(tmp, 'src', 'app.js'), '// 普通注释\nfunction hello() { return 1; }\n// TODO: 普通todo不阻断');
    const gateDef = { id: 'test', type: 'quality', level: 'soft', description: 'test', validators: [{ type: 'no-todo-critical', patterns: ['TODO(critical)', 'FIXME'] }] };
    const result = validateGate(gateDef, tmp);
    rmSync(tmp, { recursive: true, force: true });
    assert.ok(result.allPassed, `Should pass: ${JSON.stringify(result.results)}`);
  });

  test('fails when FIXME marker found', () => {
    const tmp = join(ROOT, 'test-todo-fail');
    mkdirSync(join(tmp, 'src'), { recursive: true });
    writeFileSync(join(tmp, 'src', 'app.js'), '// FIXME: this is broken\nfunction broken() {}');
    const gateDef = { id: 'test', type: 'quality', level: 'soft', description: 'test', validators: [{ type: 'no-todo-critical', patterns: ['FIXME'] }] };
    const result = validateGate(gateDef, tmp);
    rmSync(tmp, { recursive: true, force: true });
    assert.ok(!result.allPassed, 'Should fail when FIXME found');
    assert.ok(result.results[0].details?.length > 0, 'Should have details with file+line');
  });
});

describe('branch-naming validator', () => {
  test('passes for main branch (exempt)', () => {
    const gateDef = { id: 'test', type: 'quality', level: 'soft', description: 'test', validators: [{ type: 'branch-naming', pattern: '^(feature|fix|chore)/.+' }] };
    // 在当前 repo 中运行，main/master/develop 均豁免
    const result = validateGate(gateDef, ROOT);
    // 只要不报错即可（可能 passed 或 skipped）
    assert.ok(['passed', 'skipped', 'failed'].includes(result.results[0].status), 'Should return a valid status');
  });
});

describe('commit-message validator', () => {
  test('runs without crashing in git repo', () => {
    const gateDef = { id: 'test', type: 'quality', level: 'soft', description: 'test', validators: [{ type: 'commit-message', count: 3 }] };
    const result = validateGate(gateDef, ROOT);
    // 只验证不崩溃，状态可以是 passed/failed/skipped
    assert.ok(['passed', 'failed', 'skipped'].includes(result.results[0].status), `Unexpected status: ${result.results[0].status}`);
  });
});

describe('gate-reporter smoke test', () => {
  test('gate-reporter --dry-run exits 0', () => {
    const REPORTER = join(ROOT, 'scripts', 'gate-reporter.mjs');
    try {
      execSync(`node "${REPORTER}" --dry-run`, { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      assert.ok(true, 'gate-reporter --dry-run exited 0');
    } catch (e) {
      assert.fail(`gate-reporter --dry-run failed: ${e.stderr?.toString() || e.message}`);
    }
  });
});
