#!/usr/bin/env node
/**
 * dev-intelligence.mjs — 开发质量智能引擎 CLI
 * v1.4.0 大版本：知识库统一为 Wiki（不再依赖 CSV + Python）
 *
 * search / generate-gate / persist / auto-check / restore
 *
 * 调用: node dev-intelligence.mjs --query <text> [--domain <tag>]
 *       node dev-intelligence.mjs generate-gate --stage <stage> --stack <stack> --level <hard|soft>
 *       node dev-intelligence.mjs persist --type <type> --subject <text> --value <text> --evidence <text>
 *       node dev-intelligence.mjs --auto-check --stage <stage>
 *       node dev-intelligence.mjs --restore
 *       node dev-intelligence.mjs --session-context
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePluginRoot } from './path-utils.mjs';
import { ensureDir } from './hook-utils.mjs';
import { search as wikiSearch } from './wiki-search.mjs';

const pluginRoot = resolvePluginRoot();
const stacksDir = join(pluginRoot, 'stacks');
const chaosDir = join(pluginRoot, '.chaos-harness');

/**
 * 统一搜索：走 Wiki（纯 Node，零依赖）。
 * domain 作为可选 tag 过滤（如 "gate"、"test"、"anti-pattern"）。
 */
function callSearch(query, domain, top = 5) {
  // domain 在 v1.4.0 中作为 tag 提示拼接进 query，提升相关性
  const tagHint = domain && domain !== 'all' ? domain.replace(/-rules$|-patterns$/, '') : '';
  const effectiveQuery = tagHint ? `${query} ${tagHint}` : query;
  const hits = wikiSearch(effectiveQuery, { limit: top });
  return {
    query,
    domain: domain || 'all',
    results: hits.map(h => ({
      id: h.id,
      score: Math.round(h.score * 100) / 100,
      source_domain: h.type,
      matched_fields: h.tags,
      data: { pattern_name: h.title, description: '', path: h.path },
    })),
    total_results: hits.length,
  };
}

/** 格式化搜索结果为人类可读文本 */
function formatResults(searchResult) {
  if (searchResult.error) {
    return `搜索错误: ${searchResult.error}`;
  }
  if (searchResult.total_results === 0) {
    return `未找到匹配结果。建议：尝试更宽泛的关键词。`;
  }
  let output = `\n搜索结果 (${searchResult.total_results} 条):\n`;
  output += '='.repeat(50) + '\n';
  for (const r of searchResult.results) {
    output += `[${r.source_domain}] ${r.id} (score: ${r.score})\n`;
    const data = r.data;
    if (data.pattern_name || data.rule_name) output += `  名称: ${data.pattern_name || data.rule_name}\n`;
    if (data.description) output += `  描述: ${data.description}\n`;
    if (data.do) output += `  Do: ${data.do}\n`;
    if (data.dont) output += `  Don't: ${data.dont}\n`;
    if (data.severity) output += `  严重性: ${data.severity}\n`;
    if (data.fix_command) output += `  修复: ${data.fix_command}\n`;
    output += '\n';
  }
  return output;
}

/** 生成 Gate 配置（v1.4.0：基于 wiki 命中 + stack 默认验证器） */
function generateGate(stage, stack, level, outputPath) {
  const STAGE_MAP = {
    'requirements': 'gate-requirements', 'architecture': 'gate-requirements',
    'development': 'gate-implementation', 'code-review': 'gate-implementation',
    'testing': 'gate-release', 'release': 'gate-release',
  };
  const normalizedStage = STAGE_MAP[stage] || stage;

  const stackConfigPath = join(stacksDir, `${stack}.json`);
  if (!existsSync(stackConfigPath)) {
    console.error(`Stack config not found: ${stack}.json`);
    process.exit(1);
  }

  // 从 wiki 检索该 stage/stack 的相关模式作为参考
  const hits = wikiSearch(`${stage} ${stack} gate`, { limit: 5 });

  // 默认验证器按 stage 推断
  const stageValidators = {
    'gate-requirements': [{ type: 'file-exists', path: 'output/*/requirements' }],
    'gate-implementation': [{ type: 'no-syntax-errors' }, { type: 'git-has-commits', minCommits: 1 }],
    'gate-release': [{ type: 'test-suite-pass' }],
  };

  const gate = {
    id: `gate-${stage}-${stack}`,
    type: 'quality',
    level,
    description: `Generated gate for ${stage} stage (${stack} stack)`,
    trigger: 'stage-transition',
    cachePolicy: 'on-change',
    validators: stageValidators[normalizedStage] || [{ type: 'no-syntax-errors' }],
    dependsOn: [],
    references: hits.map(h => h.path),
  };

  const output = outputPath || join(chaosDir, 'gates', `gate-generated-${Date.now()}.json`);
  ensureDir(dirname(output));
  writeFileSync(output, JSON.stringify(gate, null, 2) + '\n', 'utf-8');

  console.log(`\nGate generated: ${output}`);
  console.log(`  Stage: ${stage} → ${normalizedStage}`);
  console.log(`  Stack: ${stack}`);
  console.log(`  Level: ${level}`);
  console.log(`  Validators: ${gate.validators.length}`);
  console.log(`  Wiki references: ${gate.references.length}`);
}

