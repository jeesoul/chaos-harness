#!/usr/bin/env node
/**
 * iron-law-check — PreToolUse Hook for Write|Edit
 * 验证操作是否符合铁律 IL001-IL005
 *
 * 性能优化：仅检查被修改的文件，不扫描全项目。
 * 通过 CLAUDE_TOOL_INPUT 环境变量或 argv 参数获取文件路径。
 *
 * 调用: node iron-law-check.mjs [tool_name] [tool_input_json]
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

/**
 * 从工具输入（JSON 字符串）中提取文件路径
 * 支持 CLAUDE_TOOL_INPUT 环境变量或 argv 参数
 */
function extractFilePath() {
  // 优先从环境变量读取（Claude Code hooks 标准方式）
  const envInput = process.env.CLAUDE_TOOL_INPUT;
  if (envInput) {
    const path = tryParseFilePath(envInput);
    if (path) return path;
  }

  // 其次从 argv 参数读取
  const argvInput = process.argv.slice(2).join(' ');
  if (argvInput) {
    return tryParseFilePath(argvInput);
  }

  return '';
}

/**
 * 尝试从字符串中解析出 file_path
 */
function tryParseFilePath(input) {
  if (!input) return '';
  try {
    // 尝试解析为 JSON
    const obj = JSON.parse(input);
    return obj.file_path || obj.path || '';
  } catch {
    // 如果不是 JSON，用正则提取
    const match = input.match(/"file_path"\s*:\s*"([^"]+)"/);
    if (match) return match[1];
    const match2 = input.match(/"path"\s*:\s*"([^"]+)"/);
    if (match2) return match2[1];
    return '';
  }
}

const toolName = process.argv[2] || '';
const filePath = extractFilePath();

if (!filePath) {
  process.exit(0); // 无文件路径，放行
}

/**
 * 检查单条铁律
 */
function checkIronLaw(ironLaw, context, action, message) {
  hookPrint(message);
  hookPrint(`File path: ${filePath}`);
  appendLog(IRON_LAW_LOG, {
    iron_law: ironLaw,
    context,
    action,
    file: filePath,
    timestamp: utcTimestamp(),
  });
}

// IL001: 版本目录检查
if (filePath.startsWith('output/') || filePath.includes('/output/') || filePath.includes('\\output\\')) {
  const hasVersionPattern = /v\d+\.\d+/.test(filePath);
  if (!hasVersionPattern) {
    checkIronLaw(
      'IL001',
      '文档输出无版本目录',
      'block',
      'IL001 BLOCKED: NO DOCUMENTS WITHOUT VERSION LOCK'
    );
    process.exit(1);
  }
}

// IL005: 敏感配置检查
const sensitivePatterns = /\.env$|secret|credential|password|token/i;
if (sensitivePatterns.test(filePath)) {
  checkIronLaw(
    'IL005',
    '敏感配置文件修改',
    'warning',
    'IL005 WARNING: HIGH-RISK CONFIG MODIFICATION'
  );
}

// IL001 补充：禁止在项目根目录创建文档（必须在版本目录下）
const projectRootPatterns = /^(CLAUDE\.md|README|\.md$|docs\/)/;
// 如果文件不在 output/ 下且是 .md 文件，检查是否在根目录
if (filePath.endsWith('.md') && !filePath.startsWith('output/') && !filePath.includes('/output/')) {
  // 允许 chaos-harness/ 下的 .md 文件和 skills/ 下的 .md 文件
  if (!filePath.includes('chaos-harness/') && !filePath.includes('skills/')) {
    checkIronLaw(
      'IL001',
      'Markdown 文件不在版本目录或技能目录中',
      'block',
      'IL001 BLOCKED: Markdown file not in version or skill directory'
    );
    process.exit(1);
  }
}

process.exit(0);
