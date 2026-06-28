---
name: overview
description: "Chaos Harness 系统概览。当用户明确询问 chaos-harness 功能时使用。"
license: MIT
version: "1.4.0"
---

# Chaos Harness v1.4.0 — Loop & Wiki

> 运筹帷幄，决胜千里；以智御局，以律治心。
> **Loops persist. Wiki remembers. Chaos resumes.**

## v1.4.0 新增能力

| 能力 | 说明 |
|------|------|
| **Loop Engine** | 四帧循环 observe→decide→act→reflect，原子 cursor + WAL journal |
| **Project Wiki** | Karpathy 式可寻址记忆：patterns / decisions / incidents / sessions |
| **Resume Engine** | 断电/中断后可精准恢复，SessionStart 自动提示上次进度 |
| **Skill 瘦身** | 15 → 12（含 shared）。`hooks-manager` 合并进 gate-manager，`project-state` 改造为 resume，`project-scanner` 并入 harness-generator |
| **Hook 单一分发** | PostToolUse 4 个 hook 合并为 `post-write-dispatcher`，5 秒 debounce |
| **跨平台安装** | `scripts/install.mjs` 统一入口 + `git-detector` 探测 Windows 下含空格 Git 路径 |

## 核心铁律（不可协商）

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | 所有文档必须在版本目录下 |
| IL002 | NO HARNESS WITHOUT SCAN RESULTS | Harness 需要项目扫描数据 |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 完成声明需要实际验证 |
| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT | 版本变更需要用户确认 |
| IL005 | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL | 敏感配置修改需要批准 |

## 可用 Skills（12 个）

| Skill | 触发词 | 功能 |
|-------|--------|------|
| iron-law-enforcer | 铁律、约束、违规 | 始终激活 |
| gate-manager | Gate、阶段、钩子、hooks | **v1.4 合并：Gate 状态机 + Hooks 管理** |
| dev-intelligence | 分析项目、质量检查、Gate 配置 | BM25 + Wiki 搜索 |
| harness-generator | 生成 Harness、创建约束、扫描项目 | **v1.4 合并：扫描 + 约束生成** |
| version-locker | 版本、锁定 | 版本管理（IL001） |
| resume | 继续、恢复、上次进度 | **v1.4 新：断电恢复 + 会话快照** |
| overdrive | 紧急、超频、立刻解决 | 最高优先级 |
| overview | chaos-harness | 系统概览（当前 skill） |
| product-manager | 需求分析、PRD、Kano | 产品经理 |
| java-checkstyle | Java 项目 | Java 代码规范 |
| ui-generator | 生成界面、UI 生成 | PRD → 前端 |
| web-access | 搜索、网页、CDP | 联网与浏览器 |

## 三层架构

```
用户 / Claude Code
        │
   ┌────┴────┐
   │ Hooks   │── SessionStart → resume → gate-machine
   │ (统一)  │── PreToolUse  → loop observe → iron-law → loop decide
   │         │── PostToolUse → post-write-dispatcher (5 子任务 + loop act)
   │         │── Stop        → loop reflect → snapshot → laziness-detect
   │         │── PreCompact  → snapshot (compacted)
   └────┬────┘
        │
   ┌────┴────┬─────────┬─────────┐
   ▼         ▼         ▼         ▼
Gate     Loop      Wiki      Iron-Law
状态机   Engine    Indexer   Enforcer
   │      │         │         │
   └──────┴────.chaos-harness/────────┘
            ├── gates/   (Gate 状态)
            ├── loop/    (cursor + journal)
            └── wiki/    (patterns + decisions + incidents + sessions)
```

## Gate 状态机

10 Gates（6 stage + 4 quality），7 种验证器：
`file-exists` `project-scan` `git-has-commits` `no-syntax-errors` `test-suite-pass` `lint-check` `iron-law-check`

## Loop 四帧

| Frame | 何时 | 写入者 |
|-------|------|--------|
| observe | PreToolUse | hook |
| decide  | PreToolUse | hook (基于 Gate 结果) |
| act     | PostToolUse | dispatcher |
| reflect | Stop | hook |

## Wiki 三层晋升

```
observations.jsonl  (raw)         ≥3 次同质 → 
patterns/<id>.md    (promoted)    ≥5 次复用 → 
iron-law-rules.csv  (canonical)
```

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

## 防绕过

| 借口 | 反驳 |
|------|------|
| "简单修复" | 简单也需要验证 |
| "跳过测试" | 测试是基本验证 |
| "就这一次" | 每次例外都是先例 |
| "老项目" | 老项目更需要约束 |
| "我已经了解项目结构" | 主观了解不够，需要扫描数据确认。使用 harness-generator 扫描 |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `skills/*/SKILL.md` | 需要了解特定 skill 的详细指引时 |
| `.chaos-harness/state.json` | 查看项目当前状态时 |
| `.chaos-harness/loop/cursor.json` | 查看本会话 loop 位置 |
| `.chaos-harness/loop/journal.jsonl` | 查看 hook 行为流水 |
| `.chaos-harness/wiki/index.md` | Wiki 总目录 |
| `.chaos-harness/wiki/sessions/last.md` | 上次会话快照 |
| `CLAUDE.md` | 查看项目完整上下文 |
