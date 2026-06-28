#!/usr/bin/env node
/**
 * loop-cursor — Loop Engine 游标管理
 * v1.4.0
 *
 * Cursor 是 Loop Engine 的"哪一步"指针：会话 id、当前 tick、上一帧、当前任务。
 * 写入策略：原子（先写 .tmp.<pid>，再 rename）。
 *
 * 用法：
 *   import { readCursor, advanceCursor, resetCursor } from './loop-cursor.mjs';
 *
 *   CLI:
 *     node loop-cursor.mjs read
 *     node loop-cursor.mjs reset
 *     node loop-cursor.mjs advance --frame observe --tool Write
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

import { resolvePluginRoot } from './path-utils.mjs';
import { readJson, writeJsonAtomic, ensureDir, utcTimestamp } from './hook-utils.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const LOOP_DIR = join(PLUGIN_ROOT, '.chaos-harness', 'loop');
const CURSOR_PATH = join(LOOP_DIR, 'cursor.json');

const DEFAULT_CURSOR = {
  session_id: null,
  version: '1.4.0',
  started_at: null,
  last_frame: null,
  last_frame_at: null,
  tick: 0,
  current_task: null,
  open_loops: [],
};

/**
 * 初始化 cursor（新会话）
 */
export function initCursor(sessionId = randomUUID()) {
  ensureDir(LOOP_DIR);
  const cursor = {
    ...DEFAULT_CURSOR,
    session_id: sessionId,
    started_at: utcTimestamp(),
    tick: 0,
  };
  writeJsonAtomic(CURSOR_PATH, cursor);
  return cursor;
}

/**
 * 读取当前 cursor
 */
export function readCursor() {
  return readJson(CURSOR_PATH, null);
}

/**
 * 推进一帧
 */
export function advanceCursor(frame, extra = {}) {
  ensureDir(LOOP_DIR);
  let cur = readCursor();
  if (!cur) cur = initCursor();
  cur.last_frame = frame;
  cur.last_frame_at = utcTimestamp();
  cur.tick = (cur.tick || 0) + 1;
  if (extra.current_task !== undefined) cur.current_task = extra.current_task;
  if (extra.open_loops !== undefined) cur.open_loops = extra.open_loops;
  writeJsonAtomic(CURSOR_PATH, cur);
  return cur;
}

/**
 * 重置 cursor
 */
export function resetCursor() {
  return initCursor();
}

/**
 * 当前 cursor 是否处于 "in-progress" 状态（用于 Resume）
 * 标准：last_frame 不是 reflect（即 turn 没正常关闭）
 */
export function isInProgress(cursor = readCursor()) {
  if (!cursor) return false;
  if (!cursor.last_frame) return false;
  return cursor.last_frame !== 'reflect';
}

function cli() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === 'read') {
    const c = readCursor();
    console.log(JSON.stringify(c, null, 2));
    return;
  }
  if (cmd === 'reset') {
    const c = resetCursor();
    console.log(JSON.stringify(c, null, 2));
    return;
  }
  if (cmd === 'advance') {
    const fi = rest.indexOf('--frame');
    const ti = rest.indexOf('--tool');
    const frame = fi >= 0 ? rest[fi + 1] : 'observe';
    const tool = ti >= 0 ? rest[ti + 1] : null;
    const c = advanceCursor(frame, tool ? { current_task: { tool } } : {});
    console.log(JSON.stringify(c, null, 2));
    return;
  }
  console.error('Usage: loop-cursor {read|reset|advance --frame <f> [--tool <t>]}');
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli();
}
