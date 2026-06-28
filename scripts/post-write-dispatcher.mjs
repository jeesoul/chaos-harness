#!/usr/bin/env node
/**
 * post-write-dispatcher — PostToolUse 合并分发器
 * v1.4.0
 *
 * 一次性触发四个原本独立的 hook：
 *   - learning-update.mjs
 *   - project-pattern-writer.mjs
 *   - workflow-track.mjs
 *   - instinct-collector.mjs
 *   - dev-intelligence.mjs --session-context
 *
 * 加：tick loop-engine 一帧 act，更新 wiki 索引（异步、debounce）。
 *
 * 特性：
 *   - debounce：同一脚本 5 秒内不重触发
 *   - 全部 fire-and-forget（spawn detached 模式）
 *   - 总耗时 < 200ms（仅做 spawn，不 wait）
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const SCRIPTS_DIR = join(PLUGIN_ROOT, 'scripts');
const DEBOUNCE_PATH = join(PLUGIN_ROOT, '.chaos-harness', 'dispatcher-debounce.json');
const DEBOUNCE_MS = 5000;

// 子任务清单：可独立失败不影响主流程
const TASKS = [
  { name: 'learning-update',         script: 'learning-update.mjs',         args: [] },
  { name: 'project-pattern-writer',  script: 'project-pattern-writer.mjs',  args: [] },
  { name: 'workflow-track',          script: 'workflow-track.mjs',          args: [] },
  { name: 'instinct-collector',      script: 'instinct-collector.mjs',      args: [] },
  { name: 'dev-intelligence',        script: 'dev-intelligence.mjs',        args: ['--session-context', '--root', PLUGIN_ROOT] },
  { name: 'wiki-indexer',            script: 'wiki-indexer.mjs',            args: ['build'] },
];

function readDebounce() {
  try { return JSON.parse(readFileSync(DEBOUNCE_PATH, 'utf8')); } catch { return {}; }
}

function writeDebounce(obj) {
  try {
    mkdirSync(dirname(DEBOUNCE_PATH), { recursive: true });
    writeFileSync(DEBOUNCE_PATH, JSON.stringify(obj), 'utf8');
  } catch { /* ignore */ }
}

function fire(task) {
  const script = join(SCRIPTS_DIR, task.script);
  if (!existsSync(script)) return false;
  try {
    const child = spawn(process.execPath, [script, ...task.args], {
      detached: true,
      stdio: 'ignore',
      cwd: PLUGIN_ROOT,
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function fireLoopAct(tool, exitCode) {
  const script = join(SCRIPTS_DIR, 'loop-engine.mjs');
  if (!existsSync(script)) return;
  try {
    const child = spawn(process.execPath, [
      script, 'tick',
      '--frame', 'act',
      '--tool', tool || 'unknown',
      '--exit', String(exitCode ?? 0),
    ], { detached: true, stdio: 'ignore', cwd: PLUGIN_ROOT });
    child.unref();
  } catch { /* ignore */ }
}

function main() {
  const now = Date.now();
  const debounce = readDebounce();

  const tool = process.env.CLAUDE_TOOL_NAME || 'unknown';
  const exitCode = parseInt(process.env.CLAUDE_TOOL_EXIT_CODE || '0', 10);

  fireLoopAct(tool, exitCode);

  let fired = 0;
  for (const task of TASKS) {
    const last = debounce[task.name] || 0;
    if (now - last < DEBOUNCE_MS) continue;
    if (fire(task)) {
      debounce[task.name] = now;
      fired++;
    }
  }

  writeDebounce(debounce);

  if (process.env.CHAOS_DEBUG === '1') {
    console.error(`[post-write-dispatcher] fired=${fired}/${TASKS.length}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
