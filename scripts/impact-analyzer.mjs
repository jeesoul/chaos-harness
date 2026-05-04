#!/usr/bin/env node
/**
 * impact-analyzer — 需求影响分析引擎
 *
 * 输入：新需求描述
 * 查询：项目知识图谱 + Graphify 图谱
 * 输出：影响分析报告
 *   - 影响范围：哪些模块受影响
 *   - 复用建议：哪些代码可复用
 *   - 约束提醒：哪些约束不能违反
 *   - 风险预警：哪些地方可能出问题
 *   - 工作量估算：大概需要多久
 *
 * 调用:
 *   node impact-analyzer.mjs --requirement "用户导出 Excel"
 *   node impact-analyzer.mjs --requirement "添加缓存层" --detail
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { resolveProjectRoot } from './path-utils.mjs';
import { readJson, ensureDir, utcTimestamp } from './hook-utils.mjs';
import { loadKnowledge, getKnowledgePaths } from './project-knowledge-engine.mjs';
import { loadGraph, getGodNodes, hasKnowledgeGraph } from './graphify-wrapper.mjs';

// ---- 关键词匹配引擎 ----

const KEYWORD_MAP = {
  export: ['excel', 'csv', 'pdf', 'export', 'download', 'report', 'generate'],
  database: ['table', 'column', 'index', 'migration', 'entity', 'model', 'schema', 'sql'],
  auth: ['login', 'auth', 'permission', 'role', 'token', 'session', 'security', 'rbac'],
  api: ['endpoint', 'controller', 'route', 'rest', 'graphql', 'api', 'request', 'response'],
  cache: ['cache', 'redis', 'memcached', 'ttl', 'invalidate'],
  queue: ['queue', 'message', 'kafka', 'rabbitmq', 'async', 'event'],
  ui: ['page', 'component', 'form', 'button', 'modal', 'dialog', 'view', 'template'],
  test: ['test', 'spec', 'mock', 'assert', 'coverage'],
  config: ['config', 'env', 'property', 'setting', 'yaml', 'yml'],
  performance: ['performance', 'optimize', 'slow', 'memory', 'cpu', 'latency', 'batch'],
};

function extractKeywords(requirement) {
  const lower = requirement.toLowerCase();
  const matched = {};
  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    const hits = keywords.filter(k => lower.includes(k));
    if (hits.length > 0) matched[category] = hits;
  }
  return matched;
}

// ---- 影响范围分析 ----

function analyzeImpactScope(knowledge, keywords, requirement) {
  const impacted = [];
  const modules = knowledge?.layers?.code?.modules || [];
  const entryPoints = knowledge?.layers?.code?.entryPoints || [];

  for (const mod of modules) {
    const modLower = mod.name.toLowerCase();
    let relevance = 0;
    for (const [category, hits] of Object.entries(keywords)) {
      if (hits.some(h => modLower.includes(h))) relevance += 2;
      if (category === 'api' && modLower.includes('controller')) relevance += 1;
      if (category === 'database' && (modLower.includes('model') || modLower.includes('entity') || modLower.includes('repository'))) relevance += 1;
      if (category === 'ui' && (modLower.includes('view') || modLower.includes('component') || modLower.includes('page'))) relevance += 1;
    }
    if (relevance > 0) {
      impacted.push({ module: mod.name, files: mod.files, relevance, languages: mod.languages });
    }
  }

  impacted.sort((a, b) => b.relevance - a.relevance);
  return impacted.slice(0, 10);
}

// ---- 复用建议 ----

function analyzeReusability(knowledge, keywords, projectRoot) {
  const suggestions = [];
  const deps = knowledge?.layers?.dependencies || {};
  const data = knowledge?.layers?.data || {};

  // 检查已有依赖是否可复用
  for (const dep of (deps.external || [])) {
    const depLower = dep.name.toLowerCase();
    if (keywords.export && (depLower.includes('excel') || depLower.includes('poi') || depLower.includes('easyexcel'))) {
      suggestions.push({ type: 'dependency', name: dep.name, version: dep.version, reason: '项目已有 Excel 处理依赖' });
    }
    if (keywords.cache && (depLower.includes('redis') || depLower.includes('cache') || depLower.includes('caffeine'))) {
      suggestions.push({ type: 'dependency', name: dep.name, version: dep.version, reason: '项目已有缓存依赖' });
    }
    if (keywords.queue && (depLower.includes('kafka') || depLower.includes('rabbit') || depLower.includes('amqp'))) {
      suggestions.push({ type: 'dependency', name: dep.name, version: dep.version, reason: '项目已有消息队列依赖' });
    }
  }

  // 检查已有实体是否相关
  for (const entity of (data.entities || [])) {
    const entityLower = entity.name.toLowerCase();
    for (const [category, hits] of Object.entries(keywords)) {
      if (hits.some(h => entityLower.includes(h))) {
        suggestions.push({ type: 'entity', name: entity.name, table: entity.table, reason: `已有相关数据实体` });
      }
    }
  }

  return suggestions;
}

// ---- 约束提醒 ----

function analyzeConstraints(knowledge, keywords) {
  const constraints = [];
  const deps = knowledge?.layers?.dependencies || {};

  for (const c of (deps.constraints || [])) {
    constraints.push({ type: c.type, value: c.value, severity: 'high' });
  }

  // 数据量级警告
  if (keywords.database || keywords.export) {
    constraints.push({
      type: 'data-volume',
      value: '请确认目标表的数据量级，大表操作需要分页/流式处理',
      severity: 'medium',
    });
  }

  // 权限约束
  if (keywords.auth || keywords.api) {
    constraints.push({
      type: 'auth-required',
      value: '新接口需要配置权限控制，检查现有 RBAC/权限框架',
      severity: 'high',
    });
  }

  return constraints;
}

// ---- 风险预警 ----

function analyzeRisks(knowledge, keywords, godNodes) {
  const risks = [];

  // God Nodes 风险
  if (godNodes && godNodes.length > 0) {
    const topNodes = godNodes.slice(0, 3);
    risks.push({
      level: 'medium',
      description: `项目存在高耦合核心节点: ${topNodes.map(n => n.label || n.id).join(', ')}`,
      mitigation: '修改这些节点时需要额外谨慎，影响范围大',
    });
  }

  // 性能风险
  if (keywords.export || keywords.performance) {
    risks.push({
      level: 'high',
      description: '大数据量导出可能导致 OOM',
      mitigation: '使用流式写入（SXSSFWorkbook / 分页查询），限制单次导出行数',
    });
  }

  // 依赖冲突风险
  if (keywords.cache || keywords.queue) {
    risks.push({
      level: 'medium',
      description: '新增中间件依赖可能与现有版本冲突',
      mitigation: '检查 BOM/依赖管理，确认版本兼容性',
    });
  }

  // 测试覆盖风险
  const coverage = knowledge?.layers?.code?.testCoverage;
  if (coverage && coverage.ratio < 0.3) {
    risks.push({
      level: 'low',
      description: `项目测试覆盖率较低 (${(coverage.ratio * 100).toFixed(0)}%)`,
      mitigation: '新功能务必编写单元测试和集成测试',
    });
  }

  return risks;
}

// ---- 工作量估算 ----

function estimateEffort(impactScope, constraints, risks) {
  let baseHours = 4;

  // 影响模块数
  baseHours += impactScope.length * 2;

  // 约束复杂度
  baseHours += constraints.filter(c => c.severity === 'high').length * 2;

  // 风险附加
  baseHours += risks.filter(r => r.level === 'high').length * 3;

  const estimate = {
    optimistic: Math.max(2, Math.round(baseHours * 0.6)),
    likely: Math.round(baseHours),
    pessimistic: Math.round(baseHours * 1.8),
  };

  return estimate;
}

// ---- 主分析函数 ----

export function analyzeImpact(projectRoot, requirement) {
  const knowledge = loadKnowledge(projectRoot);
  const keywords = extractKeywords(requirement);

  let godNodes = [];
  if (hasKnowledgeGraph(projectRoot)) {
    godNodes = getGodNodes(projectRoot, 5);
  }

  const impactScope = analyzeImpactScope(knowledge, keywords, requirement);
  const reusability = analyzeReusability(knowledge, keywords, projectRoot);
  const constraints = analyzeConstraints(knowledge, keywords);
  const risks = analyzeRisks(knowledge, keywords, godNodes);
  const effort = estimateEffort(impactScope, constraints, risks);

  return {
    requirement,
    timestamp: utcTimestamp(),
    keywords,
    impactScope,
    reusability,
    constraints,
    risks,
    effort,
  };
}

export function formatReport(analysis) {
  const lines = [
    '# 需求影响分析报告', '',
    `> 需求: ${analysis.requirement}`,
    `> 时间: ${analysis.timestamp}`, '',
  ];

  // 关键词
  lines.push('## 识别的关键领域', '');
  for (const [cat, hits] of Object.entries(analysis.keywords)) {
    lines.push(`- **${cat}**: ${hits.join(', ')}`);
  }

  // 影响范围
  lines.push('', '## 影响范围', '');
  if (analysis.impactScope.length > 0) {
    lines.push('| 模块 | 文件数 | 相关度 | 语言 |', '|------|--------|--------|------|');
    for (const m of analysis.impactScope) {
      lines.push(`| ${m.module} | ${m.files} | ${m.relevance} | ${m.languages.join(', ')} |`);
    }
  } else {
    lines.push('未检测到直接影响的模块（可能是新功能）');
  }

  // 复用建议
  lines.push('', '## 复用建议', '');
  if (analysis.reusability.length > 0) {
    for (const s of analysis.reusability) {
      lines.push(`- [${s.type}] **${s.name}** ${s.version ? `(${s.version})` : ''} — ${s.reason}`);
    }
  } else {
    lines.push('未发现可直接复用的组件');
  }

  // 约束提醒
  lines.push('', '## 约束提醒', '');
  for (const c of analysis.constraints) {
    const icon = c.severity === 'high' ? '!!!' : c.severity === 'medium' ? '!!' : '!';
    lines.push(`- [${icon}] **${c.type}**: ${c.value}`);
  }

  // 风险预警
  lines.push('', '## 风险预警', '');
  for (const r of analysis.risks) {
    const icon = r.level === 'high' ? '!!!' : r.level === 'medium' ? '!!' : '!';
    lines.push(`- [${icon}] ${r.description}`);
    lines.push(`  - 缓解: ${r.mitigation}`);
  }

  // 工作量估算
  lines.push('', '## 工作量估算', '',
    `| 场景 | 预估工时 |`, `|------|---------|`,
    `| 乐观 | ${analysis.effort.optimistic}h |`,
    `| 正常 | ${analysis.effort.likely}h |`,
    `| 悲观 | ${analysis.effort.pessimistic}h |`,
  );

  return lines.join('\n');
}

// ---- CLI ----

const args = process.argv.slice(2);
if (args.length === 0) process.exit(0);

const rootArgIdx = args.indexOf('--project-root');
const explicitRoot = rootArgIdx !== -1 ? args[rootArgIdx + 1] : null;
const projectRoot = resolveProjectRoot(explicitRoot);
if (!projectRoot) {
  console.log('[Impact Analyzer] 未检测到项目根目录');
  console.log('  提示: 使用 --project-root <path> 指定目标项目路径');
  process.exit(0);
}

const reqIdx = args.indexOf('--requirement');
if (reqIdx === -1) {
  console.log('用法: node impact-analyzer.mjs --requirement "需求描述"');
  process.exit(0);
}

const requirement = args[reqIdx + 1];
if (!requirement) {
  console.error('请提供需求描述');
  process.exit(1);
}

const analysis = analyzeImpact(projectRoot, requirement);
const report = formatReport(analysis);

if (args.includes('--json')) {
  console.log(JSON.stringify(analysis, null, 2));
} else {
  console.log(report);
}

// 保存报告
const reportPath = join(projectRoot, '.chaos-harness', 'impact-report.md');
ensureDir(join(projectRoot, '.chaos-harness'));
writeFileSync(reportPath, report, 'utf-8');
