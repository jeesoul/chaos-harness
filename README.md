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

**人人可用，灵活扩展：**
- 个人开发者：规范开发习惯，提升代码质量
- 团队协作：统一行为标准，降低沟通成本
- 开源项目：定制专属约束，构建项目特色

---

## 差异化特性

### 🧠 自学习生态闭环

```
项目行为 → 学习记录 → 规则优化 → 能力沉淀 → 专属Harness
    ↑                                              ↓
    └──────────────── 自动迭代 ←───────────────────┘
```

### 🔄 自适应 Harness 构建

| 输入 | 分析 | 输出 |
|------|------|------|
| 项目类型 | Java/Node/Python 自动识别 | 技术栈专属模板 |
| 代码规模 | Small/Medium/Large 分级 | 自适应工作流 |
| 团队行为 | 偷懒模式、绕过尝试统计 | 针对性铁律强化 |

### 🔌 开放插件生态

**支持第三方插件接入 Harness 约束体系：**

```yaml
# ~/.claude/harness/plugins.yaml
plugins:
  - name: superpowers
    enabled: true
    stages: [W01, W03, W08]  # 指定参与的工作流阶段
    iron_laws: inherit       # 继承 Harness 铁律约束
    
  - name: custom-tool
    enabled: true
    iron_laws:
      - IL-C001  # 自定义铁律
```

**插件接入后自动获得：**
- 铁律约束：插件行为受 Harness 监督
- 行为审计：操作日志自动记录
- 工作流集成：按阶段协调执行

### ⚡ 动态约束注入

根据上下文实时调整，无需静态配置：

```yaml
# 检测到私服配置 → 自动注入
iron_laws:
  - id: IL-AUTO-001
    rule: "NO DEPLOY WITHOUT PRIVATE REPO CHECK"
    auto_generated: true

# 检测到 JDK 8 → 自动降级兼容
workflow:
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

**扩展机制：** 支持自定义铁律、严重程度分级、触发模式配置。

### 行为检测系统

| 模式 | 检测条件 | 自动处置 |
|------|---------|---------|
| LP001 | 完成声明无验证 | 阻断 + 要求举证 |
| LP002 | 跳过根因分析 | 阻断 + 强制分析 |
| LP003 | 长时间无产出 | 施压 + 进度同步 |
| LP004 | 尝试跳过测试 | 阻断 + 强制执行 |

**绕过检测：** 自动识别 "简单修复"、"跳过测试" 等 10+ 种绕过话术。

### 钩子生态

全生命周期监控：

```
SessionStart → 注入铁律 + 恢复上下文
PreToolUse  → 铁律预检
PostToolUse → 行为学习 + 模式识别
Stop        → 完成验证
PreCompact  → 状态持久化
```

### 自适应工作流

12 阶段工作流自动适配项目规模：

| 规模 | 必经阶段 |
|------|---------|
| Small (≤100行) | 5 阶段 |
| Medium (100-500行) | 8 阶段 |
| Large (≥500行) | 全部 12 阶段 |

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
| `overview` | 系统概览、铁律状态、学习进度 |
| `project-scanner` | 项目分析、类型检测、自适应建议 |
| `version-locker` | 版本管理、变更追踪 |
| `harness-generator` | 约束生成、动态规则 |
| `workflow-supervisor` | 工作流编排、阶段控制 |
| `iron-law-enforcer` | 铁律执行、自定义扩展 |
| `collaboration-reviewer` | 多 Agent 协作、冲突检测 |
| `hooks-manager` | 钩子配置、行为审计 |
| `plugin-manager` | 插件管理、第三方接入 |
| `project-state` | 状态持久化、会话恢复 |

---

## 自定义扩展

### 添加铁律

```yaml
# ~/.claude/harness/iron-laws.yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE"
        action: block
```

### 接入第三方插件

```yaml
# ~/.claude/harness/plugins.yaml
plugins:
  - name: your-plugin
    enabled: true
    stages: [W01, W05, W08]
    iron_laws: inherit
```

---

## 模板支持

| 模板 | 技术栈 |
|------|--------|
| `java-spring` | Java 17/21 + Spring Boot 3.x |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x |
| `node-express` | Node.js Express |
| `python-django` | Python Django |
| `generic` | 通用项目 |

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