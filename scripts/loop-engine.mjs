#!/usr/bin/env node
/**
 * loop-engine — Loop Engine 协调器
 * v1.4.0
 *
 * 把 hooks 触发转换为四帧循环：
 *   observe (PreToolUse)   — 看到工具调用
 *   decide  (PreToolUse)   — Gate 决策结果
 *   act     (PostToolUse)  — 工具执行后
 *   reflect (Stop)          — 复盘一轮
 *
 * 与现有 hooks 体系并存：本脚本不替代 gate-enforcer / iron-law-check，
 * 只在它们之外异步追加 frame 到 journal，并推进 cursor。
 *
 * 用法（通常由 hooks 调用）：
 *   node loop-engine.mjs frame observe --tool Write --input '{"file_path":"..."}'
 *   node loop-engine.mjs frame decide  --gate gate-quality-iron-law --status passed
 *   node loop-engine.mjs frame act     --tool Write --exit 0
 *   node loop-engine.mjs frame reflect --turn-id xxx
 *
 *   node loop-engine.mjs status         # 显示当前 cursor + 最近 journal
 *   node loop-engine.mjs tick           # 单独推进一次心跳（不带工具）
 */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { resolvePluginRoot } from './path-utils.mjs';
import { readJson, ensureDir } from './hook-utils.mjs';
import {
  readCursor,
  advanceCursor,
  initCursor,
  isInProgress,
} from './loop-cursor.mjs';
import { writeFrame, readTail, stats as journalStats } from './loop-journal.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const LOOP_DIR = join(PLUGIN_ROOT, '.chaos-harness', 'loop');
ensureDir(LOOP_DIR);

const VALID_FRAMES = new Set(['observe', 'decide', 'act', 'reflect']);

/**
 * 写入一帧 + 推进 cursor，一次性原子操作。
 */
export function tick(frame, payload = {}) {
  if (!VALID_FRAMES.has(frame)) {
    throw new Error(`Invalid frame: ${frame}. Must be one of ${[...VALID_FRAMES].join(', ')}`);
  }

  let cur = readCursor();
  if (!cur) cur = initCursor();

  if (frame === 'reflect') {
    cur = advanceCursor(frame, {
      current_task: cur.current_task,
    });
  } else if (frame === 'observe' && payload.task) {
    cur = advanceCursor(frame, { current_task: payload.task });
  } else {
    cur = advanceCursor(frame, {});
  }

  const journalEntry = writeFrame(frame, {
    tick: cur.tick,
    session_id: cur.session_id,
    ...payload,
  });

  return { cursor: cur, frame: journalEntry };
}

/**
 * SessionStart 调用：判断是否需要 resume
 */
export function sessionStartCheck() {
  const cur = readCursor();
  if (!cur) {
    initCursor();
    return { resume_needed: false, new_session: true };
  }
  if (isInProgress(cur)) {
    return {
      resume_needed: true,
      last_session_id: cur.session_id,
      last_frame: cur.last_frame,
      last_frame_at: cur.last_frame_at,
      current_task: cur.current_task,
      open_loops: cur.open_loops,
    };
  }
  initCursor();
  return { resume_needed: false, new_session: true };
}

/**
 * 显示状态
 */
export function status() {
  const cur = readCursor();
  const tail = readTail(10);
  const st = journalStats();
  return { cursor: cur, recent_frames: tail, journal_stats: st };
}

// ---- 输入解析 ----

function parseArg(args, name, def = null) {
  const i = args.indexOf(name);
  if (i < 0) return def;
  return args[i + 1];
}

function safeJson(s, def = null) {
  if (!s) return def;
  try { return JSON.parse(s); } catch { return def; }
}

function cli() {
  const [, , cmd, ...rest] = process.argv;

  if (!cmd || cmd === 'status') {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }

  if (cmd === 'session-start') {
    console.log(JSON.stringify(sessionStartCheck(), null, 2));
    return;
  }

  if (cmd === 'tick') {
    const frame = parseArg(rest, '--frame', 'observe');
    const tool = parseArg(rest, '--tool');
    const inputStr = parseArg(rest, '--input');
    const gate = parseArg(rest, '--gate');
    const statusArg = parseArg(rest, '--status');
    const exitCode = parseArg(rest, '--exit');
    const turnId = parseArg(rest, '--turn-id');

    const payload = {};
    if (tool) payload.tool = tool;
    if (inputStr) payload.input = safeJson(inputStr, inputStr);
    if (gate) payload.gate = gate;
    if (statusArg) payload.status = statusArg;
    if (exitCode !== null) payload.exit = parseInt(exitCode, 10);
    if (turnId) payload.turn_id = turnId;

    try {
      const result = tick(frame, payload);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(`[loop-engine] ${e.message}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === 'frame') {
    const frame = rest[0];
    const tool = parseArg(rest.slice(1), '--tool');
    const inputStr = parseArg(rest.slice(1), '--input');
    const gate = parseArg(rest.slice(1), '--gate');
    const statusArg = parseArg(rest.slice(1), '--status');
    const exitCode = parseArg(rest.slice(1), '--exit');
    const turnId = parseArg(rest.slice(1), '--turn-id');

    const payload = {};
    if (tool) payload.tool = tool;
    if (inputStr) payload.input = safeJson(inputStr, inputStr);
    if (gate) payload.gate = gate;
    if (statusArg) payload.status = statusArg;
    if (exitCode !== null && exitCode !== undefined) payload.exit = parseInt(exitCode, 10);
    if (turnId) payload.turn_id = turnId;

    try {
      const result = tick(frame, payload);
      console.log(JSON.stringify(result));
    } catch (e) {
      console.error(`[loop-engine] ${e.message}`);
      process.exit(1);
    }
    return;
  }

  console.error('Usage: loop-engine {status|session-start|tick|frame <observe|decide|act|reflect> [--tool] [--input] [--gate] [--status] [--exit] [--turn-id]}');
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli();
}
