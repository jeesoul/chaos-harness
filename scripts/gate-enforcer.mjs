#!/usr/bin/env node
/**
 * gate-enforcer — Gate Hard Enforcer Hook (PreToolUse)
 *
 * 真正的硬拦截：在 AI 尝试执行工具前检查当前 Gate 状态
 * 不符合条件直接 exit 1 阻断，不是打印警告
 *
 * 拦截规则：
 *   - Gate 未通过时禁止 Write/Edit 代码文件
 *   - Gate 产出文件禁止非评审者修改
 *   - 跳过 Gate 直接推进时 exit 1
 *
 * 调用: node scripts/gate-enforcer.mjs
 *   stdin: JSON hook input
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname); // scripts/ → project root
const STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'gate-state.json');
const GATES_DIR = join(PROJECT_ROOT, '.chaos-harness', 'gates');

const GATES = [
  { id: 0, name: 'problem', label: '问题定义' },
  { id: 1, name: 'design', label: '方案设计' },
  { id: 2, name: 'tasks', label: '任务拆分' },
  { id: 3, name: 'implement', label: '实现' },
  { id: 4, name: 'test', label: '测试' },
  { id: 5, name: 'release', label: '发布' },
];

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return null; }
}

function emitBlock(data) {
  console.error('<HARNESS_ENFORCER>' + JSON.stringify(data) + '</HARNESS_ENFORCER>');
}

function block(reason, details) {
  emitBlock({ type: 'blocked', reason, ...details });
  process.exit(1);
}

function allow(message) {
  emitBlock({ type: 'allowed', message });
  process.exit(0);
}

// 读取 stdin 获取工具调用信息
function getToolInput() {
  try {
    const stdin = readFileSync('/dev/stdin', 'utf8');
    return JSON.parse(stdin);
  } catch {
    return null;
  }
}

function main() {
  const state = readState();
  const toolInput = getToolInput();

  // 无 Gate 流程 → 放行（兼容模式）
  if (!state || state.currentGate < 0) {
    allow('无 Gate 流程，放行');
    return;
  }

  const toolName = toolInput?.tool_name || '';
  const currentGate = state.gates[state.currentGate];
  const gateDef = GATES[state.currentGate];

  // === 规则 1: 前 Gate 未通过，禁止写代码 ===
  if (['Write', 'Edit'].includes(toolName)) {
    const filePath = toolInput?.tool_input?.file_path || '';

    // 判断是否在实现阶段（Gate 3）之前
    if (state.currentGate < 3) {
      block(`禁止在 Gate ${state.currentGate} (${gateDef.label}) 阶段直接写代码。必须先完成当前 Gate 并通过验证。`, {
        gate: state.currentGate,
        gateName: gateDef.name,
        label: gateDef.label,
        filePath,
        requiredAction: `完成 Gate ${state.currentGate} 产出并通过验证后才能编码`,
      });
    }

    // 判断是否修改了已锁定的 Gate 产出文件
    if (filePath.includes('.chaos-harness/gates/')) {
      const gateState = state.gates.find(g => g.output && filePath.endsWith(g.output));
      if (gateState && gateState.outputChecksum && gateState.reviewer !== toolInput?.author) {
        block(`禁止修改已锁定的 Gate 产出文件: ${filePath}`, {
          lockedBy: gateState.reviewer,
          checksum: gateState.outputChecksum,
          requiredAction: '联系评审者解锁或重新提交 Gate',
        });
      }
    }
  }

  // === 规则 2: 禁止跳过 Gate ===
  if (toolName === 'Bash') {
    const command = toolInput?.tool_input?.command || '';

    // 检测是否尝试直接推进 Gate
    const advanceMatch = command.match(/gate-machine\.mjs\s+advance\s+(\d+)/);
    if (advanceMatch) {
      const targetGate = parseInt(advanceMatch[1]);
      if (targetGate !== state.currentGate + 1) {
        block(`禁止跳过 Gate。当前在 Gate ${state.currentGate}，只能推进到 ${state.currentGate + 1}`, {
          currentGate: state.currentGate,
          attemptedGate: targetGate,
          requiredAction: `先完成 Gate ${state.currentGate} 验证，然后推进到 ${state.currentGate + 1}`,
        });
      }
    }

    // 检测是否尝试手动修改 state.json
    if (command.includes('gate-state.json') && command.includes('write')) {
      block('禁止手动修改 Gate 状态文件', {
        requiredAction: '使用 gate-machine.mjs 命令操作',
      });
    }
  }

  // === 规则 3: Gate 3（实现）前禁止运行测试 ===
  if (toolName === 'Bash' && state.currentGate < 3) {
    const command = toolInput?.tool_input?.command || '';
    if (/npm\s+test|vitest|jest|mocha|pytest/.test(command)) {
      block(`Gate ${state.currentGate} 阶段不允许运行测试。必须完成实现阶段（Gate 3）后才能测试。`, {
        gate: state.currentGate,
        command: command.slice(0, 100),
        requiredAction: '完成 Gate 2（任务拆分）和 Gate 3（实现）后再测试',
      });
    }
  }

  allow(`Gate ${state.currentGate} (${gateDef.label}) 状态正常`);
}

main();
