#!/usr/bin/env node
/**
 * session-start — 会话启动 Hook
 * 注入铁律上下文 + 恢复项目状态
 *
 * 调用: node session-start.mjs
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  readJson,
  appendLog,
  detectProjectRoot,
  readProjectState,
  utcTimestamp,
  epochMs,
  hookPrint,
  printIronLawsContext,
} from './hook-utils.mjs';

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// 初始化日志文件
ensureDir(GLOBAL_DATA_DIR);

const IRON_LAW_LOG = join(GLOBAL_DATA_DIR, 'iron-law-log.json');
const PLUGIN_LOG = join(GLOBAL_DATA_DIR, 'plugin-log.json');
const LEARNING_LOG = join(GLOBAL_DATA_DIR, 'learning-log.json');

// 确保日志文件存在
for (const f of [IRON_LAW_LOG, PLUGIN_LOG, LEARNING_LOG]) {
  if (!readJson(f, null)) {
    writeFileSync(f, '[]', 'utf-8');
  }
}

const PROJECT_ROOT = detectProjectRoot();
const state = readProjectState(PROJECT_ROOT);

// 输出铁律上下文（始终输出）
printIronLawsContext();

if (state) {
  // 项目状态恢复
  hookPrint('');
  hookPrint('<CHAOS_HARNESS_STATE_RECOVERY>');
  hookPrint(`项目状态文件已检测到: ${join(PROJECT_ROOT, '.chaos-harness', 'state.json')}`);
  hookPrint('');
  hookPrint('**建议操作:**');
  hookPrint("使用 /chaos-harness:project-state 或说 '继续上次进度' 恢复会话。");
  hookPrint('');

  // 快速状态显示
  hookPrint('**快速状态:**');
  hookPrint(`- 项目: ${state.project_name || 'Unknown'}`);
  hookPrint(`- 版本: ${state.current_version || '未设置'}`);
  hookPrint(`- 阶段: ${state.workflow?.current_stage || '未开始'}`);
  hookPrint(`- 上次会话: ${state.last_session || 'N/A'}`);

  hookPrint('</CHAOS_HARNESS_STATE_RECOVERY>');
} else {
  // 新项目引导
  hookPrint('');
  hookPrint('<CHAOS_HARNESS_NEW_PROJECT>');
  hookPrint('未检测到项目状态文件。');
  hookPrint('');
  hookPrint('这是一个新项目或首次使用 Chaos Harness。');
  hookPrint('');
  hookPrint('**建议操作:**');
  hookPrint('1. 使用 /chaos-harness:project-scanner 扫描项目');
  hookPrint('2. 使用 /chaos-harness:version-locker 创建版本');
  hookPrint('3. 使用 /chaos-harness:harness-generator 生成约束');
  hookPrint('');
  hookPrint("或说 '开始使用 chaos-harness' 进行初始化。");
  hookPrint('</CHAOS_HARNESS_NEW_PROJECT>');
}

// 记录会话启动
const ts = utcTimestamp();
appendLog(PLUGIN_LOG, {
  event: 'session_start',
  timestamp: ts,
  session_id: epochMs(),
  project_root: PROJECT_ROOT,
});

// 学习记录触发检查
const learningLogs = readJson(LEARNING_LOG);
if (learningLogs.length >= 5) {
  hookPrint('');
  hookPrint('<CHAOS_HARNESS_LEARNING_TRIGGER>');
  hookPrint(`检测到学习记录: ${learningLogs.length} 条`);
  hookPrint('');
  hookPrint('**建议操作:**');
  hookPrint('使用 /chaos-harness:learning-analyzer 分析学习记录并优化铁律。');
  hookPrint("或说 '分析学习记录' 进行自学习闭环。");
  hookPrint('</CHAOS_HARNESS_LEARNING_TRIGGER>');
}

process.exit(0);
