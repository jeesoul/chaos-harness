#!/usr/bin/env node
/**
 * project-pattern-writer — 项目经验自动积累
 * 在成功操作后，将可复用的经验写入 project-patterns
 *
 * 环境变量（由 Claude Code 注入）:
 *   CLAUDE_TOOL_NAME  - 触发的工具名
 *   CLAUDE_TOOL_INPUT - 工具输入的 JSON 字符串
 *
 * 调用: node project-pattern-writer.mjs
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  readJson,
  appendLog,
  detectProjectRoot,
  readProjectState,
  utcTimestamp,
} from './hook-utils.mjs';

import { join, dirname } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

ensureDir(GLOBAL_DATA_DIR);

const LAZINESS_LOG = join(GLOBAL_DATA_DIR, 'laziness-log.json');

// 从环境变量读取工具上下文
const toolName = process.env.CLAUDE_TOOL_NAME || '';
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';

let filePath = '';
if (toolInput) {
  try {
    const input = typeof toolInput === 'string' ? JSON.parse(toolInput) : toolInput;
    filePath = input.file_path || input.path || '';
  } catch { /* ignore */ }
}

if (!filePath) {
  process.exit(0);
}

// 推断项目类型
const projectRoot = detectProjectRoot();
const state = readProjectState(projectRoot);
const projectType = state?.scan_result?.project_type || detectProjectType(projectRoot);

// 推断文件类型
const fileType = inferFileType(filePath);

// 经验文件路径
const patternsDir = join(projectRoot, 'references', 'project-patterns');
ensureDir(patternsDir);

const patternKey = `${projectType}-${fileType}`;
const patternFile = join(patternsDir, `${patternKey}.md`);

// 读取或创建经验文件
let patternData = {
  project_key: patternKey,
  aliases: [projectType, fileType],
  updated: utcTimestamp().split('T')[0],
  sections: { features: [], patterns: [], traps: [] },
};

if (existsSync(patternFile)) {
  try {
    const content = readFileSync(patternFile, 'utf-8');
    // 简单解析：提取 frontmatter 和各 section
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      const fm = fmMatch[1];
      const body = fmMatch[2];
      const keyMatch = fm.match(/project_key:\s*(.+)/);
      const aliasMatch = fm.match(/aliases:\s*\[(.+?)\]/);
      const updatedMatch = fm.match(/updated:\s*(.+)/);
      if (keyMatch) patternData.project_key = keyMatch[1].trim();
      if (aliasMatch) patternData.aliases = aliasMatch[1].split(',').map(s => s.trim());
      if (updatedMatch) patternData.updated = updatedMatch[1].trim();

      patternData.sections.features = extractSection(body, '平台特征');
      patternData.sections.patterns = extractSection(body, '有效模式');
      patternData.sections.traps = extractSection(body, '已知陷阱');
    }
  } catch { /* ignore */ }
}

// 检查是否已有该经验
const experienceEntry = `- [${toolName}] ${filePath}`;
const allEntries = [...patternData.sections.patterns];
const alreadyRecorded = allEntries.some(e => e.includes(filePath));

if (!alreadyRecorded && allEntries.length < 20) {
  allEntries.push(experienceEntry);
  patternData.sections.patterns = allEntries;
  patternData.updated = utcTimestamp().split('T')[0];

  // 写入文件
  const output = generatePatternFile(patternData);
  writeFileSync(patternFile, output, 'utf-8');
}

// 记录经验写入事件
appendLog(join(GLOBAL_DATA_DIR, 'learning-log.json'), {
  event: 'pattern_recorded',
  file: filePath,
  pattern_file: patternFile,
  timestamp: utcTimestamp(),
});

process.exit(0);

// ---- Helpers ----

function detectProjectType(root) {
  if (existsSync(join(root, 'pom.xml'))) {
    try {
      const pom = readFileSync(join(root, 'pom.xml'), 'utf-8');
      return pom.includes('spring-boot') ? 'java-spring' : 'java-maven';
    } catch { return 'java-maven'; }
  }
  if (existsSync(join(root, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.vue) return deps.vue.startsWith('3') ? 'vue3' : 'vue2';
      if (deps.react) return 'react';
    } catch { return 'node'; }
    return 'node';
  }
  return 'unknown';
}

function inferFileType(path) {
  if (path.endsWith('.vue')) return 'vue';
  if (path.match(/\.[jt]sx?$/)) return 'typescript';
  if (path.endsWith('.java')) return 'java';
  if (path.endsWith('.py')) return 'python';
  if (path.endsWith('.md')) return 'markdown';
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
  if (path.endsWith('.sql')) return 'sql';
  if (path.match(/\.test\./) || path.match(/\.spec\./)) return 'test';
  return 'other';
}

function extractSection(body, heading) {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=## |$)`);
  const match = body.match(regex);
  if (!match) return [];
  return match[1].trim().split('\n').filter(line => line.trim());
}

function generatePatternFile(data) {
  const lines = [
    `---`,
    `project_key: ${data.project_key}`,
    `aliases: [${data.aliases.join(', ')}]`,
    `updated: ${data.updated}`,
    `---`,
    `## 平台特征`,
    ...data.sections.features,
    ``,
    `## 有效模式`,
    ...data.sections.patterns,
    ``,
    `## 已知陷阱`,
    ...data.sections.traps,
    ``,
  ];
  return lines.join('\n');
}
