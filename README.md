# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.2--Gate-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>Gate 状态机 + 硬拦截 — AI 开发流程操作系统</strong></p>
<p align="center"><em>v1.3.2 — 真验证·可追溯·自学习·数据驱动</em></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

---

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
│ 11 Gates│ │ 15 个 CSV 知识库 │
└─────────┘ └──────────────┘
    │             │
    ▼             ▼
┌─────────────────────────────┐
│ 27 Scripts · 15 Skills      │
│ 10 验证器 · 5 技术栈适配      │
└─────────────────────────────┘
```

### 文件结构

```
chaos-harness/
├── skills/              # 15 个 Skill（能力入口）
│   ├── gate-manager/    # Gate 状态机交互
│   ├── dev-intelligence/# 智能建议引擎（BM25 搜索）
│   ├── iron-law-enforcer/
│   ├── overdrive/       # 超频模式
│   ├── product-manager/
│   └── ...
├── scripts/             # 27 个脚本（执行引擎）
│   ├── gate-machine.mjs     # 阶段状态机
│   ├── gate-enforcer.mjs    # Gate 执行器
│   ├── gate-recovery.mjs    # 失败恢复
│   ├── gate-validator.mjs   # 验证器调度
│   ├── dev-intelligence.mjs # CLI 入口
│   ├── search.py            # BM25 搜索引擎
│   └── ...
├── hooks/               # hooks.json（自动拦截配置）
├── data/                # 15 个 CSV 知识库
├── stacks/              # 5 个技术栈配置
├── tests/               # 7 个测试文件
├── commands/            # 15 个 Slash 命令
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

**当前版本：v1.3.2 Gate**

```bash
# 1. 切换到 v1.3.2 分支并拉取最新代码
cd /path/to/chaos-harness
git checkout v1.3.2
git pull origin v1.3.2

# 2. 重新注册 marketplace
claude plugins marketplace remove chaos-harness
claude plugins marketplace add "/path/to/chaos-harness"

# 3. 重装
claude plugins uninstall chaos-harness@chaos-harness
claude plugins install chaos-harness@chaos-harness

# 4. 验证
bash install.sh   # Linux/macOS
install.bat       # Windows
```

> **注意：** 所有迭代在 `v1.3.2` 分支进行，升级时不要切换到 main 或其他分支。

### 版本历史

| 版本 | 主要更新 |
|------|---------|
| **1.3.2 Gate** | **Gate 状态机 + 硬拦截**：11 Gates（6 阶段 + 5 质量）、分级策略（hard/soft）、真验证（10 种验证器）、BM25 智能引擎、15 个 CSV 知识库（523 条设计规则）、5 技术栈适配、自学习闭环、15 Skills、USAGE.md 角色文档 |
| 1.3.1 孔明Pro | 持续学习系统 2.0、评测驱动开发、Schema-Driven 工作流、深度防御、战略压缩、30 Skills |
| 1.3.0 孔明 | overdrive 超频模式、P03/P04 强制 Multi-Agent 评审、产品经理增强、23 Skills |
| 1.2.0 | 自学习闭环、Agent Team 铁律、CDP 浏览器自动化 |
| 1.1.0 | Java SpringBoot 铁律、角色支持、跨平台修复 |
| 1.0.0 | 核心框架：Skills + Hooks + Templates |
---

## Gate 状态机

v1.3.2 拳头产品。11 个 Gates（6 阶段 + 5 质量），10 种验证器，分级执行。

### 阶段 Gates（6 个）

| Gate | Level | 验证器 | 说明 |
|------|-------|--------|------|
| gate-w01-requirements | hard | — | 需求阶段入口（依赖锚点） |
| gate-w03-architecture | hard | file-exists | 架构阶段：需求文档必须存在 |
| gate-w08-development | hard | file-exists | 开发阶段：设计文档必须存在 |
| gate-w09-code-review | hard | git-has-commits | 代码审查：至少 1 次提交 |
| gate-w10-testing | hard | no-syntax-errors | 测试阶段：代码无语法错误 |
| gate-w12-release | hard | test-suite-pass | 发布阶段：测试全部通过 |

### 质量 Gates（5 个）

| Gate | Level | 验证器 | 说明 |
|------|-------|--------|------|
| gate-quality-iron-law | hard | iron-law-check | 铁律零容忍 |
| gate-quality-tests | hard | test-suite-pass | 测试必须通过 |
| gate-quality-format | soft | lint-check | 代码格式建议 |
| gate-quality-ui | hard | ui-quality-check | UI 无障碍与质量 |
| gate-intelligence-check | soft | script | 智能建议报告 |

### 执行策略

| Level | 行为 | 说明 |
|-------|------|------|
| hard | exit 1 阻断 | 不可绕过，必须修复 |
| soft | exit 0 警告 | 可绕过（单 session 最多 3 次） |

### 10 种验证器

