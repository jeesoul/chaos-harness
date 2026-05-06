#!/usr/bin/env node
/**
 * graphify-update — PostToolUse Hook (Write|Edit)
 *
 * 职责：
 * 代码变更后增量更新知识图谱
 *
 * 触发条件：
 * 1. enabled=true + auto_update=true → 每次 Write/Edit 后触发
 * 2. enabled=false → 不触发
 */

import { resolveProjectRoot } from './path-utils.mjs';
import {
  loadGraphifyConfig,
  hasKnowledgeGraph,
  updateGraph,
} from './graphify-wrapper.mjs';

const projectRoot = resolveProjectRoot();

if (!projectRoot) {
  process.exit(0);
}

const cfg = loadGraphifyConfig(projectRoot);

if (!cfg.enabled || !cfg.auto_update) {
  process.exit(0);
}

if (!hasKnowledgeGraph(projectRoot)) {
  process.exit(0);
}

const result = updateGraph(projectRoot);

if (!result.success) {
  console.error(`[Graphify] 增量更新失败: ${result.error}`);
}
