#!/usr/bin/env node
// iterative-retrieval.mjs — 4 阶段检索循环
// DISPATCH → EVALUATE → REFINE → LOOP (max 3)

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const RETRIEVAL_STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'retrieval-state.json');

// 检索状态
let state = loadState();

function loadState() {
  if (!existsSync(RETRIEVAL_STATE_FILE)) {
    return { cycle: 0, candidates: [], refined_patterns: [], excluded_paths: [] };
  }
  try {
    return JSON.parse(readFileSync(RETRIEVAL_STATE_FILE, 'utf8'));
  } catch (e) {
    return { cycle: 0, candidates: [], refined_patterns: [], excluded_paths: [] };
  }
}

function saveState() {
  mkdirSync(join(PROJECT_ROOT, '.chaos-harness'), { recursive: true });
  writeFileSync(RETRIEVAL_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// 阶段 1: DISPATCH — 初始广泛查询
function dispatch(intent) {
  console.log(`[DISPATCH] Searching for: ${intent}`);

  const patterns = extractFilePatterns(intent);
  const candidates = [];

  for (const pattern of patterns) {
    // 输出搜索建议供 Claude Code 执行
    console.log(`  Search pattern: ${pattern}`);
  }

  state.cycle = 1;
  state.candidates = candidates;
  state.intent = intent;
  saveState();

  return { cycle: 1, patterns };
}

// 从意图中提取文件搜索模式
function extractFilePatterns(intent) {
  const patterns = [];
  const exts = intent.match(/\.(\w+)/g);
  if (exts) {
    for (const ext of exts) {
      patterns.push(`**/*${ext}`);
    }
  }

  // 关键词匹配
  const keywords = intent.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const kw of keywords) {
    patterns.push(`**/*${kw}*`);
  }

  return [...new Set(patterns)];
}

// 阶段 2: EVALUATE — 评估检索内容
function evaluate(fileContents) {
  console.log(`[EVALUATE] Assessing ${fileContents.length} files`);

  const scored = [];
  for (const file of fileContents) {
    const relevance = calculateRelevance(file, state.intent);
    scored.push({ ...file, relevance });
  }

  // 分类
  const high = scored.filter(s => s.relevance >= 0.8);
  const medium = scored.filter(s => s.relevance >= 0.5 && s.relevance < 0.8);
  const low = scored.filter(s => s.relevance >= 0.2 && s.relevance < 0.5);
  const none = scored.filter(s => s.relevance < 0.2);

  console.log(`  High: ${high.length}, Medium: ${medium.length}, Low: ${low.length}, None: ${none.length}`);

  state.candidates = scored;
  state.missing_context = identifyMissingContext(high, medium);
  saveState();

  return { high, medium, low, none, missing_context: state.missing_context };
}

// 计算相关性评分
function calculateRelevance(file, intent) {
  const intentWords = intent.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const content = (file.content || '').toLowerCase();

  let score = 0;
  let matched = 0;

  for (const word of intentWords) {
    const regex = new RegExp(word, 'g');
    const matches = content.match(regex);
    if (matches) {
      matched++;
      score += matches.length * 0.1;
    }
  }

  if (intentWords.length > 0) {
    score = Math.min(1.0, (matched / intentWords.length) * 0.5 + score);
  }

  return Math.round(score * 100) / 100;
}

// 识别缺失上下文
function identifyMissingContext(high, medium) {
  const allContent = [...high, ...medium].map(f => f.content || '').join(' ');
  const missing = [];

  // 检测常见缺失模式
  if (!allContent.includes('test') && !allContent.includes('spec')) {
    missing.push('no test files found');
  }
  if (!allContent.includes('interface') && !allContent.includes('type')) {
    missing.push('no type definitions found');
  }
  if (!allContent.includes('import') && !allContent.includes('require')) {
    missing.push('no import statements found');
  }

  return missing;
}

// 阶段 3: REFINE — 基于评估更新搜索标准
function refine() {
  console.log(`[REFINE] Refining search criteria`);

  const highCandidates = state.candidates.filter(c => c.relevance >= 0.8);
  const newPatterns = [];

  // 从高相关性文件中提取新关键词
  for (const candidate of highCandidates) {
    const content = (candidate.content || '').toLowerCase();
    const words = content.match(/\b[a-z]{4,}\b/g) || [];
    const freq = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;

    for (const [word, count] of Object.entries(freq)) {
      if (count >= 3 && !state.intent.toLowerCase().includes(word)) {
        newPatterns.push(`**/*${word}*`);
      }
    }
  }

  state.refined_patterns = [...new Set([...state.refined_patterns, ...newPatterns])];
  saveState();

  return { new_patterns: state.refined_patterns };
}

// 阶段 4: LOOP — 判断是否继续
function shouldLoop() {
  if (state.cycle >= 3) {
    console.log('[LOOP] Max cycles reached (3)');
    return false;
  }

  const highCount = state.candidates.filter(c => c.relevance >= 0.8).length;
  if (highCount >= 5) {
    console.log(`[LOOP] Sufficient high-relevance candidates (${highCount})`);
    return false;
  }

  if (state.missing_context.length === 0 && highCount >= 2) {
    console.log('[LOOP] No missing context and sufficient candidates');
    return false;
  }

  state.cycle++;
  saveState();
  return true;
}

// 完整检索循环
function runRetrievalCycle(intent, fileContents) {
  if (!state.intent || state.intent !== intent) {
    dispatch(intent);
  }

  const evaluated = evaluate(fileContents);
  const refined = refine();
  const shouldContinue = shouldLoop();

  return {
    cycle: state.cycle,
    evaluated,
    refined,
    shouldContinue,
    maxCycles: 3
  };
}

// CLI 入口
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'dispatch':
      dispatch(args.slice(1).join(' '));
      break;
    case 'status':
      console.log(JSON.stringify(state, null, 2));
      break;
    case 'reset':
      state = { cycle: 0, candidates: [], refined_patterns: [], excluded_paths: [] };
      saveState();
      console.log('Retrieval state reset');
      break;
    default:
      console.log('Usage: iterative-retrieval.mjs [dispatch|status|reset]');
  }
}

export { runRetrievalCycle, dispatch, evaluate, refine, shouldLoop, loadState };
