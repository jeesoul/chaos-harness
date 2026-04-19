#!/usr/bin/env node
/**
 * gate-recovery — Gate 失败恢复引擎
 *
 * 检测失败类型，判断恢复策略，生成恢复计划
 *
 * 失败类型:
 *   - gate_verify_failed: Gate 产出不通过
 *   - gate_advance_failed: Gate 推进被阻断
 *   - hook_timeout: Hook 执行超时
 *   - task_stuck: 任务长时间无进展
 *   - review_rejected: 评审被拒绝
 *
 * 恢复策略:
 *   - 验证不通过 → 回退到上一个通过的 Gate
 *   - 任务卡住 → 启动超频拆分
 *   - Hook 失败 → 降级为 warning 并重试
 *
 * 调用: node scripts/gate-recovery.mjs [--check | --recover]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname); // scripts/ → project root
const STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'gate-state.json');
const RECOVERY_FILE = join(PROJECT_ROOT, '.chaos-harness', 'recovery-plan.md');

const GATES = [
  { id: 0, name: 'problem', label: '问题定义' },
  { id: 1, name: 'design', label: '方案设计' },
  { id: 2, name: 'tasks', label: '任务拆分' },
  { id: 3, name: 'implement', label: '实现' },
  { id: 4, name: 'test', label: '测试' },
  { id: 5, name: 'release', label: '发布' },
];

const MAX_RETRIES = 3;

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return null; }
}

function emitMarker(data) {
  console.error('<HARNESS_RECOVERY>' + JSON.stringify(data) + '</HARNESS_RECOVERY>');
}

function detectFailure(state) {
  if (!state) return { type: 'no_state', message: '无 Gate 状态' };

  const failedGate = state.gates?.find(g => g.status === 'failed');
  if (failedGate) {
    return {
      type: 'gate_verify_failed',
      gate: failedGate.id,
      gateName: GATES[failedGate.id]?.name || 'unknown',
      error: failedGate.lastError,
      attempts: failedGate.attempts,
    };
  }

  const stuckGate = state.gates?.find(g => g.status === 'in_progress' && g.attempts >= MAX_RETRIES);
  if (stuckGate) {
    return {
      type: 'task_stuck',
      gate: stuckGate.id,
      gateName: GATES[stuckGate.id]?.name || 'unknown',
      attempts: stuckGate.attempts,
    };
  }

  return null;
}

function determineStrategy(failure) {
  switch (failure.type) {
    case 'gate_verify_failed': {
      if (failure.attempts >= MAX_RETRIES) {
        // 超过最大重试次数，回退到上一个通过的 Gate
        return {
          action: 'rollback',
          reason: `Gate ${failure.gate} (${failure.gateName}) 已尝试 ${failure.attempts} 次仍未通过`,
          rollbackTo: findLastPassedGate(),
          message: '回退到上一个通过的 Gate 重新开始',
        };
      }
      return {
        action: 'retry',
        reason: failure.error,
        gate: failure.gate,
        remainingAttempts: MAX_RETRIES - failure.attempts,
        message: `修复问题后重试，剩余 ${MAX_RETRIES - failure.attempts} 次机会`,
      };
    }
    case 'task_stuck': {
      return {
        action: 'overdrive',
        reason: `Gate ${failure.gate} (${failure.gateName}) 已尝试 ${failure.attempts} 次`,
        gate: failure.gate,
        message: '启动超频模式拆分任务',
      };
    }
    case 'hook_timeout': {
      return {
        action: 'degrade',
        reason: 'Hook 执行超时',
        message: '降级为 warning，继续执行',
      };
    }
    default:
      return { action: 'manual', reason: '未知失败类型', message: '需要人工介入' };
  }
}

function findLastPassedGate() {
  const state = readState();
  if (!state) return null;
  const lastPassed = [...state.gates].reverse().find(g => g.status === 'passed');
  return lastPassed ? { id: lastPassed.id, name: GATES[lastPassed.id]?.name || 'unknown' } : null;
}

function generateRecoveryPlan(failure, strategy) {
  const plan = `# Gate 恢复计划

## 失败信息

| 字段 | 内容 |
|------|------|
| 失败类型 | ${failure.type} |
| 失败 Gate | ${failure.gate} (${GATES[failure.gate]?.label || 'unknown'}) |
| 错误信息 | ${failure.error || '无'} |
| 已尝试次数 | ${failure.attempts || 0} |

## 恢复策略

| 字段 | 内容 |
|------|------|
| 动作 | ${strategy.action} |
| 原因 | ${strategy.reason} |
| 说明 | ${strategy.message} |

${strategy.action === 'rollback' ? `
## 回退目标

回退到 Gate ${strategy.rollbackTo?.id} (${strategy.rollbackTo?.name})

**注意：** 当前 Gate 的产出将被标记为待重新实现。
` : ''}
${strategy.action === 'overdrive' ? `
## 超频拆分

启动超频模式，将当前 Gate 拆分为子任务并行处理。
` : ''}
${strategy.action === 'degrade' ? `
## 降级说明

Hook 失败降级为 warning，不阻塞后续流程。但需要记录失败原因。
` : ''}
## 恢复时间

${new Date().toISOString()}
`;

  mkdirSync(join(PROJECT_ROOT, '.chaos-harness'), { recursive: true });
  writeFileSync(RECOVERY_FILE, plan, 'utf8');
  return plan;
}

function check() {
  const state = readState();
  const failure = detectFailure(state);

  if (!failure) {
    emitMarker({ type: 'recovery_check', status: 'ok', message: '无失败需要恢复' });
    process.exit(0);
  }

  const strategy = determineStrategy(failure);

  emitMarker({
    type: 'recovery_failure',
    failure,
    strategy,
    timestamp: new Date().toISOString(),
  });
}

function recover() {
  const state = readState();
  const failure = detectFailure(state);

  if (!failure) {
    emitMarker({ type: 'recovery_run', status: 'ok', message: '无失败需要恢复' });
    process.exit(0);
  }

  const strategy = determineStrategy(failure);
  const plan = generateRecoveryPlan(failure, strategy);

  // 执行恢复动作
  if (strategy.action === 'rollback' && strategy.rollbackTo) {
    // 重置失败 Gate 状态
    const failedGate = state.gates[failure.gate];
    failedGate.status = 'pending';
    failedGate.lastError = null;
    failedGate.attempts = 0;

    // 回退到上一个通过的 Gate 并重新设为 in_progress
    const rollbackGate = state.gates[strategy.rollbackTo.id];
    rollbackGate.status = 'in_progress';
    rollbackGate.attempts = 0;

    state.currentGate = strategy.rollbackTo.id;
    writeState(state);
  }

  if (strategy.action === 'retry') {
    const failedGate = state.gates[failure.gate];
    failedGate.status = 'in_progress';
    failedGate.lastError = null;
    writeState(state);
  }

  emitMarker({
    type: 'recovery_run',
    status: 'executed',
    strategy,
    recoveryFile: RECOVERY_FILE,
    timestamp: new Date().toISOString(),
  });
}

const action = process.argv[2] || '--check';

if (action === '--check') {
  check();
} else if (action === '--recover') {
  recover();
} else {
  console.error('Usage: node gate-recovery.mjs [--check | --recover]');
  process.exit(1);
}
