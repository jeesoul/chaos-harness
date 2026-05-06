#!/usr/bin/env node
/**
 * gate-reporter — Gate 检查报告生成器
 * 生成 Markdown 格式报告，支持 PR 描述模式和 JSON 输出
 *
 * 调用: node gate-reporter.mjs [--pr-description] [--json] [--root <project-root>]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import { resolvePluginRoot, resolveProjectRoot } from './path-utils.mjs';
import { readJson, ensureDir } from './hook-utils.mjs';
import { loadRegistry, validateGate, loadGateState, isCacheValid } from './gate-validator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();

// ---- 工具函数 ----

function statusIcon(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'skipped': return '⏭️';
    case 'soft-fail': return '⚠️';
    default: return '❓';
  }
}

function severityLabel(level) {
  return level === 'hard' ? '🔴 Hard' : '🟡 Soft';
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * 获取当前 git 信息
 */
function getGitInfo(projectRoot) {
  const info = {};
  try {
    info.branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
    info.commit = execSync('git rev-parse --short HEAD', { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
    info.author = execSync('git log -1 --pretty=format:"%an"', { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
    info.message = execSync('git log -1 --pretty=format:"%s"', { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch { /* not a git repo */ }
  return info;
}

/**
 * 运行所有 Gate 并收集结果
 */
function runAllGates(registry, projectRoot, options = {}) {
  const results = [];
  const gateFilter = options.gateFilter || null;

  for (const gateDef of registry.gates) {
    if (gateFilter && !gateFilter.includes(gateDef.id)) continue;

    const start = Date.now();

    // 检查缓存
    const state = loadGateState(gateDef.id);
    if (isCacheValid(gateDef, state)) {
      results.push({
        gate: gateDef,
        status: 'passed',
        cached: true,
        duration: 0,
        results: [],
      });
      continue;
    }

    const validation = validateGate(gateDef, projectRoot);
    const duration = Date.now() - start;

    results.push({
      gate: gateDef,
      status: validation.allPassed ? 'passed' : 'failed',
      cached: false,
      duration,
      results: validation.results,
    });
  }

  return results;
}

/**
 * 生成 Markdown 报告
 */
function generateMarkdownReport(gateResults, gitInfo, projectRoot, options = {}) {
  const now = new Date().toISOString();
  const passed = gateResults.filter(r => r.status === 'passed').length;
  const failed = gateResults.filter(r => r.status === 'failed').length;
  const total = gateResults.length;
  const overallStatus = failed === 0 ? '✅ PASSED' : `❌ FAILED (${failed}/${total})`;

  const lines = [];

  if (options.prDescription) {
    // PR 描述模式：紧凑格式
    lines.push('## 🔍 Chaos Harness Gate 检查报告');
    lines.push('');
    lines.push(`**状态：** ${overallStatus}  `);
    lines.push(`**通过：** ${passed}/${total} Gates  `);
    if (gitInfo.branch) lines.push(`**分支：** \`${gitInfo.branch}\`  `);
    if (gitInfo.commit) lines.push(`**提交：** \`${gitInfo.commit}\` ${gitInfo.message || ''}  `);
    lines.push('');
    lines.push('| Gate | 类型 | 级别 | 状态 | 耗时 |');
    lines.push('|------|------|------|------|------|');

    for (const gr of gateResults) {
      const icon = statusIcon(gr.status);
      const type = gr.gate.type === 'stage' ? '阶段' : '质量';
      const level = severityLabel(gr.gate.level);
      const cached = gr.cached ? ' (cached)' : '';
      lines.push(`| ${gr.gate.id} | ${type} | ${level} | ${icon} ${gr.status}${cached} | ${formatDuration(gr.duration)} |`);
    }

    // 只展示失败详情
    const failedGates = gateResults.filter(r => r.status === 'failed');
    if (failedGates.length > 0) {
      lines.push('');
      lines.push('### ❌ 失败详情');
      for (const gr of failedGates) {
        lines.push('');
        lines.push(`**${gr.gate.id}** (${gr.gate.description})`);
        for (const vr of gr.results.filter(r => r.status === 'failed')) {
          lines.push(`- \`${vr.type}\`: ${vr.reason || 'failed'}`);
          if (vr.details && Array.isArray(vr.details)) {
            for (const d of vr.details.slice(0, 3)) {
              if (d.file) lines.push(`  - ${d.file}${d.line ? `:${d.line}` : ''} — ${d.error || d.pattern || JSON.stringify(d).slice(0, 80)}`);
            }
          }
        }
      }
    }
  } else {
    // 完整报告模式
    lines.push('# Chaos Harness Gate 检查报告');
    lines.push('');
    lines.push(`> 生成时间：${now}`);
    lines.push('');
    lines.push('## 概览');
    lines.push('');
    lines.push(`| 项目 | 值 |`);
    lines.push(`|------|-----|`);
    lines.push(`| 总体状态 | ${overallStatus} |`);
    lines.push(`| 通过 | ${passed}/${total} |`);
    lines.push(`| 失败 | ${failed}/${total} |`);
    if (gitInfo.branch) lines.push(`| 分支 | \`${gitInfo.branch}\` |`);
    if (gitInfo.commit) lines.push(`| 提交 | \`${gitInfo.commit}\` |`);
    if (gitInfo.author) lines.push(`| 作者 | ${gitInfo.author} |`);
    if (gitInfo.message) lines.push(`| 提交信息 | ${gitInfo.message} |`);
    lines.push('');

    lines.push('## Gate 列表');
    lines.push('');

    // 分组：stage + quality
    const stageGates = gateResults.filter(r => r.gate.type === 'stage');
    const qualityGates = gateResults.filter(r => r.gate.type === 'quality');

    if (stageGates.length > 0) {
      lines.push('### 阶段 Gates');
      lines.push('');
      lines.push('| Gate ID | 描述 | 级别 | 状态 | 耗时 |');
      lines.push('|---------|------|------|------|------|');
      for (const gr of stageGates) {
        const icon = statusIcon(gr.status);
        const cached = gr.cached ? ' *(cached)*' : '';
        lines.push(`| \`${gr.gate.id}\` | ${gr.gate.description} | ${severityLabel(gr.gate.level)} | ${icon} ${gr.status}${cached} | ${formatDuration(gr.duration)} |`);
      }
      lines.push('');
    }

    if (qualityGates.length > 0) {
      lines.push('### 质量 Gates');
      lines.push('');
      lines.push('| Gate ID | 描述 | 级别 | 状态 | 耗时 |');
      lines.push('|---------|------|------|------|------|');
      for (const gr of qualityGates) {
        const icon = statusIcon(gr.status);
        const cached = gr.cached ? ' *(cached)*' : '';
        lines.push(`| \`${gr.gate.id}\` | ${gr.gate.description} | ${severityLabel(gr.gate.level)} | ${icon} ${gr.status}${cached} | ${formatDuration(gr.duration)} |`);
      }
      lines.push('');
    }

    // 详细结果
    lines.push('## 验证详情');
    lines.push('');
    for (const gr of gateResults) {
      lines.push(`### ${statusIcon(gr.status)} ${gr.gate.id}`);
      lines.push('');
      lines.push(`**描述：** ${gr.gate.description}  `);
      lines.push(`**类型：** ${gr.gate.type} | **级别：** ${gr.gate.level} | **触发：** ${gr.gate.trigger || 'manual'}  `);
      lines.push(`**状态：** ${gr.status} ${gr.cached ? '*(缓存命中)*' : `| **耗时：** ${formatDuration(gr.duration)}`}  `);
      lines.push('');

      if (gr.results.length > 0) {
        lines.push('| 验证器 | 状态 | 详情 |');
        lines.push('|--------|------|------|');
        for (const vr of gr.results) {
          const detail = vr.reason || vr.coverage || vr.checked || vr.framework || vr.branch || '';
          lines.push(`| \`${vr.type}\` | ${statusIcon(vr.status)} ${vr.status} | ${detail} |`);
        }
        lines.push('');

        // 展示失败详细信息
        const failedValidators = gr.results.filter(r => r.status === 'failed' && r.details);
        for (const vr of failedValidators) {
          lines.push(`<details><summary><code>${vr.type}</code> 失败详情</summary>`);
          lines.push('');
          if (Array.isArray(vr.details)) {
            lines.push('```');
            for (const d of vr.details.slice(0, 10)) {
              lines.push(JSON.stringify(d));
            }
            lines.push('```');
          } else {
            lines.push('```');
            lines.push(String(vr.details).slice(0, 500));
            lines.push('```');
          }
          lines.push('');
          lines.push('</details>');
          lines.push('');
        }
      } else if (gr.cached) {
        lines.push('*缓存命中，跳过验证*');
        lines.push('');
      }
    }

    // 修复建议
    const failedGates = gateResults.filter(r => r.status === 'failed');
    if (failedGates.length > 0) {
      lines.push('## 🔧 修复建议');
      lines.push('');
      for (const gr of failedGates) {
        lines.push(`### ${gr.gate.id}`);
        lines.push('');
        for (const vr of gr.results.filter(r => r.status === 'failed')) {
          lines.push(`**${vr.type}**：${vr.reason || '验证失败'}`);
          if (vr.suggestion) lines.push(`> 建议：${vr.suggestion}`);
          lines.push('');
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const prDescription = args.includes('--pr-description');
  const jsonOutput = args.includes('--json');
  const dryRun = args.includes('--dry-run');
  const rootIdx = args.indexOf('--root');
  const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : resolveProjectRoot() || process.cwd();

  // 支持 --gate 过滤特定 gate
  const gateIdx = args.indexOf('--gate');
  const gateFilter = gateIdx >= 0 ? args[gateIdx + 1].split(',') : null;

  const registry = loadRegistry();
  const gitInfo = getGitInfo(projectRoot);

  if (!dryRun) {
    const gateResults = runAllGates(registry, projectRoot, { gateFilter });

    if (jsonOutput) {
      console.log(JSON.stringify({ gateResults, gitInfo, timestamp: new Date().toISOString() }, null, 2));
      process.exit(gateResults.some(r => r.status === 'failed') ? 1 : 0);
    }

    const report = generateMarkdownReport(gateResults, gitInfo, projectRoot, { prDescription });

    if (prDescription) {
      // PR 描述模式：直接输出到 stdout
      console.log(report);
    } else {
      // 完整报告：保存到文件 + 输出路径
      const reportDir = join(projectRoot, '.chaos-harness');
      ensureDir(reportDir);
      const reportPath = join(reportDir, 'gate-report.md');
      writeFileSync(reportPath, report, 'utf-8');
      console.log(`[Gate Reporter] 报告已生成: ${reportPath}`);
      console.log('');
      // 同时输出简要摘要
      const passed = gateResults.filter(r => r.status === 'passed').length;
      const failed = gateResults.filter(r => r.status === 'failed').length;
      console.log(`📊 总计 ${gateResults.length} Gates：✅ ${passed} 通过，❌ ${failed} 失败`);
    }

    process.exit(gateResults.some(r => r.status === 'failed') ? 1 : 0);
  } else {
    console.log('[Gate Reporter] Dry run 模式 — 仅显示将要检查的 Gates:');
    for (const gate of registry.gates) {
      if (gateFilter && !gateFilter.includes(gate.id)) continue;
      console.log(`  - ${gate.id} (${gate.type}, ${gate.level})`);
    }
    process.exit(0);
  }
}

main().catch(err => {
  console.error('[Gate Reporter] 错误:', err.message);
  process.exit(1);
});
