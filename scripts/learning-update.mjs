#!/usr/bin/env node
/**
 * learning-update — PostToolUse Hook
 * 记录操作到学习日志供后续分析
 *
 * 调用: node learning-update.mjs
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  appendLog,
  utcTimestamp,
} from './hook-utils.mjs';

import { join } from 'node:path';

ensureDir(GLOBAL_DATA_DIR);

appendLog(join(GLOBAL_DATA_DIR, 'learning-log.json'), {
  event: 'operation',
  timestamp: utcTimestamp(),
  recorded: true,
});

process.exit(0);
