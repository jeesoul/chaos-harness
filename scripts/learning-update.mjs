#!/usr/bin/env node
/**
 * learning-update — PostToolUse Hook
 * 记录操作到学习日志供后续分析
 *
 * 环境变量（由 Claude Code 注入）:
 *   CLAUDE_TOOL_NAME  - 触发的工具名（Write/Edit）
 *   CLAUDE_TOOL_INPUT - 工具输入的 JSON 字符串
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

const LEARNING_LOG = join(GLOBAL_DATA_DIR, 'learning-log.json');

// 从环境变量读取工具上下文
const toolName = process.env.CLAUDE_TOOL_NAME || '';
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';

// 解析文件路径和操作类型
let filePath = '';
let fileType = '';

if (toolInput) {
  try {
    const input = typeof toolInput === 'string'
      ? JSON.parse(toolInput)
      : toolInput;
    filePath = input.file_path || input.path || '';
  } catch {
    // 非 JSON 输入，忽略
  }
}

// 推断文件类型
if (filePath) {
  if (filePath.endsWith('.vue')) fileType = 'vue-component';
  else if (filePath.match(/\.[jt]sx?$/)) fileType = 'frontend-code';
  else if (filePath.endsWith('.java')) fileType = 'java-code';
  else if (filePath.endsWith('.py')) fileType = 'python-code';
  else if (filePath.endsWith('.md')) fileType = 'documentation';
  else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) fileType = 'config';
  else if (filePath.endsWith('.sql')) fileType = 'database';
  else if (filePath.endsWith('.test.') || filePath.endsWith('.spec.')) fileType = 'test';
  else if (filePath.includes('output/')) fileType = 'version-output';
  else fileType = 'other';
}

appendLog(LEARNING_LOG, {
  event: 'tool_use',
  tool: toolName,
  file_path: filePath,
  file_type: fileType,
  timestamp: utcTimestamp(),
});

process.exit(0);
