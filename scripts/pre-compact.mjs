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

// 输出上下文摘要
hookPrint('');
hookPrint('<CHAOS_HARNESS_COMPACT>');
hookPrint('📌 压缩前状态:');
hookPrint(`   版本: ${snapshot.current_version} | 阶段: ${snapshot.current_stage}`);
hookPrint(`   铁律触发: ${snapshot.iron_law_triggers} 次 | 偷懒检测: ${snapshot.laziness_detections} 次`);
hookPrint('</CHAOS_HARNESS_COMPACT>');

process.exit(0);
