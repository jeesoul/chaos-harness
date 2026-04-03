# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg">
  <img src="https://img.shields.io/badge/tests-623-passing-brightgreen.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg">
</p>

<p align="center">
  <strong>确定性 AI Agent 约束框架</strong><br>
  <em>Chaos demands order. Harness provides it.</em>
</p>

---

## 项目定位

**Chaos Harness 是首个面向 Claude Code 的企业级 Agent 治理框架**，通过声明式铁律（Iron Laws）解决 AI Agent 在软件开发中的**确定性行为缺失**问题。

**核心价值主张：**
- 🛡️ **强制验证** - 消除"声称完成但无证据"的交付风险
- 🔒 **约束硬化** - 建议性规则升级为零解释空间的铁律
- 🕵️ **行为审计** - 实时检测绕过尝试与偷懒模式
- 🔄 **自纠正闭环** - Hook 机制实现自动干预与学习记录

---

## 核心能力

### 铁律引擎 (Iron Law Engine)

声明式规则定义，自动拦截违规行为：

```yaml
# 预置铁律（不可禁用）
IL001: NO DOCUMENTS WITHOUT VERSION LOCK
IL002: NO HARNESS WITHOUT SCAN RESULTS  
IL003: NO COMPLETION CLAIMS WITHOUT VERIFICATION
IL004: NO VERSION CHANGES WITHOUT USER CONSENT
IL005: NO HIGH-RISK CONFIG WITHOUT APPROVAL

# 自定义铁律
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE"
        action: block
```

### 行为检测系统

| 检测类型 | 触发条件 | 处置动作 |
|---------|---------|---------|
| LP001 | 完成声明无验证证据 | 阻断 + 要求举证 |
| LP002 | 跳过根因分析 | 阻断 + 强制分析 |
| LP003 | 长时间无产出 | 施压 + 进度同步 |
| LP004 | 尝试跳过测试 | 阻断 + 强制执行 |
| BP-* | 绕过关键词检测 | 自动驳回 + 铁律引用 |

### 钩子生态 (Hook System)

全生命周期监控与干预：

```
SessionStart → 注入铁律上下文
    ↓
PreToolUse → 铁律预检 (IL001/IL005)
    ↓
PostToolUse → 偷懒检测 + 学习记录
    ↓
Stop → 完成声明验证 (IL003)
    ↓
PreCompact → 上下文持久化
```

### 工作流编排

12 阶段自适应工作流，根据项目规模自动调整阶段通过条件：

| 规模 | 文件数 | 代码行数 | 必经阶段 |
|------|--------|---------|---------|
| Small | ≤5 | ≤100 | 5 阶段 |
| Medium | 5-20 | 100-500 | 8 阶段 |
| Large | ≥20 | ≥500 | 全部 12 阶段 |

---

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                  Chaos Harness                       │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Iron Laws   │  │  Bypass     │  │  Laziness   │  │
│  │   Engine    │  │  Detection  │  │  Detection  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │         │
│         └────────────────┼────────────────┘         │
│                          ▼                          │
│              ┌─────────────────────┐                │
│              │   Hook Orchestrator │                │
│              └─────────────────────┘                │
│                          │                          │
│         ┌────────────────┼────────────────┐         │
│         ▼                ▼                ▼         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Workflow   │  │  Project    │  │   Plugin    │  │
│  │   Engine    │  │   Scanner   │  │   Manager   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 快速开始

```bash
# 安装
git clone https://github.com/jeesoul/chaos-harness.git
claude plugins marketplace add "路径"
claude plugins install chaos-harness@chaos-harness

# 验证
/chaos-harness:overview
```

---

## 命令参考

| 命令 | 功能描述 |
|------|---------|
| `overview` | 系统概览、铁律状态、插件列表 |
| `project-scanner` | 项目类型检测、依赖分析、环境验证 |
| `version-locker` | 版本目录管理、锁定机制、变更追踪 |
| `harness-generator` | 约束规则生成、模板选择、动态补充 |
| `workflow-supervisor` | 阶段管理、进度追踪、自适应调整 |
| `iron-law-enforcer` | 铁律执行、绕过拦截、自定义扩展 |
| `collaboration-reviewer` | 多 Agent 协作、评审流程、冲突检测 |
| `hooks-manager` | 钩子配置、日志审计、性能监控 |
| `plugin-manager` | 插件安装、约束注入、版本管理 |
| `project-state` | 状态持久化、会话恢复、进度同步 |

---

## 企业级特性

- ✅ **零配置启动** - 预置铁律开箱即用
- ✅ **渐进式约束** - 从核心铁律到自定义规则
- ✅ **审计追踪** - 完整的行为日志与决策记录
- ✅ **模板生态** - Java/Node/Python/通用项目模板
- ✅ **插件扩展** - 支持自定义铁律与工作流阶段

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Node.js 18+ |
| 语言 | TypeScript 5.x |
| 测试 | Vitest (623 test cases) |
| 包管理 | npm |

---

## 适用场景

- 🔹 **企业开发团队** - 强制代码审查与测试覆盖率
- 🔹 **关键业务系统** - 敏感操作审批与审计
- 🔹 **外包项目管理** - 交付质量与进度把控
- 🔹 **个人开发者** - 规范化开发流程养成

---

## 开源协议

[MIT License](LICENSE)

---

<p align="center">
  <strong>Chaos demands order. Harness provides it.</strong>
</p>