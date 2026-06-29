---
id: dec-afa88a
type: decision
title: v1.4.0大版本简化决策
tags: [v1.4.0, simplify, architecture, decision]
links: []
sources: []
created: "2026-06-29T03:52:15.159Z"
updated: "2026-06-29T03:52:15.160Z"
confidence: 0.9
status: promoted
---

# v1.4.0 大版本简化决策

## 背景

v1.3.2 累积了 15 Skills、10 Gates、5 铁律、6 CSV 知识库、Python + Node 两套搜索。
功能堆叠导致定位模糊、维护成本高、绕过空间大。

## 决策

v1.4.0 在引入 Loop + Wiki + Resume 三大能力的同时，做减法：

| 维度 | v1.3.2 | v1.4.0 | 理由 |
|------|--------|--------|------|
| Skills | 15 | 11 | hooks-manager→gate-manager；project-state→resume；version-locker→iron-law-enforcer；project-scanner→harness-generator |
| Gates | 10 | 5 | W01/W03→requirements；W08/W09→implementation；W10/W12→release；quality 合并 |
| 铁律 | 5 | 2 | 保留 IL001（版本化）+ IL003（验证）；删 IL002/IL004/IL005 |
| 知识库 | 6 CSV | Wiki（90 条迁移） | CSV 是死的，Wiki 可寻址/可链接/可演化 |
| 搜索 | Python BM25 | 纯 Node wiki-search | 去除 Python 依赖 |
| PostToolUse | 4 hook | 1 dispatcher | 性能 + 可维护 |

## 理由

**少即是多。** 2 条能严格执行的铁律 > 5 条被频繁绕过的铁律。
- IL002（扫描）→ 变成 gate-requirements 自动前置
- IL004（版本变更确认）→ Loop snapshot 已记录全部变更
- IL005（敏感配置）→ 与 IL001 本质重合（版本化即审计轨迹）

## 影响

- 破坏 v1.3.2 兼容（已 tag v1.3.2 可回退）
- 评测 116/116 全通过，无功能退化
- 知识库统一为 Wiki，支持三层晋升（observations → patterns → decisions）

参见 [[dec-37b296]]（IL003 完成验证规则）。