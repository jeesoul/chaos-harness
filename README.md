# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.4.0--Loop%26Wiki-blueviolet.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
  <img src="https://img.shields.io/badge/tests-82%2F82%20%2B%2013%2F13-success.svg">
</p>

<p align="center"><strong>Gate 状态机 + Loop Engine + Project Wiki — AI 开发流程操作系统</strong></p>
<p align="center"><em>v1.4.0 Loop & Wiki — Loops persist. Wiki remembers. Chaos resumes.</em></p>

---

## v1.4.0 新能力一句话总结

| 能力 | 一句话 |
|------|--------|
| **Loop Engine** | 把 hooks 链升级为 observe→decide→act→reflect 四帧循环，cursor + WAL 持久化 |
| **Project Wiki** | Karpathy 式可寻址记忆，patterns / decisions / incidents / sessions 自动双向链接 |
| **Resume Engine** | 断电/重启后自动检测中断点，SessionStart 输出可读 resume 提示 |
| **统一安装** | `scripts/install.mjs` 跨平台入口，自动探测 Windows 含空格 Git 路径 |
| **Skill 精简** | 15 → 12，PostToolUse 4 hook → 1 dispatcher |

## 一句话定位

> 用 Gate 状态机给 AI 开发流程立规矩，让每一步操作都经过验证。

## 核心问题

AI Agent 辅助开发的核心问题是非确定性——跳过验证、绕过约束、幻觉式交付。自然语言提示词是软性建议，存在语义博弈空间。

Chaos Harness 将约束编码为 **Gate 状态机**——通过 Gate 分级执行 + Hooks 自动拦截 + 知识库数据驱动，消除灰色地带。

### 三大特性

| 特性 | 说明 |
|------|------|
| **确定性** | Gate 分级执行（hard 阻断 / soft 警告），行为路径可追溯 |
| **数据驱动** | 6 个 CSV 知识库 + BM25 检索，Gate/铁律/测试/反模式全覆盖 |
| **可进化** | 自学习闭环：行为追踪 → 模式聚类 → 规则优化 → 阈值调整 |

---

## 架构总览

```
用户交互 (自然语言 / CLI / Slash Command)
         │
         ▼
┌─────────────────────────────────────────┐
│  Hooks 自动拦截 (hooks.json)             │
│  SessionStart → PreToolUse → PostToolUse │
│  → Stop → PreCompact                     │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌─────────┐ ┌──────────────┐
│ Gate    │ │ Dev-Intelligence│
│ 状态机  │ │ BM25 搜索引擎  │
│ 15 Gates│ │ 6 个 CSV 知识库 │
└─────────┘ └──────────────┘
    │             │
    ▼             ▼
┌─────────────────────────────┐
│ 13 Skills · 28 Scripts      │
│ 6 验证器 · 5 技术栈适配      │
└─────────────────────────────┘
```

### 文件结构

```
chaos-harness/
├── skills/              # 13 个 Skill（能力入口）
│   ├── gate-manager/    # Gate 状态机交互
│   ├── dev-intelligence/# 智能建议引擎（BM25 搜索）
│   ├── iron-law-enforcer/
│   ├── overdrive/       # 超频模式
│   ├── product-manager/
│   └── ...
├── scripts/             # 28 个脚本（执行引擎）
│   ├── gate-machine.mjs     # 阶段状态机
│   ├── gate-enforcer.mjs    # Gate 执行器
│   ├── gate-recovery.mjs    # 失败恢复
│   ├── gate-validator.mjs   # 验证器调度
│   ├── dev-intelligence.mjs # CLI 入口
│   ├── search.py            # BM25 搜索引擎
│   └── ...
├── hooks/               # hooks.json（自动拦截配置）
├── data/                # 6 个 CSV 知识库
├── stacks/              # 5 个技术栈配置
├── tests/               # 测试文件
├── commands/            # 27 个 Slash 命令
├── instincts/           # 本能系统（直觉观察）
└── .chaos-harness/      # 运行时状态
    ├── gates/           # Gate 定义 + 状态
    └── state.json       # 会话状态
```

> **无需手动配置 settings.json！** 插件安装后，Skills 和 Hooks（hooks.json）会被 Claude Code 插件系统自动加载。

### 卸载

```bash
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness
```

### 升级

**当前版本：v1.4.0 Loop & Wiki**

