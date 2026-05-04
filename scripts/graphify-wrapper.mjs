#!/usr/bin/env node
/**
 * graphify-wrapper — Graphify 知识图谱集成层
 *
 * 封装 Graphify CLI，提供：
 * - 图谱生成 / 增量更新 / 查询 / 分析
 * - chaos-harness 配置感知（enabled / auto_generate / auto_update）
 * - 供其他脚本 import 使用
 */

import { execSync, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolvePluginRoot, resolveProjectRoot } from './path-utils.mjs';
import { readJson, ensureDir } from './hook-utils.mjs';

const pluginRoot = resolvePluginRoot();

// ---- 配置 ----

const DEFAULT_CONFIG = {
  enabled: false,
  auto_generate: true,
  auto_update: true,
  query_before_action: true,
  output_dir: 'graphify-out',
  ignore_patterns: ['node_modules/', 'dist/', 'build/', '.chaos-harness/', 'graphify-out/'],
  token_budget: 2000,
};

/**
 * 加载 Graphify 配置（项目级优先，插件级兜底）
 */
export function loadGraphifyConfig(projectRoot) {
  const projectCfg = join(projectRoot, '.chaos-harness', 'graphify-config.json');
  const pluginCfg = join(pluginRoot, 'data', 'chaos-config.json');

  // 1. 从默认配置开始
  let cfg = { ...DEFAULT_CONFIG };

  // 2. 插件级配置覆盖默认值
  if (existsSync(pluginCfg)) {
    try {
      const pluginData = readJson(pluginCfg, {});
      if (pluginData.graphify) {
        cfg = { ...cfg, ...pluginData.graphify };
      }
    } catch (err) {
      console.error(`[Graphify] 加载插件配置失败: ${err.message}`);
    }
  }

  // 3. 项目级配置覆盖插件级（最高优先级）
  if (existsSync(projectCfg)) {
    try {
      const projectData = readJson(projectCfg, {});
      if (projectData.graphify) {
        cfg = { ...cfg, ...projectData.graphify };
      }
    } catch (err) {
      console.error(`[Graphify] 加载项目配置失败: ${err.message}`);
    }
  }

  return cfg;
}

/**
 * 保存 Graphify 配置到项目级
 */
export function saveGraphifyConfig(projectRoot, config) {
  const projectCfg = join(projectRoot, '.chaos-harness', 'graphify-config.json');
  ensureDir(join(projectRoot, '.chaos-harness'));
  writeFileSync(projectCfg, JSON.stringify({ graphify: config }, null, 2), 'utf-8');
}

// ---- 检测 Graphify 是否可用 ----

/**
 * 检查 Graphify 是否已安装
 */
