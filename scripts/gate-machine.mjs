#!/usr/bin/env node
/**
 * gate-machine — Gate State Machine
 * chaos-harness v1.4.0 核心：真门控状态机
 *
 * 每个 Gate 有明确输入/输出/校验，不能跳过，不能回退。
 * 产出物有 checksum 锁定，评审者独立记录。
 *
 * 调用: node scripts/gate-machine.mjs <command> [args]
 *   init          — 初始化 Gate 流程
 *   advance <N>   — 尝试推进到 Gate N
 *   status        — 显示当前状态
 *   verify <N>    — 验证 Gate N 产出
 *   recover       — 失败恢复
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname); // scripts/ → project root
const STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'gate-state.json');
const GATES_DIR = join(PROJECT_ROOT, '.chaos-harness', 'gates');

// === Gate 定义 ===
const GATES = [
  {
    id: 0,
    name: 'problem',
    label: '问题定义',
    output: 'problem.md',
    requiredFields: ['问题描述', '影响范围', '预期行为', '复现步骤'],
    reviewRequired: true,
  },
  {
    id: 1,
    name: 'design',
    label: '方案设计',
    output: 'design.md',
    dependsOn: 0,
    requiredFields: ['架构设计', '接口定义', '数据模型', '风险点'],
    reviewRequired: true,
  },
  {
    id: 2,
    name: 'tasks',
    label: '任务拆分',
    output: 'tasks.md',
    dependsOn: 1,
    requiredFields: ['任务列表', '依赖关系', '验收标准', '估算'],
    reviewRequired: true,
  },
  {
    id: 3,
    name: 'implement',
    label: '实现',
    output: null, // 实现阶段产出代码文件
    dependsOn: 2,
    requiredFields: [],
    reviewRequired: true,
  },
  {
    id: 4,
    name: 'test',
    label: '测试',
    output: 'test-report.md',
    dependsOn: 3,
    requiredFields: ['测试用例', '覆盖率', '通过状态'],
    reviewRequired: true,
  },
  {
    id: 5,
    name: 'release',
    label: '发布',
    output: 'release.md',
    dependsOn: 4,
    requiredFields: ['变更日志', '回滚方案', '验证清单'],
    reviewRequired: true,
  },
];

// === 状态读写 ===
function readState() {
  if (!existsSync(STATE_FILE)) {
    return {
      version: '1.4.0',
      currentGate: -1, // -1 = 未初始化
      problem: null,
      gates: GATES.map(g => ({
        id: g.id,
        name: g.name,
        status: 'pending', // pending | in_progress | passed | failed
        output: null,
        outputChecksum: null,
        reviewer: null,
        reviewedAt: null,
        attempts: 0,
        lastError: null,
      })),
      artifacts: {},
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return readState(); // 文件损坏，重建
  }
}

function writeState(state) {
  state.updatedAt = new Date().toISOString();
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// === Checksum ===
function checksum(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

// === 核心操作 ===
function initGateFlow(problem) {
  const state = readState();
  if (state.currentGate >= 0) {
    emitGateMarker({
      type: 'gate_error',
      action: 'init',
      message: `Gate 流程已在运行，当前处于 Gate ${state.currentGate} (${GATES[state.currentGate]?.name})`,
    });
    process.exit(1);
  }

  state.currentGate = 0;
  state.problem = problem;
  state.gates[0].status = 'in_progress';
  state.gates[0].attempts = 0;

  // 创建 gates 目录
  mkdirSync(GATES_DIR, { recursive: true });

  writeState(state);

  emitGateMarker({
    type: 'gate_init',
    problem,
    currentGate: 0,
    totalGates: GATES.length,
    gates: GATES.map(g => ({ id: g.id, name: g.name, label: g.label })),
  });
}

function advanceGate(gateId, reviewer) {
  const state = readState();

  if (state.currentGate < 0) {
    emitGateMarker({ type: 'gate_error', action: 'advance', message: 'Gate 流程未初始化，先执行 init' });
    process.exit(1);
  }

  if (gateId !== state.currentGate + 1) {
    emitGateMarker({
      type: 'gate_error',
      action: 'advance',
      message: `Gate 只能顺序推进，当前在 Gate ${state.currentGate}，尝试推进到 ${gateId}。只能推进到 ${state.currentGate + 1}`,
      blocked: true,
    });
    process.exit(1);
  }

  // 验证前一个 Gate 产出
  const prevGate = GATES[state.currentGate];
  const prevGateState = state.gates[state.currentGate];

  if (prevGateState.status !== 'passed') {
    emitGateMarker({
      type: 'gate_error',
      action: 'advance',
      message: `Gate ${state.currentGate} (${prevGate.name}) 未通过，不能推进`,
      blocked: true,
    });
    process.exit(1);
  }

  // 推进
  state.currentGate = gateId;
  state.gates[gateId].status = 'in_progress';
  state.gates[gateId].attempts = 0;
  state.history.push({
    event: 'gate_advance',
    from: state.currentGate - 1,
    to: gateId,
    reviewer,
    timestamp: new Date().toISOString(),
  });

  writeState(state);

  emitGateMarker({
    type: 'gate_advance',
    from: gateId - 1,
    to: gateId,
    gate: GATES[gateId],
    reviewer,
  });
}

function verifyGate(gateId, reviewer) {
  const state = readState();
  const gate = GATES[gateId];
  const gateState = state.gates[gateId];

  if (!gate) {
    emitGateMarker({ type: 'gate_error', action: 'verify', message: `Gate ${gateId} 不存在` });
    process.exit(1);
  }

  if (gateState.status === 'pending') {
    emitGateMarker({ type: 'gate_error', action: 'verify', message: `Gate ${gateId} (${gate.name}) 尚未开始` });
    process.exit(1);
  }

  // 检查产出文件
  const outputName = gate.output;
  if (outputName) {
    const outputPath = join(GATES_DIR, outputName);
    if (!existsSync(outputPath)) {
      gateState.status = 'failed';
      gateState.lastError = `产出文件 ${outputName} 不存在`;
      gateState.attempts++;
      writeState(state);

      emitGateMarker({
        type: 'gate_verify_failed',
        gateId,
        gate: gate.name,
        reason: `产出文件 ${outputName} 不存在`,
      });
      process.exit(1);
    }

    // 校验 checksum
    const content = readFileSync(outputPath, 'utf8');
    const ck = checksum(content);

    if (gateState.outputChecksum && gateState.outputChecksum !== ck) {
      emitGateMarker({
        type: 'gate_verify_failed',
        gateId,
        gate: gate.name,
        reason: `产出文件 checksum 不匹配，可能被修改`,
        expected: gateState.outputChecksum,
        actual: ck,
      });
      process.exit(1);
    }

    // 校验 requiredFields
    const missingFields = gate.requiredFields.filter(f => !content.includes(f));
    if (missingFields.length > 0) {
      gateState.status = 'failed';
      gateState.lastError = `缺少必要字段: ${missingFields.join(', ')}`;
      gateState.attempts++;
      writeState(state);

      emitGateMarker({
        type: 'gate_verify_failed',
        gateId,
        gate: gate.name,
        reason: `缺少必要字段: ${missingFields.join(', ')}`,
        missingFields,
      });
      process.exit(1);
    }

    // 通过
    gateState.outputChecksum = ck;
    gateState.output = outputPath;
    state.artifacts[outputName] = {
      gate: gateId,
      checksum: ck,
      locked: true,
      size: content.length,
    };
  }

  gateState.status = 'passed';
  gateState.reviewedAt = new Date().toISOString();
  gateState.reviewer = reviewer || 'auto';
  gateState.attempts++;
  state.history.push({
    event: 'gate_verify_passed',
    gateId,
    gate: gate.name,
    reviewer: gateState.reviewer,
    timestamp: new Date().toISOString(),
  });

  writeState(state);

  emitGateMarker({
    type: 'gate_verify_passed',
    gateId,
    gate: gate.name,
    reviewer: gateState.reviewer,
    checksum: gateState.outputChecksum,
  });
}

function submitGateOutput(gateId, content, author) {
  const state = readState();
  const gate = GATES[gateId];

  if (state.currentGate !== gateId) {
    emitGateMarker({
      type: 'gate_error',
      action: 'submit',
      message: `当前在 Gate ${state.currentGate}，不能提交到 Gate ${gateId}`,
      blocked: true,
    });
    process.exit(1);
  }

  const outputName = gate.output;
  if (outputName) {
    mkdirSync(GATES_DIR, { recursive: true });
    const outputPath = join(GATES_DIR, outputName);
    writeFileSync(outputPath, content, 'utf8');

    const ck = checksum(content);
    state.gates[gateId].outputChecksum = ck;
    state.gates[gateId].output = outputPath;
    state.artifacts[outputName] = {
      gate: gateId,
      checksum: ck,
      locked: true,
      size: content.length,
    };
  }

  state.history.push({
    event: 'gate_submit',
    gateId,
    gate: gate.name,
    author,
    timestamp: new Date().toISOString(),
  });

  writeState(state);

  emitGateMarker({
    type: 'gate_submit',
    gateId,
    gate: gate.name,
    author,
    hasOutput: !!outputName,
    checksum: state.gates[gateId].outputChecksum,
  });
}

function recover() {
  const state = readState();

  if (state.currentGate < 0) {
    emitGateMarker({ type: 'gate_error', action: 'recover', message: '无 Gate 流程可恢复' });
    process.exit(0);
  }

  // 查找失败的 Gate
  const failedGate = state.gates.find(g => g.status === 'failed');
  if (failedGate) {
    // 回退到上一个通过的 Gate
    const lastPassed = [...state.gates].reverse().find(g => g.status === 'passed' && g.id < failedGate.id);

    emitGateMarker({
      type: 'gate_recovery',
      failedGate: { id: failedGate.id, name: failedGate.name, error: failedGate.lastError, attempts: failedGate.attempts },
      recoveryGate: lastPassed ? { id: lastPassed.id, name: lastPassed.name } : null,
      strategy: lastPassed ? `回退到 Gate ${lastPassed.id} (${lastPassed.name}) 重新开始` : '从 Gate 0 重新开始',
    });

    // 重置失败 Gate 状态
    failedGate.status = 'in_progress';
    failedGate.lastError = null;
    writeState(state);
    return;
  }

  // 没有失败的 Gate，显示当前状态
  const currentGate = state.gates[state.currentGate];
  emitGateMarker({
    type: 'gate_status',
    currentGate: state.currentGate,
    gate: currentGate.name,
    status: currentGate.status,
    progress: `${state.gates.filter(g => g.status === 'passed').length}/${GATES.length}`,
  });
}

function status() {
  const state = readState();

  if (state.currentGate < 0) {
    emitGateMarker({ type: 'gate_status', currentGate: null, message: 'Gate 流程未初始化' });
    process.exit(0);
  }

  const gateSummary = state.gates.map(g => ({
    id: g.id,
    name: g.name,
    label: GATES[g.id].label,
    status: g.status,
    attempts: g.attempts,
    reviewer: g.reviewer,
    checksum: g.outputChecksum,
  }));

  emitGateMarker({
    type: 'gate_status',
    currentGate: state.currentGate,
    problem: state.problem,
    gates: gateSummary,
    progress: `${state.gates.filter(g => g.status === 'passed').length}/${GATES.length}`,
    artifacts: Object.keys(state.artifacts),
  });
}

// === Marker 输出 ===
function emitGateMarker(data) {
  console.error('<HARNESS_GATE>' + JSON.stringify(data) + '</HARNESS_GATE>');
}

// === 主函数 ===
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'init':
    initGateFlow(args[0] || '未指定问题');
    break;
  case 'advance':
    advanceGate(parseInt(args[0]), args[1] || 'auto');
    break;
  case 'verify':
    verifyGate(parseInt(args[0]));
    break;
  case 'submit': {
    // 从 stdin 读取内容
    const stdin = readFileSync('/dev/stdin', 'utf8');
    submitGateOutput(parseInt(args[0]), stdin, args[1] || 'auto');
    break;
  }
  case 'recover':
    recover();
    break;
  case 'status':
    status();
    break;
  default:
    console.log('Usage: node gate-machine.mjs <command> [args]');
    console.log('Commands: init, advance, verify, submit, recover, status');
    process.exit(1);
}
