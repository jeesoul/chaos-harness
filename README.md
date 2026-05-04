# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.3-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>给 AI 编程助手套上约束框架，让它在真实项目里不乱来。</strong></p>
<p align="center"><em>v1.3.3 — 项目知识图谱 · 需求影响分析 · Gate 状态机 · 硬拦截</em></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

---

## 核心问题

AI 辅助开发有两个根本问题：

**问题一：AI 不了解你的项目。** 让 AI 加"用户导出 Excel"功能，它会自己选一个 Excel 库，可能和你已有的 `easyexcel` 冲突；命名风格和老代码不一致；不知道用户表有 500 万行不能全量查询。Gate 全部通过，线上炸了。

**问题二：AI 行为不确定。** 自然语言提示词是软性建议，AI 会跳过验证、绕过约束、声称完成但没有实际验证。

Chaos Harness 的解法：

- **项目知识图谱** — 让 AI 先读懂项目，再动手
- **Gate 状态机** — 把约束编码为硬拦截，不可绕过

---

## v1.3.3 新增能力

| 模块 | 说明 |
|------|------|
| **项目知识引擎** | 扫描代码结构、依赖约束、JPA 实体、入口点，生成 `project-knowledge.json` |
| **需求影响分析** | 输入需求，输出影响范围 / 复用建议 / 约束提醒 / 风险预警 / 工作量估算 |
| **上下文感知建议** | 生成代码前注入项目规范：命名风格 / 依赖选择 / 架构模式 / 日志格式 |
| **Graphify 集成** | AST 提取 + Leiden 社区检测 + God Nodes 分析，SessionStart 自动生成图谱 |
| **Gate 增强验证器** | 新增 context-compliance / reuse-check / constraint-check / impact-check |

---

## 架构总览

```
用户交互 (自然语言 / CLI / Slash Command)
         │
         ▼
┌─────────────────────────────────────────────┐
│  Hooks 自动拦截 (hooks.json)                  │
│  SessionStart → PreToolUse → PostToolUse      │
│  → Stop → PreCompact                          │
└──────────┬──────────────────────────────────┘
           │
    ┌──────┴──────────┬──────────────┐
    ▼                 ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────┐
│ 项目知识层   │ │ Gate 状态机  │ │ Dev-Intel│
│ 知识图谱引擎 │ │ 11 Gates     │ │ BM25引擎 │
│ 影响分析引擎 │ │ 10 验证器    │ │ 15 CSV库 │
│ 上下文建议器 │ │ 分级执行     │ │ 5 技术栈 │
└──────────────┘ └──────────────┘ └──────────┘
                        │
                        ▼
         36 Scripts · 18 Skills · 18 Commands
```

### 文件结构

```
chaos-harness/
├── skills/              # 18 个 Skill（能力入口）
├── scripts/             # 36 个脚本（执行引擎）
│   ├── project-knowledge-engine.mjs  # 项目知识扫描
│   ├── impact-analyzer.mjs           # 需求影响分析
│   ├── context-advisor.mjs           # 上下文感知建议
│   ├── coding-convention-extractor.mjs # 规范提取
│   ├── graphify-*.mjs                # Graphify 集成（4 个）
│   ├── gate-machine.mjs              # 阶段状态机
│   ├── gate-enforcer.mjs             # Gate 执行器
│   ├── gate-validator.mjs            # 验证器调度
│   ├── gate-validator-v2.mjs         # 增强验证器
│   ├── dev-intelligence.mjs          # BM25 CLI
│   ├── search.py                     # BM25 搜索引擎
│   └── ...
├── hooks/               # hooks.json（自动拦截配置）
├── data/                # 15 个 CSV 知识库 + Schema + 配置
├── stacks/              # 5 个技术栈配置
├── tests/               # 9 个测试文件（37 用例，全通过）
├── commands/            # 18 个 Slash 命令
└── .chaos-harness/      # 运行时状态
    ├── gates/           # Gate 定义 + 状态
    ├── impact-report.md # 最新影响分析报告
    └── state.json       # 会话状态
```

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

> Windows：路径不能含中文和空格。

### 升级

```bash
git checkout v1.3.3 && git pull origin v1.3.3
claude plugins marketplace remove chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins uninstall chaos-harness@chaos-harness
claude plugins install chaos-harness@chaos-harness
```

### 卸载

```bash
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness
```

---

## 项目知识引擎

v1.3.3 核心能力。扫描项目生成结构化知识，让 AI 在动手前先读懂项目。

### 扫描内容

| 层 | 内容 |
|----|------|
| **代码层** | 模块结构、入口点（Controller/Router）、源文件统计、语言分布 |
| **依赖层** | 外部依赖及版本约束、engine 约束（Node/Java 版本要求） |
| **数据层** | JPA 实体、表名映射、字段列表 |
| **规范层** | 命名风格、日志框架、异常处理模式、注释语言 |

### 使用

