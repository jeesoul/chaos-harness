#!/usr/bin/env node
/**
 * graphify-context — PreToolUse Hook (Write|Edit)
 *
 * 职责：
 * 在 AI 写/编辑文件前，查询知识图谱获取上下文
 * 输出 hookSpecificOutput 让 AI 看到图谱上下文
 *
 * 触发条件：
 * 1. enabled=true → 每次 Write/Edit 都触发
 * 2. enabled=false → 不触发（手动调用走 Skill）
 */

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

if (!cfg.enabled || !cfg.query_before_action) {
  process.exit(0);
}

if (!hasKnowledgeGraph(projectRoot)) {
  process.exit(0);
}

const report = getGraphReport(projectRoot);
const godNodes = getGodNodes(projectRoot, 5);

if (!report) {
  process.exit(0);
}

const godNodesSummary = godNodes
  .map(n => `${n.label} (degree:${n.degree}, community:${n.community})`)
  .join(', ');

const context = [
  'graphify: Knowledge graph is active.',
  `God nodes: ${godNodesSummary}`,
  'Read graphify-out/GRAPH_REPORT.md for full community structure before making changes.',
  'Check if the file you are editing belongs to a community — respect module boundaries.',
].join(' ');

const hookOutput = {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    additionalContext: context,
  },
};

process.stdout.write(JSON.stringify(hookOutput));
