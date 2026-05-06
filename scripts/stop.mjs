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

import { join } from 'node:path';
import { existsSync, appendFileSync } from 'node:fs';

const PROJECT_ROOT = detectProjectRoot();
const state = readProjectState(PROJECT_ROOT);

if (state) {
  const ts = utcTimestamp();

  state.last_session = ts;
  state.statistics = state.statistics || {};
  state.statistics.total_sessions = (state.statistics.total_sessions || 0) + 1;

  const statePath = join(PROJECT_ROOT, '.chaos-harness', 'state.json');
  writeJson(statePath, state);

  ensureDir(GLOBAL_DATA_DIR);
  appendLog(join(GLOBAL_DATA_DIR, 'plugin-log.json'), {
    event: 'session_end',
    timestamp: ts,
    session_id: epochMs(),
    project_root: PROJECT_ROOT,
  });
}

// 处理过期的 active 契约
const contractPath = join(PROJECT_ROOT, '.chaos-harness', 'task-contract.json');
if (existsSync(contractPath)) {
  try {
    const contract = readJson(contractPath, null);
    if (contract && contract.status === 'active') {
      const CONTRACT_EXPIRY_MS = 2 * 60 * 60 * 1000;
      const age = Date.now() - new Date(contract.created_at).getTime();
      if (age > CONTRACT_EXPIRY_MS) {
        contract.status = 'expired';
        contract.expired_at = utcTimestamp();
        writeJson(contractPath, contract);
        // 写入学习日志
        ensureDir(GLOBAL_DATA_DIR);
        appendFileSync(
          join(GLOBAL_DATA_DIR, 'contract-log.jsonl'),
          JSON.stringify({ event: 'contract_expired', id: contract.id, description: contract.task?.description, timestamp: utcTimestamp() }) + '\n',
          'utf-8'
        );
      }
    }
  } catch { /* non-critical */ }
}

process.exit(0);
