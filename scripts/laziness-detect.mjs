#!/usr/bin/env node
/**
 * laziness-detect — Stop Hook 偷懒模式检测
 * 检测绕过话术和偷懒行为
 *
 * 调用: node laziness-detect.mjs
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  readJson,
  appendLog,
  utcTimestamp,
  hookPrint,
} from './hook-utils.mjs';

import { join } from 'node:path';

ensureDir(GLOBAL_DATA_DIR);

const LAZINESS_LOG = join(GLOBAL_DATA_DIR, 'laziness-log.json');
const IRON_LAW_LOG = join(GLOBAL_DATA_DIR, 'iron-law-log.json');

const ts = utcTimestamp();

// 偷懒模式关键词
const lazinessKeywords = [
  '简单修复', '跳过测试', '就这一次', '快速处理',
  'simple fix', 'skip test', 'just this once', 'quick fix',
  '特殊情况', 'too simple', 'no need to test', 'trivial fix',
];

// ---- LP007: Team 阶段主 Agent 代劳检测 ----
// 检测主 Agent 在 Team 阶段（W02/W04/W07/W08/W09）自己干活而不 spawn 子 Agent
const teamStageKeywords = ['并行', '多agent', '协作', '团队', '评审阶段', 'agent team'];
const teamWorkKeywords = ['我来写', '我来改', '我来做', '直接修改', '我来实现', 'let me', 'i will'];

// 简单启发式检测：如果同时出现 Team 阶段词和主 Agent 亲自干活词，标记 LP007
const allText = JSON.stringify(readJson(LAZINESS_LOG) || []);
const hasTeamStage = teamStageKeywords.some(k => allText.includes(k));
const hasMainAgentDoing = teamWorkKeywords.some(k => allText.includes(k));

if (hasTeamStage && hasMainAgentDoing) {
  appendLog(LAZINESS_LOG, {
    pattern: 'LP007',
    context: 'Team 阶段检测到主 Agent 代劳（检测到并行意图 + 亲自干活表述）',
    severity: 'critical',
    timestamp: ts,
    detected_by: 'laziness-detect',
  });

  appendLog(IRON_LAW_LOG, {
    iron_law: 'IL-TEAM005',
    context: 'LP007 触发：主 Agent 在 Team 阶段代劳，禁止单线程退化',
    action: 'warn',
    timestamp: ts,
    detected_by: 'laziness-detect',
  });
}

// 记录本轮检测
appendLog(LAZINESS_LOG, {
  event: 'end_turn_check',
  timestamp: ts,
  patterns_checked: true,
  keywords: lazinessKeywords.join('|'),
});

// 统计偷懒检测次数
const lazyLogs = readJson(LAZINESS_LOG);
const ironLogs = readJson(IRON_LAW_LOG);

if (lazyLogs.length > 3) {
  hookPrint('');
  hookPrint('<HARNESS_LAZINESS_ALERT>');
  hookPrint(`⚠️ 累计偷懒检测: ${lazyLogs.length} 次`);
  hookPrint('建议: 使用 /chaos-harness:learning-analyzer 分析行为模式');
  hookPrint('</HARNESS_LAZINESS_ALERT>');
}

process.exit(0);
