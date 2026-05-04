#!/usr/bin/env node
/**
 * context-advisor — 上下文感知代码建议器
 *
 * 基于项目知识图谱，在 AI 生成代码前提供上下文建议：
 * - 命名风格：和现有代码一致
 * - 依赖选择：和现有依赖一致
 * - 架构模式：和现有架构一致
 * - 异常处理：和现有方式一致
 * - 日志格式：和现有格式一致
 *
 * 调用:
 *   node context-advisor.mjs --advise "创建UserExportService"
 *   node context-advisor.mjs --for-file src/service/UserService.java
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename, dirname, relative } from 'node:path';
import { resolveProjectRoot } from './path-utils.mjs';
import { readJson } from './hook-utils.mjs';
import { loadKnowledge } from './project-knowledge-engine.mjs';

// ---- 上下文建议生成 ----

export function generateAdvice(projectRoot, description) {
  const knowledge = loadKnowledge(projectRoot);
  if (!knowledge) {
    return { advice: [], warning: '知识图谱不存在，无法提供上下文建议' };
  }

  const advice = [];
  const code = knowledge.layers.code;
  const conv = knowledge.layers.convention || {};
  const deps = knowledge.layers.dependencies || {};

  // 1. 命名建议
  if (conv.naming) {
    const namingAdvice = [];
    if (conv.naming.classStyle) namingAdvice.push(`类名使用 ${conv.naming.classStyle}`);
    if (conv.naming.methodStyle) namingAdvice.push(`方法名使用 ${conv.naming.methodStyle}`);
    if (conv.naming.functionStyle) namingAdvice.push(`函数名使用 ${conv.naming.functionStyle}`);
    if (namingAdvice.length > 0) {
      advice.push({ category: 'naming', items: namingAdvice });
    }
  }

  // 2. 格式化建议
  if (conv.formatting) {
    const fmtAdvice = [];
    if (conv.formatting.indentStyle) fmtAdvice.push(`缩进: ${conv.formatting.indentStyle}${conv.formatting.indentSize ? ` (${conv.formatting.indentSize} spaces)` : ''}`);
    if (conv.formatting.semicolons !== undefined) fmtAdvice.push(`分号: ${conv.formatting.semicolons ? '使用' : '不使用'}`);
    if (conv.formatting.quoteStyle) fmtAdvice.push(`引号: ${conv.formatting.quoteStyle}`);
    if (fmtAdvice.length > 0) {
      advice.push({ category: 'formatting', items: fmtAdvice });
    }
  }

  // 3. 日志建议
  if (conv.logging?.framework) {
    advice.push({
      category: 'logging',
      items: [`使用 ${conv.logging.framework} 日志框架`, conv.logging.variableName ? `日志变量名: ${conv.logging.variableName}` : null].filter(Boolean),
    });
  }

  // 4. 依赖建议
  if (deps.external?.length > 0) {
    const descLower = description.toLowerCase();
    const relevantDeps = deps.external.filter(d => {
      const depLower = d.name.toLowerCase();
      return descLower.split(/\s+/).some(w => w.length > 2 && depLower.includes(w));
    });
    if (relevantDeps.length > 0) {
      advice.push({
        category: 'dependencies',
        items: relevantDeps.map(d => `已有依赖 ${d.name}@${d.version}，优先复用`),
      });
    }
  }

  // 5. 约束提醒
  if (deps.constraints?.length > 0) {
    advice.push({
      category: 'constraints',
      items: deps.constraints.map(c => `${c.type}: ${c.value}`),
    });
  }

  // 6. 架构建议
  if (code.modules?.length > 0) {
    const descLower = description.toLowerCase();
    const matchedModules = code.modules.filter(m =>
      descLower.includes(m.name.toLowerCase()) ||
      m.name.toLowerCase().includes(descLower.split(/\s+/)[0]?.toLowerCase() || '')
    );
    if (matchedModules.length > 0) {
      advice.push({
        category: 'architecture',
        items: matchedModules.map(m => `建议放入 ${m.name}/ 模块（已有 ${m.files} 个文件）`),
      });
    }
  }

  // 7. 测试建议
  if (code.testCoverage?.ratio > 0) {
    advice.push({
      category: 'testing',
      items: [`项目测试覆盖率 ${(code.testCoverage.ratio * 100).toFixed(0)}%，新代码需要配套测试`],
    });
  }

  return { advice };
}

// ---- 文件级上下文 ----

export function getFileContext(projectRoot, filePath) {
  const knowledge = loadKnowledge(projectRoot);
  if (!knowledge) return null;

  const relPath = relative(projectRoot, filePath).replace(/\\/g, '/');
  const dir = dirname(relPath);
  const ext = extname(filePath).toLowerCase();

  const context = {
    file: relPath,
    module: null,
    siblingFiles: [],
    conventions: knowledge.layers.convention || {},
    relatedEntities: [],
  };

  // 所属模块
  const parts = relPath.split('/');
  if (parts.length > 1) {
    context.module = knowledge.layers.code.modules?.find(m => m.name === parts[0]) || null;
  }

  // 同目录文件（推断风格）
  try {
    const siblings = readdirSync(join(projectRoot, dir))
      .filter(f => extname(f).toLowerCase() === ext && f !== basename(filePath))
      .slice(0, 5);
    context.siblingFiles = siblings;
  } catch {}

  // 相关数据实体
  const data = knowledge.layers.data;
  if (data?.entities) {
    context.relatedEntities = data.entities.filter(e =>
      e.file === relPath || basename(e.file || '').replace(extname(e.file || ''), '') === basename(relPath).replace(ext, '')
    );
  }

  return context;
}

// ---- 格式化输出 ----

export function formatAdvice(result) {
  if (result.warning) return `**注意:** ${result.warning}`;

  const lines = ['## 上下文建议', ''];
  for (const group of result.advice) {
    lines.push(`### ${group.category}`);
    for (const item of group.items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  if (result.advice.length === 0) {
    lines.push('暂无特定建议（知识图谱数据不足）');
  }

  return lines.join('\n');
}

// ---- CLI ----

const args = process.argv.slice(2);
if (args.length === 0) process.exit(0);

const projectRoot = resolveProjectRoot();
if (!projectRoot) {
  console.log('[Context Advisor] 未检测到项目根目录');
  process.exit(0);
}

if (args.includes('--advise')) {
  const idx = args.indexOf('--advise') + 1;
  const desc = args[idx];
  if (!desc) { console.error('用法: --advise "描述"'); process.exit(1); }
  const result = generateAdvice(projectRoot, desc);
  console.log(formatAdvice(result));
} else if (args.includes('--for-file')) {
  const idx = args.indexOf('--for-file') + 1;
  const filePath = args[idx];
  if (!filePath) { console.error('用法: --for-file <path>'); process.exit(1); }
  const context = getFileContext(projectRoot, join(projectRoot, filePath));
  if (context) console.log(JSON.stringify(context, null, 2));
  else console.log('无法获取文件上下文');
}
