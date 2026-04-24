#!/usr/bin/env node
/**
 * gate-enforcer — Gate 执行层
 * 根据验证结果决定 exit 1（硬阻断）还是 exit 0（软警告）
 *
 * 调用: node gate-enforcer.mjs <gate-id> [--root <project-root>]
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot, resolveProjectRoot } from './path-utils.mjs';
import { readJson, writeJson, ensureDir, computeFileHash } from './hook-utils.mjs';
import { validateGate, loadRegistry, loadGateState, isCacheValid } from './gate-validator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();

/**
 * 保存 Gate 状态
 */
function saveGateState(gateId, state, dir) {
  ensureDir(dir);
  const statePath = join(dir, `${gateId}.json`);
  writeJson(statePath, state);
}

/**
 * 输出 Gate 失败信息
 */
function printFailure(gateDef, result) {
  process.stderr.write(`\n[GATE FAILED] ${gateDef.id}: ${gateDef.description}\n`);
  process.stderr.write(`Level: ${gateDef.level.toUpperCase()}\n`);
  process.stderr.write('\n');
  for (const r of result.results) {
    if (r.status === 'failed') {
      process.stderr.write(`  X ${r.type}: ${r.reason}\n`);
      if (r.details) {
        const detailStr = Array.isArray(r.details)
          ? r.details.map(d => typeof d === 'object' ? JSON.stringify(d) : String(d)).join('\n    ')
          : String(r.details);
        process.stderr.write(`    ${detailStr}\n`);
      }
    } else if (r.status === 'skipped') {
      process.stderr.write(`  - ${r.type}: ${r.reason} (skipped)\n`);
    } else {
      process.stderr.write(`  OK ${r.type}: passed\n`);
    }
  }
  process.stderr.write('\n');
}

/**
 * 输出 Gate 警告信息（soft）
 */
function printWarning(gateDef, result) {
  process.stderr.write(`\n[GATE WARNING] ${gateDef.id}: ${gateDef.description}\n`);
  for (const r of result.results) {
    if (r.status === 'failed') {
      process.stderr.write(`  WARN ${r.type}: ${r.reason}\n`);
    }
  }
  process.stderr.write('\n');
}

/**
 * 主入口
 */
function main() {
  const args = process.argv.slice(2);
  const gateId = args.find(a => !a.startsWith('--'));
  const rootIdx = args.indexOf('--root');
  const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : resolveProjectRoot() || process.cwd();

  if (!gateId) {
    process.stderr.write('Usage: node gate-enforcer.mjs <gate-id> [--root <project-root>]\n');
    process.exit(1);
  }

  const registry = loadRegistry();
  const gateDef = registry.gates.find(g => g.id === gateId);
  if (!gateDef) {
    process.stderr.write(`Gate not found: ${gateId}\n`);
    process.exit(1);
  }

  // 检查缓存 — 使用项目级的 .chaos-harness/gates/ 而非插件级的
  const projectGatesDir = join(projectRoot, '.chaos-harness', 'gates');
  const state = readJson(join(projectGatesDir, `${gateId}.json`), null);
  if (isCacheValid(gateDef, state)) {
    process.exit(0);
  }

  // 执行验证
  const result = validateGate(gateDef, projectRoot);

  if (result.allPassed) {
    // 计算 fileHashes（仅对非 glob 路径）
    const fileHashes = {};
    for (const v of gateDef.validators) {
      if (v.path && !v.path.includes('*')) {
        const hash = computeFileHash(v.path);
        if (hash) fileHashes[v.path] = hash;
      }
    }

    saveGateState(gateId, {
      id: gateId,
      status: 'passed',
      lastChecked: new Date().toISOString(),
      projectRoot,
      fileHashes,
      result: { results: result.results },
    }, projectGatesDir);
    process.exit(0);
  }

  // 验证失败
  if (gateDef.level === 'hard') {
    printFailure(gateDef, result);
    process.exit(1);
  } else {
    printWarning(gateDef, result);
    // soft Gate 失败仍然记录状态
    saveGateState(gateId, {
      id: gateId,
      status: 'soft-fail',
      lastChecked: new Date().toISOString(),
      projectRoot,
      result: { results: result.results },
    }, projectGatesDir);
    process.exit(0);
  }
}

// CLI 模式
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
