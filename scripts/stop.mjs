#!/usr/bin/env node
/**
 * stop — 会话结束 Hook
 * 保存项目状态以供下次恢复
 *
 * 调用: node stop.mjs
 */

import {
  detectProjectRoot,
  readProjectState,
  writeJson,
  readJson,
  appendLog,
  GLOBAL_DATA_DIR,
  ensureDir,
  utcTimestamp,
  epochMs,
} from './hook-utils.mjs';

import { join, dirname } from 'node:path';

const PROJECT_ROOT = detectProjectRoot();
const state = readProjectState(PROJECT_ROOT);

if (state) {
  const ts = utcTimestamp();

  // 更新 last_session 和会话计数
  state.last_session = ts;
  state.statistics = state.statistics || {};
  state.statistics.total_sessions = (state.statistics.total_sessions || 0) + 1;

  const statePath = join(PROJECT_ROOT, '.chaos-harness', 'state.json');
  writeJson(statePath, state);

  // 记录会话结束
  ensureDir(GLOBAL_DATA_DIR);
  appendLog(join(GLOBAL_DATA_DIR, 'plugin-log.json'), {
    event: 'session_end',
    timestamp: ts,
    session_id: epochMs(),
    project_root: PROJECT_ROOT,
  });
}

process.exit(0);
