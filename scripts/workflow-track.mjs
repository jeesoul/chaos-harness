#!/usr/bin/env node
/**
 * workflow-track — 追踪工作流事件
 *
 * 调用: node workflow-track.mjs
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  appendLog,
  utcTimestamp,
} from './hook-utils.mjs';

import { join } from 'node:path';

ensureDir(GLOBAL_DATA_DIR);

appendLog(join(GLOBAL_DATA_DIR, 'workflow-log.json'), {
  event: 'tool_use',
  timestamp: utcTimestamp(),
});

process.exit(0);
