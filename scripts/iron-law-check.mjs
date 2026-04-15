#!/usr/bin/env node
/**
 * iron-law-check — PreToolUse Hook for Write|Edit
 * 验证操作是否符合铁律 IL001-IL005
 *
 * 调用: node iron-law-check.mjs <tool_name> <tool_input_json>
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  appendLog,
  utcTimestamp,
  hookPrint,
} from './hook-utils.mjs';

import { join } from 'node:path';

const IRON_LAW_LOG = join(GLOBAL_DATA_DIR, 'iron-law-log.json');
ensureDir(GLOBAL_DATA_DIR);

// 从参数中解析文件路径
function extractFilePath(toolInput) {
  if (!toolInput) return '';
  try {
    // 尝试解析为 JSON
    const input = JSON.parse(toolInput);
    return input.file_path || '';
  } catch {
    // 如果不是 JSON，用正则提取
    const match = toolInput.match(/"file_path"\s*:\s*"([^"]+)"/);
    return match ? match[1] : '';
  }
}

const toolName = process.argv[2] || '';
const toolInput = process.argv.slice(3).join(' ');
const filePath = extractFilePath(toolInput);

if (!filePath) {
  process.exit(0); // 无文件路径，放行
}

// IL001: 版本目录检查
if (filePath.startsWith('output/') || filePath.includes('/output/')) {
  const hasVersionPattern = /v\d+\.\d+/.test(filePath);
  if (!hasVersionPattern) {
    hookPrint('IL001 BLOCKED: NO DOCUMENTS WITHOUT VERSION LOCK');
    hookPrint(`File path: ${filePath}`);
    hookPrint('Required: output/vX.Y/... format');
    appendLog(IRON_LAW_LOG, {
      iron_law: 'IL001',
      context: '文档输出无版本目录',
      action: 'block',
      file: filePath,
      timestamp: utcTimestamp(),
    });
    process.exit(1);
  }
}

// IL005: 敏感配置检查
const sensitivePatterns = /\.env$|secret|credential|password|token/i;
if (sensitivePatterns.test(filePath)) {
  hookPrint('IL005 WARNING: HIGH-RISK CONFIG MODIFICATION');
  hookPrint(`File path: ${filePath}`);
  hookPrint('Action: Confirm with user before modifying');
  appendLog(IRON_LAW_LOG, {
    iron_law: 'IL005',
    context: '敏感配置文件修改',
    action: 'warning',
    file: filePath,
    timestamp: utcTimestamp(),
  });
}

process.exit(0);
