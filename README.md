# Chaos Harness

<p align="center">
  <strong>确定性 AI Agent 约束框架</strong>
</p>

<p align="center">
  <em>Chaos demands order. Harness provides it.</em>
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#架构">架构</a> •
  <a href="#安装">安装</a> •
  <a href="#使用">使用</a> •
  <a href="#文档">文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Tests-623-brightgreen.svg" alt="Tests">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js">
</p>

---

## 为什么需要 Chaos Harness？

AI Agent 在软件工程场景中存在**确定性行为缺失**问题：

| 问题 | 表现 | 后果 |
|------|------|------|
| **不可信的完成声明** | "任务完成了" 但无测试输出、无审查确认 | 引入未验证代码 |
| **系统性绕过尝试** | "这很简单"、"跳过测试"、"就这一次" | 质量债务累积 |
| **根因分析缺失** | 直接修复，不调查原因 | 问题反复出现 |
| **约束软化** | 建议性规则被 Agent 合理化规避 | 约束形同虚设 |

**Chaos Harness 的解决方案：** 用**不可协商的铁律（Iron Laws）** 替代建议性规则，消除 Agent 可以规避质量要求的"灰色空间"。

---

## 特性

### 🏛️ 铁律系统

五条核心铁律，自动执行，无法绕过：

```
┌─────────────────────────────────────────────────────────────────┐
│  IL001  │  NO DOCUMENTS WITHOUT VERSION LOCK                    │
│  IL002  │  NO HARNESS WITHOUT SCAN RESULTS                      │
│  IL003  │  NO COMPLETION CLAIMS WITHOUT VERIFICATION            │
│  IL004  │  NO VERSION CHANGES WITHOUT USER CONSENT              │
│  IL005  │  NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL   │
└─────────────────────────────────────────────────────────────────┘
```

**与建议性规则的本质区别：**

| 传统方式 | Chaos Harness |
|----------|---------------|
| "建议验证后再提交" | `IL003: 无验证 = 阻止` |
| "应该运行测试" | `IL003: 无测试输出 = 未完成` |
| "推荐创建备份" | `IL-C001: 无备份 = 阻止变更` |

### 🛡️ 绕过检测引擎

基于模式匹配的实时检测与反驳生成：

```python
# 检测示例
Agent: "这是个简单修复，可以跳过测试吗？"

Harness:
  匹配规则: simple-fix
  铁律引用: IL003
  反驳策略: "简单修改也可能引入回归。所有变更都需要执行测试。"
```

**预置检测规则：**

| 规则 | 模式 | 反驳策略 |
|------|------|----------|
| `simple-fix` | 简单、小事、容易 | 复杂度不降低验证要求 |
| `skip-test` | 跳过测试、不需要测试 | 测试是基准验证 |
| `just-once` | 就这一次、一次而已 | 每次例外都是先例 |
| `legacy-project` | 老项目、历史代码 | 历史项目需更严格约束 |
| `time-pressure` | 紧急、截止、快点 | 紧迫性增加风险 |

### 🕵️ 偷懒模式监控

实时行为模式检测，自动介入：

| 模式 | 检测条件 | 严重程度 | 动作 |
|------|----------|----------|------|
| LP001 | 声称完成但无验证证据 | Critical | 阻止 |
| LP002 | 跳过根因分析直接修复 | Critical | 阻止 |
| LP003 | 长时间无产出 | Warning | 警告 |
| LP004 | 试图跳过测试 | Critical | 阻止 |
| LP005 | 擅自更改版本号 | Critical | 阻止 |
| LP006 | 自动处理高风险配置 | Critical | 阻止 |

### 📊 自适应工作流

12阶段工作流，基于项目规模动态调整：

```
项目规模检测 ────────────────────────────────────────┐
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Small (≤5文件, ≤100行)    │  必经 5 阶段，可跳过 7 阶段        │
│  Medium (5-20文件)         │  必经 8 阶段，可跳过 4 阶段        │
│  Large (≥20文件, ≥500行)   │  必经全部 12 阶段，零例外          │
└─────────────────────────────────────────────────────────────────┘
```

### 🔌 插件生态系统

**约束注入机制** — 所有外部插件必须接受铁律约束：

```yaml
# 插件加载时的强制约束
constraints:
  enforce_iron_laws: true      # IL001-IL005 强制
  enforce_version_lock: true   # 输出在版本目录
  enforce_verification: true   # 完成需证据
  enforce_supervisor: true     # 接受监控
```

**拒绝约束 = 拒绝加载**

### ⚖️ 自定义铁律

用户可扩展约束体系：

```yaml
# ~/.claude/harness/iron-laws.yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE|TRUNCATE"
        action: block
```

---

## 架构

