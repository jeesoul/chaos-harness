#!/usr/bin/env node
/**
 * task-contract-verify — PostToolUse 验证器
 * 写文件后自动验证任务契约的 success_criteria
 */

import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  detectProjectRoot,
  readJson,
  writeJsonAtomic,
  ensureDir,
  utcTimestamp,
  GLOBAL_DATA_DIR,
  hookPrint,
} from './hook-utils.mjs';

const CONTRACT_EXPIRY_MS = 2 * 60 * 60 * 1000;

const projectRoot = detectProjectRoot();
const contractPath = join(projectRoot, '.chaos-harness', 'task-contract.json');

const contract = readJson(contractPath, null);

// 无契约或非 active → 跳过
if (!contract || contract.status !== 'active') {
  process.exit(0);
}

// 过期检查
const age = Date.now() - new Date(contract.created_at).getTime();
if (age > CONTRACT_EXPIRY_MS) {
  process.exit(0);
}

// 获取刚写入的文件路径（用于 no-new-fixme 检查）
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
let writtenFile = null;
try {
  const parsed = JSON.parse(toolInput);
  writtenFile = parsed.file_path || parsed.path || null;
} catch {}

// ---- 验证 success_criteria ----

const evidence = contract.verification.evidence || [];
let anyUpdated = false;

for (const criterion of contract.task.success_criteria) {
  // 跳过已验证通过的项
  const existing = evidence.find(e => e.criterion === criterion);
  if (existing && existing.passed) continue;

  let result = null;

  if (criterion.startsWith('file-exists:')) {
    const filePath = criterion.slice('file-exists:'.length).trim();
    const fullPath = join(projectRoot, filePath);
    const passed = existsSync(fullPath);
    result = { criterion, passed, detail: passed ? `✓ ${filePath}` : `✗ 文件不存在: ${filePath}` };

  } else if (criterion === 'no-new-fixme') {
    if (writtenFile && existsSync(writtenFile)) {
      try {
        const content = readFileSync(writtenFile, 'utf-8');
        const fixmeLines = content.split('\n')
          .map((line, idx) => ({ line, idx: idx + 1 }))
          .filter(({ line }) => /FIXME|TODO\(critical\)|HACK/.test(line));
        const passed = fixmeLines.length === 0;
        result = {
          criterion,
          passed,
          detail: passed
            ? `✓ 无 FIXME 标记`
            : `✗ 发现 ${fixmeLines.length} 处: ${fixmeLines.slice(0, 3).map(f => `L${f.idx}`).join(', ')}`,
        };
      } catch {
        result = { criterion, passed: null, detail: '无法读取文件' };
      }
    }
    // 无写入文件时跳过此次检查

  } else if (criterion.startsWith('custom:')) {
    // 人工确认项 — 记录为待确认，不自动判断
    const existing2 = evidence.find(e => e.criterion === criterion);
    if (!existing2) {
      result = { criterion, passed: null, detail: '待人工确认' };
    }
  }

  if (result) {
    const idx = evidence.findIndex(e => e.criterion === criterion);
    if (idx >= 0) {
      evidence[idx] = result;
    } else {
      evidence.push(result);
    }
    anyUpdated = true;
  }
}

if (!anyUpdated) {
  process.exit(0);
}

// 计算整体通过状态（null = 有待确认项）
const definitive = evidence.filter(e => e.passed !== null);
const allPassed = definitive.length === evidence.length && definitive.every(e => e.passed);
const anyFailed = evidence.some(e => e.passed === false);

contract.verification = {
  checked_at: utcTimestamp(),
  passed: anyFailed ? false : (allPassed ? true : null),
  evidence,
};

writeJsonAtomic(contractPath, contract);

// 写入学习日志（JSONL）
ensureDir(GLOBAL_DATA_DIR);
const logPath = join(GLOBAL_DATA_DIR, 'contract-log.jsonl');
appendFileSync(logPath, JSON.stringify({
  event: 'contract_verified',
  id: contract.id,
  description: contract.task.description,
  file: writtenFile,
  criteria_total: contract.task.success_criteria.length,
  criteria_passed: evidence.filter(e => e.passed === true).length,
  criteria_failed: evidence.filter(e => e.passed === false).length,
  criteria_pending: evidence.filter(e => e.passed === null).length,
  overall: contract.verification.passed,
  timestamp: utcTimestamp(),
}) + '\n', 'utf-8');

// 输出简洁状态（PostToolUse 异步，不阻断）
const passedCount = evidence.filter(e => e.passed === true).length;
const failedCount = evidence.filter(e => e.passed === false).length;
const pendingCount = evidence.filter(e => e.passed === null).length;

if (failedCount > 0) {
  hookPrint(
    `⚠️  [Task Contract] 验收标准未满足 (${failedCount} 项失败)`,
    ...evidence.filter(e => e.passed === false).map(e => `   ❌ ${e.detail || e.criterion}`)
  );
} else if (passedCount > 0) {
  hookPrint(`✅ [Task Contract] ${passedCount}/${contract.task.success_criteria.length} 项验收通过${pendingCount > 0 ? `，${pendingCount} 项待人工确认` : ''}`);
}

process.exit(0);
