#!/usr/bin/env node
/**
 * sp-test-runner — Superpowers 框架自测
 * 运行 chaos-harness 自身的测试用例
 *
 * 调用: node sp-test-runner.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolvePluginRoot } from './path-utils.mjs';
import { writeJson, ensureDir } from './hook-utils.mjs';

const pluginRoot = resolvePluginRoot();

async function main() {
  console.log('\nChaos-Harness Self-Test');
  console.log('='.repeat(40));

  const results = [];

  // 检查核心脚本是否存在
  const coreScripts = [
    'gate-validator.mjs',
    'gate-machine.mjs',
    'gate-enforcer.mjs',
    'gate-recovery.mjs',
    'iron-law-check.mjs',
    'laziness-detect.mjs',
    'learning-update.mjs',
    'workflow-track.mjs',
    'stop.mjs',
    'dev-intelligence.mjs',
    // v1.4.0 Loop & Wiki
    'loop-engine.mjs',
    'loop-cursor.mjs',
    'loop-journal.mjs',
    'wiki-indexer.mjs',
    'wiki-search.mjs',
    'resume.mjs',
    'snapshot.mjs',
    'post-write-dispatcher.mjs',
    'install.mjs',
    'git-detector.mjs',
    'path-sanity.mjs',
  ];

  console.log('\nChecking core scripts...');
  for (const script of coreScripts) {
    const scriptPath = join(pluginRoot, 'scripts', script);
    const exists = existsSync(scriptPath);
    results.push({ test: `script-exists:${script}`, passed: exists, reason: exists ? '' : 'Missing' });
    console.log(`  [${exists ? 'PASS' : 'FAIL'}] ${script}`);
  }

  // 语法检查
  console.log('\nChecking syntax...');
  const mjsFiles = readdirSync(join(pluginRoot, 'scripts')).filter(f => f.endsWith('.mjs'));
  let syntaxErrors = 0;
  for (const file of mjsFiles) {
    const filePath = join(pluginRoot, 'scripts', file);
    try {
      execSync(`node -c "${filePath}"`, { stdio: 'pipe', timeout: 5000 });
      results.push({ test: `syntax:${file}`, passed: true });
    } catch (e) {
      syntaxErrors++;
      results.push({ test: `syntax:${file}`, passed: false, reason: e.stderr?.toString()?.slice(0, 200) });
      console.log(`  [FAIL] ${file}`);
    }
  }
  console.log(`  Syntax OK: ${mjsFiles.length - syntaxErrors}/${mjsFiles.length}`);

  // 检查 hooks.json
  console.log('\nChecking hooks...');
  const hooksPath = join(pluginRoot, 'hooks', 'hooks.json');
  const hooksExists = existsSync(hooksPath);
  results.push({ test: 'hooks-json', passed: hooksExists });
  console.log(`  [${hooksExists ? 'PASS' : 'FAIL'}] hooks.json`);

  if (hooksExists) {
    try {
      const hooks = JSON.parse(readFileSync(hooksPath, 'utf-8'));
      const hookCount = Object.keys(hooks.hooks || {}).length;
      console.log(`  Hooks defined: ${hookCount}`);
    } catch (e) {
      console.log('  [FAIL] Invalid JSON');
      results.push({ test: 'hooks-valid-json', passed: false });
    }
  }

  // 检查 gate 注册表
  console.log('\nChecking gates...');
  const registryPath = join(pluginRoot, '.chaos-harness', 'gates', 'gate-registry.json');
  const registryExists = existsSync(registryPath);
  results.push({ test: 'gate-registry', passed: registryExists });
  console.log(`  [${registryExists ? 'PASS' : 'FAIL'}] gate-registry.json`);

  // 检查知识库（v1.4.0：Wiki 取代 CSV）
  console.log('\nChecking knowledge base (Wiki)...');
  const wikiPatternsDir = join(pluginRoot, '.chaos-harness', 'wiki', 'patterns');
  if (existsSync(wikiPatternsDir)) {
    const patternCount = readdirSync(wikiPatternsDir).filter(f => f.endsWith('.md')).length;
    const ok = patternCount >= 20; // 迁移后应有大量 pattern
    results.push({ test: 'wiki-patterns-populated', passed: ok, reason: `${patternCount} patterns` });
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] wiki patterns: ${patternCount}`);
  } else {
    results.push({ test: 'wiki-patterns-populated', passed: false, reason: 'wiki/patterns missing' });
    console.log('  [FAIL] wiki/patterns missing');
  }

  // 检查 Wiki 搜索（纯 Node，无 Python 依赖）
  console.log('\nChecking Wiki search engine...');
  try {
    const out = execSync(`node "${join(pluginRoot, 'scripts', 'wiki-search.mjs')}" query "test"`, { stdio: 'pipe', timeout: 5000, encoding: 'utf8' });
    JSON.parse(out);
    results.push({ test: 'wiki-search-engine', passed: true });
    console.log('  [PASS] wiki-search (pure Node, no Python dep)');
  } catch (e) {
    results.push({ test: 'wiki-search-engine', passed: false, reason: String(e).slice(0, 200) });
    console.log('  [FAIL] wiki-search');
  }

  // v1.4.0 — Loop Engine 自检
  console.log('\nChecking Loop Engine...');
  try {
    execSync(`node "${join(pluginRoot, 'scripts', 'loop-cursor.mjs')}" read`, { stdio: 'pipe', timeout: 3000 });
    results.push({ test: 'loop-cursor-readable', passed: true });
    console.log('  [PASS] loop-cursor read');
  } catch (e) {
    results.push({ test: 'loop-cursor-readable', passed: false, reason: String(e).slice(0, 200) });
    console.log('  [FAIL] loop-cursor read');
  }

  try {
    execSync(`node "${join(pluginRoot, 'scripts', 'loop-journal.mjs')}" stats`, { stdio: 'pipe', timeout: 3000 });
    results.push({ test: 'loop-journal-stats', passed: true });
    console.log('  [PASS] loop-journal stats');
  } catch (e) {
    results.push({ test: 'loop-journal-stats', passed: false, reason: String(e).slice(0, 200) });
    console.log('  [FAIL] loop-journal stats');
  }

  // v1.4.0 — Wiki 自检
  console.log('\nChecking Wiki...');
  const wikiDir = join(pluginRoot, '.chaos-harness', 'wiki');
  const wikiExists = existsSync(wikiDir);
  results.push({ test: 'wiki-dir-exists', passed: wikiExists });
  console.log(`  [${wikiExists ? 'PASS' : 'FAIL'}] .chaos-harness/wiki/`);

  try {
    const out = execSync(`node "${join(pluginRoot, 'scripts', 'wiki-indexer.mjs')}" validate`, { stdio: 'pipe', timeout: 5000, encoding: 'utf8' });
    const r = JSON.parse(out);
    results.push({ test: 'wiki-validate', passed: r.ok === true });
    console.log(`  [${r.ok ? 'PASS' : 'FAIL'}] wiki validate (${r.errors?.length || 0} errors)`);
  } catch (e) {
    results.push({ test: 'wiki-validate', passed: false, reason: String(e).slice(0, 200) });
    console.log('  [FAIL] wiki validate');
  }

  // v1.4.0 — Resume self-check
  console.log('\nChecking Resume Engine...');
  try {
    let out;
    try {
      out = execSync(`node "${join(pluginRoot, 'scripts', 'resume.mjs')}" --json`, { stdio: 'pipe', timeout: 3000, encoding: 'utf8' });
    } catch (e) {
      // resume.mjs 用 exit 10 表示"需要恢复"，仍输出有效 JSON 到 stdout
      out = e.stdout?.toString() || '';
    }
    JSON.parse(out);
    results.push({ test: 'resume-json-output', passed: true });
    console.log('  [PASS] resume.mjs --json');
  } catch (e) {
    results.push({ test: 'resume-json-output', passed: false, reason: String(e).slice(0, 200) });
    console.log('  [FAIL] resume.mjs');
  }

  // v1.4.0 — install.mjs quick check
  console.log('\nChecking install path-sanity...');
  try {
    execSync(`node "${join(pluginRoot, 'scripts', 'path-sanity.mjs')}" check "${pluginRoot}"`, { stdio: 'pipe', timeout: 3000 });
    results.push({ test: 'path-sanity-pass', passed: true });
    console.log('  [PASS] path-sanity');
  } catch (e) {
    results.push({ test: 'path-sanity-pass', passed: false, reason: 'plugin root failed sanity' });
    console.log('  [WARN] path-sanity returned error');
  }

  // 检查 stacks 配置
  console.log('\nChecking stack configs...');
  const stacks = ['vue.json', 'react.json', 'java-springboot.json', 'python-fastapi.json', 'generic.json'];
  for (const stack of stacks) {
    const stackPath = join(pluginRoot, 'stacks', stack);
    const stackExists = existsSync(stackPath);
    results.push({ test: `stack-exists:${stack}`, passed: stackExists });
    console.log(`  [${stackExists ? 'PASS' : 'FAIL'}] stacks/${stack}`);
  }

  // 汇总
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log(`\nSelf-Test Results: ${passed}/${total} passed, ${failed} failed`);

  const summary = {
    timestamp: new Date().toISOString(),
    total,
    passed,
    failed,
    results,
  };

  const outputPath = join(pluginRoot, '.chaos-harness', 'self-test-result.json');
  ensureDir(dirname(outputPath));
  writeJson(outputPath, summary);

  process.exit(failed > 0 ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
