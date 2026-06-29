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
| **大版本简化** | Skills 15→11 · Gates 10→5 · 铁律 5→2 · CSV→Wiki · 去除 Python 依赖 · PostToolUse 4 hook→1 dispatcher |

## 一句话定位

> 用 Gate 状态机给 AI 开发流程立规矩，让每一步操作都经过验证。

## 核心问题

AI Agent 辅助开发的核心问题是非确定性——跳过验证、绕过约束、幻觉式交付。自然语言提示词是软性建议，存在语义博弈空间。

Chaos Harness 将约束编码为 **Gate 状态机**——通过 Gate 分级执行 + Hooks 自动拦截 + Wiki 知识库驱动，消除灰色地带。

### 三大特性

| 特性 | 说明 |
|------|------|
| **确定性** | Gate 分级执行（hard 阻断 / soft 警告），行为路径可追溯 |
| **数据驱动** | Wiki 可寻址知识库 + 纯 Node 搜索，模式/决策/事故全覆盖（零 Python 依赖） |
| **可进化** | 自学习闭环：observe → pattern → decision 三层晋升 |

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
│ 状态机  │ │ Wiki 搜索引擎  │
│ 5 Gates │ │ (纯 Node)     │
└─────────┘ └──────────────┘
    │             │
    ▼             ▼
┌─────────────────────────────┐
│ 11 Skills · Loop + Wiki     │
│ 7 验证器 · 5 技术栈适配      │
└─────────────────────────────┘
```

### 文件结构

```
chaos-harness/
├── skills/              # 11 个 Skill（能力入口）
│   ├── gate-manager/    # Gate 状态机 + Hooks 管理
│   ├── dev-intelligence/# 智能建议引擎（Wiki 搜索）
│   ├── iron-law-enforcer/ # 铁律 + 版本锁定
│   ├── resume/          # 断电恢复
│   ├── overdrive/       # 超频模式
│   └── ...
├── scripts/             # 执行引擎（.mjs）
│   ├── gate-machine.mjs     # 阶段状态机
│   ├── gate-enforcer.mjs    # Gate 执行器
│   ├── loop-engine.mjs      # Loop 四帧循环
│   ├── wiki-indexer.mjs     # Wiki 索引器
│   ├── wiki-search.mjs      # 纯 Node 搜索（零 Python 依赖）
│   ├── resume.mjs           # 断电恢复
│   └── ...
├── hooks/               # hooks.json（自动拦截配置）
├── stacks/              # 5 个技术栈配置
├── tests/               # 测试文件
├── commands/            # Slash 命令
├── instincts/           # 本能系统（直觉观察）
└── .chaos-harness/      # 运行时状态
    ├── gates/           # 5 Gate 定义 + 状态
    ├── loop/            # cursor + journal（WAL）
    ├── wiki/            # 唯一知识库（patterns/decisions/incidents/sessions）
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

v1.4.0 精简为 5 个 Gate（3 stage + 2 quality），7 种验证器，分级执行。

### 阶段 Gates（3 个）

| Gate | Level | 验证器 | 说明 |
|------|-------|--------|------|
| gate-requirements | hard | file-exists | 需求阶段：需求文档/PRD 存在 |
| gate-implementation | hard | no-syntax-errors + git-has-commits | 实现阶段：代码无错且有提交 |
| gate-release | hard | test-suite-pass | 发布阶段：测试全部通过 |

### 质量 Gates（2 个）

| Gate | Level | 验证器 | 说明 |
|------|-------|--------|------|
| gate-quality | hard | iron-law-check | 铁律零容忍（合并 tests/format/iron-law） |
| gate-intelligence | soft | dev-intelligence.mjs | 基于 Wiki 的智能建议 |

> v1.4.0 压缩：原 6 stage + 4 quality = 10 Gate，合并为 3+2。
> W01/W03→requirements，W08/W09→implementation，W10/W12→release。

### 执行策略

| Level | 行为 | 说明 |
|-------|------|------|
| hard | exit 1 阻断 | 不可绕过，必须修复 |
| soft | exit 0 警告 | 可绕过（单 session 最多 3 次） |

### 7 种验证器

