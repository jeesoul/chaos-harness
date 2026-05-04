# Chaos Harness 使用指南

> v1.3.3 — 按角色快速上手

---

## 目录

- [通用安装](#通用安装)
- [项目知识引擎（v1.3.3 新增）](#项目知识引擎)
- [需求影响分析（v1.3.3 新增）](#需求影响分析)
- [上下文感知建议（v1.3.3 新增）](#上下文感知建议)
- [Graphify 知识图谱](#graphify-知识图谱)
- [产品经理](#产品经理)
- [架构师](#架构师)
- [开发工程师](#开发工程师)
- [QA 测试工程师](#qa-测试工程师)
- [项目经理](#项目经理)
- [通用命令速查](#通用命令速查)
- [超频模式](#超频模式)
- [故障恢复](#故障恢复)

---

## 通用安装

```bash
# 本地安装
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# 验证
/chaos-harness:overview
```

安装后，Gate 状态机、知识图谱和 Hooks 自动拦截即刻生效，无需额外配置。

---

## 项目知识引擎

**v1.3.3 新增**。扫描项目生成结构化知识，让 AI 在动手前先读懂项目。

### 使用场景

- 老项目接手：快速了解项目结构、规范、约束
- 新成员上手：自动提取编码规范，不用口口相传
- AI 辅助开发：让 AI 知道项目已有什么，不重复造轮子

### 命令

```bash
# 扫描项目，生成知识图谱（存入 .chaos-harness/project-knowledge.json）
node scripts/project-knowledge-engine.mjs --scan

# 查询特定知识
node scripts/project-knowledge-engine.mjs --query code.languages
node scripts/project-knowledge-engine.mjs --query dependencies
node scripts/project-knowledge-engine.mjs --query convention.naming

# 生成可读报告
node scripts/project-knowledge-engine.mjs --report

# 指定目标项目（在 chaos-harness 目录外调用时）
node scripts/project-knowledge-engine.mjs --scan --project-root /path/to/your-project
```

或通过 Slash 命令：`/chaos-harness:graphify generate`

### 扫描内容

| 层 | 内容 |
|----|------|
| 代码层 | 模块结构、入口点、源文件统计、语言分布 |
| 依赖层 | 外部依赖及版本约束、engine 约束 |
| 数据层 | JPA 实体、表名映射、字段列表 |
| 规范层 | 命名风格、日志框架、异常处理模式 |

### 输出文件

| 文件 | 说明 |
|------|------|
| `.chaos-harness/project-knowledge.json` | 结构化知识图谱（机器可读） |
| `.chaos-harness/knowledge-report.md` | 可读分析报告 |

---

## 需求影响分析

**v1.3.3 新增**。输入一个需求，在开发前就知道影响范围、风险和工作量。

### 使用场景

- 评估新需求：在排期前了解复杂度和风险
- 老项目迭代：避免踩到隐性约束（数据量、版本锁定、架构边界）
- 复用发现：找出项目里已有的可复用代码和依赖

### 命令

```bash
# 分析需求影响
node scripts/impact-analyzer.mjs --requirement "用户导出 Excel"

# 输出 JSON 格式（供其他工具消费）
node scripts/impact-analyzer.mjs --requirement "添加缓存层" --json

# 指定目标项目
node scripts/impact-analyzer.mjs --requirement "需求" --project-root /path/to/project
```

或通过 Slash 命令：`/chaos-harness:impact-analyzer`

### 分析维度

| 维度 | 说明 |
|------|------|
| 影响范围 | 哪些模块受影响，影响程度 |
| 复用建议 | 项目里已有哪些可复用的代码/依赖 |
| 约束提醒 | 哪些约束不能违反（数据量、版本锁定、架构边界） |
| 风险预警 | 哪些地方可能出问题 |
| 工作量估算 | 乐观 / 可能 / 悲观三点估算（小时） |

### 触发词

| 你说... | 自动触发 |
|---------|---------|
| "影响分析"、"需求影响" | impact-analyzer |
| "风险预警"、"影响范围" | impact-analyzer |
| "复用建议"、"工作量估算" | impact-analyzer |

### 输出文件

报告自动保存到 `.chaos-harness/impact-report.md`。

---

## 上下文感知建议

**v1.3.3 新增**。在 AI 生成代码前，自动注入项目规范，确保生成的代码和老代码风格一致。

### 使用场景

- 新功能开发：AI 生成的代码命名、日志、异常处理和老代码一致
- 代码审查：快速了解当前文件所在模块的规范
- 依赖选择：优先复用已有依赖，不引入冲突

### 命令

```bash
# 获取编码建议
node scripts/context-advisor.mjs --advise "创建 UserExportService"

# 获取文件级上下文
node scripts/context-advisor.mjs --for-file src/service/UserService.java

# 指定目标项目
node scripts/context-advisor.mjs --advise "描述" --project-root /path/to/project
```

或通过 Slash 命令：`/chaos-harness:context-advisor`

### 建议维度

| 维度 | 说明 |
|------|------|
| 命名风格 | 和现有代码一致（PascalCase / camelCase / snake_case） |
| 依赖选择 | 优先复用已有依赖，不引入冲突 |
| 架构模式 | 和现有分层架构一致 |
| 异常处理 | 和现有 GlobalExceptionHandler 一致 |
| 日志格式 | 和现有 slf4j / log4j 格式一致 |

### 自动行为

PreToolUse Hook 在每次 Write/Edit 前自动触发，将项目规范注入 AI 上下文。无需手动调用。

### 触发词

| 你说... | 自动触发 |
|---------|---------|
| "上下文建议"、"编码建议" | context-advisor |
| "项目规范"、"代码风格" | context-advisor |

---

## Graphify 知识图谱

**核心能力**：项目理解 + 依赖分析 + God Nodes 识别 + 交互式可视化

### 前置条件

```bash
pip install graphifyy
```

### 两种模式

| 模式 | 配置 | 行为 |
|------|------|------|
| **强制模式** | `enabled: true` | 所有 AI 交互都必须先查询知识图谱 |
| **手动模式** | `enabled: false` | 仅手动调用时使用（默认） |

### 常用命令

| 命令 | 说明 |
|------|------|
| `/chaos-harness:graphify generate` | 生成项目知识图谱 |
| `/chaos-harness:graphify status` | 查看图谱状态和配置 |
| `/chaos-harness:graphify enable` | 开启强制模式 |
| `/chaos-harness:graphify disable` | 关闭强制模式 |
| `/chaos-harness:graphify query "X"` | 查询图谱 |
| `/chaos-harness:graphify path "A" "B"` | 查找依赖路径 |
| `/chaos-harness:graphify explain "X"` | 解释节点及其邻居 |
| `/chaos-harness:graphify visualize` | 打开交互式可视化 |

### 触发词

| 你说... | 自动触发 |
|---------|---------|
| "知识图谱"、"graphify" | graphify |
| "项目结构"、"依赖分析" | graphify |
| "god nodes"、"核心节点" | graphify |

### 自动行为

| 阶段 | 行为 |
|------|------|
| SessionStart | 自动检查图谱，不存在则生成（如果 `auto_generate: true`） |
| PreToolUse (Write/Edit) | 自动查询图谱，注入上下文（如果 `enabled: true`） |
| PostToolUse (Write/Edit) | 自动增量更新图谱（如果 `auto_update: true`） |

### 输出文件

| 文件 | 说明 |
|------|------|
| `graphify-out/graph.json` | 知识图谱（JSON，机器可读） |
| `graphify-out/GRAPH_REPORT.md` | 分析报告（God nodes、社区、意外依赖） |
| `graphify-out/graph.html` | 交互式可视化（浏览器打开） |

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
| 自然语言："继续"、"恢复" | project-state 恢复进度 |

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
3. **状态恢复** — project-state 恢复中断的会话

### 常用命令

| 命令 | 说明 |
|------|------|
| `/gate-manager status` | 全阶段进度仪表盘 |
| `/chaos-harness:project-state` | 项目状态恢复 |
| 自然语言："当前进度"、"Gate 状态" | gate-manager |

### 阶段流转

```
W01 需求 → W03 架构 → W08 开发 → W09 审查 → W10 测试 → W12 发布
```

每个阶段切换都自动执行对应 Gate 验证。

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
| `/chaos-harness:project-state` | 状态恢复 |

### 自然语言触发

| 你说... | 触发 |
|---------|------|
| "紧急"、"超频"、"overdrive" | overdrive |
| "知识图谱"、"graphify"、"项目结构" | graphify |
| "Gate 状态"、"阶段切换" | gate-manager |
| "搜索"、"质量检查" | dev-intelligence |
| "PRD"、"需求" | product-manager |
| "继续"、"恢复" | project-state |

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
/chaos-harness:project-state
```

### 常见问题

| 问题 | 解决 |
|------|------|
| Gate 阻断无法继续 | 查看阻断原因，修复后 recheck |
| Hook 报错 | 检查 `hooks/hooks.json` 配置 |
| 状态丢失 | 使用 `/chaos-harness:project-state` 恢复 |
| 版本号不一致 | 运行 `claude plugins marketplace list` 检查版本 |
