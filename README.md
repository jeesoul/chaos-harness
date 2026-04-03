# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg">
  <img src="https://img.shields.io/badge/tests-623-passing-brightgreen.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>确定性 AI Agent 约束框架</strong></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

---

## 核心定位

**首个具备自学习、自适应能力的 Claude Code Agent 治理框架。**

通过**铁律引擎**强制执行确定性行为，通过**自适应系统**动态构建项目专属约束生态，实现从"被动约束"到"主动治理"的跃迁。

---

## 差异化特性

### 🧠 自学习生态闭环

```
项目行为 → 学习记录 → 规则优化 → 能力沉淀 → 专属Harness
    ↑                                              ↓
    └──────────────── 自动迭代 ←───────────────────┘
```

- **行为学习**：Hook 自动记录 Agent 决策路径与结果
- **规则进化**：根据历史模式自动补充约束规则
- **能力沉淀**：项目专属 Harness 持续增强

### 🔄 自适应 Harness 构建

| 输入 | 分析 | 输出 |
|------|------|------|
| 项目类型 | Java/Node/Python 自动识别 | 技术栈专属模板 |
| 代码规模 | Small/Medium/Large 分级 | 自适应工作流 |
| 团队行为 | 偷懒模式、绕过尝试统计 | 针对性铁律强化 |
| 历史缺陷 | 模式匹配、根因聚类 | 预防性约束注入 |

### ⚡ 动态约束注入

不依赖静态配置，根据上下文实时调整：

```yaml
# 检测到私服配置 → 自动注入
iron_laws:
  - id: IL-AUTO-001
    rule: "NO DEPLOY WITHOUT PRIVATE REPO CHECK"
    auto_generated: true
    source: "detected_nexus_config"

# 检测到 JDK 8 → 自动降级兼容
workflow:
  stage: "build"
  compatibility_mode: "jdk8-legacy"
```

---

## 核心能力

### 铁律引擎

声明式规则 + 自动执行：

| 铁律 | 约束行为 |
|------|---------|
| IL001 | 文档必须在版本目录生成 |
| IL002 | Harness 生成依赖扫描数据 |
| IL003 | 完成声明必须附带验证证据 |
| IL004 | 版本变更需要用户确认 |
| IL005 | 敏感配置修改需要审批 |

**扩展机制**：支持自定义铁律、严重程度分级、触发模式配置。

### 行为检测系统

**偷懒模式检测：**
| 模式 | 检测条件 | 自动处置 |
|------|---------|---------|
| LP001 | 完成声明无验证 | 阻断 + 要求举证 |
| LP002 | 跳过根因分析 | 阻断 + 强制分析 |
| LP003 | 长时间无产出 | 施压 + 进度同步 |
| LP004 | 尝试跳过测试 | 阻断 + 强制执行 |

**绕过检测：** 自动识别 "简单修复"、"跳过测试"、"就这一次" 等 10+ 种绕过话术并驳回。

### 钩子生态

全生命周期监控与自动干预：

```
SessionStart → 注入铁律 + 恢复上下文
PreToolUse  → 铁律预检 + 权限验证
PostToolUse → 行为学习 + 模式识别
Stop        → 完成验证 + 结果审计
PreCompact  → 状态持久化 + 能力沉淀
```

### 自适应工作流

12 阶段工作流自动适配项目规模：

| 规模 | 必经阶段 | 可跳过阶段 |
|------|---------|-----------|
| Small (≤100行) | 5 阶段 | 7 阶段 |
| Medium (100-500行) | 8 阶段 | 4 阶段 |
| Large (≥500行) | 全部 12 阶段 | 无 |

---

## 安装

```bash
git clone https://github.com/jeesoul/chaos-harness.git
claude plugins marketplace add "路径"
claude plugins install chaos-harness@chaos-harness
# 重启 Claude Code
/chaos-harness:overview
```

---

## 命令

| 命令 | 功能 |
|------|------|
| `/chaos-harness:overview` | 系统概览、铁律状态、学习进度 |
| `/chaos-harness:project-scanner` | 项目分析、类型检测、自适应建议 |
| `/chaos-harness:version-locker` | 版本管理、变更追踪、锁定机制 |
| `/chaos-harness:harness-generator` | 约束生成、动态规则、专属模板 |
| `/chaos-harness:workflow-supervisor` | 工作流编排、阶段控制、进度同步 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行、绕过拦截、自定义扩展 |
| `/chaos-harness:collaboration-reviewer` | 多 Agent 协作、冲突检测、评审流程 |
| `/chaos-harness:hooks-manager` | 钩子配置、学习日志、行为审计 |
| `/chaos-harness:plugin-manager` | 插件管理、约束注入、生态扩展 |
| `/chaos-harness:project-state` | 状态持久化、会话恢复、进度追踪 |

---

## 技术架构

```
┌────────────────────────────────────────────────────┐
│                Chaos Harness Core                   │
├────────────────────────────────────────────────────┤
│  ┌──────────┐   ┌──────────┐   ┌──────────┐       │
│  │ Iron Law │   │ Adaptive │   │ Learning │       │
│  │  Engine  │   │  Builder │   │  System  │       │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘       │
│       │              │              │              │
│       └──────────────┼──────────────┘              │
│                      ▼                             │
│           ┌──────────────────┐                     │
│           │ Hook Orchestrator│                     │
│           └────────┬─────────┘                     │
│       ┌────────────┼────────────┐                  │
│       ▼            ▼            ▼                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │Workflow │ │ Scanner │ │ Plugins │              │
│  │ Engine  │ │   +     │ │ Manager │              │
│  │         │ │Analyzer │ │         │              │
│  └─────────┘ └─────────┘ └─────────┘              │
└────────────────────────────────────────────────────┘
```

---

## 模板生态

| 模板 | 技术栈 | 特殊支持 |
|------|--------|---------|
| `java-spring` | Java 17/21 + Spring Boot 3.x | Spring 注解扫描 |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x | 兼容模式、降级策略 |
| `node-express` | Node.js Express | npm/yarn 智能识别 |
| `python-django` | Python Django | 虚拟环境检测 |
| `generic` | 通用项目 | 语言无关约束 |

---

## 开发

```bash
npm install && npm run build && npm test
```

---

## 许可证

[MIT](LICENSE)

---

<p align="center"><strong>Chaos demands order. Harness provides it.</strong></p>