---
name: overview
description: "chaos-harness 系统概览与核心能力介绍,当用户询问框架功能、架构、使用方式时触发"
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

## 核心铁律（v1.4.0 精简为 2 条不可协商）

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | 所有文档必须在版本目录下 |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 完成声明需要实际验证 |

> v1.4.0 设计：原 IL002/IL004/IL005 已移除。少而严 > 多而松。

## 核心 Skills（5 个：聚焦精简）

| Skill | 功能 |
|-------|------|
| **overview** | 系统概览（当前 skill） |
| **gate-manager** | Gate 状态机 + Hooks 自动拦截 |
| **iron-law-enforcer** | 2 条核心铁律执行(IL001/IL003) |
| **dev-intelligence** | Wiki 知识库搜索 + 质量智能建议 |
| **resume** | 会话断点恢复 + 快照管理 |

> **v1.4.0 设计哲学:精而最优,少即是多。** 6 个可选 skills(overdrive/harness-generator/product-manager/java-checkstyle/ui-generator/web-access)已归档,1.4.0 聚焦 Loop+Wiki+Gate 核心能力。

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
            ├── gates/   (5 Gate 状态)
            ├── loop/    (cursor + journal)
            └── wiki/    (patterns + decisions + incidents + sessions)
```

## Gate 状态机（v1.4.0 精简为 5 个）

| Gate | 类型 | Level | 验证器 |
|------|------|-------|--------|
| gate-requirements | stage | hard | file-exists |
| gate-implementation | stage | hard | no-syntax-errors + git-has-commits |
| gate-release | stage | hard | test-suite-pass |
| gate-quality | quality | hard | iron-law-check |
| gate-intelligence | quality | soft | dev-intelligence (Wiki 推荐) |

验证器：`file-exists` `no-syntax-errors` `git-has-commits` `test-suite-pass` `iron-law-check` `lint-check` `script`

## Loop 四帧

| Frame | 何时 | 写入者 |
|-------|------|--------|
| observe | PreToolUse | hook |
| decide  | PreToolUse | hook (基于 Gate 结果) |
| act     | PostToolUse | dispatcher |
| reflect | Stop | hook |

## Wiki 三层晋升（v1.4.0 唯一知识库）

```
observations.jsonl  (raw)         ≥3 次同质 →
patterns/<id>.md    (promoted)    ≥5 次复用 →
decisions/<id>.md   (canonical, iron-law 候选)
```

> v1.4.0：6 个 CSV 知识库已全部迁移为 Wiki 条目（90 条）。
> 搜索引擎统一为纯 Node 的 wiki-search.mjs，删除 Python rank_bm25 依赖。

## 偷懒模式

| ID | 模式 | 严重程度 |
|----|------|---------|
| LP001 | 声称完成但无验证证据 | critical |
| LP002 | 跳过根因分析直接修复 | critical |
| LP003 | 长时间无产出 | warning |
| LP004 | 试图跳过测试 | critical |
| LP007 | Team 阶段主 Agent 代劳 | critical |

## 防绕过

| 借口 | 反驳 |
|------|------|
| "简单修复" | 简单也需要验证 |
| "跳过测试" | 测试是基本验证 |
| "就这一次" | 每次例外都是先例 |
| "应该没问题" | IL003 需要实际验证证据 |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `skills/*/SKILL.md` | 需要了解特定 skill 的详细指引时 |
| `.chaos-harness/state.json` | 查看项目当前状态时 |
| `.chaos-harness/loop/cursor.json` | 查看本会话 loop 位置 |
| `.chaos-harness/loop/journal.jsonl` | 查看 hook 行为流水 |
| `.chaos-harness/wiki/index.md` | Wiki 总目录（唯一知识库） |
| `.chaos-harness/wiki/sessions/last.md` | 上次会话快照 |
