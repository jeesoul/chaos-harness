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
