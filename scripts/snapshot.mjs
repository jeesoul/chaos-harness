#!/usr/bin/env node
/**
 * snapshot — Session 快照写入器
 * v1.4.0
 *
 * 把当前 Loop cursor、Gate 状态、待办（如有）合并成一个 wiki/sessions/<id>.md。
 * 同时维护 wiki/sessions/last.md 作为最新一份的硬链接（用 mtime 比对实现）。
 *
 * 用法：
 *   node snapshot.mjs write [--status in-progress|completed|interrupted]
 *   node snapshot.mjs read [--id <ses-id>]
 *   node snapshot.mjs latest
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';
import { ensureDir, utcTimestamp, readJson } from './hook-utils.mjs';
import { readCursor } from './loop-cursor.mjs';
import { readTail } from './loop-journal.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const WIKI_DIR = join(PLUGIN_ROOT, '.chaos-harness', 'wiki');
const SESSIONS_DIR = join(WIKI_DIR, 'sessions');
const LAST_PATH = join(SESSIONS_DIR, 'last.md');
const GATES_DIR = join(PLUGIN_ROOT, '.chaos-harness', 'gates');

function collectGateStates() {
  if (!existsSync(GATES_DIR)) return [];
  const states = [];
  for (const f of readdirSync(GATES_DIR)) {
    if (!f.startsWith('gate-') || !f.endsWith('.json') || f === 'gate-registry.json' || f === 'gate-learning.json') continue;
    const j = readJson(join(GATES_DIR, f), null);
    if (!j) continue;
    states.push({
      id: j.id || f.replace('.json', ''),
      status: j.status || 'pending',
      lastChecked: j.lastChecked || null,
    });
  }
  return states;
}

function buildBody({ cursor, frames, gates, status, openTasks }) {
  const lines = [];
  lines.push('## Progress');
  lines.push('');
  if (openTasks && openTasks.length > 0) {
    for (const t of openTasks) {
      const mark = t.status === 'completed' ? 'x' : ' ';
      lines.push(`- [${mark}] ${t.subject || t.id}`);
    }
  } else {
    lines.push('_No tracked tasks._');
  }
  lines.push('');

  lines.push('## Loop Cursor');
  lines.push('');
  if (cursor) {
    lines.push(`- session_id: \`${cursor.session_id}\``);
    lines.push(`- tick: ${cursor.tick}`);
    lines.push(`- last_frame: \`${cursor.last_frame || 'none'}\` at ${cursor.last_frame_at || ''}`);
    lines.push(`- current_task: ${cursor.current_task ? JSON.stringify(cursor.current_task) : 'none'}`);
    lines.push(`- open_loops: ${(cursor.open_loops || []).length}`);
  } else {
    lines.push('_No cursor recorded._');
  }
  lines.push('');

  lines.push('## Gate States');
  lines.push('');
  if (gates.length === 0) {
    lines.push('_No gate states yet._');
  } else {
    lines.push('| Gate | Status | Last checked |');
    lines.push('|------|--------|--------------|');
    for (const g of gates) {
      lines.push(`| \`${g.id}\` | ${g.status} | ${g.lastChecked || ''} |`);
    }
  }
  lines.push('');

  lines.push('## Recent Frames (last 10)');
  lines.push('');
  if (frames.length === 0) {
    lines.push('_No frames._');
  } else {
    lines.push('| Tick | Frame | Detail |');
    lines.push('|------|-------|--------|');
    for (const f of frames) {
      const detail = f.tool ? `tool=${f.tool}` : (f.gate ? `gate=${f.gate} status=${f.status}` : '');
      lines.push(`| ${f.tick || ''} | \`${f.frame}\` | ${detail} |`);
    }
  }
  lines.push('');

  lines.push('## Resume Hints');
  lines.push('');
  if (status === 'interrupted' || (cursor && cursor.last_frame && cursor.last_frame !== 'reflect')) {
    lines.push('- Loop did NOT finish with `reflect` — session likely interrupted.');
    if (cursor && cursor.last_frame) lines.push(`- Last frame was \`${cursor.last_frame}\` — pick up from the next frame in cycle.`);
    if (cursor && cursor.current_task) lines.push(`- Current task: \`${JSON.stringify(cursor.current_task)}\``);
    const incomplete = openTasks ? openTasks.filter(t => t.status !== 'completed') : [];
    if (incomplete.length > 0) lines.push(`- Resume from open tasks: ${incomplete.map(t => `\`${t.subject || t.id}\``).join(', ')}`);
  } else {
    lines.push('- Previous session completed normally.');
    lines.push('- No special resume action needed.');
  }
  lines.push('');
  return lines.join('\n');
}

export function writeSnapshot({ status = 'in-progress', openTasks = [], title = null } = {}) {
  ensureDir(SESSIONS_DIR);
  const cursor = readCursor();
  const frames = readTail(10);
  const gates = collectGateStates();

  const sid = cursor?.session_id || 'unknown';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const id = `ses-${stamp}-${sid.slice(0, 8)}`;
  const file = join(SESSIONS_DIR, `${id}.md`);

  const tags = [`status:${status}`];

  const fm = [
    '---',
    `id: ${id}`,
    `type: session`,
    `title: "${title || `Session ${id}`}"`,
    `tags: [${tags.join(', ')}]`,
    `links: []`,
    `created: ${utcTimestamp()}`,
    `updated: ${utcTimestamp()}`,
    `status: ${status}`,
    `cursor_tick: ${cursor?.tick || 0}`,
    `last_frame: ${cursor?.last_frame || 'none'}`,
    '---',
  ].join('\n');

  const body = buildBody({ cursor, frames, gates, status, openTasks });
  const content = `${fm}\n\n${body}`;
  writeFileSync(file, content, 'utf8');
  copyFileSync(file, LAST_PATH);
  return { id, path: file, last: LAST_PATH };
}

export function readSnapshot(id = null) {
  if (id) {
    const p = join(SESSIONS_DIR, `${id}.md`);
    if (!existsSync(p)) return null;
    return readFileSync(p, 'utf8');
  }
  if (!existsSync(LAST_PATH)) return null;
  return readFileSync(LAST_PATH, 'utf8');
}

export function listSnapshots() {
  if (!existsSync(SESSIONS_DIR)) return [];
  return readdirSync(SESSIONS_DIR)
    .filter(f => f.startsWith('ses-') && f.endsWith('.md'))
    .map(f => ({ name: f, mtime: statSync(join(SESSIONS_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
}

function cli() {
  const [, , cmd, ...rest] = process.argv;
  const get = (flag) => { const i = rest.indexOf(flag); return i >= 0 ? rest[i + 1] : null; };

  if (cmd === 'write' || !cmd) {
    const status = get('--status') || 'in-progress';
    const title = get('--title');
    const r = writeSnapshot({ status, title });
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === 'read') {
    const id = get('--id');
    const content = readSnapshot(id);
    if (!content) { console.error('No snapshot found'); process.exit(1); }
    console.log(content);
    return;
  }

  if (cmd === 'latest') {
    const list = listSnapshots();
    console.log(JSON.stringify(list.slice(0, 5), null, 2));
    return;
  }

  console.error('Usage: snapshot {write|read|latest}');
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli();
}
