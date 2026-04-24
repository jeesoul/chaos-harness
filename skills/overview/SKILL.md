---
name: overview
description: "Chaos Harness 系统概览。当用户明确询问 chaos-harness 功能时使用。"
license: MIT
version: "1.3.2"
---

# Chaos Harness v1.3.2 Gate

> 运筹帷幄，决胜千里；以智御局，以律治心。
> **Chaos demands order. Harness provides it.**

## 核心铁律（不可协商）

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | 所有文档必须在版本目录下 |
| IL002 | NO HARNESS WITHOUT SCAN RESULTS | Harness 需要项目扫描数据 |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 完成声明需要实际验证 |
| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT | 版本变更需要用户确认 |
| IL005 | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL | 敏感配置修改需要批准 |

## 可用 Skills（15 个）

| Skill | 触发词 | 功能 |
|-------|--------|------|
| iron-law-enforcer | 铁律、约束、违规 | 始终激活 |
| gate-manager | Gate、阶段、验证、过渡 | Gate 状态机管理 |
| project-scanner | 扫描项目、分析项目、项目类型 | 项目类型/技术栈/目录/依赖扫描 |
| dev-intelligence | 分析项目、质量检查、Gate 配置 | BM25 搜索引擎 + 知识库 |
| harness-generator | 生成Harness、创建约束 | 基于扫描生成铁律配置 |
| version-locker | 版本、锁定 | 版本管理和锁定 |
| hooks-manager | 钩子、hooks | 查看钩子状态 |
| project-state | 继续、恢复 | 会话持久化 |
| java-checkstyle | Java 项目 | Java 代码规范 |
| ui-generator | 生成界面、UI 生成 | 从 PRD 生成可运行的前端界面 |
| ui-ux-intelligence | 设计、UI、UX、配色、字体、排版 | 161 色板、50 风格、57 字体、60 组件、40 动画、50 UX 指南 |
| web-access | 搜索、网页、CDP | 联网操作与浏览器自动化 |
| overdrive | 紧急、超频、立刻解决 | 最高优先级、全速运行 |
| product-manager | 需求分析、竞品分析、Kano | 产品经理工作助手 |
| overview | chaos-harness | 系统概览（当前 skill） |

## Gate 状态机

11 Gates（6 stage + 5 quality），10 种验证器：
- `file-exists` `project-scan` `git-has-commits` `no-syntax-errors` `test-suite-pass` `lint-check` `iron-law-check` `ui-quality-check` `prd-quality-check` `script`

## 防绕过

## 铁律检查表

| 借口 | 反驳 |
|------|------|
| "简单修复" | 简单也需要验证 |
| "跳过测试" | 测试是基本验证 |
| "就这一次" | 每次例外都是先例 |
| "老项目" | 老项目更需要约束 |
| "我已经了解项目结构" | 主观了解不够，需要扫描数据确认。使用 `/project-scanner` 快速扫描 |

## 偷懒模式

| ID | 模式 | 严重程度 |
|----|------|---------|
| LP001 | 声称完成但无验证证据 | critical |
| LP002 | 跳过根因分析直接修复 | critical |
| LP003 | 长时间无产出 | warning |
| LP004 | 试图跳过测试 | critical |
| LP005 | 擅自更改版本号 | critical |
| LP006 | 自动处理高风险配置 | critical |
| LP007 | Team 阶段主 Agent 代劳 | critical |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `skills/*/SKILL.md` | 需要了解特定 skill 的详细指引时 |
| `.chaos-harness/state.json` | 查看项目当前状态时 |
| `CLAUDE.md` | 查看项目完整上下文时 |
