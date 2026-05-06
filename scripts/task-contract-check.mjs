#!/usr/bin/env node
/**
 * task-contract-check — PreToolUse 强制检查
 * 写文件前检查是否有 active 任务契约，无则 exit 1 阻断
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  detectProjectRoot,
  readJson,
  hookPrint,
  utcTimestamp,
} from './hook-utils.mjs';

const CONTRACT_EXPIRY_MS = 2 * 60 * 60 * 1000;

const projectRoot = detectProjectRoot();
const contractPath = join(projectRoot, '.chaos-harness', 'task-contract.json');

// 豁免：写入契约文件本身（避免死锁）
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
if (toolInput.includes('task-contract.json') || toolInput.includes('task-contract-')) {
  process.exit(0);
}

// 豁免：写入 .chaos-harness/ 目录下的状态文件
if (toolInput.includes('.chaos-harness/') || toolInput.includes('.chaos-harness\\')) {
  process.exit(0);
}

const contract = readJson(contractPath, null);

// 有 active 且未过期的契约 → 放行
if (contract && contract.status === 'active') {
  const age = Date.now() - new Date(contract.created_at).getTime();
  if (age <= CONTRACT_EXPIRY_MS) {
    process.exit(0);
  }
  // 过期了，标记并阻断
  contract.status = 'expired';
  contract.expired_at = utcTimestamp();
  try {
    writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf-8');
  } catch {}
}

// 无契约或已过期 → exit 1 阻断
hookPrint(
  '',
  '🚫 [Task Contract] 未声明任务契约',
  '',
  '在写代码前，请先声明你的任务意图和验收标准：',
  '',
  '  /chaos-harness:task-contract declare',
  '',
  '或直接运行:',
  '  node scripts/task-contract.mjs declare \\',
  '    --desc "你要做什么" \\',
  '    --scope "影响的文件列表" \\',
  '    --criteria "file-exists:path,no-new-fixme"',
  '',
  '这是 chaos-harness Task Contract 机制 — 事前声明，事后验证。',
  ''
);

process.exit(1);
