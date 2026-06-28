---
name: dev-intelligence
description: 开发质量智能引擎 — BM25 搜索 Gate 模式/铁律/测试策略/反模式/UI 自动化/PRD 质量。触发词：分析项目、质量检查、Gate 配置、测试策略、反模式、PRD 质量、智能建议
---

# Dev-Intelligence

## 概述

基于结构化知识库 + BM25 检索的开发质量智能引擎，为 PM/QA/Dev 角色提供数据驱动的决策建议。

## 能力模块

### 模块 1: 知识搜索

搜索 6 个知识域：

| 领域 | 内容 |
|------|------|
| gate-patterns | Gate 模式库：阶段/验证器/依赖/级别 |
| iron-law-rules | 铁律规则库：检测信号/严重程度/修复 |
| test-patterns | 测试模式库：技术栈/框架/命令/阈值 |
| anti-patterns | 反模式库：偷懒模式/常见错误/Do/Don't |
| ui-patterns | UI 自动化模式：组件/选择器/断言 |
| prd-quality-rules | PRD 质量规则：检查项/级别/示例 |

### 模块 2: Gate 生成

根据阶段 + 技术栈自动生成 Gate 配置。

### 模块 3: 决策持久化

跨会话保存和恢复 PM/QA 决策。

## 快捷命令

| 你说 | 动作 |
|------|------|
| "搜索 Gate 模式" | 搜索 gate-patterns 域 |
| "PRD 质量怎么检查" | 搜索 prd-quality-rules 域 |
| "Vue 项目怎么测试" | 搜索 test-patterns 域 |
| "跳过测试有什么问题" | 搜索 anti-patterns 域 |
| "帮我生成测试 Gate" | generate-gate 命令 |
| "保存这个决策" | persist 命令 |
| "恢复上次决策" | restore 命令 |

## 技术栈适配

| 技术栈 | 测试框架 | 覆盖率工具 | UI 测试 |
|--------|---------|-----------|--------|
| Vue | vitest, jest | v8 | playwright |
| React | jest, vitest | istanbul | playwright |
| Spring Boot | junit, mockito | jacoco | selenium |
| FastAPI | pytest, httpx | coverage.py | playwright |
| 通用 | vitest, jest, pytest | auto-detect | playwright |