```bash
# 扫描项目，生成知识图谱
node scripts/project-knowledge-engine.mjs --scan

# 查询特定知识
node scripts/project-knowledge-engine.mjs --query code.languages
node scripts/project-knowledge-engine.mjs --query dependencies

# 生成报告
node scripts/project-knowledge-engine.mjs --report
```

或通过 Slash 命令：`/chaos-harness:graphify generate`

---

## 需求影响分析

输入一个需求，输出完整的影响分析报告，在开发前就知道风险。

### 分析维度

| 维度 | 说明 |
|------|------|
| **影响范围** | 哪些模块受影响，影响程度 |
| **复用建议** | 项目里已有哪些可复用的代码/依赖 |
| **约束提醒** | 哪些约束不能违反（数据量、版本锁定、架构边界） |
| **风险预警** | 哪些地方可能出问题 |
| **工作量估算** | 乐观 / 可能 / 悲观三点估算（小时） |

### 使用

```bash
node scripts/impact-analyzer.mjs --requirement "用户导出 Excel"
node scripts/impact-analyzer.mjs --requirement "添加缓存层" --json
```

或通过 Slash 命令：`/chaos-harness:impact-analyzer`

报告保存到 `.chaos-harness/impact-report.md`。

---

## 上下文感知建议

在 AI 生成代码前，自动注入项目规范，确保生成的代码和老代码风格一致。

### 建议维度

- **命名风格** — 和现有代码一致（PascalCase / camelCase / snake_case）
- **依赖选择** — 优先复用已有依赖，不引入冲突
- **架构模式** — 和现有分层架构一致
- **异常处理** — 和现有 GlobalExceptionHandler 一致
- **日志格式** — 和现有 slf4j / log4j 格式一致

### 使用

```bash
node scripts/context-advisor.mjs --advise "创建 UserExportService"
node scripts/context-advisor.mjs --for-file src/service/UserService.java
```

或通过 Slash 命令：`/chaos-harness:context-advisor`

PreToolUse Hook 会在每次 Write/Edit 前自动触发上下文注入。

---

## Graphify 知识图谱

