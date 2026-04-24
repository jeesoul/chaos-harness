# Chaos Harness 使用指南

> v1.3.2 Gate — 按角色快速上手

---

## 目录

- [通用安装](#通用安装)
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

安装后，Gate 状态机和 Hooks 自动拦截即刻生效，无需额外配置。

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