```bash
# 1. 切换到 v1.4.0 分支并拉取最新代码
cd /path/to/chaos-harness
git checkout v1.4.0-loop-wiki

# 2. 重新注册 marketplace
claude plugins marketplace remove chaos-harness
claude plugins marketplace add "/path/to/chaos-harness"

# 3. 重装
claude plugins uninstall chaos-harness@chaos-harness
claude plugins install chaos-harness@chaos-harness

# 4. 验证（v1.4.0 跨平台统一入口）
node scripts/install.mjs
# 或者：
bash install.sh    # Linux/macOS / Git Bash
install.bat        # Windows cmd
```

> **注意：** 所有迭代在 `v1.4.0-loop-wiki` 分支进行。

### 版本历史

| 版本 | 主要更新 |
|------|---------|
| **1.4.0 Loop & Wiki** | **Loop Engine（四帧循环）+ Project Wiki（可寻址记忆）+ Resume Engine（断电恢复）+ 统一跨平台安装 + Skill 瘦身（15→12）+ Hook 单一分发** |
| 1.3.2 Gate | Gate 状态机 + 硬拦截：10 Gates、分级策略、6 验证器、BM25 智能引擎、6 CSV 知识库 |
| 1.3.1 孔明Pro | 持续学习系统 2.0、评测驱动开发、Schema-Driven 工作流 |
| 1.3.0 孔明 | overdrive 超频模式、P03/P04 强制 Multi-Agent 评审 |
| 1.2.0 | 自学习闭环、Agent Team 铁律、CDP 浏览器自动化 |
| 1.1.0 | Java SpringBoot 铁律、角色支持、跨平台修复 |
| 1.0.0 | 核心框架：Skills + Hooks + Templates |
---

## Gate 状态机

v1.3.2 引入，v1.4.0 集成 Loop frame。10 个 Gates，7 种验证器，分级执行。

### 阶段 Gates（6 个）

| Gate | Level | 验证器 | 说明 |
|------|-------|--------|------|
| gate-w01-requirements | hard | — | 需求阶段入口（依赖锚点） |
| gate-w03-architecture | hard | file-exists | 架构阶段：需求文档必须存在 |
| gate-w08-development | hard | file-exists | 开发阶段：设计文档必须存在 |
| gate-w09-code-review | hard | git-has-commits | 代码审查：至少 1 次提交 |
| gate-w10-testing | hard | no-syntax-errors | 测试阶段：代码无语法错误 |
| gate-w12-release | hard | test-suite-pass | 发布阶段：测试全部通过 |

### 质量 Gates（4 个）

| Gate | Level | 验证器 | 说明 |
|------|-------|--------|------|
| gate-quality-iron-law | hard | iron-law-check | 铁律零容忍 |
| gate-quality-tests | hard | test-suite-pass | 测试必须通过 |
| gate-quality-format | soft | lint-check | 代码格式建议 |
| gate-intelligence-check | soft | dev-intelligence.mjs | 智能建议报告 |

### 执行策略

| Level | 行为 | 说明 |
|-------|------|------|
| hard | exit 1 阻断 | 不可绕过，必须修复 |
| soft | exit 0 警告 | 可绕过（单 session 最多 3 次） |

### 6 种验证器

| 验证器 | 实现 | 说明 |
|--------|------|------|
| file-exists | fs.access() | 文件/目录存在性检查 |
| no-syntax-errors | node --check | 代码语法检查 |
| test-suite-pass | 动态检测 vitest/jest/mocha | 测试套件运行 |
| iron-law-check | iron-law-check.mjs | 铁律合规检查 |
| lint-check | eslint | 代码格式检查 |
| git-has-commits | git log 计数 | 开发产出检查 |
| script | 调用 .mjs/.py 脚本 | 自定义验证逻辑 |

---

## 铁律引擎

5 条核心铁律，自动执行，不可绕过：

| ID | 铁律 | 触发场景 |
|----|------|----------|
| IL001 | 文档必须在版本目录生成 | 任何文档输出 |
| IL002 | Harness 生成依赖扫描数据 | 约束生成请求 |
| IL003 | 完成声明必须附带验证证据 | Stop Hook |
| IL004 | 版本变更需要用户确认 | 版本号修改 |
| IL005 | 敏感配置修改需要审批 | 数据库/密钥配置 |

---

## Loop Engine (v1.4.0 新)

四帧循环：每次工具调用都会写入四个 frame，cursor 原子推进，journal 永不修改只追加。

