<div align="center">

# Chaos Harness

**AI 编码 Agent 的确定性约束框架**

_Constraints as code, not prompts_

[![version](https://img.shields.io/badge/version-1.4.0-blueviolet.svg)](https://github.com/jeesoul/chaos-harness)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![tests](https://img.shields.io/badge/tests-116%2F116%20passing-success.svg)](evals/v1.4.0-eval-report.md)
[![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#安装)
[![node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org)

**循环可断点 · Wiki 可寻址 · 混沌可恢复**

[快速开始](#快速开始) · [核心概念](#核心概念) · [技能矩阵](#技能矩阵) · [命令速查](#命令速查) · [English](README.md)

</div>

---

## 为什么需要 Chaos Harness

AI 编码 agent 本质上是非确定性的——会跳过验证、绕过约束、无证据声称完成。自然语言提示词只是**软建议**，总有语义博弈空间。

Chaos Harness 把约束编码为 **Gate 状态机**，由 Claude Code 钩子强制执行。约束是代码，不是建议。没有灰色地带可辩。

| 原则 | 含义 |
|------|------|
| **确定性** | Gate 要么硬阻断（`exit 1`）要么软警告（`exit 0`），每个行为可追溯 |
| **可恢复** | 四帧循环 + WAL 日志，断电也不会丢失进度 |
| **记忆驱动** | 可寻址、可链接、可演化的 Wiki 取代扁平配置文件 |
| **极简主义** | 2 条铁律、5 个 Gate、5 个技能——少而严胜过多而松 |

## 架构

```
┌──────────────────────────────────────────────────────────────┐
│  Claude Code  ·  自然语言 / 斜杠命令 / 工具调用                  │
└───────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────┐
│  钩子 (hooks.json) — 自动拦截                                     │
│  SessionStart → PreToolUse → PostToolUse → Stop → PreCompact     │
└────────────────┬────────────────────────────────┬───────────────┘
                 │                                 │
      ┌──────────▼────────┐              ┌────────▼────────┐
      │  Gate 状态机        │              │  Loop 引擎      │
      │  ├ 5 Gates         │              │  observe        │
      │  ├ 硬阻/软警告      │              │  decide         │
      │  └ 可追溯           │              │  act            │
      └────────┬────────────┘              │  reflect        │
               │                           └────────┬────────┘
      ┌────────▼────────────────────────────────────▼───────┐
      │  Project Wiki (可寻址记忆)                            │
      │  ├ 90+ 条目 (决策/模式/工作流)                        │
      │  ├ 双向链接 + 快照                                     │
      │  └ 纯 Node 搜索引擎                                   │
      └──────────────────────────────────────────────────────┘
```

**三大支柱：**
- **Gate 状态机** — 约束即代码，5 个 Gate（doc-in-version、completion-evidence、critical-file-change、critical-command、code-deletion），硬阻/软警，行为可追溯
- **Loop 引擎** — observe→decide→act→reflect 四帧循环 + WAL 日志，断点续作
- **Project Wiki** — 90+ 可寻址条目（决策/模式/工作流），双向链接，纯 Node 搜索

**两条铁律：**
- **IL001**: 文档必须在版本目录下
- **IL003**: 完成声明必须附验证证据

## 快速开始

```bash
# 远程安装
claude plugins marketplace add github:jeesoul/chaos-harness
claude plugins install chaos-harness@chaos-harness

# 本地开发
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness
```

无需手动编辑 `settings.json`——技能与钩子自动加载。

> **首次运行**: SessionStart hooks 会自动创建 `.chaos-harness/` 目录
> (loop/, wiki/, gates/)，无需手动配置。
>
> **Windows 用户**: 脚本自动探测 Git(PATH/Program Files/Scoop/Chocolatey/WSL),
> 非 ASCII 路径会被拒绝并提示清晰的错误。

### 从 v1.3.x 升级

如果你已安装**旧版本**:

```bash
# 1. 进入本地 chaos-harness 目录
cd /path/to/chaos-harness

# 2. 备份自定义配置(如果你修改过这些)
cp -r .chaos-harness/wiki/decisions ~/.chaos-harness-backup/ 2>/dev/null || true

# 3. 卸载旧版本
claude plugins uninstall chaos-harness

# 4. 拉取最新代码
git fetch origin
git checkout main
git pull origin main

# 5. 重新安装
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# 6. 重启 Claude Code 以加载新 hooks
```

**v1.4.0 主要变化:**
- Skills: 11 个 → **5 个核心**(overdrive/product-manager/java-checkstyle/ui-generator/web-access/harness-generator 已归档)
- 铁律: 5 条 → **2 条**(仅保留 IL001/IL003)
- Gates: 10 个 → **5 个**
- 新增: **Loop 引擎**(四帧循环 + WAL)、**Project Wiki**(可寻址模式)、**Resume**(中断恢复)
- 移除: Python/BM25 依赖(纯 Node.js)

> **数据迁移**: 旧的 `.chaos-harness/` 目录兼容,v1.4.0 首次运行时会自动迁移。

### 卸载

```bash
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness
```

## 核心概念

### Gate 状态机

5 个 Gate 定义工作流关卡，由 `PostToolUse` 钩子在每个工具调用后自动检查：

| ID | Gate | 触发条件 | 策略 |
|----|------|---------|------|
| G001 | doc-in-version | 写文档到非版本目录 | hard-block |
| G002 | completion-evidence | 声称完成但无证据 | soft-warn |
| G003 | critical-file-change | 修改关键文件未说明 | soft-warn |
| G004 | critical-command | 运行危险命令未确认 | soft-warn |
| G005 | code-deletion | 大量删除代码未记录 | soft-warn |

**策略：**
- `hard-block` → 立即终止会话（`exit 1`）
- `soft-warn` → 警告但继续（`exit 0`），记录到状态日志

**管理命令：**
```bash
/gate-manager status           # Gate 仪表板
/gate-manager recheck G002     # 重新验证某个 gate
/gate-manager override G003 --reason "hotfix紧急修复"  # 临时绕过软 gate
```

### Loop 引擎

四帧循环（observe→decide→act→reflect）+ WAL 日志，支持断点续作：

```bash
node scripts/loop-engine.mjs status    # 查看当前帧 + 最近 5 帧快照
node scripts/loop-engine.mjs advance   # 手动推进到下一帧
```

**帧结构：**
- **observe** — 收集上下文（git diff、test output、gate 状态）
- **decide** — 确定下一步行动
- **act** — 执行操作（写代码、跑测试）
- **reflect** — 回顾结果，记录教训

每帧写入 `.chaos-harness/loop/journal.jsonl`（WAL），断电后用 `/resume` 恢复。

### Project Wiki

90+ 可寻址条目（决策/模式/工作流），取代扁平配置：

```bash
node scripts/wiki-search.mjs query "测试策略"   # 纯 Node 搜索
/chaos-harness:dev-intelligence                # AI 驱动的知识推荐
```

**条目类型：**
- **decisions/** — 架构决策（dec-xxx）
- **patterns/** — 最佳实践（pat-xxx）
- **workflows/** — 标准流程（wf-xxx）

双向链接示例：`[[dec-afa88a-v1-4-0]]` 自动解析为超链接，backlinks 自动生成。

### Resume 引擎

检测会话中断（断电/崩溃/网络），提供恢复提示：

```bash
/resume      # 自动检测中断点，打印恢复步骤
node scripts/resume.mjs   # CLI 版本
```

**恢复逻辑：**
1. 读取 `.chaos-harness/loop/cursor.json`（最后帧）
2. 扫描 `journal.jsonl`（未完成的 act）
3. 提示用户从中断点继续

### 铁律（Iron Laws）

2 条硬约束，由 `iron-law-enforcer` 技能强制执行：

| ID | 铁律 | 检查时机 |
|----|------|---------|
| IL001 | 文档必须在版本目录下 | 写 `.md` 文件时 |
| IL003 | 完成声明必须附验证证据 | Agent 声称"完成"时 |

**示例：**
- ❌ `docs/api.md` → 违反 IL001（应为 `docs/v1.4.0/api.md`）
- ❌ "功能已完成" → 违反 IL003（需附 test output / screenshot）
- ✅ "功能已完成，测试通过：`npm test` 116/116 ✓"

## 技能矩阵

5 个核心技能 — 聚焦精简。通过斜杠命令或自然语言触发。

| 技能 | 触发词 | 用途 |
|------|--------|------|
| `overview` | chaos-harness | 系统概览 + 入口 |
| `gate-manager` | gate, stage, hooks | Gate 状态机 + hooks 管理 |
| `iron-law-enforcer` | iron law, version, lock | 铁律执行(IL001/IL003) |
| `dev-intelligence` | search, knowledge | Wiki 搜索引擎（纯 Node） |
| `resume` | resume, continue | 会话中断恢复 + 快照 |

## 命令速查

| 命令 | 作用 |
|------|------|
| `/chaos-harness:overview` | 系统概览 |
| `/gate-manager status` | Gate 仪表板 |
| `/gate-manager recheck <id>` | 重新验证某个 gate |
| `/gate-manager transition <stage>` | 推进工作流阶段 |
| `/gate-manager override <id> --reason "..."` | 绕过软 gate |
| `/resume` | 检测中断 + 打印恢复提示 |
| `/chaos-harness:dev-intelligence` | Wiki 搜索 + 推荐 |
| `/chaos-harness:iron-law-enforcer` | 铁律检查与历史 |

### CLI

```bash
node scripts/gate-machine.mjs --status        # gate 仪表板
node scripts/loop-engine.mjs status           # loop 光标 + 最近帧
node scripts/wiki-search.mjs query "<关键词>"  # 搜索 wiki
node scripts/resume.mjs                        # 检查中断
node scripts/wiki-indexer.mjs build           # 重建索引 + backlinks
```

## 1.4.0 新特性

v1.4.0 是大版本：新增 Loop/Wiki/Resume 引擎，同时**大幅简化**核心。

| 维度 | v1.3.2 | v1.4.0 | 变化 |
|------|--------|--------|------|
| 技能数 | 15 | 11 | −27% |
| Gate 数 | 10 | 5 | −50% |
| 铁律数 | 5 | 2 | −60% |
| 知识库 | 6 个 CSV 文件 | Wiki（90 条目） | 统一可寻址 |
| 搜索引擎 | Python BM25 + Node 降级 | 纯 Node | 零 Python 依赖 |
| PostToolUse 钩子 | 4 个独立钩子 | 1 个分发器 | −75% |

**新增能力：** Loop 引擎（四帧循环 + WAL）、Project Wiki（可寻址记忆 + 双向链接）、Resume 引擎（断电恢复）。

## 安装

```bash
# 远程
claude plugins marketplace add github:jeesoul/chaos-harness
claude plugins install chaos-harness@chaos-harness

# 本地
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness
```
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness
```

无需手动编辑 `settings.json`——技能和钩子自动加载。

### 卸载

```bash
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness
```

## 测试

```bash
node scripts/sp-test-runner.mjs          # 单元自测
node scripts/eval-runner-v140.mjs        # 能力 evals
node scripts/eval-runner-regression.mjs  # 回归 evals
node tests/test-v140-integration.mjs     # 集成测试
```

当前状态：**116/116 通过**（自测 78、能力 13、回归 12、集成 13）。详见 [evals/v1.4.0-eval-report.md](evals/v1.4.0-eval-report.md)。

## 版本历史

| 版本 | 亮点 |
|------|------|
| **1.4.0 Loop & Wiki** | Loop 引擎 · Project Wiki · Resume 引擎 · 跨平台安装器 · **大版本简化**（技能 15→5、gates 10→5、铁律 5→2、CSV→Wiki、零 Python） |
| 1.3.2 Gate | Gate 状态机 · 10 gates · BM25 引擎 · 6 个 CSV 知识库 |
| 1.3.1 | 持续学习 2.0 · eval 驱动 · schema 工作流 |
| 1.3.0 | Overdrive 模式 · 多 agent 评审 |
| 1.2.0 | 自学习循环 · agent-team 铁律 · CDP 浏览器 |
| 1.0.0 | 核心框架：技能 + 钩子 |

## 协议

[MIT](LICENSE)

---

<div align="center">

**Loops persist · Wiki remembers · Chaos resumes**

[English](README.md) · [使用指南](USAGE.md) · [Issues](https://github.com/jeesoul/chaos-harness/issues)

</div>
