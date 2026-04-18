---
name: iterative-retrieval
description: "4 阶段迭代检索循环 — DISPATCH/EVALUATE/REFINE/LOOP，解决子 Agent 上下文问题。触发词：迭代检索、上下文优化、检索循环、iterative"
license: MIT
version: "1.3.1"
---

# 迭代检索模式（Iterative Retrieval）

## 核心理念

**单次检索往往不够，需要循环精炼。**

子 Agent 的上下文问题不是一次搜索能解决的，而是通过 DISPATCH → EVALUATE → REFINE → LOOP 的迭代过程逐步逼近完整上下文。

## 4 阶段循环

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌──────────┐      ┌──────────┐            │
│   │ DISPATCH │─────▶│ EVALUATE │            │
│   └──────────┘      └──────────┘            │
│        ▲                  │                 │
│        │                  ▼                 │
│   ┌──────────┐      ┌──────────┐            │
│   │   LOOP   │◀─────│  REFINE  │            │
│   └──────────┘      └──────────┘            │
│                                             │
│        最多 3 个循环，然后继续               │
└─────────────────────────────────────────────┘
```

### 阶段 1：DISPATCH — 初始广泛查询
- 从高层意图开始
- 使用关键字和文件模式匹配
- 尽可能广地搜索

### 阶段 2：EVALUATE — 评估检索内容
相关性评分（0-1 刻度）：
- **高（0.8-1.0）**：直接实现目标功能
- **中（0.5-0.7）**：包含相关模式或类型
- **低（0.2-0.4）**：间接相关
- **无（0-0.2）**：不相关，排除

识别缺失上下文（测试文件、类型定义、导入语句等）。

### 阶段 3：REFINE — 基于评估更新搜索标准
- 新增在高相关性文件中发现的模式
- 新增在代码库中频繁出现的术语
- 排除确认不相关的路径

### 阶段 4：LOOP — 以精炼标准重复（最多 3 次循环）

退出条件：
- 达到 3 次循环上限
- 找到 5+ 个高相关性文件
- 无缺失上下文且有 2+ 高相关性文件

## 与 Agent Team 集成

多 Agent 并行检索：

```
检索 Agent（Haiku） → 候选文件列表
评估 Agent（Sonnet） → 相关性评分 + 缺失上下文
精炼 Agent（Sonnet） → 更新搜索标准
```

## 命令

| 命令 | 描述 |
|------|------|
| `/iterative-retrieval dispatch <intent>` | 启动检索循环 |
| `/iterative-retrieval status` | 查看当前检索状态 |
| `/iterative-retrieval reset` | 重置检索状态 |

## 数据存储

```
.chaos-harness/
└── retrieval-state.json    # 检索循环状态
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `.chaos-harness/retrieval-state.json` | 需要查看检索循环状态时 |
| `scripts/iterative-retrieval.mjs` | 需要执行检索循环时 |
| `skills/agent-team-orchestrator/SKILL.md` | 需要多 Agent 并行检索时 |
