#!/usr/bin/env node
/**
 * gate-recovery — Gate 恢复机制
 * 提供自动修复建议、模板生成、绕过日志
 *
 * 调用:
 *   node gate-recovery.mjs suggest <gate-id>  # 获取修复建议
 *   node gate-recovery.mjs override <gate-id> --reason "xxx"  # 绕过（仅 soft）
 *   node gate-recovery.mjs history            # 查看绕过日志
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';
import { readJson, writeJsonAtomic, ensureDir } from './hook-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();
const gatesDir = join(pluginRoot, '.chaos-harness', 'gates');
const overrideLogPath = join(gatesDir, 'override-log.json');

/**
 * 获取 Gate 失败后的修复建议
 */
function getSuggestions(gateId) {
  const statePath = join(gatesDir, `${gateId}.json`);
  const state = readJson(statePath, null);
  if (!state || !state.result) {
    console.log('No failure data available for this gate.');
    return;
  }

  console.log(`\n修复建议 for ${gateId}:`);
  console.log('='.repeat(40));

  for (const r of state.result.results) {
    if (r.status === 'failed') {
      console.log(`\n  [${r.type}] 失败原因: ${r.reason}`);
      console.log(`  建议修复:`);
      console.log(`    ${getFixSuggestion(r)}`);
    }
  }
}

/**
 * 根据验证结果生成修复建议
 */
function getFixSuggestion(result) {
  switch (result.type) {
    case 'file-exists':
      return `创建缺失的文件: ${result.matched || result.reason}`;
    case 'no-syntax-errors':
      return `修复语法错误后运行: node -c <file>`;
    case 'test-suite-pass':
      return `修复失败的测试后运行: npm test`;
    case 'iron-law-check':
      return `检查铁律违规，确保操作符合 IL001-IL005`;
    case 'lint-check':
      return `运行格式化: npx eslint . --fix`;
    case 'git-has-commits':
      return `提交当前更改后再继续`;
    default:
      return `根据错误信息修复后重新验证`;
  }
}

/**
 * 绕过 soft Gate
 */
function overrideGate(gateId, reason) {
  const registryPath = join(gatesDir, 'gate-registry.json');
  const registry = readJson(registryPath, { gates: [] });
  const gateDef = registry.gates.find(g => g.id === gateId);

  if (!gateDef) {
    console.error(`Gate not found: ${gateId}`);
    process.exit(1);
  }

  if (gateDef.level === 'hard') {
    console.error(`ERROR: Cannot override hard gate: ${gateId}`);
    console.error('Hard gates cannot be bypassed. This is a design底线.');
    process.exit(1);
  }

  // 检查 session 内的绕过次数
  const overrideLog = readJson(overrideLogPath, []);
  const sessionOverrides = overrideLog.filter(o => {
    const overrideTime = new Date(o.overriddenAt);
    const sessionStart = new Date(Date.now() - 4 * 60 * 60 * 1000);
    return overrideTime > sessionStart;
  });

  if (sessionOverrides.length >= 3) {
    console.error(`WARNING: Already ${sessionOverrides.length} overrides this session. Max is 3.`);
    console.error('Contact project lead for approval to continue.');
    process.exit(1);
  }

  // 记录绕过
  const entry = {
    gateId,
    overriddenAt: new Date().toISOString(),
    reason,
    overriddenBy: 'user',
  };
  overrideLog.push(entry);
  ensureDir(gatesDir);
  writeJsonAtomic(overrideLogPath, overrideLog);

  console.log(`Override recorded for ${gateId}`);
  console.log(`Reason: ${reason}`);
}

/**
 * 查看绕过日志
 */
function showHistory() {
  const overrideLog = readJson(overrideLogPath, []);
  if (overrideLog.length === 0) {
    console.log('No override history.');
    return;
  }

  console.log('\nOverride History:');
  console.log('='.repeat(60));
  for (const entry of overrideLog) {
    console.log(`  [${entry.overriddenAt}] ${entry.gateId}`);
    console.log(`    Reason: ${entry.reason}`);
    console.log(`    By: ${entry.overriddenBy}`);
    console.log('');
  }
}

/**
 * 主入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'suggest':
      getSuggestions(args[1]);
      break;
    case 'override': {
      const gateId = args[1];
      const reasonIdx = args.indexOf('--reason');
      const reason = reasonIdx >= 0 ? args[reasonIdx + 1] : 'No reason provided';
      overrideGate(gateId, reason);
      break;
    }
    case 'history':
      showHistory();
      break;
    default:
      console.error('Usage: node gate-recovery.mjs <suggest|override|history> [args]');
      process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