/** 持久化决策 */
function persist(type, subject, value, evidence) {
  const decisionsPath = join(chaosDir, 'intelligence-decisions.jsonl');
  ensureDir(chaosDir);
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    subject,
    value,
    evidence,
    session_id: String(Date.now()),
  };
  try {
    appendFileSync(decisionsPath, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (e) {
    const tmpPath = decisionsPath + '.tmp';
    appendFileSync(tmpPath, JSON.stringify(entry) + '\n', 'utf-8');
    console.error(`Persist failed, saved to temp file: ${tmpPath}`);
  }
  console.log(`Decision persisted: ${subject} = ${value}`);
}

/** 自动检查 — 阶段切换时输出建议报告 */
function autoCheck(stage) {
  const gateResult = callSearch(stage, 'gate-patterns', 5);
  const antiResult = callSearch(stage, 'anti-patterns', 5);

  let report = `# Intelligence Report: ${stage}\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;

  report += `## Recommended Gate Patterns\n\n`;
  if (gateResult.results?.length) {
    for (const r of gateResult.results) {
      report += `- [${r.id}] ${r.data.pattern_name || r.id}: ${r.data.description || ''}\n`;
    }
  } else {
    report += `- No specific recommendations for this stage\n`;
  }

  report += `\n## Common Anti-Patterns to Watch\n\n`;
  if (antiResult.results?.length) {
    for (const r of antiResult.results) {
      report += `- [${r.id}] ${r.data.pattern_name || r.id}: Do ${r.data.do || 'follow best practices'}, Don't ${r.data.dont || 'ignore warnings'}\n`;
    }
  } else {
    report += `- No specific anti-patterns for this stage\n`;
  }

  const reportPath = join(chaosDir, 'intelligence-report.md');
  ensureDir(chaosDir);
  writeFileSync(reportPath, report, 'utf-8');
  console.log(report);
}

/** 恢复最近决策 */
function restore() {
  const decisionsPath = join(chaosDir, 'intelligence-decisions.jsonl');
  if (!existsSync(decisionsPath)) {
    console.log('No intelligence decisions found.');
    return;
  }
  const lines = readFileSync(decisionsPath, 'utf-8').trim().split('\n');
  const recent = lines.slice(-10).map(l => JSON.parse(l));
  console.log('\nRecent Intelligence Decisions:');
  console.log('='.repeat(50));
  for (const d of recent.reverse()) {
    const age = Math.floor((Date.now() - new Date(d.timestamp).getTime()) / 86400000);
    const expired = age > 7 ? ' [EXPIRED]' : '';
    console.log(`  [${d.type}] ${d.subject} = ${d.value}${expired}`);
  }
}

/** 主入口 */
function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  if (mode === 'persist') {
    const typeIdx = args.indexOf('--type');
    const subjectIdx = args.indexOf('--subject');
    const valueIdx = args.indexOf('--value');
    const evidenceIdx = args.indexOf('--evidence');
    if (typeIdx === -1 || subjectIdx === -1 || valueIdx === -1) {
      console.error('Usage: node dev-intelligence.mjs persist --type <type> --subject <text> --value <text> --evidence <text>');
      process.exit(1);
    }
    persist(args[typeIdx + 1], args[subjectIdx + 1], args[valueIdx + 1], evidenceIdx >= 0 ? args[evidenceIdx + 1] : '');
    process.exit(0);
  }

  if (mode === 'generate-gate') {
    const stageIdx = args.indexOf('--stage');
    const stackIdx = args.indexOf('--stack');
    const levelIdx = args.indexOf('--level');
    const outputIdx = args.indexOf('--output');
    if (stageIdx === -1 || stackIdx === -1) {
      console.error('Usage: node dev-intelligence.mjs generate-gate --stage <stage> --stack <stack> [--level hard|soft] [--output <path>]');
      process.exit(1);
    }
    const stage = args[stageIdx + 1];
    const stack = args[stackIdx + 1];
    const level = levelIdx >= 0 ? args[levelIdx + 1] : 'hard';
    const output = outputIdx >= 0 ? args[outputIdx + 1] : null;
    generateGate(stage, stack, level, output);
    process.exit(0);
  }

  const queryIdx = args.indexOf('--query');
  const domainIdx = args.indexOf('--domain');
  const topIdx = args.indexOf('--top');
  const stageIdx = args.indexOf('--stage');

  if (args.includes('--auto-check')) {
    const stage = stageIdx >= 0 ? args[stageIdx + 1] : 'W10_testing';
    autoCheck(stage);
    process.exit(0);
  }

  if (args.includes('--restore') || args.includes('--session-context')) {
    restore();
    process.exit(0);
  }

  if (queryIdx >= 0 && domainIdx >= 0) {
    const query = args[queryIdx + 1];
    const domain = args[domainIdx + 1];
    const top = topIdx >= 0 ? parseInt(args[topIdx + 1]) : 5;
    const result = callSearch(query, domain, top);
    console.log(formatResults(result));
    const resultPath = join(chaosDir, 'intelligence-result.json');
    ensureDir(chaosDir);
    writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n', 'utf-8');
    process.exit(0);
  }

  console.error('Usage:');
  console.error('  node dev-intelligence.mjs --query <text> --domain <domain>');
  console.error('  node dev-intelligence.mjs generate-gate --stage <stage> --stack <stack>');
  console.error('  node dev-intelligence.mjs persist --type <type> --subject <text> --value <text>');
  console.error('  node dev-intelligence.mjs --auto-check --stage <stage>');
  console.error('  node dev-intelligence.mjs --restore');
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
