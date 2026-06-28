# Chaos Harness 使用指南

> v1.4.0 Loop & Wiki — 按角色快速上手

---

## 目录

- [通用安装](#通用安装)
- [产品经理](#产品经理)
- [架构师](#架构师)
- [开发工程师](#开发工程师)
- [QA 测试工程师](#qa-测试工程师)
- [项目经理](#项目经理)
- [Loop / Wiki / Resume（v1.4.0 新）](#loop--wiki--resumev140-新)
- [通用命令速查](#通用命令速查)
- [超频模式](#超频模式)
- [故障恢复](#故障恢复)

---

## 通用安装

```bash
# 本地安装
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
git checkout v1.4.0-loop-wiki

# v1.4.0 统一跨平台入口
node scripts/install.mjs            # 任意平台
# 或包装脚本
bash install.sh                     # Linux/macOS/Git Bash
install.bat                         # Windows cmd

claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# 验证
/chaos-harness:overview
```

> **Windows + Git 提示：** `scripts/git-detector.mjs` 会自动定位 `Program Files\Git`、scoop、chocolatey、WSL 的 git，无需手动配置 PATH。

安装后，Gate 状态机、Loop Engine、Hooks 拦截即刻生效，无需额外配置。

---

## 产品经理

**核心能力**：需求管理 + PRD 质量 + Kano 分析 + Gate 阶段控制

### 日常工作流

1. **需求阶段** — Claude Code 会话启动后，Gate 自动进入 W01 需求阶段
2. **PRD 编写** — 使用 product-manager skill 进行需求分析
3. **质量检查** — Gate 自动检查 PRD 格式和完整性

### 常用命令

| 命令 | 说明 |
|------|------|
| `/chaos-harness:product-manager` | 启动产品经理模式 |
| `/gate-manager status` | 查看当前 Gate 阶段 |
| 自然语言："PRD 质量检查" | 自动触发 dev-intelligence |

### 触发词

| 你说... | 自动触发 |
|---------|---------|
| "PRD"、"需求文档"、"产品需求" | product-manager |
| "Kano 分析"、"需求优先级" | product-manager |
| "Gate 阶段"、"当前进度" | gate-manager |

### Gate 保护

| 阶段 | 保护内容 |
|------|---------|
| W01 → W03 | 需求文档必须存在，否则无法进入架构阶段 |
| PRD 输出 | 铁律 IL001：必须在版本目录下生成 |

---

## 架构师

**核心能力**：Gate 状态机 + 架构设计 + Schema 工作流 + 技术栈适配

### 日常工作流

1. **架构设计** — W03 阶段，Gate 自动验证需求文档存在性
2. **技术选型** — 使用 dev-intelligence 搜索对应技术栈的最佳实践
3. **Schema 驱动** — 定义工作流 Schema，约束开发流程

### 常用命令

| 命令 | 说明 |
|------|------|
| `/gate-manager status` | Gate 状态仪表盘 |
| `/chaos-harness:dev-intelligence` | 智能建议引擎 |
| 自然语言："搜索架构模式" | BM25 检索 anti-patterns 知识库 |

### 技术栈适配

| 技术栈 | 配置 |
|--------|------|
| Vue | `stacks/vue.json` |
| React | `stacks/react.json` |
| Spring Boot | `stacks/java-springboot.json` |
| FastAPI | `stacks/python-fastapi.json` |
| 通用 | `stacks/generic.json` |

### Gate 保护

| Gate | 验证内容 |
|------|---------|
| gate-w03-architecture | 需求文档必须存在于 `output/*/W01_requirements` |
| gate-w08-development | 设计文档必须存在于 `output/*/W03_architecture` |
| gate-intelligence-check | 阶段切换时自动推荐 Gate 配置和反模式 |

---

## 开发工程师

**核心能力**：铁律约束 + 代码质量 Gate + 智能建议 + 超频模式

### 日常工作流

1. **编码** — Write/Edit 文件时，Hooks 自动拦截检查
2. **铁律合规** — IL001（版本目录）、IL003（完成需验证）自动执行
3. **质量 Gate** — 提交前自动检查语法、测试、格式

### 常用命令

| 命令 | 说明 |
|------|------|
| `/gate-manager status` | 查看当前阶段和质量 Gate |
| `/chaos-harness:overdrive` | 紧急任务超频模式 |
| `/chaos-harness:dev-intelligence --query "代码规范"` | 搜索最佳实践 |
| 自然语言："继续"、"恢复" | resume 恢复进度 |

### Hook 自动拦截

| 操作 | 自动检查 |
|------|---------|
| 写/编辑文件 | 铁律检查（IL001-IL005） |
| 执行命令 | 测试 Gate + 格式 Gate |
| 写/编辑后 | 学习更新 + 工作流追踪 |

### 铁律速查

| ID | 铁律 | 违反后果 |
|----|------|---------|
| IL001 | 文档必须在版本目录下生成 | Hook 阻断 |
| IL003 | 完成声明必须附带验证证据 | Stop Hook 阻断 |
| IL004 | 版本变更需要用户确认 | 自动回退 |
| IL005 | 敏感配置修改需要审批 | Hook 阻断 |

---

## QA 测试工程师

**核心能力**：测试 Gate + 测试模式库 + 自动化验证

### 日常工作流

1. **测试阶段** — W10 阶段，Gate 自动验证代码无语法错误
2. **发布阶段** — W12 阶段，Gate 要求测试全部通过
3. **测试模式** — 使用 dev-intelligence 搜索测试最佳实践

### 常用命令

| 命令 | 说明 |
|------|------|
| `/gate-manager status` | 查看测试阶段 Gate 状态 |
| `/gate-manager recheck gate-w10-testing` | 重新验证测试 Gate |
| 自然语言："搜索测试模式" | BM25 检索 test-patterns 知识库 |

### Gate 保护

| Gate | 验证器 | 说明 |
|------|--------|------|
| gate-w10-testing | no-syntax-errors | 代码无语法错误 |
| gate-w12-release | test-suite-pass | 测试全部通过 |
| gate-quality-tests | test-suite-pass | 提交前必须通过 |

### 测试模式知识库

`data/test-patterns.csv` 包含 15 种测试模式，覆盖：
- 单元测试模式
- 集成测试模式
- E2E 测试模式
- 覆盖率要求
- Mock 策略

---

## 项目经理

**核心能力**：进度追踪 + Gate 阶段管理 + 状态持久化

### 日常工作流

1. **进度查看** — gate-manager 实时显示各阶段状态
2. **阶段切换** — 自动触发 Gate 验证和智能建议
3. **状态恢复** — resume / snapshot 恢复中断的会话（v1.4.0 增强）

### 常用命令

| 命令 | 说明 |
|------|------|
| `/gate-manager status` | 全阶段进度仪表盘 |
| `/resume` | v1.4 检测中断点并输出 resume 提示 |
| 自然语言："当前进度"、"上次进度" | gate-manager / resume |

### 阶段流转

```
W01 需求 → W03 架构 → W08 开发 → W09 审查 → W10 测试 → W12 发布
```

每个阶段切换都自动执行对应 Gate 验证。

---

## Loop / Wiki / Resume（v1.4.0 新）

### Loop Engine

每次工具调用自动产生 observe → decide → act → reflect 四帧，写入 `loop/journal.jsonl`，cursor 原子推进。

```bash
node scripts/loop-cursor.mjs read           # 当前位置（session_id, tick, last_frame）
node scripts/loop-journal.mjs tail --n 20   # 最近 20 帧
node scripts/loop-engine.mjs status         # 综合视图
```

**为什么有用：** 任何时刻你都能知道"chaos-harness 现在做到第几步、上次做了什么、为什么这么做"。

### Project Wiki

可寻址、可链接、可演化的长期记忆。

```bash
# 新增 pattern / decision / incident
node scripts/wiki-indexer.mjs add --type pattern --title "..." --tags "a,b"

# 重建索引（含双向链接自动补全）
node scripts/wiki-indexer.mjs build

# 校验所有 frontmatter
node scripts/wiki-indexer.mjs validate

# 搜索（pure Node，零依赖）
node scripts/wiki-search.mjs query "关键词" --type pattern --limit 5
```

Wiki 与 `dev-intelligence` 集成：自然语言"搜索 xxx" 自动同时搜 CSV 知识库和 Wiki。

### Resume / Snapshot

```bash
# 检测上次是否中断（exit 0=clean, exit 10=needs resume）
node scripts/resume.mjs

# 手动写当前会话快照
node scripts/snapshot.mjs write --status in-progress --title "..."

# 列最近 5 个会话
node scripts/snapshot.mjs latest

# 读 last.md 全文
node scripts/snapshot.mjs read
```

**断电场景**：

1. 你在某个任务中途强制重启电脑
2. 重启后打开 Claude Code
3. SessionStart hook 自动调用 `resume.mjs`
4. 输出 "🔄 previous session was interrupted" + 最近 5 frames + 当前 task
5. 你直接说"继续" 即可

---

## 通用命令速查

### Slash Commands

| 命令 | 功能 |
|------|------|
| `/chaos-harness:overview` | 项目总览 |
| `/gate-manager status` | Gate 状态仪表盘 |
| `/gate-manager recheck <id>` | 手动重新验证 |
| `/gate-manager override <id> --reason "xxx"` | 绕过 soft Gate |
| `/chaos-harness:overdrive` | 超频模式 |
| `/chaos-harness:product-manager` | 产品经理 |
| `/chaos-harness:dev-intelligence` | 智能建议 |
| `/resume` | 状态恢复 |

### 自然语言触发

| 你说... | 触发 |
|---------|------|
| "紧急"、"超频"、"overdrive" | overdrive |
| "Gate 状态"、"阶段切换" | gate-manager |
| "搜索"、"质量检查" | dev-intelligence |
| "PRD"、"需求" | product-manager |
| "继续"、"恢复" | resume |

### CLI 命令

```bash
# 智能引擎查询
node scripts/dev-intelligence.mjs --query "测试" --domain gate-patterns

# 指定领域搜索
node scripts/dev-intelligence.mjs --query "反模式" --domain anti-patterns

# 生成 Gate 配置
node scripts/dev-intelligence.mjs --generate-gate --stage development

# 持久化决策
node scripts/dev-intelligence.mjs --persist --key "decision" --value "use vitest"
```

---

## 超频模式

紧急任务一键激活：

- **触发词**：紧急、超频、overdrive、立刻解决
- **行为**：零铺垫、不解释、快速拍板、最小上下文
- **并行**：自动分配 3+ Agent 并行工作
- **铁律**：跳过前置扫描，保留底线验证

```
/chaos-harness:overdrive
```

---

## 故障恢复

### Gate 失败恢复

```bash
# 查看失败原因
/gate-manager status

# 重新验证
/gate-manager recheck <gate-id>

# 绕过 soft Gate（单 session 最多 3 次）
/gate-manager override <gate-id> --reason "原因"

# 恢复会话状态
/resume
```

### 常见问题

| 问题 | 解决 |
|------|------|
| Gate 阻断无法继续 | 查看阻断原因，修复后 recheck |
| Hook 报错 | 检查 `hooks/hooks.json` 配置 |
| 状态丢失 | 使用 `/resume` 恢复 |
| 版本号不一致 | 运行 `install.sh` 或 `install.bat` 检查 |
