#!/usr/bin/env node
/**
 * gate-validator-v2 — Gate 增强验证器
 *
 * 在原有 10 种验证器基础上，新增 4 种上下文感知验证器：
 * - context-compliance-check：代码是否符合项目规范
 * - reuse-check：是否复用了建议的组件
 * - constraint-check：是否违反了项目约束
 * - impact-check：是否考虑了影响分析报告
 *
 * 调用:
 *   node gate-validator-v2.mjs --validate context-compliance --file src/X.java
 *   node gate-validator-v2.mjs --validate reuse-check --requirement "导出Excel"
 *   node gate-validator-v2.mjs --validate constraint-check
 *   node gate-validator-v2.mjs --validate impact-check --requirement "添加缓存"
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { resolveProjectRoot } from './path-utils.mjs';
import { readJson } from './hook-utils.mjs';
import { loadKnowledge } from './project-knowledge-engine.mjs';

// ---- context-compliance-check ----
// 检查代码是否符合项目编码规范

export function validateContextCompliance(projectRoot, filePath) {
  const knowledge = loadKnowledge(projectRoot);
  if (!knowledge) return { pass: true, reason: '知识图谱不存在，跳过检查' };

  const conv = knowledge.layers.convention || {};
  const violations = [];

  if (!existsSync(filePath)) {
    return { pass: true, reason: '文件不存在，跳过' };
  }

  const content = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  // 缩进检查
  if (conv.formatting?.indentStyle) {
    const lines = content.split('\n').filter(l => l.match(/^\s+\S/));
    const tabLines = lines.filter(l => l.startsWith('\t')).length;
    const spaceLines = lines.filter(l => l.match(/^ /)).length;

    if (conv.formatting.indentStyle === 'tabs' && spaceLines > tabLines * 2) {
      violations.push('缩进风格不一致：项目使用 tabs，但文件使用 spaces');
    }
    if (conv.formatting.indentStyle === 'spaces' && tabLines > spaceLines * 2) {
      violations.push('缩进风格不一致：项目使用 spaces，但文件使用 tabs');
    }
  }

  // 分号检查（JS/TS）
  if (['.js', '.ts', '.mjs', '.tsx'].includes(ext) && conv.formatting?.semicolons !== undefined) {
    const codeLines = content.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const semiLines = codeLines.filter(l => l.trim().endsWith(';')).length;
    const ratio = semiLines / codeLines.length;

    if (conv.formatting.semicolons && ratio < 0.3) {
      violations.push('项目使用分号，但此文件大部分行缺少分号');
    }
    if (!conv.formatting.semicolons && ratio > 0.7) {
      violations.push('项目不使用分号，但此文件大部分行有分号');
    }
  }

  // 日志框架检查
  if (conv.logging?.framework) {
    if (conv.logging.framework === 'SLF4J' && content.includes('System.out.println')) {
      violations.push('项目使用 SLF4J 日志框架，不应使用 System.out.println');
    }
    if (conv.logging.framework !== 'console' && content.includes('console.log') && !filePath.includes('test')) {
      violations.push(`项目使用 ${conv.logging.framework}，不应在生产代码中使用 console.log`);
    }
  }

  return {
    pass: violations.length === 0,
    violations,
    reason: violations.length > 0 ? `发现 ${violations.length} 个规范违反` : '符合项目规范',
  };
}

// ---- reuse-check ----
// 检查是否复用了建议的组件

export function validateReuseCheck(projectRoot, requirement) {
  const knowledge = loadKnowledge(projectRoot);
  if (!knowledge) return { pass: true, reason: '知识图谱不存在，跳过' };

  const deps = knowledge.layers.dependencies || {};
  const suggestions = [];

  const reqLower = requirement.toLowerCase();

  // 检查是否有可复用的依赖
  for (const dep of (deps.external || [])) {
    const depLower = dep.name.toLowerCase();
    if (reqLower.includes('excel') && (depLower.includes('poi') || depLower.includes('easyexcel'))) {
      suggestions.push(`已有 ${dep.name}@${dep.version}，建议复用`);
    }
    if (reqLower.includes('json') && (depLower.includes('jackson') || depLower.includes('gson'))) {
      suggestions.push(`已有 ${dep.name}@${dep.version}，建议复用`);
    }
    if (reqLower.includes('http') && (depLower.includes('okhttp') || depLower.includes('httpclient') || depLower.includes('axios'))) {
      suggestions.push(`已有 ${dep.name}@${dep.version}，建议复用`);
    }
  }

  return {
    pass: true,
    suggestions,
    reason: suggestions.length > 0 ? `发现 ${suggestions.length} 个复用建议` : '无复用建议',
  };
}

// ---- constraint-check ----
// 检查是否违反了项目约束

export function validateConstraintCheck(projectRoot) {
  const knowledge = loadKnowledge(projectRoot);
  if (!knowledge) return { pass: true, reason: '知识图谱不存在，跳过' };

  const deps = knowledge.layers.dependencies || {};
  const violations = [];

  // 检查约束
  for (const c of (deps.constraints || [])) {
    if (c.type === 'java-version') {
      violations.push({ type: 'info', msg: `Java 版本锁定: ${c.value}，新代码不能使用更高版本特性` });
    }
    if (c.type === 'spring-boot-version') {
      violations.push({ type: 'info', msg: `Spring Boot 版本: ${c.value}，新依赖需兼容此版本` });
    }
  }

  return {
    pass: true,
    constraints: violations,
    reason: `${violations.length} 个约束需要注意`,
  };
}

// ---- impact-check ----
// 检查是否考虑了影响分析

export function validateImpactCheck(projectRoot, requirement) {
  const reportPath = join(projectRoot, '.chaos-harness', 'impact-report.md');
  if (!existsSync(reportPath)) {
    return {
      pass: false,
      reason: '未找到影响分析报告，建议先运行需求影响分析',
      suggestion: `运行: node scripts/impact-analyzer.mjs --requirement "${requirement}"`,
    };
  }

  const report = readFileSync(reportPath, 'utf-8');
  const hasRisks = report.includes('## 风险预警') && !report.includes('未检测到明显风险');

  return {
    pass: true,
    hasImpactReport: true,
    hasRisks,
    reason: hasRisks ? '影响分析报告中存在风险预警，请确认已处理' : '影响分析报告已生成，无高风险',
  };
}

// ---- 统一验证入口 ----

export function validate(projectRoot, validatorName, options = {}) {
  switch (validatorName) {
    case 'context-compliance':
    case 'context-compliance-check':
      return validateContextCompliance(projectRoot, options.file || '');
    case 'reuse-check':
      return validateReuseCheck(projectRoot, options.requirement || '');
    case 'constraint-check':
      return validateConstraintCheck(projectRoot);
    case 'impact-check':
      return validateImpactCheck(projectRoot, options.requirement || '');
    default:
      return { pass: true, reason: `未知验证器: ${validatorName}` };
  }
}

// ---- CLI ----

const args = process.argv.slice(2);
if (args.length === 0) process.exit(0);

const projectRoot = resolveProjectRoot();
if (!projectRoot) {
  console.log('[Gate Validator V2] 未检测到项目根目录');
  process.exit(0);
}

if (args.includes('--validate')) {
  const idx = args.indexOf('--validate') + 1;
  const validatorName = args[idx];
  if (!validatorName) { console.error('用法: --validate <validator-name>'); process.exit(1); }

  const fileIdx = args.indexOf('--file');
  const reqIdx = args.indexOf('--requirement');

  const options = {
    file: fileIdx !== -1 ? join(projectRoot, args[fileIdx + 1]) : '',
    requirement: reqIdx !== -1 ? args[reqIdx + 1] : '',
  };

  const result = validate(projectRoot, validatorName, options);
  console.log(JSON.stringify(result, null, 2));

  if (!result.pass) process.exit(1);
} else {
  console.log('用法:');
  console.log('  --validate context-compliance --file <path>');
  console.log('  --validate reuse-check --requirement "描述"');
  console.log('  --validate constraint-check');
  console.log('  --validate impact-check --requirement "描述"');
}
