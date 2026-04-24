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
