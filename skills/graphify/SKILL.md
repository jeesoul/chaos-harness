---
name: graphify
description: Generate, query, and manage project knowledge graph powered by Graphify
trigger_words:
  - graphify
  - knowledge graph
  - 知识图谱
  - 项目结构
  - 依赖分析
  - god nodes
  - community
---

# Graphify Manager

管理项目知识图谱 — 基于 Graphify 的 AST 提取 + Leiden 社区检测 + 交互式可视化。

## 前置条件

需要安装 Graphify: `pip install graphifyy`

## Commands

### /chaos-harness:graphify generate [--force]

生成项目知识图谱（全量扫描）。

Run: `node <plugin-root>/scripts/graphify-init.mjs`

如果图谱已存在，跳过生成。加 `--force` 强制重新生成。

### /chaos-harness:graphify status

查看知识图谱状态和配置。

Read: `<project-root>/.chaos-harness/graphify-config.json`
Read: `<project-root>/graphify-out/GRAPH_REPORT.md`

### /chaos-harness:graphify enable

开启强制模式 — 所有 AI 交互都必须先查询知识图谱。

修改 `<project-root>/.chaos-harness/graphify-config.json` 中 `enabled: true`。

### /chaos-harness:graphify disable

关闭强制模式 — 仅手动调用时使用知识图谱。

修改 `<project-root>/.chaos-harness/graphify-config.json` 中 `enabled: false`。

### /chaos-harness:graphify query "<question>"

查询知识图谱。

Run: `graphify query "<question>" --graph <project-root>/graphify-out/graph.json`

### /chaos-harness:graphify path "<nodeA>" "<nodeB>"

查找两个节点之间的最短路径。

Run: `graphify path "<nodeA>" "<nodeB>" --graph <project-root>/graphify-out/graph.json`

### /chaos-harness:graphify explain "<node>"

解释某个节点及其邻居关系。

Run: `graphify explain "<node>" --graph <project-root>/graphify-out/graph.json`

### /chaos-harness:graphify update

增量更新知识图谱（仅代码文件变更，无需 LLM）。

Run: `graphify update <project-root>`

### /chaos-harness:graphify visualize

打开交互式可视化图谱。

Open: `<project-root>/graphify-out/graph.html`

## 配置说明

配置文件: `<project-root>/.chaos-harness/graphify-config.json`

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `enabled` | `false` | 开启后所有 AI 交互都必须先查询知识图谱 |
| `auto_generate` | `true` | SessionStart 时自动生成知识图谱（如果不存在） |
| `auto_update` | `true` | 代码变更后自动增量更新知识图谱 |
| `query_before_action` | `true` | Write/Edit 前自动查询图谱获取上下文 |
| `token_budget` | `2000` | 图谱查询时的 token 预算上限 |

## 行为规则

### enabled=true（强制模式）

1. **SessionStart**: 自动检查图谱，不存在则生成
2. **PreToolUse (Write/Edit)**: 自动查询图谱，注入上下文到 AI
3. **PostToolUse (Write/Edit)**: 自动增量更新图谱
4. **所有 AI 交互**: 必须先读取 GRAPH_REPORT.md 了解项目结构

### enabled=false（手动模式）

1. **SessionStart**: 仅提示图谱状态，不强制生成
2. **PreToolUse**: 不注入图谱上下文
3. **PostToolUse**: 不自动更新
4. **手动调用**: `/chaos-harness:graphify query` 等命令仍然可用
5. **自动触发**: 如果其他模块（如 impact-analyzer）需要图谱，会自动生成

## 输出文件

| 文件 | 说明 |
|------|------|
| `graphify-out/graph.json` | 知识图谱（JSON，机器可读） |
| `graphify-out/GRAPH_REPORT.md` | 分析报告（God nodes、社区、意外依赖） |
| `graphify-out/graph.html` | 交互式可视化（浏览器打开） |
| `graphify-out/cache/` | SHA256 缓存（增量更新用） |