| 验证器 | 实现 | 说明 |
|--------|------|------|
| file-exists | fs.access() + glob | 文件/目录存在性检查 |
| project-scan | project-scanner.mjs | 项目类型/技术栈扫描 |
| git-has-commits | git log 计数 | 开发产出检查 |
| no-syntax-errors | javac/node/py_compile | 多语言语法检查 |
| test-suite-pass | 动态检测 vitest/jest/pytest/maven | 测试套件运行 |
| iron-law-check | iron-law-check.mjs | 铁律合规检查 |
| lint-check | eslint/flake8/checkstyle | 代码格式检查 |
| ui-quality-check | ui-quality-validator.mjs | UI 无障碍与质量 |
| prd-quality-check | 关键词/规则匹配 | PRD 质量验证 |
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

## Dev-Intelligence 智能引擎

基于 BM25 检索 + CSV 知识库的数据驱动决策引擎。

### 15 个知识域

| 领域 | 内容 | 行数 |
|------|------|------|
| gate-patterns | Gate 模式库 | 15 行 |
| iron-law-rules | 铁律规则库 | 15 行 |
| test-patterns | 测试模式库 | 15 行 |
| anti-patterns | 反模式库 | 20 行 |
| ui-patterns | UI 自动化模式 | 15 行 |
| prd-quality-rules | PRD 质量规则 | 10 行 |
| ui-color-palettes | 色板库 | 161 行 |
| ui-styles | 风格库 | 50 行 |
| ui-typography | 字体配对库 | 57 行 |
| ui-components | 组件规格库 | 60 行 |
| ui-animations | 动画规则库 | 40 行 |
| ui-responsive | 响应式断点库 | 30 行 |
| ui-product-types | 产品类型库 | 50 行 |
| ui-ux-guidelines | UX 指南库 | 50 行 |
| ui-charts | 图表类型库 | 25 行 |

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

```bash
# 远程安装
claude plugins marketplace add github:jeesoul/chaos-harness
claude plugins install chaos-harness@chaos-harness

# 本地安装
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# 验证
/chaos-harness:overview
```

> Windows 注意：路径不能含中文和空格。使用 `$(pwd)` (PowerShell) 或 `"%CD%"` (CMD)。

---

## 命令速查

| 命令 | 功能 |
|------|------|
| `/gate-manager status` | Gate 状态仪表盘 |
| `/gate-manager recheck <id>` | 手动重新验证 |
| `/gate-manager override <id> --reason "xxx"` | 绕过 soft Gate |
| `/chaos-harness:overdrive` | 超频模式 |
| `/chaos-harness:product-manager` | 产品经理 |
| `/chaos-harness:dev-intelligence` | 智能建议 |
| `/chaos-harness:overview` | 项目总览 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行 |
| `/chaos-harness:project-state` | 状态恢复 |
| `/chaos-harness:version-locker` | 版本管理 |
| `/chaos-harness:harness-generator` | 约束生成 |
| `/chaos-harness:hooks-manager` | 钩子管理 |
| `/chaos-harness:java-checkstyle` | Java 代码规范检查 |
| `/chaos-harness:ui-generator` | UI 生成工具 |
| `/chaos-harness:web-access` | 浏览器自动化 |

### 智能触发

| 你说... | 自动触发 |
|--------|---------|
| "紧急"、"超频" | overdrive |
| "Gate 状态"、"阶段切换" | gate-manager |
| "搜索"、"质量检查" | dev-intelligence |
| "PRD"、"需求" | product-manager |
| "继续"、"恢复" | project-state |

---

## 技能清单

### 核心（8 个）

| Skill | 说明 |
|-------|------|
| `gate-manager` | Gate 状态机交互层 |
| `dev-intelligence` | BM25 智能建议引擎 |
| `iron-law-enforcer` | 铁律执行 |
| `overdrive` | 应急超频模式 |
| `overview` | 项目总览入口 |
| `project-state` | 状态持久化 |
| `version-locker` | 版本管理 |
| `harness-generator` | 约束生成 |

### 可选（5 个）

| Skill | 说明 |
|-------|------|
| `product-manager` | 产品经理（需求/Kano/PRD/生命周期） |
| `java-checkstyle` | Java 代码规范检查 |
| `ui-generator` | UI 生成工具 |
| `web-access` | 浏览器自动化 |
| `hooks-manager` | 钩子管理 |

---

## 版本历史

| 版本 | 主要更新 |
|------|---------|
| **1.3.2 Gate** | Gate 状态机 11 Gates · 10 种验证器 · BM25 智能引擎 · 15 个 CSV 知识库 · 5 技术栈适配 · 自学习闭环 · 15 Skills |
| 1.3.1 孔明Pro | 持续学习系统 · 评测驱动 · Schema-Driven 工作流 · 深度防御 · 战略压缩 · 30 Skills |
| 1.3.0 孔明 | overdrive 超频模式 · LP007 退化检测 · P03/P04 强制评审 · 23 Skills |
| 1.2.0 | 自学习闭环 · Agent Team 铁律 · CDP 浏览器 |
| 1.0.0 | 核心框架：Skills + Hooks |

---

## 许可证

[MIT](LICENSE)

---

<p align="center"><strong>Chaos demands order. Harness provides it.</strong></p>
