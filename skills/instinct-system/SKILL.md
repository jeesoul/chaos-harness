---
name: instinct-system
description: "直觉系统 — 原子本能 CRUD、置信度演进、导出/导入、聚类。触发词：直觉、本能、置信度、instinct"
license: MIT
version: "1.3.1"
---

# 直觉系统 (Instinct System)

## 核心理念

**直觉是原子化的学习单元** — 每次观测记录一个行为模式，随置信度演进而成长。

## 直觉模型

直觉 = 触发器 + 动作 + 置信度 + 证据链

```yaml
id: inst_001
type: iron_law_violation
pattern: "写入非版本目录文件"
context:
  tool: Write
  file_pattern: "*.md"
  violation: IL001
confidence: 0.85
occurrences: 12
status: active
```

## 直觉类型

| 类型 | 说明 | 确认要求 |
|------|------|---------|
| iron_law_violation | 铁律违规模式 | 必须确认 |
| workflow_optimization | 工作流优化模式 | 自动应用 |
| code_pattern | 代码模式偏好 | 自动应用 |
| agent_coordination | Agent 协调模式 | 必须确认 |

## 置信度演进

| 分数 | 意义 | 行为 |
|------|------|------|
| 0.3 | 试探性 | 记录观察 |
| 0.5 | 中等 | 建议但不强制 |
| 0.7 | 强烈 | 铁律类强制确认 / 工作流类自动应用 |
| 0.9 | 近乎确定 | 铁律类自动阻断 |

**置信度增加当**:
- 重复观察到模式（每次 +0.05）
- 用户不修正建议行为

**置信度减少当**:
- 用户明确修正行为
- 长期未观察到模式（衰减率 0.05/周）

## 命令

| 命令 | 描述 |
|------|------|
| `/instinct-system status` | 显示所有直觉及其置信度 |
| `/instinct-system list [type] [minConfidence]` | 列出直觉 |
| `/instinct-system export --output=file.json` | 导出直觉（自动脱敏） |
| `/instinct-system import --input=file.json [--merge\|--overwrite]` | 导入直觉 |
| `/instinct-system cluster` | 聚类分析 |
| `/instinct-system repair` | 从备份恢复 |

## 数据存储

```
instincts/
├── instincts.json           # 主数据文件
├── instincts.json.bak       # 自动备份
├── observations.jsonl       # 观测日志
└── clusters/                # 聚类结果
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `instincts/instincts.json` | 查看当前直觉数据时 |
| `scripts/instinct-utils.mjs` | 手动执行直觉操作时 |
| `scripts/instinct-collector.mjs` | 查看 Hook 采集逻辑时 |
| `skills/adaptive-harness/SKILL.md` | 了解混合演进策略时 |