export function isGraphifyInstalled() {
  try {
    execSync('graphify --help', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查知识图谱是否已存在
 */
export function hasKnowledgeGraph(projectRoot) {
  const cfg = loadGraphifyConfig(projectRoot);
  const graphPath = join(projectRoot, cfg.output_dir, 'graph.json');
  return existsSync(graphPath);
}

/**
 * 获取图谱文件路径
 */
export function getGraphPaths(projectRoot) {
  const cfg = loadGraphifyConfig(projectRoot);
  const outDir = join(projectRoot, cfg.output_dir);
  return {
    graph: join(outDir, 'graph.json'),
    report: join(outDir, 'GRAPH_REPORT.md'),
    html: join(outDir, 'graph.html'),
    outDir,
  };
}

// ---- 核心操作 ----

/**
 * 生成知识图谱（全量）
 */
export function generateGraph(projectRoot, options = {}) {
  const cfg = loadGraphifyConfig(projectRoot);
  const paths = getGraphPaths(projectRoot);

  if (existsSync(paths.graph) && !options.force) {
    return { success: true, cached: true, paths };
  }

  if (!isGraphifyInstalled()) {
    return { success: false, error: 'graphify 未安装，请运行: pip install graphifyy' };
  }

  try {
    execFileSync('graphify', [projectRoot], {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 300000,
    });
    return { success: true, cached: false, paths };
  } catch (err) {
    // 清理不完整的 graph.json（timeout 或其他错误）
    if (existsSync(paths.graph)) {
      try {
        unlinkSync(paths.graph);
      } catch {}
    }
    return { success: false, error: err.message };
  }
}

/**
 * 增量更新知识图谱（仅代码文件，无需 LLM）
 */
export function updateGraph(projectRoot) {
  if (!hasKnowledgeGraph(projectRoot)) {
    return generateGraph(projectRoot);
  }

  if (!isGraphifyInstalled()) {
    return { success: false, error: 'graphify 未安装' };
  }

  const paths = getGraphPaths(projectRoot);
  const backupPath = `${paths.graph}.backup`;

  try {
    // 备份现有图谱
    if (existsSync(paths.graph)) {
      copyFileSync(paths.graph, backupPath);
    }

    execFileSync('graphify', ['update', projectRoot], {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 120000,
    });

    // 删除备份
    if (existsSync(backupPath)) {
      unlinkSync(backupPath);
    }

    return { success: true };
  } catch (err) {
    // 恢复备份
    if (existsSync(backupPath)) {
      copyFileSync(backupPath, paths.graph);
      unlinkSync(backupPath);
    }
    return { success: false, error: err.message };
  }
}

/**
 * 查询知识图谱
 */
export function queryGraph(projectRoot, question, options = {}) {
  const cfg = loadGraphifyConfig(projectRoot);
  const paths = getGraphPaths(projectRoot);

  if (!existsSync(paths.graph)) {
    return { success: false, error: '知识图谱不存在' };
  }

  const budget = options.budget || cfg.token_budget;

  try {
    const output = execFileSync(
      'graphify',
      ['query', question, '--budget', String(budget), '--graph', paths.graph],
      { cwd: projectRoot, stdio: 'pipe', encoding: 'utf-8', timeout: 30000 }
    );
    return { success: true, result: output.trim() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 查找两个节点之间的最短路径
 */
export function findPath(projectRoot, nodeA, nodeB) {
  const paths = getGraphPaths(projectRoot);
  if (!existsSync(paths.graph)) {
    return { success: false, error: '知识图谱不存在' };
  }

  try {
    const output = execFileSync(
      'graphify',
      ['path', nodeA, nodeB, '--graph', paths.graph],
      { cwd: projectRoot, stdio: 'pipe', encoding: 'utf-8', timeout: 15000 }
    );
    return { success: true, result: output.trim() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 解释某个节点及其邻居
 */
export function explainNode(projectRoot, nodeName) {
  const paths = getGraphPaths(projectRoot);
  if (!existsSync(paths.graph)) {
    return { success: false, error: '知识图谱不存在' };
  }

  try {
    const output = execFileSync(
      'graphify',
      ['explain', nodeName, '--graph', paths.graph],
      { cwd: projectRoot, stdio: 'pipe', encoding: 'utf-8', timeout: 15000 }
    );
    return { success: true, result: output.trim() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ---- 图谱分析 ----

export function getGraphReport(projectRoot) {
  const paths = getGraphPaths(projectRoot);
  if (!existsSync(paths.report)) return null;
  return readFileSync(paths.report, 'utf-8');
}

export function loadGraph(projectRoot) {
  const paths = getGraphPaths(projectRoot);
  if (!existsSync(paths.graph)) return null;
  return readJson(paths.graph, null);
}

export function getGodNodes(projectRoot, topN = 10) {
  const graph = loadGraph(projectRoot);
  if (!graph || !graph.nodes) return [];
  return graph.nodes
    .filter(n => n.degree > 0)
    .sort((a, b) => (b.degree || 0) - (a.degree || 0))
    .slice(0, topN);
}

export function getCommunities(projectRoot) {
  const graph = loadGraph(projectRoot);
  if (!graph || !graph.nodes) return {};
  const communities = {};
  for (const node of graph.nodes) {
    const cid = node.community ?? 0;
    if (!communities[cid]) communities[cid] = [];
    communities[cid].push(node);
  }
  return communities;
}

// ---- 决策入口 ----

/**
 * 判断当前操作是否需要走 Graphify
 *
 * 规则：
 * 1. enabled=true → 所有 AI 交互都必须走图谱
 * 2. enabled=false + 手动调用 → 也走图谱
 * 3. enabled=false + 自动触发 → 不走图谱
 */
export function shouldUseGraphify(projectRoot, trigger = 'auto') {
  const cfg = loadGraphifyConfig(projectRoot);
  if (cfg.enabled) return true;
  if (trigger === 'manual') return true;
  return false;
}

/**
 * 确保图谱就绪（按需生成）
 */
export function ensureGraphReady(projectRoot, trigger = 'auto') {
  if (!shouldUseGraphify(projectRoot, trigger)) {
    return { ready: false, skipped: true };
  }

  if (hasKnowledgeGraph(projectRoot)) {
    const report = getGraphReport(projectRoot);
    return { ready: true, report };
  }

  const cfg = loadGraphifyConfig(projectRoot);
  if (!cfg.auto_generate && trigger === 'auto') {
    return { ready: false, skipped: true };
  }

  const result = generateGraph(projectRoot);
  if (!result.success) {
    return { ready: false, error: result.error };
  }

  const report = getGraphReport(projectRoot);
  return { ready: true, report, generated: true };
}
