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
    'gate-dispatcher.mjs',
    'iron-law-check.mjs',
    'laziness-detect.mjs',
    'learning-update.mjs',
    'workflow-track.mjs',
    'stop.mjs',
    'dev-intelligence.mjs',
    'search.py',
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
  const registryPath = join(pluginRoot, 'data', 'gate-registry.json');
  const registryExists = existsSync(registryPath);
  results.push({ test: 'gate-registry', passed: registryExists });
  console.log(`  [${registryExists ? 'PASS' : 'FAIL'}] gate-registry.json`);

  // 检查 CSV 知识库
  console.log('\nChecking knowledge base...');
  const csvFiles = ['gate-patterns.csv', 'iron-law-rules.csv', 'test-patterns.csv', 'anti-patterns.csv', 'ui-patterns.csv', 'prd-quality-rules.csv'];
  for (const csv of csvFiles) {
    const csvPath = join(pluginRoot, 'data', csv);
    const csvExists = existsSync(csvPath);
    results.push({ test: `csv-exists:${csv}`, passed: csvExists });
    console.log(`  [${csvExists ? 'PASS' : 'FAIL'}] data/${csv}`);
  }

  // 检查 Python 依赖
  console.log('\nChecking Python dependencies...');
  try {
    execSync('python -c "import rank_bm25"', { stdio: 'pipe', timeout: 5000 });
    results.push({ test: 'python-rank-bm25', passed: true });
    console.log('  [PASS] rank_bm25');
  } catch {
    results.push({ test: 'python-rank-bm25', passed: false, reason: 'rank_bm25 not installed' });
    console.log('  [WARN] rank_bm25 not installed (run: pip install rank-bm25)');
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
