#!/usr/bin/env node
/**
 * knowledge-update — PostToolUse Hook (Write|Edit)
 *
 * 职责：
 * AI 写/编辑文件后，增量更新 project-knowledge.json
 *
 * 策略：
 * - 知识图谱不存在 → 子进程触发全量扫描（首次建立）
 * - 知识图谱存在 → 只更新被修改文件所在模块的统计 + lastUpdated
 * - 非代码文件 → 只更新 lastUpdated
 *
 * 注意：不直接 import project-knowledge-engine.mjs，
 * 因为该文件顶层有 process.exit(0) 会终止当前进程。
 */

import { existsSync } from 'node:fs';
import { join, relative, basename, extname, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  detectProjectRoot,
  readJson,
  writeJsonAtomic,
  ensureDir,
  utcTimestamp,
} from './hook-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CODE_EXTENSIONS = new Set([
  '.java', '.kt', '.scala',
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.py', '.rb', '.go', '.rs', '.cs', '.cpp', '.c', '.h',
  '.vue', '.svelte',
]);

function isCodeFile(fp) {
  return CODE_EXTENSIONS.has(extname(fp).toLowerCase());
}

function isTestFile(fp) {
  const lower = fp.toLowerCase();
  return lower.includes('test') || lower.includes('spec') || lower.includes('__tests__');
}

function detectLang(fp) {
  const ext = extname(fp).toLowerCase();
  const map = {
    '.java': 'java', '.kt': 'kotlin', '.scala': 'scala',
    '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript', '.jsx': 'javascript',
    '.py': 'python', '.rb': 'ruby', '.go': 'go', '.rs': 'rust',
    '.cs': 'csharp', '.cpp': 'cpp', '.c': 'c',
    '.vue': 'vue', '.svelte': 'svelte',
  };
  return map[ext] || null;
}

// ---- 获取被修改的文件路径 ----

const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
let writtenFile = null;
try {
  const parsed = JSON.parse(toolInput);
  writtenFile = parsed.file_path || parsed.path || null;
} catch {}

const projectRoot = detectProjectRoot();
if (!projectRoot) process.exit(0);

// 修改的文件不在项目内 → 跳过
if (writtenFile) {
  const rel = relative(projectRoot, writtenFile).replace(/\\/g, '/');
  if (rel.startsWith('..')) process.exit(0);
}

const knowledgePath = join(projectRoot, '.chaos-harness', 'project-knowledge.json');

// ---- 知识图谱不存在 → 子进程全量扫描 ----

if (!existsSync(knowledgePath)) {
  try {
    execFileSync(process.execPath, [
      join(__dirname, 'project-knowledge-engine.mjs'),
      '--scan',
      '--project-root', projectRoot,
    ], { stdio: 'pipe', timeout: 60000 });
  } catch {
    // 非阻断，静默失败
  }
  process.exit(0);
}

// ---- 知识图谱存在 → 增量更新 ----

const knowledge = readJson(knowledgePath, null);
if (!knowledge) process.exit(0);

knowledge.lastUpdated = utcTimestamp();

if (writtenFile && isCodeFile(writtenFile)) {
  const rel = relative(projectRoot, writtenFile).replace(/\\/g, '/');
  const parts = rel.split('/');
  const moduleName = parts.length > 1 ? parts[0] : null;
  const fileExists = existsSync(writtenFile);
  const wasTest = isTestFile(rel);
  const code = knowledge.layers.code;
  const srcList = code.sourceFileList || [];
  const alreadyTracked = srcList.includes(rel);

  if (fileExists && !alreadyTracked) {
    if (wasTest) {
      code.testFiles = (code.testFiles || 0) + 1;
    } else {
      code.sourceFiles = (code.sourceFiles || 0) + 1;
      srcList.push(rel);
      code.sourceFileList = srcList;
    }

    const lang = detectLang(writtenFile);
    if (lang) {
      code.languages = code.languages || {};
      code.languages[lang] = (code.languages[lang] || 0) + 1;
    }

    if (moduleName) {
      const modules = code.modules || [];
      const existing = modules.find(m => m.name === moduleName);
      if (existing) {
        existing.files++;
        if (lang && !existing.languages.includes(lang)) existing.languages.push(lang);
      } else {
        modules.push({ name: moduleName, files: 1, languages: lang ? [lang] : [] });
        code.modules = modules;
      }
    }

    const src = code.sourceFiles || 0;
    const tst = code.testFiles || 0;
    code.testCoverage = { ratio: src > 0 ? tst / src : 0, testFiles: tst, sourceFiles: src };

    const name = basename(rel).toLowerCase();
    const isEntry = name.includes('controller') || name.includes('router') ||
      name.includes('main') || name.includes('app') ||
      name.includes('index') || name.includes('server');
    if (isEntry && !wasTest) {
      const entries = code.entryPoints || [];
      if (!entries.includes(rel)) {
        entries.push(rel);
        code.entryPoints = entries.slice(0, 20);
      }
    }
  }
}

ensureDir(join(projectRoot, '.chaos-harness'));
writeJsonAtomic(knowledgePath, knowledge);

process.exit(0);
