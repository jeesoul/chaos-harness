#!/usr/bin/env node
/**
 * test-v140 — v1.4.0 端到端集成测试
 * 验证 Loop / Wiki / Resume / Install / Dispatcher 协同
 */

import { execSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePluginRoot } from '../scripts/path-utils.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const SCRIPTS = join(PLUGIN_ROOT, 'scripts');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function run(cmd) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', cwd: PLUGIN_ROOT, timeout: 10000 });
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }

test('install --quick succeeds', () => {
  const out = run(`node "${join(SCRIPTS, 'install.mjs')}" --quick --json`);
  const r = JSON.parse(out);
  ok(r.ok === true, 'install report not ok');
});

test('path-sanity rejects non-ASCII path', () => {
  let failed = false;
  try {
    run(`node "${join(SCRIPTS, 'path-sanity.mjs')}" check "D:\\\\test\\\\万物入侵"`);
  } catch { failed = true; }
  ok(failed, 'path-sanity should fail for non-ASCII path');
});

test('git-detector finds git binary', () => {
  const out = run(`node "${join(SCRIPTS, 'git-detector.mjs')}"`);
  const r = JSON.parse(out);
  ok(r.found === true, 'git not detected');
  ok(r.version && r.version.match(/^\d+\.\d+/), `bad version: ${r.version}`);
});

test('loop full cycle observe→decide→act→reflect', () => {
  run(`node "${join(SCRIPTS, 'loop-cursor.mjs')}" reset`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame observe --tool Write`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame decide --gate g --status passed`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame act --tool Write --exit 0`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame reflect --turn-id t1`);
  const cur = JSON.parse(run(`node "${join(SCRIPTS, 'loop-cursor.mjs')}" read`));
  ok(cur.tick === 4, `tick=${cur.tick}, want 4`);
  ok(cur.last_frame === 'reflect', `last_frame=${cur.last_frame}`);
});

test('interrupt detected when last_frame != reflect', () => {
  run(`node "${join(SCRIPTS, 'loop-cursor.mjs')}" reset`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame observe --tool Write`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame act --tool Write --exit 0`);
  let ex = 0;
  try {
    run(`node "${join(SCRIPTS, 'resume.mjs')}" --silent`);
  } catch (e) {
    ex = e.status;
  }
  ok(ex === 10, `expected exit 10 (resume needed), got ${ex}`);
});

test('resume clean when last_frame === reflect', () => {
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame reflect --turn-id t2`);
  const ex = (() => {
    try { run(`node "${join(SCRIPTS, 'resume.mjs')}" --silent`); return 0; }
    catch (e) { return e.status; }
  })();
  ok(ex === 0, `expected exit 0 (clean), got ${ex}`);
});

test('wiki indexer build creates index.md', () => {
  run(`node "${join(SCRIPTS, 'wiki-indexer.mjs')}" build`);
  const indexPath = join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'index.md');
  ok(existsSync(indexPath), 'index.md not created');
  const content = readFileSync(indexPath, 'utf8');
  ok(content.includes('# Chaos Harness Wiki'), 'index.md missing title');
});

test('wiki search returns ranked results', () => {
  const out = run(`node "${join(SCRIPTS, 'wiki-search.mjs')}" query "loop frame"`);
  const arr = JSON.parse(out);
  ok(Array.isArray(arr), 'wiki-search did not return array');
  ok(arr.length >= 1, 'wiki-search returned 0 results for known seed');
});

test('wiki indexer validate ok', () => {
  const out = run(`node "${join(SCRIPTS, 'wiki-indexer.mjs')}" validate`);
  const r = JSON.parse(out);
  ok(r.ok === true, `wiki validate failed: ${JSON.stringify(r.errors)}`);
});

test('snapshot write produces last.md', () => {
  run(`node "${join(SCRIPTS, 'snapshot.mjs')}" write --status in-progress`);
  const last = join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'sessions', 'last.md');
  ok(existsSync(last), 'last.md not created');
});

test('post-write-dispatcher fires without crash', () => {
  // 不一定有所有脚本，只要 dispatcher 自身正常退出即可
  let crashed = false;
  try {
    run(`node "${join(SCRIPTS, 'post-write-dispatcher.mjs')}"`);
  } catch { crashed = true; }
  ok(!crashed, 'dispatcher crashed');
});

test('hooks.json is valid + has v1.4.0 dispatcher', () => {
  const content = readFileSync(join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'utf8');
  const h = JSON.parse(content);
  ok(h.hooks.PostToolUse, 'no PostToolUse');
  const flat = JSON.stringify(h);
  ok(flat.includes('post-write-dispatcher.mjs'), 'dispatcher not registered in hooks.json');
  ok(flat.includes('loop-engine.mjs'), 'loop-engine not registered in hooks.json');
  ok(flat.includes('resume.mjs'), 'resume.mjs not registered in hooks.json');
});

test('skills directory has v1.4.0 count', () => {
  const skills = run(`node -e "console.log(require('fs').readdirSync('skills').filter(d => !d.startsWith('.') && d !== 'shared').length)"`);
  const n = parseInt(skills.trim(), 10);
  ok(n === 12, `expected 12 skills, got ${n}`);
});

// ---- runner ----
async function main() {
  console.log('\nv1.4.0 Integration Tests');
  console.log('='.repeat(40));
  let passed = 0, failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.log(`  [FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nResults: ${passed}/${tests.length} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
