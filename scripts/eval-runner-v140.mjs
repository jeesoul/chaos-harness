#!/usr/bin/env node
/**
 * eval-runner-v140.mjs — v1.4.0 能力评测运行器
 *
 * 自动运行所有 v1.4.0 新功能评测并生成报告
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';
import { createEval, recordResult, codeScorer, generateReport, loadRegistry, saveRegistry } from './eval-utils.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const SCRIPTS = join(PLUGIN_ROOT, 'scripts');

const evals = [];
let passed = 0, failed = 0;

function test(name, fn) {
  evals.push({ name, fn });
}

function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    cwd: PLUGIN_ROOT,
    stdio: opts.silent ? 'pipe' : ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeout || 10000,
    ...opts
  });
}

function expectPass(name, cmd) {
  try {
    run(cmd, { silent: true });
    return { pass: true, detail: 'OK' };
  } catch (e) {
    return { pass: false, detail: e.message };
  }
}

function expectFail(name, cmd) {
  try {
    run(cmd, { silent: true });
    return { pass: false, detail: 'should have failed but passed' };
  } catch {
    return { pass: true, detail: 'correctly failed' };
  }
}

// ---- v1.4.0 Capability Evals ----

test('CAP-001: Loop Engine四帧循环完整', async () => {
  run(`node "${join(SCRIPTS, 'loop-cursor.mjs')}" reset`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame observe --tool Write`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame decide --gate g --status passed`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame act --tool Write --exit 0`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame reflect --turn-id t1`);
  const cursor = JSON.parse(run(`node "${join(SCRIPTS, 'loop-cursor.mjs')}" read`));
  if (cursor.tick !== 4 || cursor.last_frame !== 'reflect') {
    throw new Error(`tick=${cursor.tick}, last_frame=${cursor.last_frame}`);
  }
});

test('CAP-002: Loop journal WAL完整性', async () => {
  const stats = JSON.parse(run(`node "${join(SCRIPTS, 'loop-journal.mjs')}" stats`));
  if (!stats.exists || stats.frames < 4) {
    throw new Error(`journal: exists=${stats.exists}, frames=${stats.frames}`);
  }
  if (!stats.byFrame || !stats.byFrame.observe || !stats.byFrame.reflect) {
    throw new Error('missing frame types in journal');
  }
});

test('CAP-003: Resume检测中断（last_frame != reflect）', async () => {
  run(`node "${join(SCRIPTS, 'loop-cursor.mjs')}" reset`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame observe --tool Write`);
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame act --tool Write --exit 0`);
  let exitCode = 0;
  try {
    run(`node "${join(SCRIPTS, 'resume.mjs')}" --silent`);
  } catch (e) {
    exitCode = e.status;
  }
  if (exitCode !== 10) {
    throw new Error(`expected exit 10 (needs resume), got ${exitCode}`);
  }
});

test('CAP-004: Resume检测正常关闭（last_frame === reflect）', async () => {
  run(`node "${join(SCRIPTS, 'loop-engine.mjs')}" tick --frame reflect --turn-id t2`);
  let exitCode = 255;
  try {
    run(`node "${join(SCRIPTS, 'resume.mjs')}" --silent`);
    exitCode = 0;
  } catch (e) {
    exitCode = e.status;
  }
  if (exitCode !== 0) {
    throw new Error(`expected exit 0 (clean), got ${exitCode}`);
  }
});

test('CAP-005: Wiki indexer build生成index.md', async () => {
  run(`node "${join(SCRIPTS, 'wiki-indexer.mjs')}" build`);
  const indexPath = join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'index.md');
  if (!existsSync(indexPath)) {
    throw new Error('index.md not created');
  }
  const content = readFileSync(indexPath, 'utf8');
  if (!content.includes('# Chaos Harness Wiki')) {
    throw new Error('index.md missing header');
  }
});

test('CAP-006: Wiki search召回种子pattern', async () => {
  const out = run(`node "${join(SCRIPTS, 'wiki-search.mjs')}" query "loop frame"`);
  const results = JSON.parse(out);
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('wiki-search returned empty for known seed');
  }
});

test('CAP-007: Wiki validate通过', async () => {
  const out = run(`node "${join(SCRIPTS, 'wiki-indexer.mjs')}" validate`);
  const r = JSON.parse(out);
  if (!r.ok) {
    throw new Error(`wiki validate failed: ${JSON.stringify(r.errors)}`);
  }
});

test('CAP-008: Snapshot写入last.md', async () => {
  run(`node "${join(SCRIPTS, 'snapshot.mjs')}" write --status in-progress`);
  const lastPath = join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'sessions', 'last.md');
  if (!existsSync(lastPath)) {
    throw new Error('last.md not created');
  }
});

test('CAP-009: path-sanity拒绝非ASCII路径', async () => {
  const r = expectFail('non-ascii', `node "${join(SCRIPTS, 'path-sanity.mjs')}" check "D:\\\\test\\\\万物入侵"`);
  if (!r.pass) throw new Error(r.detail);
});

test('CAP-010: git-detector找到git', async () => {
  const out = run(`node "${join(SCRIPTS, 'git-detector.mjs')}"`);
  const r = JSON.parse(out);
  if (!r.found) {
    throw new Error('git not detected');
  }
  if (!r.version || !r.version.match(/^\d+\.\d+/)) {
    throw new Error(`invalid version: ${r.version}`);
  }
});

test('CAP-011: install.mjs --quick成功', async () => {
  const out = run(`node "${join(SCRIPTS, 'install.mjs')}" --quick --json`);
  const r = JSON.parse(out);
  if (!r.ok) {
    throw new Error('install report not ok');
  }
});

test('CAP-012: post-write-dispatcher不crash', async () => {
  try {
    run(`node "${join(SCRIPTS, 'post-write-dispatcher.mjs')}"`, { silent: true });
  } catch (e) {
    throw new Error(`dispatcher crashed: ${e.message}`);
  }
});

test('CAP-013: hooks.json含v1.4.0新hook', async () => {
  const content = readFileSync(join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'utf8');
  const h = JSON.parse(content);
  const flat = JSON.stringify(h);
  if (!flat.includes('post-write-dispatcher.mjs')) {
    throw new Error('dispatcher not in hooks.json');
  }
  if (!flat.includes('loop-engine.mjs')) {
    throw new Error('loop-engine not in hooks.json');
  }
  if (!flat.includes('resume.mjs')) {
    throw new Error('resume.mjs not in hooks.json');
  }
});

// ---- Runner ----

async function main() {
  console.log('\n════════════════════════════════════════');
  console.log(' v1.4.0 Capability Evaluation');
  console.log('════════════════════════════════════════\n');

  for (const { name, fn } of evals) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.log(`  [FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(` Results: ${passed}/${evals.length} passed, ${failed} failed`);
  console.log(`════════════════════════════════════════\n`);

  // 写入 eval registry
  const registry = loadRegistry();
  const timestamp = new Date().toISOString();
  registry.v140_capability_run = {
    timestamp,
    passed,
    failed,
    total: evals.length,
    pass_rate: (passed / evals.length).toFixed(2),
  };
  saveRegistry(registry);

  const resultFile = join(PLUGIN_ROOT, 'evals', 'results', 'v140-capability-run.json');
  writeFileSync(resultFile, JSON.stringify({
    timestamp,
    passed,
    failed,
    total: evals.length,
    tests: evals.map(e => e.name),
  }, null, 2));

  console.log(`Results saved: ${resultFile}\n`);

  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e); process.exit(2); });
}