基于 [Graphify](https://github.com/safishamsi/graphify) 的深度代码结构分析。

### 核心能力

| 能力 | 说明 |
|------|------|
| AST 提取 | tree-sitter 解析 25+ 语言，提取类/函数/依赖关系 |
| 社区检测 | Leiden 算法自动发现模块边界 |
| God Nodes | 识别高耦合核心节点，修改前预警 |
| 增量更新 | SHA256 缓存，仅处理变更文件 |
| 交互式可视化 | 浏览器打开 graph.html 探索项目结构 |

### 前置条件

```bash
pip install graphifyy
```

### 两种模式

| 模式 | 配置 | 行为 |
|------|------|------|
| **强制模式** | `enabled: true` | 所有 AI 交互都必须先查询知识图谱 |
| **手动模式** | `enabled: false`（默认） | 仅 `/chaos-harness:graphify` 命令时使用 |

### 常用命令

```bash
/chaos-harness:graphify generate    # 生成知识图谱
/chaos-harness:graphify status      # 查看图谱状态
/chaos-harness:graphify enable      # 开启强制模式
/chaos-harness:graphify query "X"   # 查询图谱
/chaos-harness:graphify visualize   # 打开可视化
```

---

## Gate 状态机

11 个 Gates（6 阶段 + 5 质量），10 种验证器，分级执行。

### 阶段 Gates（6 个）

| Gate | Level | 验证器 | 说明 |
|------|-------|--------|------|
| gate-w01-requirements | hard | — | 需求阶段入口 |
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

| Level | 行为 |
|-------|------|
| hard | exit 1 阻断，不可绕过，必须修复 |
| soft | exit 0 警告，单 session 最多绕过 3 次 |

### 10 种验证器

| 验证器 | 实现 |
|--------|------|
| file-exists | fs.access() + glob |
| project-scan | project-scanner.mjs |
| git-has-commits | git log 计数 |
| no-syntax-errors | javac / node / py_compile |
| test-suite-pass | 动态检测 vitest/jest/pytest/maven |
| iron-law-check | iron-law-check.mjs |
| lint-check | eslint / flake8 / checkstyle |
| ui-quality-check | ui-quality-validator.mjs |
| prd-quality-check | 关键词/规则匹配 |
| script | 调用 .mjs/.py 自定义脚本 |

---

## 铁律引擎

5 条核心铁律，Hooks 自动执行，不可绕过：

| ID | 铁律 | 触发场景 |
|----|------|----------|
| IL001 | 文档必须在版本目录生成 | 任何文档输出 |
| IL002 | Harness 生成依赖扫描数据 | 约束生成请求 |
| IL003 | 完成声明必须附带验证证据 | Stop Hook |
| IL004 | 版本变更需要用户确认 | 版本号修改 |
| IL005 | 敏感配置修改需要审批 | 数据库/密钥配置 |

---

## Hooks 自动拦截

| Hook | 触发条件 | 执行脚本 |
|------|---------|---------|
| SessionStart | 会话启动 | gate-machine.mjs + graphify-init.mjs |
| PreToolUse (Write\|Edit) | 写/编辑文件 | graphify-context.mjs + gate-enforcer.mjs + iron-law-check.mjs |
| PreToolUse (Bash) | 执行命令 | gate-enforcer.mjs |
| PostToolUse (Write\|Edit) | 写/编辑后 | graphify-update.mjs + learning-update + workflow-track + dev-intelligence |
| Stop | 会话结束 | stop.mjs + laziness-detect.mjs |

---

## Dev-Intelligence 智能引擎

BM25 检索 + 15 个 CSV 知识库，数据驱动决策。

### 知识域

| 领域 | 内容 |
|------|------|
| gate-patterns | Gate 模式库 |
| iron-law-rules | 铁律规则库 |
| test-patterns | 测试模式库 |
| anti-patterns | 反模式库 |
| ui-patterns | UI 自动化模式 |
| prd-quality-rules | PRD 质量规则 |
| ui-color-palettes / ui-styles / ui-typography / ui-components / ui-animations / ui-responsive / ui-product-types / ui-ux-guidelines / ui-charts | UI 设计知识库（9 个） |

### 5 个技术栈适配

Vue · React · Spring Boot · FastAPI · Generic

---

## 命令速查

| 命令 | 功能 |
|------|------|
| `/chaos-harness:overview` | 项目总览 |
| `/chaos-harness:graphify` | 知识图谱管理 |
| `/chaos-harness:impact-analyzer` | 需求影响分析 |
| `/chaos-harness:context-advisor` | 上下文感知建议 |
| `/chaos-harness:gate-manager` | Gate 状态仪表盘 |
| `/chaos-harness:dev-intelligence` | 智能建议查询 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行 |
| `/chaos-harness:overdrive` | 超频模式（紧急任务） |
| `/chaos-harness:product-manager` | 产品经理（需求/PRD/Kano） |
| `/chaos-harness:project-scanner` | 项目扫描 |
| `/chaos-harness:project-state` | 状态恢复 |
| `/chaos-harness:version-locker` | 版本管理 |
| `/chaos-harness:harness-generator` | 约束生成 |
| `/chaos-harness:hooks-manager` | 钩子管理 |
| `/chaos-harness:java-checkstyle` | Java 代码规范检查 |
| `/chaos-harness:ui-generator` | UI 生成工具 |
| `/chaos-harness:ui-ux-intelligence` | UI/UX 智能建议 |
| `/chaos-harness:web-access` | 浏览器自动化 |

### 智能触发

| 你说... | 自动触发 |
|--------|---------|
| "影响分析"、"需求影响"、"风险预警" | impact-analyzer |
| "上下文建议"、"编码建议"、"项目规范" | context-advisor |
| "知识图谱"、"graphify"、"项目结构" | graphify |
| "Gate 状态"、"阶段切换" | gate-manager |
| "紧急"、"超频" | overdrive |
| "搜索"、"质量检查" | dev-intelligence |
| "继续"、"恢复" | project-state |

---

## Skills 清单

### 项目智能（v1.3.3 新增，3 个）

| Skill | 说明 |
|-------|------|
| `impact-analyzer` | 需求影响分析引擎 |
| `context-advisor` | 上下文感知代码建议器 |
| `graphify` | 知识图谱管理（生成/查询/可视化） |

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

### 可选（7 个）

| Skill | 说明 |
|-------|------|
| `product-manager` | 产品经理（需求/Kano/PRD） |
| `project-scanner` | 项目类型/技术栈扫描 |
| `java-checkstyle` | Java 代码规范检查 |
| `ui-generator` | UI 生成工具 |
| `ui-ux-intelligence` | UI/UX 智能建议 |
| `web-access` | 浏览器自动化 |
| `hooks-manager` | 钩子管理 |

---

## 版本历史

| 版本 | 主要更新 |
|------|---------|
| **1.3.3 AI 项目智能体** | **项目知识引擎（代码/依赖/实体/规范扫描）· 需求影响分析（影响范围/复用/约束/风险/工作量）· 上下文感知建议（命名/依赖/架构一致性）· Graphify 集成（AST+社区检测+God Nodes）· Gate 增强验证器（v2）· 18 Skills · 36 Scripts · 37 测试用例全通过** |
| 1.3.2 Gate | Gate 状态机 11 Gates · 10 种验证器 · BM25 智能引擎 · 15 个 CSV 知识库 · 5 技术栈适配 · 自学习闭环 · 15 Skills |
| 1.3.1 孔明Pro | 持续学习系统 · 评测驱动 · Schema-Driven 工作流 · 深度防御 · 30 Skills |
| 1.3.0 孔明 | overdrive 超频模式 · P03/P04 强制评审 · 23 Skills |
| 1.2.0 | 自学习闭环 · Agent Team 铁律 · CDP 浏览器 |
| 1.0.0 | 核心框架：Skills + Hooks |

---

## 许可证

[MIT](LICENSE)

---

<p align="center"><strong>Chaos demands order. Harness provides it.</strong></p>
