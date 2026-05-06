#!/usr/bin/env node
/**
 * gate-visualizer — Gate 状态可视化
 * 生成 Mermaid / ASCII 格式的 Gate 状态图
 *
 * 用法:
 *   node gate-visualizer.mjs                    # ASCII 格式（终端）
 *   node gate-visualizer.mjs --mermaid          # Mermaid 格式（可嵌入 Markdown）
 *   node gate-visualizer.mjs --pr-description   # PR 描述格式
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import { resolvePluginRoot, resolveProjectRoot } from './path-utils.mjs';
import { loadRegistry, loadGateState } from './gate-validator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();

// ---- 状态图标 ----

const STATUS_ICONS = {
  passed: '✅',
  failed: '❌',
  skipped: '⏭️',
  pending: '⏳',
  blocked: '🔒',
};

const LEVEL_ICONS = {
  hard: '🔴',
  soft: '🟡',
};

// ---- 获取 Gate 运行时状态 ----

function getGateRuntimeStatus(gateDef) {
  const state = loadGateState(gateDef.id);

  if (!state || !state.lastRun) {
    return { status: 'pending', reason: '未运行' };
  }

  if (state.status === 'passed') {
    return { status: 'passed', reason: `通过 (${new Date(state.lastRun).toLocaleString()})` };
  }

  if (state.status === 'failed') {
    const reason = state.failureReason || '验证失败';
    return { status: 'failed', reason };
  }

  return { status: 'pending', reason: '状态未知' };
}

// ---- 检查 Gate 是否被阻塞 ----

function isGateBlocked(gateDef, registry) {
  if (!gateDef.dependsOn || gateDef.dependsOn.length === 0) {
    return { blocked: false };
  }

  const blockedBy = [];
  for (const depId of gateDef.dependsOn) {
    const depGate = registry.gates.find(g => g.id === depId);
    if (!depGate) continue;

    const depState = loadGateState(depId);
    if (!depState || depState.status !== 'passed') {
      blockedBy.push(depId);
    }
  }

  return blockedBy.length > 0 ? { blocked: true, blockedBy } : { blocked: false };
}

// ---- ASCII 格式输出 ----

function renderASCII(registry, projectRoot) {
  console.log('');
  console.log('═'.repeat(70));
  console.log('  Chaos Harness Gate 状态图');
  console.log('═'.repeat(70));
  console.log('');

  // Stage Gates
  console.log('📍 阶段 Gates (Stage)');
  console.log('─'.repeat(70));
  const stageGates = registry.gates.filter(g => g.type === 'stage');
  for (const gate of stageGates) {
    const runtime = getGateRuntimeStatus(gate);
    const blockInfo = isGateBlocked(gate, registry);
    const icon = blockInfo.blocked ? STATUS_ICONS.blocked : STATUS_ICONS[runtime.status];
    const level = LEVEL_ICONS[gate.level];

    console.log(`${icon} ${level} ${gate.id}`);
    console.log(`   ${gate.description}`);

    if (blockInfo.blocked) {
      console.log(`   🔒 阻塞原因: 依赖 ${blockInfo.blockedBy.join(', ')} 未通过`);
    } else {
      console.log(`   状态: ${runtime.reason}`);
    }

    if (gate.validators && gate.validators.length > 0) {
      console.log(`   验证器: ${gate.validators.map(v => v.type).join(', ')}`);
    }
    console.log('');
  }

  // Quality Gates
  console.log('🔍 质量 Gates (Quality)');
  console.log('─'.repeat(70));
  const qualityGates = registry.gates.filter(g => g.type === 'quality');
  for (const gate of qualityGates) {
    const runtime = getGateRuntimeStatus(gate);
    const icon = STATUS_ICONS[runtime.status];
    const level = LEVEL_ICONS[gate.level];

    console.log(`${icon} ${level} ${gate.id}`);
    console.log(`   ${gate.description}`);
    console.log(`   状态: ${runtime.reason}`);
    console.log(`   触发: ${gate.trigger || 'manual'}`);
    console.log('');
  }

  // 统计
  const allGates = registry.gates;
  const passed = allGates.filter(g => getGateRuntimeStatus(g).status === 'passed').length;
  const failed = allGates.filter(g => getGateRuntimeStatus(g).status === 'failed').length;
  const pending = allGates.length - passed - failed;

  console.log('═'.repeat(70));
  console.log(`  总计: ${allGates.length} Gates | ✅ ${passed} 通过 | ❌ ${failed} 失败 | ⏳ ${pending} 待运行`);
  console.log('═'.repeat(70));
  console.log('');
}

// ---- Mermaid 格式输出 ----

function renderMermaid(registry) {
  console.log('```mermaid');
  console.log('graph TD');
  console.log('');

  // 定义节点
  for (const gate of registry.gates) {
    const runtime = getGateRuntimeStatus(gate);
    const icon = STATUS_ICONS[runtime.status] || '⏳';
    const level = gate.level === 'hard' ? 'Hard' : 'Soft';
    const label = `${icon} ${gate.id}<br/>${level}`;

    // 节点样式
    if (runtime.status === 'passed') {
      console.log(`  ${gate.id}["${label}"]:::passed`);
    } else if (runtime.status === 'failed') {
      console.log(`  ${gate.id}["${label}"]:::failed`);
    } else {
      console.log(`  ${gate.id}["${label}"]:::pending`);
    }
  }

  console.log('');

  // 定义依赖关系
  for (const gate of registry.gates) {
    if (gate.dependsOn && gate.dependsOn.length > 0) {
      for (const depId of gate.dependsOn) {
        console.log(`  ${depId} --> ${gate.id}`);
      }
    }
  }

  console.log('');

  // 样式定义
  console.log('  classDef passed fill:#d4edda,stroke:#28a745,stroke-width:2px');
  console.log('  classDef failed fill:#f8d7da,stroke:#dc3545,stroke-width:2px');
  console.log('  classDef pending fill:#fff3cd,stroke:#ffc107,stroke-width:2px');
  console.log('```');
}

// ---- PR 描述格式 ----

function renderPRDescription(registry) {
  console.log('## 🚦 Gate 检查状态');
  console.log('');

  const allGates = registry.gates;
  const passed = allGates.filter(g => getGateRuntimeStatus(g).status === 'passed');
  const failed = allGates.filter(g => getGateRuntimeStatus(g).status === 'failed');
  const pending = allGates.filter(g => {
    const s = getGateRuntimeStatus(g).status;
    return s !== 'passed' && s !== 'failed';
  });

  console.log(`**总计:** ${allGates.length} Gates | ✅ ${passed.length} 通过 | ❌ ${failed.length} 失败 | ⏳ ${pending.length} 待运行`);
  console.log('');

  if (failed.length > 0) {
    console.log('### ❌ 失败的 Gates');
    console.log('');
    for (const gate of failed) {
      const runtime = getGateRuntimeStatus(gate);
      console.log(`- **${gate.id}** (${gate.level}): ${runtime.reason}`);
    }
    console.log('');
  }

  if (pending.length > 0) {
    console.log('### ⏳ 待运行的 Gates');
    console.log('');
    for (const gate of pending) {
      const blockInfo = isGateBlocked(gate, registry);
      if (blockInfo.blocked) {
        console.log(`- **${gate.id}**: 🔒 阻塞（依赖 ${blockInfo.blockedBy.join(', ')}）`);
      } else {
        console.log(`- **${gate.id}**: 待运行`);
      }
    }
    console.log('');
  }

  if (passed.length > 0) {
    console.log('<details>');
    console.log('<summary>✅ 已通过的 Gates</summary>');
    console.log('');
    for (const gate of passed) {
      console.log(`- **${gate.id}** (${gate.level})`);
    }
    console.log('');
    console.log('</details>');
  }

  // Mermaid 图
  console.log('');
  console.log('### 📊 Gate 依赖关系图');
  console.log('');
  renderMermaid(registry);
}

// ---- 主函数 ----

function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--mermaid') ? 'mermaid' :
                 args.includes('--pr-description') ? 'pr' : 'ascii';

  const rootIdx = args.indexOf('--root');
  const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : resolveProjectRoot() || process.cwd();

  const registry = loadRegistry();

  if (format === 'mermaid') {
    renderMermaid(registry);
  } else if (format === 'pr') {
    renderPRDescription(registry);
  } else {
    renderASCII(registry, projectRoot);
  }
}

main();
