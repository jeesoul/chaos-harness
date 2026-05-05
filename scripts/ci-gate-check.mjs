#!/usr/bin/env node
/**
 * ci-gate-check — CI 环境 Gate 检查入口
 * 串行运行所有 quality Gate，输出 GitHub Actions 兼容的注解格式
 *
 * 调用: node ci-gate-check.mjs [--dry-run] [--gate <id>] [--root <project-root>]
 *
 * 退出码：
 *   0 = 全部通过（含 soft-fail 警告）
 *   1 = 有 hard Gate 失败
 *   2 = 只有 soft Gate 警告（无 hard 失败）
 *
 * GitHub Actions 集成示例：
 *   - name: Chaos Harness Gate Check
 *     run: node scripts/ci-gate-check.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot, resolveProjectRoot } from './path-utils.mjs';
import { loadRegistry, validateGate, loadGateState, isCacheValid } from './gate-validator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();

// ---- GitHub Actions 注解格式 ----

/**
 * 输出 GitHub Actions workflow 命令（注解）
 * 格式：::error file=<file>,line=<line>::<message>
 */
function ghaError(message, file = null, line = null) {
  const location = file ? `file=${file}${line ? `,line=${line}` : ''}` : '';
  const prefix = location ? `::error ${location}::` : '::error::';
  console.error(`${prefix}${message}`);
}

function ghaWarning(message, file = null, line = null) {
  const location = file ? `file=${file}${line ? `,line=${line}` : ''}` : '';
  const prefix = location ? `::warning ${location}::` : '::warning::';
  console.warn(`${prefix}${message}`);
}

function ghaNotice(message) {
  console.log(`::notice::${message}`);
}

function ghaGroup(name) {
  console.log(`::group::${name}`);
}

function ghaEndGroup() {
  console.log(`::endgroup::`);
}

function ghaSetOutput(key, value) {
  // GitHub Actions output（GITHUB_OUTPUT 环境变量）
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    import('node:fs').then(({ appendFileSync }) => {
      appendFileSync(outputFile, `${key}=${value}\n`);
    }).catch(() => {});
  }
  // 兼容旧版 set-output（已废弃，但部分 CI 仍使用）
  console.log(`::set-output name=${key}::${value}`);
}

// ---- 判断是否在 CI 环境 ----

function isCI() {
  return !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL ||
    process.env.TRAVIS || process.env.CIRCLECI || process.env.GITLAB_CI);
}

// ---- 格式化输出 ----

const CI_MODE = isCI();

function log(msg) {
  console.log(msg);
}

function logSection(title) {
  if (CI_MODE) {
    ghaGroup(title);
  } else {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('='.repeat(60));
  }
}

function logSectionEnd() {
  if (CI_MODE) {
    ghaEndGroup();
  }
}

function statusIcon(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'skipped': return '⏭️';
    case 'soft-fail': return '⚠️';
    default: return '❓';
  }
}

// ---- 核心逻辑 ----

/**
 * 运行单个 Gate 并返回结果
 */
function runGate(gateDef, projectRoot) {
  const start = Date.now();

  // 检查缓存
  const state = loadGateState(gateDef.id);
  if (isCacheValid(gateDef, state)) {
    return {
      gate: gateDef,
      status: 'passed',
      cached: true,
      duration: 0,
      results: [],
    };
  }

  const validation = validateGate(gateDef, projectRoot);
  const duration = Date.now() - start;

  return {
    gate: gateDef,
    status: validation.allPassed ? 'passed' : 'failed',
    cached: false,
    duration,
    results: validation.results,
  };
}

/**
 * 输出单个 Gate 结果（CI 模式输出注解，本地模式输出格式化文本）
 */
