#!/usr/bin/env node
/**
 * graphify-context — PreToolUse Hook (Write|Edit)
 *
 * 职责：
 * 在 AI 写/编辑文件前，查询知识图谱获取上下文
 * 输出 hookSpecificOutput 让 AI 看到图谱上下文
 *
 * 优先级：
 * 1. Graphify 已启用且图谱存在 → 输出 Graphify 上下文
 * 2. project-knowledge.json 存在 → 降级输出知识图谱摘要
 * 3. 两者都没有 → 静默退出
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveProjectRoot } from './path-utils.mjs';
import {
  loadGraphifyConfig,
  hasKnowledgeGraph,
  getGraphReport,
  getGodNodes,
} from './graphify-wrapper.mjs';

const projectRoot = resolveProjectRoot();

if (!projectRoot) {
  process.exit(0);
}

const cfg = loadGraphifyConfig(projectRoot);

// --- 优先路径：Graphify 已启用 ---
if (cfg.enabled && cfg.query_before_action && hasKnowledgeGraph(projectRoot)) {
  const report = getGraphReport(projectRoot);
  const godNodes = getGodNodes(projectRoot, 5);

  if (report) {
    const godNodesSummary = godNodes
      .map(n => `${n.label} (degree:${n.degree}, community:${n.community})`)
      .join(', ');

    const context = [
      'graphify: Knowledge graph is active.',
      `God nodes: ${godNodesSummary}`,
      'Read graphify-out/GRAPH_REPORT.md for full community structure before making changes.',
      'Check if the file you are editing belongs to a community — respect module boundaries.',
    ].join(' ');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: context,
      },
    }));
    process.exit(0);
  }
}

// --- 降级路径：project-knowledge.json ---
const knowledgePath = join(projectRoot, '.chaos-harness', 'project-knowledge.json');
if (!existsSync(knowledgePath)) {
  process.exit(0);
}

try {
  const knowledge = JSON.parse(readFileSync(knowledgePath, 'utf8'));
  const code = knowledge.layers?.code || {};
  const deps = knowledge.layers?.dependencies || {};
  const conv = knowledge.layers?.convention || {};

  const parts = [];

  if (conv.naming?.classStyle) parts.push(`命名: 类=${conv.naming.classStyle}`);
  if (conv.logging?.framework) parts.push(`日志: ${conv.logging.framework}`);
  if (deps.constraints?.length > 0) {
    parts.push(`约束: ${deps.constraints.map(c => `${c.type}=${c.value}`).join(', ')}`);
  }
  if (code.modules?.length > 0) {
    parts.push(`模块: ${code.modules.map(m => m.name).join(', ')}`);
  }

  if (parts.length === 0) process.exit(0);

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: `project-knowledge: ${parts.join(' | ')}`,
    },
  }));
} catch {
  // 知识图谱损坏，静默退出
}

