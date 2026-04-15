#!/usr/bin/env node
/**
 * pre-compact — 对话压缩前保存关键上下文
 *
 * 调用: node pre-compact.mjs
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  readJson,
  writeJson,
  detectProjectRoot,
  readProjectState,
  utcTimestamp,
  hookPrint,
} from './hook-utils.mjs';

import { join } from 'node:path';

ensureDir(GLOBAL_DATA_DIR);

const COMPACT_FILE = join(GLOBAL_DATA_DIR, 'last-compact.json');
const PROJECT_ROOT = detectProjectRoot();
const state = readProjectState(PROJECT_ROOT);

const ironLogs = readJson(join(GLOBAL_DATA_DIR, 'iron-law-log.json'));
const lazyLogs = readJson(join(GLOBAL_DATA_DIR, 'laziness-log.json'));
const ts = utcTimestamp();

// 保存压缩前快照
const snapshot = {
  compact_at: utcTimestamp(),
  project_root: PROJECT_ROOT,
  current_version: state?.current_version || '未设置',
  current_stage: state?.workflow?.current_stage || '未开始',
  iron_law_triggers: Array.isArray(ironLogs) ? ironLogs.length : 0,
  laziness_detections: Array.isArray(lazyLogs) ? lazyLogs.length : 0,
};

writeJson(COMPACT_FILE, snapshot);

// ---- Team 阶段退化检测 ----
// 检测主 Agent 是否在 Team 阶段代劳（IL-TEAM005 违反）
const teamStages = ['W02', 'W04', 'W07', 'W08', 'W09', 'P03_review', 'P04_review'];
const isTeamStage = teamStages.some(s => snapshot.current_stage?.includes(s));
const hasSpawnedAgents = (ironLogs || []).some(l => l.iron_law === 'IL-TEAM005');

if (isTeamStage && !hasSpawnedAgents && snapshot.iron_law_triggers < 5) {
  // Team 阶段但没有 spawn Agent 的记录，可能是主 Agent 代劳
  appendLog(join(GLOBAL_DATA_DIR, 'iron-law-log.json'), {
    iron_law: 'IL-TEAM005',
    context: 'PreCompact 检测到 Team 阶段无 Agent spawn 记录，疑似主 Agent 代劳',
    action: 'warn',
    timestamp: ts,
    detected_by: 'pre-compact',
  });

  appendLog(join(GLOBAL_DATA_DIR, 'laziness-log.json'), {
    pattern: 'LP007',
    context: 'Team 阶段主 Agent 代劳，子 Agent 未产出',
    severity: 'critical',
    timestamp: ts,
  });

  hookPrint('');
  hookPrint('<HARNESS_TEAM_DEGRADATION>');
  hookPrint('⚠️ 检测到 Team 阶段退化：主 Agent 可能在代劳');
  hookPrint('铁律 IL-TEAM005 已被记录，下次会话需强制 spawn Agent');
  hookPrint('</HARNESS_TEAM_DEGRADATION>');
}

// 输出上下文摘要
hookPrint('');
hookPrint('<CHAOS_HARNESS_COMPACT>');
hookPrint('📌 压缩前状态:');
hookPrint(`   版本: ${snapshot.current_version} | 阶段: ${snapshot.current_stage}`);
hookPrint(`   铁律触发: ${snapshot.iron_law_triggers} 次 | 偷懒检测: ${snapshot.laziness_detections} 次`);
hookPrint('</CHAOS_HARNESS_COMPACT>');

process.exit(0);