| Frame | 何时 | 内容 |
|-------|------|------|
| observe | PreToolUse | 工具名 + 输入摘要 |
| decide  | PreToolUse | Gate 检查结果 + 决策 |
| act     | PostToolUse | 工具退出码 |
| reflect | Stop | 复盘 + 下一步建议 |

文件：

```
.chaos-harness/loop/
├── cursor.json    (原子写入的会话游标)
└── journal.jsonl  (WAL，超 4MB 滚动)
```

CLI：

```bash
node scripts/loop-cursor.mjs read       # 当前位置
node scripts/loop-journal.mjs tail --n 20
node scripts/loop-engine.mjs status     # 综合视图
```

---

## Project Wiki (v1.4.0 新)

Karpathy 风格可寻址、可链接、可演化的长期记忆。

```
.chaos-harness/wiki/
├── index.md            (自动生成的总目录)
├── patterns/           (代码/Gate/UI 模式)
├── decisions/          (ADR 风格决策)
├── incidents/          (事故/反模式)
└── sessions/           (每次会话快照)
    └── last.md         (最新一份，resume 用)
```

每条 .md 含 frontmatter：

```yaml
---
id: pat-001
type: pattern|decision|incident|session
title: "..."
tags: [a, b]
links: [pat-002, dec-005]   # 双向链接由 indexer 自动维护
created/updated: ISO8601
confidence: 0.0-1.0
status: draft|promoted|archived
---
```

CLI：

```bash
node scripts/wiki-indexer.mjs build         # 重建索引 + 双向链接
node scripts/wiki-indexer.mjs add --type pattern --title "..." --tags "a,b"
node scripts/wiki-indexer.mjs validate
node scripts/wiki-search.mjs query "关键词" --limit 5
```

Wiki 自动接入 `dev-intelligence` 搜索（PostToolUse 时增量更新）。

---

## Resume Engine (v1.4.0 新)

任何中断后下次启动都能精准恢复到 task 粒度。

机制：

1. Stop / PreCompact 时写 `wiki/sessions/<id>.md` + 复制为 `last.md`
2. SessionStart 时 `scripts/resume.mjs` 检测 cursor.last_frame
3. 若不是 `reflect`（说明上次没正常关闭）→ exit 10 + 输出可读 resume 提示

CLI：

```bash
node scripts/resume.mjs            # 检测并输出（exit 0=clean, 10=needs resume）
node scripts/resume.mjs --json     # JSON 输出
node scripts/snapshot.mjs latest   # 列最近 5 个会话快照
node scripts/snapshot.mjs read     # 读 last.md
```

---

## Dev-Intelligence 智能引擎

基于 BM25 检索 + CSV 知识库的数据驱动决策引擎。

### 6 个知识域

| 领域 | 内容 | 行数 |
|------|------|------|
| gate-patterns | Gate 模式库 | 15 行 |
| iron-law-rules | 铁律规则库 | 15 行 |
| test-patterns | 测试模式库 | 15 行 |
| anti-patterns | 反模式库 | 20 行 |
| ui-patterns | UI 自动化模式 | 15 行 |
| prd-quality-rules | PRD 质量规则 | 10 行 |

### 5 个技术栈适配

Vue · React · Spring Boot · FastAPI · Generic

### 交互方式

| 方式 | 触发 | 说明 |
|------|------|------|
| 自然语言 | "搜索 Gate 配置" | SKILL.md 触发词匹配 |
| CLI | `node dev-intelligence.mjs --query "测试" --domain gate-patterns` | 命令行查询 |
| Gate 自动 | 阶段切换时自动触发 | gate-intelligence-check |
| 持久化 | `persist` 命令 | 跨会话决策记忆 |

---

## Hooks 自动拦截

5 个 Hook 阶段，自动执行：

| Hook | 触发条件 | 执行脚本 |
|------|---------|---------|
| SessionStart | 会话启动 | gate-machine.mjs |
| PreToolUse (Write\|Edit) | 写/编辑文件 | gate-enforcer.mjs + iron-law-check.mjs |
| PreToolUse (Bash) | 执行命令 | gate-enforcer.mjs |
| PostToolUse (Write\|Edit) | 写/编辑后 | learning-update + project-pattern-writer + workflow-track + dev-intelligence |
| Stop | 会话结束 | stop.mjs + laziness-detect.mjs |

---

## 超频模式 (Overdrive)

紧急任务一键激活最高优先级处理：

- **触发**：紧急、超频、overdrive、立刻解决
- **效率**：零铺垫、不解释、快速拍板、最小上下文
- **并行**：自动分配 3+ Agent 并行，主 Agent 只做协调
- **铁律**：跳过前置扫描，保留底线验证

