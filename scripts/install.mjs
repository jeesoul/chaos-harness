#!/usr/bin/env node
/**
 * install.mjs — Chaos Harness 跨平台统一安装入口
 * v1.4.0
 *
 * 替代分散的 install.bat / install.sh，由它们包装调用。
 *
 * 流程：
 *   1. path-sanity 检查
 *   2. Node.js 版本检查 (>= 18)
 *   3. git-detector 探测并写入 .chaos-harness/config.json
 *   4. 创建必要目录（loop/, wiki/, gates/）
 *   5. hooks.json / plugin.json / package.json 一致性检查
 *   6. 所有 .mjs 语法检查
 *   7. 输出安装指引
 *
 * 用法：
 *   node install.mjs           # 完整安装
 *   node install.mjs --quick   # 跳过语法检查
 *   node install.mjs --json    # JSON 输出（CI 用）
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';
import { ensureDir, readJson, writeJsonAtomic } from './hook-utils.mjs';
import { checkPath, formatReport } from './path-sanity.mjs';
import { detectGit } from './git-detector.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const REQUIRED_NODE = 18;

const args = process.argv.slice(2);
const opts = {
  quick: args.includes('--quick'),
  json: args.includes('--json'),
  quiet: args.includes('--quiet'),
};

const report = {
  steps: [],
  errors: [],
  warnings: [],
  ok: true,
};

function log(msg) {
  if (!opts.json && !opts.quiet) console.log(msg);
}

function logErr(msg) {
  if (!opts.json) console.error(msg);
}

function record(step, status, detail) {
  report.steps.push({ step, status, detail });
  if (status === 'error') {
    report.ok = false;
    report.errors.push({ step, detail });
  } else if (status === 'warn') {
    report.warnings.push({ step, detail });
  }
}

// ---- Step 1: path sanity ----
function stepPathSanity() {
  log('\n[1/7] Path sanity...');
  const r = checkPath(PLUGIN_ROOT);
  if (!opts.json) console.log(formatReport(r, 'Plugin root'));
  if (!r.ok) {
    record('path-sanity', 'error', r.errors);
    return false;
  }
  if (r.warnings.length > 0) record('path-sanity', 'warn', r.warnings);
  else record('path-sanity', 'ok', null);
  return true;
}

// ---- Step 2: node version ----
function stepNodeVersion() {
  log('\n[2/7] Node.js version...');
  const m = process.version.match(/^v(\d+)/);
  const major = m ? parseInt(m[1], 10) : 0;
  if (major < REQUIRED_NODE) {
    logErr(`  ✗ Node ${process.version} < ${REQUIRED_NODE}`);
    record('node-version', 'error', { version: process.version });
    return false;
  }
  log(`  ✓ ${process.version}`);
  record('node-version', 'ok', { version: process.version });
  return true;
}

// ---- Step 3: git detector ----
function stepGitDetect() {
  log('\n[3/7] Git detector...');
  const r = detectGit();
  if (!r.found) {
    log(`  ⚠ git not found (PATH/Program Files/scoop/chocolatey/WSL all checked)`);
    record('git-detect', 'warn', { found: false });
    return true;
  }
  log(`  ✓ git ${r.version} via ${r.via}: ${r.path}`);
  const configDir = join(PLUGIN_ROOT, '.chaos-harness');
  ensureDir(configDir);
  const configPath = join(configDir, 'config.json');
  const existing = readJson(configPath, {});
  existing.git = {
    binary: r.path,
    version: r.version,
    detected_via: r.via,
    detected_at: new Date().toISOString(),
  };
  writeJsonAtomic(configPath, existing);
  log(`  ✓ saved to .chaos-harness/config.json`);
  record('git-detect', 'ok', r);
  return true;
}

// ---- Step 4: ensure runtime dirs ----
function stepEnsureDirs() {
  log('\n[4/7] Ensure runtime dirs...');
  const dirs = [
    join(PLUGIN_ROOT, '.chaos-harness'),
    join(PLUGIN_ROOT, '.chaos-harness', 'gates'),
    join(PLUGIN_ROOT, '.chaos-harness', 'loop'),
    join(PLUGIN_ROOT, '.chaos-harness', 'wiki'),
    join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'patterns'),
    join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'decisions'),
    join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'incidents'),
    join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'sessions'),
  ];
  for (const d of dirs) {
    ensureDir(d);
  }
  log(`  ✓ ${dirs.length} dirs ready`);
  record('ensure-dirs', 'ok', { count: dirs.length });
  return true;
}

// ---- Step 5: hooks/plugin/package consistency ----
function stepConsistency() {
  log('\n[5/7] Consistency check...');
  const hooksPath = join(PLUGIN_ROOT, 'hooks', 'hooks.json');
  const pluginPath = join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');
  const pkgPath = join(PLUGIN_ROOT, 'package.json');

  if (!existsSync(hooksPath)) {
    record('consistency', 'error', `hooks.json missing: ${hooksPath}`);
    logErr('  ✗ hooks.json missing');
    return false;
  }
  try {
    const hooks = readJson(hooksPath, null);
    if (!hooks || !hooks.hooks) {
      record('consistency', 'error', 'hooks.json invalid');
      logErr('  ✗ hooks.json invalid');
      return false;
    }
    let matcherCount = 0;
    for (const m of Object.values(hooks.hooks)) matcherCount += m.length;
    log(`  ✓ hooks.json: ${matcherCount} matchers`);
  } catch (e) {
    record('consistency', 'error', `hooks.json parse error: ${e.message}`);
    return false;
  }

  let pluginVer = null, pkgVer = null;
  try {
    pluginVer = readJson(pluginPath, {}).version;
    pkgVer = readJson(pkgPath, {}).version;
  } catch (e) {
    record('consistency', 'warn', `version read error: ${e.message}`);
  }
  if (pluginVer && pkgVer) {
    if (pluginVer === pkgVer) {
      log(`  ✓ version: ${pluginVer}`);
    } else {
      log(`  ⚠ version mismatch: plugin=${pluginVer} pkg=${pkgVer}`);
      record('consistency', 'warn', { pluginVer, pkgVer });
    }
  }
  record('consistency', 'ok', { matcherCount: null, version: pluginVer });
  return true;
}

// ---- Step 6: scripts syntax ----
function stepSyntax() {
  if (opts.quick) {
    log('\n[6/7] Scripts syntax... SKIPPED (--quick)');
    record('syntax', 'ok', { skipped: true });
    return true;
  }
  log('\n[6/7] Scripts syntax...');
  const scriptsDir = join(PLUGIN_ROOT, 'scripts');
  if (!existsSync(scriptsDir)) {
    record('syntax', 'error', 'scripts/ missing');
    return false;
  }
  const scripts = readdirSync(scriptsDir).filter(f => f.endsWith('.mjs'));
  let fail = 0;
  const failed = [];
  for (const s of scripts) {
    try {
      execFileSync(process.execPath, ['--check', join(scriptsDir, s)], { stdio: 'ignore', timeout: 5000 });
    } catch {
      fail++;
      failed.push(s);
    }
  }
  if (fail === 0) {
    log(`  ✓ ${scripts.length} scripts pass`);
    record('syntax', 'ok', { count: scripts.length });
    return true;
  }
  log(`  ✗ ${fail}/${scripts.length} failed: ${failed.join(', ')}`);
  record('syntax', 'error', { failed });
  return false;
}

// ---- Step 7: skills check ----
function stepSkills() {
  log('\n[7/7] Skills check...');
  const skillsDir = join(PLUGIN_ROOT, 'skills');
  if (!existsSync(skillsDir)) {
    record('skills', 'error', 'skills/ missing');
    return false;
  }
  const skills = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => existsSync(join(skillsDir, d.name, 'SKILL.md')));
  log(`  ✓ ${skills.length} skills`);
  record('skills', 'ok', { count: skills.length });
  return true;
}

function summary() {
  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  log('\n=========================================');
  if (report.ok) {
    log(' ✓ chaos-harness v1.4.0 install OK');
    if (report.warnings.length > 0) {
      log(`   ${report.warnings.length} warning(s) — review above`);
    }
    log('=========================================');
    log('');
    log('Next steps:');
    log('  1. claude plugins marketplace add "' + PLUGIN_ROOT + '"');
    log('  2. claude plugins install chaos-harness@chaos-harness');
    log('  3. /chaos-harness:overview');
  } else {
    log(' ✗ install failed');
    for (const e of report.errors) {
      log(`   [${e.step}] ${JSON.stringify(e.detail)}`);
    }
    log('=========================================');
  }
}

async function main() {
  log('=========================================');
  log(' Chaos Harness v1.4.0 — Loop & Wiki');
  log(' Cross-platform installer');
  log('=========================================');

  const steps = [stepPathSanity, stepNodeVersion, stepGitDetect, stepEnsureDirs, stepConsistency, stepSyntax, stepSkills];
  for (const step of steps) {
    const ok = step();
    if (!ok && step !== stepGitDetect) break;
  }

  summary();
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e); process.exit(2); });
}
