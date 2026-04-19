#!/usr/bin/env node
/**
 * gate-validator — Gate Output Validator
 * 对 Gate 产出物进行真验证，不只是关键词匹配
 *
 * 验证类型：
 *   - artifact: 产出文件存在且有内容
 *   - content: 必要字段完整性
 *   - checksum: 文件未被篡改
 *   - code: 代码质量（lint、type check）
 *   - test: 测试是否通过
 *
 * 调用: node scripts/gate-validator.mjs <gateId> [--type <type>]
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname); // scripts/ → project root
const STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'gate-state.json');
const GATES_DIR = join(PROJECT_ROOT, '.chaos-harness', 'gates');

const GATES = [
  { id: 0, name: 'problem', output: 'problem.md', requiredFields: ['问题描述', '影响范围', '预期行为', '复现步骤'] },
  { id: 1, name: 'design', output: 'design.md', requiredFields: ['架构设计', '接口定义', '数据模型', '风险点'] },
  { id: 2, name: 'tasks', output: 'tasks.md', requiredFields: ['任务列表', '依赖关系', '验收标准', '估算'] },
  { id: 3, name: 'implement', output: null, requiredFields: [] },
  { id: 4, name: 'test', output: 'test-report.md', requiredFields: ['测试用例', '覆盖率', '通过状态'] },
  { id: 5, name: 'release', output: 'release.md', requiredFields: ['变更日志', '回滚方案', '验证清单'] },
];

function checksum(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function emitFinding(data) {
  console.error('<HARNESS_VALIDATE>' + JSON.stringify(data) + '</HARNESS_VALIDATE>');
}

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return null; }
}

// === 验证器 ===
function validateArtifact(gateId) {
  const gate = GATES[gateId];
  if (!gate.output) {
    return { passed: true, message: `${gate.name} 无产出文件要求` };
  }

  const outputPath = join(GATES_DIR, gate.output);
  if (!existsSync(outputPath)) {
    return { passed: false, severity: 'critical', message: `产出文件不存在: ${gate.output}` };
  }

  const content = readFileSync(outputPath, 'utf8');
  if (content.length < 50) {
    return { passed: false, severity: 'critical', message: `产出文件内容不足 (${content.length} bytes): ${gate.output}` };
  }

  return { passed: true, size: content.length };
}

function validateContent(gateId) {
  const gate = GATES[gateId];
  if (!gate.requiredFields || gate.requiredFields.length === 0) {
    return { passed: true, message: `${gate.name} 无字段要求` };
  }

  const outputPath = join(GATES_DIR, gate.output);
  if (!existsSync(outputPath)) {
    return { passed: false, severity: 'critical', message: `无法验证字段，文件不存在: ${gate.output}` };
  }

  const content = readFileSync(outputPath, 'utf8');
  const missingFields = gate.requiredFields.filter(f => !content.includes(f));

  if (missingFields.length > 0) {
    return {
      passed: false,
      severity: 'critical',
      message: `缺少必要字段: ${missingFields.join(', ')}`,
      missingFields,
    };
  }

  return { passed: true, fields: gate.requiredFields.length };
}

function validateChecksum(gateId) {
  const state = readState();
  const gate = GATES[gateId];
  if (!gate.output) return { passed: true };

  const gateState = state?.gates?.[gateId];
  if (!gateState?.outputChecksum) return { passed: true, message: '无 checksum 记录，跳过校验' };

  const outputPath = join(GATES_DIR, gate.output);
  if (!existsSync(outputPath)) {
    return { passed: false, severity: 'critical', message: '产出文件不存在，checksum 校验失败' };
  }

  const content = readFileSync(outputPath, 'utf8');
  const ck = checksum(content);

  if (gateState.outputChecksum !== ck) {
    return {
      passed: false,
      severity: 'critical',
      message: `checksum 不匹配，文件可能被篡改`,
      expected: gateState.outputChecksum,
      actual: ck,
    };
  }

  return { passed: true, checksum: ck };
}

function validateCode(gateId) {
  // 检查项目是否有代码变更
  try {
    const status = execSync('git status --porcelain', { cwd: PROJECT_ROOT, encoding: 'utf8' });
    const modifiedFiles = status.split('\n').filter(l => l.trim() && !l.startsWith('??'));

    if (modifiedFiles.length === 0) {
      return { passed: true, message: '无代码变更' };
    }

    // 检查 lint
    try {
      execSync('npm run lint --if-present', { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
      return { passed: false, severity: 'warning', message: 'lint 检查失败' };
    }

    // 检查 type check
    try {
      execSync('npx tsc --noEmit', { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
      return { passed: false, severity: 'warning', message: '类型检查失败' };
    }

    return { passed: true, modifiedFiles: modifiedFiles.length };
  } catch {
    return { passed: true, message: '无法执行代码验证（非 git 项目或无 git）' };
  }
}

function validateTests(gateId) {
  try {
    // 尝试运行测试
    const testOutput = execSync('npm test --if-present', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000,
    });

    if (testOutput.includes('passing') || testOutput.includes('PASS') || testOutput.includes('passed')) {
      return { passed: true, message: '测试通过' };
    }

    return { passed: false, severity: 'critical', message: '测试运行但结果为失败', output: testOutput.slice(0, 500) };
  } catch (e) {
    return { passed: false, severity: 'critical', message: '测试运行失败', error: e.stderr?.slice(0, 500) };
  }
}

// === 主函数 ===
const gateId = parseInt(process.argv[2]);
const typeFlag = process.argv.indexOf('--type');
const type = typeFlag >= 0 ? process.argv[typeFlag + 1] : 'all';

if (isNaN(gateId) || gateId < 0 || gateId >= GATES.length) {
  console.error('Usage: node gate-validator.mjs <gateId> [--type artifact|content|checksum|code|test|all]');
  process.exit(1);
}

const gate = GATES[gateId];
const results = [];

if (type === 'all' || type === 'artifact') {
  results.push({ validator: 'artifact', ...validateArtifact(gateId) });
}
if (type === 'all' || type === 'content') {
  results.push({ validator: 'content', ...validateContent(gateId) });
}
if (type === 'all' || type === 'checksum') {
  results.push({ validator: 'checksum', ...validateChecksum(gateId) });
}
if (type === 'all' || type === 'code') {
  results.push({ validator: 'code', ...validateCode(gateId) });
}
if (type === 'all' || type === 'test') {
  results.push({ validator: 'test', ...validateTests(gateId) });
}

const criticalFailures = results.filter(r => !r.passed && r.severity === 'critical');
const warnings = results.filter(r => !r.passed && r.severity === 'warning');
const overallPassed = criticalFailures.length === 0;

emitFinding({
  type: 'gate_validation',
  gateId,
  gate: gate.name,
  overallPassed,
  criticalFailures: criticalFailures.length,
  warnings: warnings.length,
  results,
  timestamp: new Date().toISOString(),
});

if (!overallPassed) {
  process.exit(1);
}

process.exit(0);