---

## 安装

### v1.4.0 跨平台统一安装

```bash
# 远程
claude plugins marketplace add github:jeesoul/chaos-harness
claude plugins install chaos-harness@chaos-harness

# 本地
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
git checkout v1.4.0-loop-wiki

# 跨平台统一入口（推荐）
node scripts/install.mjs

# 或包装脚本
bash install.sh    # Linux/macOS/Git Bash
install.bat        # Windows cmd

claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# 验证
/chaos-harness:overview
```

> **Windows + Git 提示：** v1.4.0 的 `scripts/git-detector.mjs` 会自动探测
> `C:\Program Files\Git\`、scoop、chocolatey、WSL 中的 git 二进制；
> 安装路径含中文会被 `path-sanity.mjs` 拒绝并给出明确错误。

---

## 命令速查

| 命令 | 功能 |
|------|------|
| `/gate-manager status` | Gate 状态仪表盘 |
| `/gate-manager recheck <id>` | 手动重新验证 |
| `/gate-manager override <id> --reason "xxx"` | 绕过 soft Gate |
| `/resume` | v1.4 检测中断 + 输出 resume 提示 |
| `/chaos-harness:overdrive` | 超频模式 |
| `/chaos-harness:product-manager` | 产品经理 |
| `/chaos-harness:dev-intelligence` | 智能建议 + Wiki 搜索 |
| `/chaos-harness:overview` | 项目总览 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行 |
| `/chaos-harness:version-locker` | 版本管理 |
| `/chaos-harness:harness-generator` | 扫描 + 约束生成 |
| `/chaos-harness:java-checkstyle` | Java 代码规范检查 |
| `/chaos-harness:ui-generator` | UI 生成工具 |
| `/chaos-harness:web-access` | 浏览器自动化 |

### 智能触发

| 你说... | 自动触发 |
|--------|---------|
| "紧急"、"超频" | overdrive |
| "Gate 状态"、"阶段切换"、"钩子"、"hooks" | gate-manager |
| "搜索"、"质量检查" | dev-intelligence |
| "PRD"、"需求" | product-manager |
| "继续"、"恢复"、"上次进度" | resume |

---

## 技能清单（v1.4.0 共 12 个）

### 核心（8 个）

| Skill | 说明 |
|-------|------|
| `overview` | 项目总览入口 |
| `gate-manager` | **v1.4 合并：Gate 状态机 + Hooks 管理** |
| `dev-intelligence` | BM25 + Wiki 搜索引擎 |
| `iron-law-enforcer` | 铁律执行 |
| `harness-generator` | **v1.4 合并：扫描 + 约束生成** |
| `version-locker` | 版本管理 |
| `resume` | **v1.4 新：断电恢复 + 会话快照** |
| `overdrive` | 应急超频模式 |

### 可选（4 个）

| Skill | 说明 |
|-------|------|
| `product-manager` | 产品经理（需求/Kano/PRD/生命周期） |
| `java-checkstyle` | Java 代码规范检查 |
| `ui-generator` | UI 生成工具 |
| `web-access` | 浏览器自动化 |

---

## 版本历史

| 版本 | 主要更新 |
|------|---------|
| **1.4.0 Loop & Wiki** | Loop Engine 四帧循环 · Project Wiki（可寻址记忆 + 双向链接）· Resume Engine（断电恢复）· 跨平台统一安装（含 Windows Git 路径探测）· Skill 瘦身 15→12 · PostToolUse 单一 dispatcher · 82+13 测试全通过 |
| 1.3.2 Gate | Gate 状态机 10 Gates · 6 种验证器 · BM25 智能引擎 · 6 个 CSV 知识库 · 5 技术栈适配 · 自学习闭环 · 13 Skills |
| 1.3.1 孔明Pro | 持续学习系统 · 评测驱动 · Schema-Driven 工作流 · 深度防御 · 战略压缩 · 30 Skills |
| 1.3.0 孔明 | overdrive 超频模式 · LP007 退化检测 · P03/P04 强制评审 · 23 Skills |
| 1.2.0 | 自学习闭环 · Agent Team 铁律 · CDP 浏览器 |
| 1.0.0 | 核心框架：Skills + Hooks |

---

## 许可证

[MIT](LICENSE)

---

<p align="center"><strong>Loops persist. Wiki remembers. Chaos resumes.</strong></p>
