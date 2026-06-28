#!/usr/bin/env node
/**
 * overdrive — 超频模式效率注入 Hook
 * 当检测到超频关键词时，注入最高效率模式指令
 *
 * 调用: node scripts/overdrive.mjs
 */

import {
  detectProjectRoot,
  readJson,
  appendLog,
  utcTimestamp,
  hookPrint,
} from './hook-utils.mjs';

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = detectProjectRoot();
const GLOBAL_DATA_DIR = join(process.env.HOME || process.env.USERPROFILE, '.claude', 'harness');
const OVERDRIVE_STATE = join(GLOBAL_DATA_DIR, 'overdrive-state.json');
const OVERDRIVE_LOG = join(GLOBAL_DATA_DIR, 'overdrive-log.json');

// 确保目录存在
if (!existsSync(GLOBAL_DATA_DIR)) mkdirSync(GLOBAL_DATA_DIR, { recursive: true });

// 初始化日志
if (!readJson(OVERDRIVE_LOG)) writeFileSync(OVERDRIVE_LOG, '[]', 'utf-8');

// 检查是否已激活
const existingState = readJson(OVERDRIVE_STATE);
if (existingState && existingState.active) {
  hookPrint('⚡ Overdrive 已激活，跳过重复注入');
  process.exit(0);
}

// 激活超频状态
writeFileSync(OVERDRIVE_STATE, JSON.stringify({
  active: true,
  activated_at: utcTimestamp(),
  reason: 'user_triggered',
}), 'utf-8');

appendLog(OVERDRIVE_LOG, {
  event: 'overdrive_activated',
  timestamp: utcTimestamp(),
});

// 注入最高效率指令
hookPrint('');
hookPrint('<HARNESS_OVERDRIVE>');
hookPrint('⚡ 超频模式已激活');
hookPrint('- 优先级: P0 (最高)');
hookPrint('- 状态: 所有 Agent 全速运行');
hookPrint('- 目标: 最短时间最优解决');
hookPrint('');
hookPrint('### 大模型效率指令（自动生效）');
hookPrint('');
hookPrint('你现在进入超频模式，必须遵守以下效率规则：');
hookPrint('');
hookPrint('1. **禁止废话** — 不说铺垫、不解释过程、不输出无关上下文');
hookPrint('2. **直接动手** — 不写详细计划，直接 spawn Agent 并行处理');
hookPrint('3. **摘要优先** — 每个 Agent 只输出核心发现，不输出推理过程');
hookPrint('4. **快速拍板** — 分歧时 1 分钟内做决策，不展开讨论');
hookPrint('5. **最大并行** — 能拆必须拆，绝不单线程执行');
hookPrint('6. **最小上下文** — 只传递必要信息，不携带完整背景');
hookPrint('7. **验证不可跳过** — 解决后必须附带证据');
hookPrint('8. **超时自动收敛** — 每个阶段超时后自动进入下一阶段');
hookPrint('');
hookPrint('### Agent 调度指令');
hookPrint('');
hookPrint('遇到复杂问题时，必须立即 spawn 多个 Agent 并行处理：');
hookPrint('- 代码缺陷 → 3 Agent（诊断 + 读代码 + 假设生成）');
hookPrint('- 需求变更 → 3 Agent（分析 + 影响 + 范围）');
hookPrint('- 架构修改 → 3 Agent（读架构 + 影响分析 + 替代方案）');
hookPrint('- 测试调整 → 3 Agent（分析 + 覆盖率 + 用例调整）');
hookPrint('- 运维事故 → 3 Agent（日志 + 基础设施 + 修复）');
hookPrint('');
hookPrint('</HARNESS_OVERDRIVE>');

process.exit(0);
