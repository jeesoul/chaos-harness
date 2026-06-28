#!/usr/bin/env node
/**
 * wiki-search — Wiki 搜索（轻量 BM25-lite，零依赖）
 * v1.4.0
 *
 * 与 dev-intelligence 的 search.py 不同：wiki-search 是 pure Node.js，
 * 因为 wiki 内容会频繁变化，每次都跑 Python 启动成本太高。
 *
 * 算法：TF-IDF 简化版 + tag 加权 + title 加权。
 *
 * 用法：
 *   node wiki-search.mjs query "关键词"
 *   node wiki-search.mjs query "关键词" --type pattern --limit 5
 */

import { fileURLToPath } from 'node:url';
import { exportCorpus } from './wiki-indexer.mjs';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'has',
  'have', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
  '的', '了', '是', '在', '和', '与', '或', '但', '把',
]);

function tokenize(text) {
  if (!text) return [];
  const lowered = text.toLowerCase();
  const tokens = lowered.split(/[^\p{L}\p{N}_-]+/u).filter(Boolean);
  return tokens.filter(t => !STOPWORDS.has(t) && t.length >= 2);
}

function scoreEntry(entry, queryTokens) {
  const textTokens = tokenize(entry.text);
  const titleTokens = tokenize(entry.title);
  const tagTokens = entry.tags.flatMap(t => tokenize(t));

  const tf = new Map();
  for (const t of textTokens) tf.set(t, (tf.get(t) || 0) + 1);

  let score = 0;
  let matched = 0;
  for (const q of queryTokens) {
    if (tf.has(q)) {
      score += Math.log(1 + tf.get(q));
      matched++;
    }
    if (titleTokens.includes(q)) score += 3;
    if (tagTokens.includes(q)) score += 2;
  }
  if (matched === 0) return 0;
  score += matched * 0.5;
  return score;
}

export function search(query, { type = null, limit = 10 } = {}) {
  const corpus = exportCorpus();
  const filtered = type ? corpus.filter(e => e.type === type) : corpus;
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const scored = filtered
    .map(e => ({ ...e, score: scoreEntry(e, qTokens) }))
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}

function cli() {
  const [, , cmd, ...rest] = process.argv;
  if (cmd !== 'query') {
    console.error('Usage: wiki-search query "<terms>" [--type <t>] [--limit <n>]');
    process.exit(2);
  }
  const query = rest[0];
  const ti = rest.indexOf('--type');
  const li = rest.indexOf('--limit');
  const opts = {
    type: ti >= 0 ? rest[ti + 1] : null,
    limit: li >= 0 ? parseInt(rest[li + 1], 10) : 10,
  };
  if (!query) {
    console.error('Missing query');
    process.exit(2);
  }
  const results = search(query, opts);
  console.log(JSON.stringify(results.map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    tags: r.tags,
    path: r.path,
    score: Math.round(r.score * 100) / 100,
  })), null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli();
}