### 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Chaos Harness                                │
│                                                                      │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│   │   Scanner   │   │   Version   │   │   Harness   │              │
│   │   扫描模块  │   │   版本管理  │   │   生成模块  │              │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘              │
│          │                 │                 │                      │
│          └─────────────────┼─────────────────┘                      │
│                            │                                         │
│                            ▼                                         │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                    Iron Law Enforcer                        │    │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐  │    │
│   │  │ 铁律检查  │  │ 绕过检测  │  │ 偷懒监控  │  │ 施压引擎│  │    │
│   │  └───────────┘  └───────────┘  └───────────┘  └─────────┘  │    │
│   └────────────────────────────────────────────────────────────┘    │
│                            │                                         │
│                            ▼                                         │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                   Workflow Supervisor                       │    │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐  │    │
│   │  │ 规模检测  │  │ 阶段管理  │  │ 跳过审批  │  │ 进度追踪│  │    │
│   │  └───────────┘  └───────────┘  └───────────┘  └─────────┘  │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                    Plugin Manager                           │    │
│   │         约束注入  │  来源管理  │  阶段映射                  │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 双层架构

Chaos Harness 提供两种使用方式：

| 层级 | 说明 | 适用场景 |
|------|------|----------|
| **Skill 指令层** | Claude Code 直接读取执行的 Markdown 指令 | Claude Code 用户 |
| **编程 API 层** | 可发布 npm 包，供程序调用 | 工具开发者、自动化集成 |

```typescript
// 编程 API 示例
import { scan, detectBypassAttempt, createWorkflowExecutor } from 'chaos-harness';

const result = await scan({ projectRoot: './project' });
const bypass = detectBypassAttempt('This is a simple fix');
const workflow = createWorkflowExecutor({ projectScale: 'medium' });
```

---

## 安装

```bash
# 克隆仓库
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness

# 安装
chmod +x install.sh && ./install.sh   # macOS/Linux
install.bat                            # Windows

# 重启 Claude Code
```

**零配置** — 安装后 Skills 自动激活。

---

## 使用

### 自然语言触发

```
你: 扫描当前项目
你: 创建版本 v0.1
你: 生成这个项目的 Harness
你: 列出所有铁律
你: 添加铁律：周五禁止部署
```

### 斜杠命令

```
/chaos-harness:project-scanner      # 扫描项目
/chaos-harness:version-locker       # 版本管理
/chaos-harness:harness-generator    # 生成约束
/chaos-harness:workflow-supervisor  # 工作流
/chaos-harness:iron-law-enforcer    # 铁律执行
/chaos-harness:plugin-manager       # 插件管理
```

### 示例：完成验证

```
你: 任务完成了

Harness: [IL003 铁律检查]
         
         检测到完成声明，需要验证证据：
         - 测试执行输出
         - 验证命令结果
         - 代码审查确认

你: [粘贴测试输出]

Harness: ✓ 验证通过，任务完成
```

### 示例：绕过检测

```
你: 这是个简单修复，跳过测试？

Harness: [绕过检测触发]
         
         匹配规则: simple-fix
         铁律引用: IL003
         
         简单修改也可能引入回归。
         所有变更都需要执行测试。
```

---

## 模板系统

| 模板 | 技术栈 | 检测条件 |
|------|--------|----------|
| `java-spring` | Java 17/21 + Spring Boot 3.x | pom.xml, Spring 注解 |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x | Legacy 兼容标记 |
| `node-express` | Node.js Express | package.json, Express |
| `python-django` | Python Django | requirements.txt, Django |
| `generic` | 通用 | 默认 |

---

## 文档

| 文档 | 说明 |
|------|------|
| [使用文档](docs/USAGE.md) | 完整的使用指南 |
| [插件系统设计](docs/plugin-system-design.md) | 插件架构说明 |

---

## 开发

```bash
npm install
npm run build
npm test              # 623 测试用例
npm run coverage      # 覆盖率报告
```

---

## 项目结构

```
chaos-harness/
├── skills/                    # Skill 模块定义
│   ├── SKILL.md               # 主入口
│   ├── iron-law-enforcer/     # 铁律执行
│   ├── project-scanner/       # 项目扫描
│   ├── version-locker/        # 版本锁定
│   ├── harness-generator/     # Harness 生成
│   ├── workflow-supervisor/   # 工作流监督
│   └── plugin-manager/        # 插件管理
├── src/core/                  # 核心 API 实现
│   ├── scanner/               # 扫描器
│   ├── version-manager/       # 版本管理
│   ├── env-fixer/             # 环境修复
│   ├── harness-generator/     # Harness 生成
│   ├── workflow-engine/       # 工作流引擎
│   └── mcp-server/            # MCP Server
├── templates/                 # 配置模板
├── tests/                     # 测试套件
└── docs/                      # 文档
```

---

## 许可证

[MIT](LICENSE)

---

<p align="center">
  <strong>Chaos demands order. Harness provides it.</strong>
</p>