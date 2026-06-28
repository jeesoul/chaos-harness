#!/usr/bin/env node
/**
 * loop-journal — Loop Engine 流水日志（WAL）
 * v1.4.0
 *
 * journal.jsonl：每行一个 frame。永不修改，只追加。
 * 单文件超过 N 行自动滚动到 journal.<date>.jsonl
 *
 * 用法：
 *   import { writeFrame, readTail, rollover } from './loop-journal.mjs';
 *
 *   CLI:
 *     node loop-journal.mjs append --frame observe --tool Write '{"file_path":"..."}'
 *     node loop-journal.mjs tail --n 20
 *     node loop-journal.mjs stats
 */

import { existsSync, appendFileSync, readFileSync, renameSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';
import { ensureDir, utcTimestamp } from './hook-utils.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const LOOP_DIR = join(PLUGIN_ROOT, '.chaos-harness', 'loop');
const JOURNAL_PATH = join(LOOP_DIR, 'journal.jsonl');

const ROLLOVER_BYTES = 1024 * 1024 * 4; // 4MB

/**
 * 写入一帧。frame ∈ {observe, decide, act, reflect}
 */
export function writeFrame(frame, payload = {}) {
  ensureDir(LOOP_DIR);
  maybeRollover();
  const entry = {
    ts: utcTimestamp(),
    frame,
    ...payload,
  };
  appendFileSync(JOURNAL_PATH, JSON.stringify(entry) + '\n', 'utf8');
  return entry;
}

/**
 * 读取尾部 N 行
 */
export function readTail(n = 20) {
  if (!existsSync(JOURNAL_PATH)) return [];
  const content = readFileSync(JOURNAL_PATH, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  return lines.slice(-n).map(l => {
    try { return JSON.parse(l); } catch { return { raw: l, parse_error: true }; }
  });
}

/**
 * 滚动：超过阈值则重命名为 journal.<date-yyyymmdd-hhmmss>.jsonl
 */
export function maybeRollover() {
  if (!existsSync(JOURNAL_PATH)) return;
  const st = statSync(JOURNAL_PATH);
  if (st.size < ROLLOVER_BYTES) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archived = join(LOOP_DIR, `journal.${stamp}.jsonl`);
  renameSync(JOURNAL_PATH, archived);
  return archived;
}

/**
 * 简单统计
 */
export function stats() {
  if (!existsSync(JOURNAL_PATH)) return { exists: false, frames: 0 };
  const content = readFileSync(JOURNAL_PATH, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  const byFrame = {};
  for (const l of lines) {
    try {
      const e = JSON.parse(l);
      byFrame[e.frame || 'unknown'] = (byFrame[e.frame || 'unknown'] || 0) + 1;
    } catch { /* skip */ }
  }
  return { exists: true, frames: lines.length, byFrame };
}

function cli() {
  const [, , cmd, ...rest] = process.argv;
  if (cmd === 'append') {
    const fi = rest.indexOf('--frame');
    const ti = rest.indexOf('--tool');
    const frame = fi >= 0 ? rest[fi + 1] : 'observe';
    const tool = ti >= 0 ? rest[ti + 1] : null;
    const last = rest[rest.length - 1];
    let payload = tool ? { tool } : {};
    try { if (last && last.startsWith('{')) payload = { ...payload, ...JSON.parse(last) }; } catch {}
    const e = writeFrame(frame, payload);
    console.log(JSON.stringify(e));
    return;
  }
  if (cmd === 'tail') {
    const ni = rest.indexOf('--n');
    const n = ni >= 0 ? parseInt(rest[ni + 1], 10) : 20;
    console.log(JSON.stringify(readTail(n), null, 2));
    return;
  }
  if (cmd === 'stats' || !cmd) {
    console.log(JSON.stringify(stats(), null, 2));
    return;
  }
  console.error('Usage: loop-journal {append|tail|stats}');
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli();
}