| 验证器 | 实现 | 说明 |
|--------|------|------|
| file-exists | fs.access() | 文件/目录存在性检查 |
| no-syntax-errors | node --check | 代码语法检查 |
| test-suite-pass | 动态检测 vitest/jest/mocha | 测试套件运行 |
| iron-law-check | iron-law-check.mjs | 铁律合规检查 |
| lint-check | eslint | 代码格式检查 |
| git-has-commits | git log 计数 | 开发产出检查 |
| script | 调用 .mjs 脚本 | 自定义验证逻辑 |

---

## 铁律引擎

v1.4.0 精简为 2 条核心铁律，自动执行，不可绕过：

| ID | 铁律 | 触发场景 |
|----|------|----------|
| IL001 | 文档必须在版本目录生成 | 任何文档输出（PreToolUse hook 拦截） |
| IL003 | 完成声明必须附带验证证据 | Stop hook（reflect 帧） |

> 原 IL002/IL004/IL005 已移除：IL002 变成 gate-requirements 前置，IL004 由 Loop snapshot 替代，IL005 与 IL001 本质重合。**少而严 > 多而松。**

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

v1.4.0：基于 **Wiki** 的纯 Node 搜索引擎（零 Python 依赖）。原 6 个 CSV 知识库已迁移为 Wiki 条目。

### 知识域（Wiki tags）

| tag | 内容 | 来源 |
|------|------|------|
| gate | Gate 模式 | 原 gate-patterns.csv |
| iron-law | 铁律规则 | 原 iron-law-rules.csv |
| test | 测试模式 | 原 test-patterns.csv |
| anti-pattern | 反模式 | 原 anti-patterns.csv |
| ui | UI 自动化模式 | 原 ui-patterns.csv |
| prd | PRD 质量规则 | 原 prd-quality-rules.csv |

> 90 条知识全部迁移到 `.chaos-harness/wiki/`，可寻址、可链接、可演化。

### 5 个技术栈适配

Vue · React · Spring Boot · FastAPI · Generic

### 交互方式

| 方式 | 触发 | 说明 |
|------|------|------|
| 自然语言 | "搜索 Gate 配置" | SKILL.md 触发词匹配 |
| CLI | `node dev-intelligence.mjs --query "测试"` | 命令行查询（走 Wiki） |
| Gate 自动 | 阶段切换时自动触发 | gate-intelligence |
| 持久化 | `persist` 命令 | 跨会话决策记忆 |

---

## Hooks 自动拦截

5 个 Hook 阶段，自动执行：

| Hook | 触发条件 | 执行脚本 |
|------|---------|---------|
| SessionStart | 会话启动 | resume.mjs + gate-machine.mjs |
| PreToolUse (Write\|Edit) | 写/编辑文件 | loop observe → gate-enforcer (gate-quality) + iron-law-check → loop decide |
| PreToolUse (Bash) | 执行命令 | loop observe |
| PostToolUse (Write\|Edit\|Bash) | 工具执行后 | **post-write-dispatcher**（loop act + learning + wiki-indexer） |
| Stop | 会话结束 | loop reflect + snapshot + stop + laziness-detect |
| PreCompact | 压缩前 | snapshot + pre-compact |

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
| `/chaos-harness:iron-law-enforcer` | 铁律执行 + 版本锁定 |
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
| "版本"、"锁定" | iron-law-enforcer |

---

## 技能清单（v1.4.0 共 11 个）

### 核心（6 个）

| Skill | 说明 |
|-------|------|
| `overview` | 项目总览入口 |
| `gate-manager` | Gate 状态机 + Hooks 管理 |
| `iron-law-enforcer` | **v1.4 合并：铁律执行 + 版本锁定** |
| `dev-intelligence` | Wiki 搜索引擎（纯 Node） |
| `resume` | 断电恢复 + 会话快照 |
| `overdrive` | 应急超频模式 |

### 可选（5 个）

| Skill | 说明 |
|-------|------|
| `harness-generator` | 扫描 + 约束生成 |
| `product-manager` | 产品经理（需求/Kano/PRD/生命周期） |
| `java-checkstyle` | Java 代码规范检查 |
| `ui-generator` | UI 生成工具 |
| `web-access` | 浏览器自动化 |

---

## 版本历史

| 版本 | 主要更新 |
|------|---------|
| **1.4.0 Loop & Wiki** | Loop Engine 四帧循环 · Project Wiki（可寻址记忆）· Resume Engine（断电恢复）· 跨平台统一安装 · **大版本简化：Skills 15→11 · Gates 10→5 · 铁律 5→2 · CSV→Wiki · 去 Python 依赖** · 测试全通过 |
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