function reportGateResult(gateResult) {
  const { gate, status, cached, duration, results } = gateResult;
  const icon = statusIcon(status);
  const cachedStr = cached ? ' [cached]' : ` (${duration}ms)`;
  const levelStr = gate.level === 'hard' ? '🔴 Hard' : '🟡 Soft';

  log(`${icon} ${gate.id} — ${gate.description} ${levelStr}${cachedStr}`);

  if (status === 'failed') {
    const failedResults = results.filter(r => r.status === 'failed');
    for (const vr of failedResults) {
      const reason = vr.reason || '验证失败';

      if (CI_MODE) {
        if (gate.level === 'hard') {
          // 带文件位置的错误注解
          if (vr.details && Array.isArray(vr.details) && vr.details[0]?.file) {
            for (const d of vr.details.slice(0, 5)) {
              ghaError(`[${gate.id}] ${vr.type}: ${d.error || d.pattern || reason}`, d.file, d.line);
            }
          } else {
            ghaError(`[${gate.id}] ${vr.type}: ${reason}`);
          }
        } else {
          ghaWarning(`[${gate.id}] ${vr.type}: ${reason}`);
        }
      } else {
        log(`  ↳ ${vr.type}: ${reason}`);
        if (vr.details && Array.isArray(vr.details)) {
          for (const d of vr.details.slice(0, 3)) {
            if (d.file) {
              log(`    • ${d.file}${d.line ? `:${d.line}` : ''} — ${d.error || d.pattern || JSON.stringify(d).slice(0, 80)}`);
            }
          }
        }
      }
    }
  } else if (status === 'passed' && !cached) {
    for (const vr of results) {
      if (vr.framework) log(`  ↳ framework: ${vr.framework}`);
      if (vr.coverage) log(`  ↳ coverage: ${vr.coverage}%`);
      if (vr.branch) log(`  ↳ branch: ${vr.branch}`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const rootIdx = args.indexOf('--root');
  const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : resolveProjectRoot() || process.cwd();

  // 支持 --gate 过滤
  const gateIdx = args.indexOf('--gate');
  const gateFilter = gateIdx >= 0 ? args[gateIdx + 1].split(',') : null;

  // 支持 --type 过滤（stage/quality）
  const typeIdx = args.indexOf('--type');
  const typeFilter = typeIdx >= 0 ? args[typeIdx + 1] : null;

  const registry = loadRegistry();

  // 过滤 Gate
  let gates = registry.gates;
  if (gateFilter) gates = gates.filter(g => gateFilter.includes(g.id));
  if (typeFilter) gates = gates.filter(g => g.type === typeFilter);

  // Dry-run 模式
  if (dryRun) {
    log('[CI Gate Check] Dry-run 模式 — 将要检查的 Gates:');
    log('');
    for (const gate of gates) {
      log(`  ${gate.id} (${gate.type}, ${gate.level})`);
      for (const v of gate.validators) {
        log(`    • ${v.type}`);
      }
    }
    log('');
    log(`共 ${gates.length} 个 Gates`);
    process.exit(0);
  }

  // 正式运行
  logSection('🔍 Chaos Harness CI Gate Check');
  log(`项目根目录: ${projectRoot}`);
  log(`Gates 数量: ${gates.length}`);
  log(`运行时间: ${new Date().toISOString()}`);
  log(`CI 模式: ${CI_MODE ? 'YES (GitHub Actions annotations enabled)' : 'NO (local mode)'}`);
  logSectionEnd();

  const allResults = [];
  let hardFailCount = 0;
  let softFailCount = 0;
  let passedCount = 0;

  // 串行运行所有 Gate
  for (const gate of gates) {
    logSection(`Gate: ${gate.id}`);
    const result = runGate(gate, projectRoot);
    allResults.push(result);

    reportGateResult(result);

    if (result.status === 'failed') {
      if (gate.level === 'hard') {
        hardFailCount++;
      } else {
        softFailCount++;
      }
    } else {
      passedCount++;
    }

    logSectionEnd();
  }

  // 汇总报告
  logSection('📊 CI Gate 检查汇总');

  const total = allResults.length;
  const overallStatus = hardFailCount > 0 ? '❌ FAILED' : softFailCount > 0 ? '⚠️ WARNED' : '✅ PASSED';

  log(`总体状态: ${overallStatus}`);
  log(`通过: ${passedCount}/${total}`);
  if (hardFailCount > 0) log(`Hard 失败: ${hardFailCount}`);
  if (softFailCount > 0) log(`Soft 警告: ${softFailCount}`);
  log('');

  // 失败的 Gate 列表
  if (hardFailCount > 0 || softFailCount > 0) {
    log('失败/警告 Gates:');
    for (const r of allResults.filter(r => r.status === 'failed')) {
      const icon = r.gate.level === 'hard' ? '❌' : '⚠️';
      log(`  ${icon} ${r.gate.id} (${r.gate.level}): ${r.gate.description}`);
    }
    log('');
  }

  // GitHub Actions output
  if (CI_MODE) {
    ghaSetOutput('gate_status', hardFailCount > 0 ? 'failed' : softFailCount > 0 ? 'warned' : 'passed');
    ghaSetOutput('hard_fail_count', String(hardFailCount));
    ghaSetOutput('soft_fail_count', String(softFailCount));
    ghaSetOutput('passed_count', String(passedCount));
    ghaSetOutput('total_gates', String(total));

    if (hardFailCount > 0) {
      ghaError(`Chaos Harness: ${hardFailCount} hard Gate(s) failed. Please fix before merging.`);
    } else if (softFailCount > 0) {
      ghaWarning(`Chaos Harness: ${softFailCount} soft Gate(s) warned. Consider addressing before merging.`);
    } else {
      ghaNotice(`Chaos Harness: All ${total} Gates passed.`);
    }
  }

  logSectionEnd();

  // 退出码
  if (hardFailCount > 0) {
    process.exit(1); // hard 失败
  } else if (softFailCount > 0) {
    process.exit(2); // 只有 soft 警告
  } else {
    process.exit(0); // 全部通过
  }
}

main().catch(err => {
  console.error('[CI Gate Check] 错误:', err.message);
  if (isCI()) {
    ghaError(`Chaos Harness CI Gate Check crashed: ${err.message}`);
  }
  process.exit(1);
});
