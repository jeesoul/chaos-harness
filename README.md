# Chaos Harness

**Claude Code Agent 约束框架**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Test Coverage](https://img.shields.io/badge/Tests-623-brightgreen.svg)]()

---

## 概述

Chaos Harness 是一个确定性的 AI Agent 约束框架，通过铁律、绕过检测和偷懒模式监控来强制执行不可协商的行为规则。与提供建议的咨询系统不同，Harness 使用禁止性规则，消除 Agent 可以规避质量要求的"偷懒空间"。

---

## 问题陈述

AI Agent 在开发工作流中表现出一致的行为模式，这些模式会损害质量：

| 模式 | 表现 |
|------|------|
| **无验证完成** | 声称任务完成但没有测试输出、审查确认 |
| **绕过尝试** | "这很简单"、"跳过测试"、"就这一次" |
| **根因回避** | 不进行调查就直接修复 |
| **配置漂移** | 未经授权更改敏感配置 |

传统方法使用咨询性指南（"应该验证"、"建议测试"），Agent 可以合理化地规避这些指南。

---

## 解决方案架构

### 铁律

五条核心不可协商规则，触发自动执行：

```
IL001: 无版本锁定，不生成文档
IL002: 无扫描结果，不生成 Harness  
IL003: 无验证证据，不声称完成
IL004: 无用户同意，不更改版本
IL005: 无明确批准，不改高风险配置
```

**执行模型：**

```
Agent: "任务完成"
        │
        ▼
    ┌───────────────────────────────────────┐
    │  铁律 IL003 触发                       │
    │  需要证据：                            │
    │  - 测试执行输出                        │
    │  - 验证命令结果                        │
    │  - 代码审查确认                        │
    └───────────────────────────────────────┘
        │
        ▼
    无证据 = 执行阻止
```

### 绕过检测引擎

基于模式匹配的检测与反驳生成：

| 检测规则 | 模式匹配 | 反驳策略 |
|----------|----------|----------|
| `simple-fix` | "简单"、"小事"、"容易" | IL003: 无论复杂度如何都需要验证 |
| `skip-test` | "跳过测试"、"不需要测试" | IL003: 测试是基准验证 |
| `just-once` | "就这一次"、"一次而已" | IL001: 每次例外都会成为先例 |
| `legacy-project` | "老项目"、"历史代码" | IL003: 历史项目需要更严格的约束 |
| `time-pressure` | "紧急"、"截止日期"、"快点" | IL003: 紧迫性增加风险，而非降低 |

### 偷懒模式监控

实时行为模式检测，按严重程度分类：

| 模式ID | 描述 | 严重程度 | 动作 |
|--------|------|----------|------|
| LP001 | 声称完成但无验证证据 | Critical | 阻止 |
| LP002 | 跳过根因调查 | Critical | 阻止 |
| LP003 | 长时间无输出 | Warning | 警告 |
| LP004 | 跳过测试执行 | Critical | 阻止 |
| LP005 | 擅自修改版本号 | Critical | 阻止 |
| LP006 | 自动处理高风险配置 | Critical | 阻止 |

### 自适应工作流引擎

12阶段工作流，基于规模的强制要求：

| 项目规模 | 定义 | 强制阶段 | 可跳过 |
|----------|------|----------|--------|
| 小型 | ≤5文件, ≤100行 | 5个阶段 | W02, W04, W07 |
| 中型 | 5-20文件, 100-500行 | 8个阶段 | W06 |
| 大型 | ≥20文件, ≥500行 | 全部12个阶段 | 无（IL001强制） |

**规模检测指标：**
- 文件数量分析
- 代码行数分析
- 复杂度指标聚合
- 自动规模升级触发

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chaos Harness                             │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   Scanner     │  │   Version     │  │   Harness     │        │
│  │   扫描模块    │  │   版本管理    │  │   生成模块    │        │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘        │
│          │                  │                  │                 │
│          └──────────────────┼──────────────────┘                 │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Iron Law Enforcer                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │    │
│  │  │铁律检查  │  │绕过检测  │  │偷懒监控  │  │施压引擎 │  │    │
│  │  │引擎      │  │          │  │          │  │         │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Workflow Supervisor                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │    │
│  │  │规模检测  │  │阶段管理  │  │跳过审批  │  │进度追踪 │  │    │
│  │  │          │  │          │  │          │  │         │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Plugin Manager                          │    │
│  │  约束注入 │ 来源管理 │ 阶段映射                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 双层架构设计

Chaos Harness 提供两种使用方式：

### 1. Skill 指令层（给 Claude Code 使用）

```
skills/
├── SKILL.md                    # 主入口，铁律定义
├── iron-law-enforcer/SKILL.md  # 铁律执行指令
├── project-scanner/SKILL.md    # 项目扫描指令
├── version-locker/SKILL.md     # 版本锁定指令
├── harness-generator/SKILL.md  # Harness生成指令
├── workflow-supervisor/SKILL.md # 工作流监督指令
└── plugin-manager/SKILL.md     # 插件管理指令
```

**工作原理：** Claude Code 启动时读取 `skills/*.md` 文件，按照其中的指令执行。这是**零配置**的方式，安装后直接对话即可使用。

### 2. 编程 API 层（给程序调用）

```
src/core/
├── scanner/           # 项目扫描 API
├── version-manager/   # 版本管理 API
├── env-fixer/         # 环境修复 API
├── harness-generator/ # Harness 生成 API
├── workflow-engine/   # 工作流引擎 API
└── mcp-server/        # MCP Server（可选）
```

**工作原理：** 发布为 npm 包，其他程序可以 `import` 调用。

**使用示例：**

```typescript
import {
  scan,
  generateScanReport,
  VersionManager,
  generateHarness,
  detectBypassAttempt,
  createWorkflowExecutor,
  quickDetectLaziness
} from 'chaos-harness';

// 扫描项目
const result = await scan({ projectRoot: '/path/to/project' });

// 版本管理
const versionManager = new VersionManager('./output');
await versionManager.initialize('v0.1');

// 生成 Harness
const harness = await generateHarness({
  scanResult: result,
  outputPath: './output/v0.1/Harness'
});

// 检测绕过尝试
const bypass = detectBypassAttempt('This is a simple fix');
if (bypass.detected) {
  console.log(bypass.matchedRule); // 'simple-fix'
}

// 创建工作流
const workflow = createWorkflowExecutor({
  projectScale: 'medium',
  enableSupervisor: true
});

// 检测偷懒模式
const laziness = quickDetectLaziness('agent-1', {
  claimedCompletion: true,
  ranVerification: false
});
```

---

## 插件系统

### 约束注入机制

所有外部插件在加载时必须接受铁律约束：

```yaml
constraints:
  enforce_iron_laws: true      # IL001-IL005 强制
  enforce_version_lock: true   # 输出必须在版本目录
  enforce_verification: true   # 完成需要证据
  enforce_supervisor: true     # 接受偷懒监控
```

**拒绝约束 = 拒绝加载**

### 插件来源支持

| 来源类型 | 格式 | 示例 |
|----------|------|------|
| GitHub | `github:owner/repo` | `github:obra/superpowers` |
| npm | `npm:package-name` | `npm:chaos-plugin` |
| 本地 | `local:/path` | `local:~/.claude/plugins/custom` |
| URL | `url:https://...` | `url:https://host/plugin.tar.gz` |

### 阶段-插件映射

```yaml
W08_development:
  required:
    - harness:iron-law-enforcer    # 始终强制
  optional:
    - external:skill-name          # 用户可配置

W09_code_review:
  required:
    - harness:iron-law-enforcer
  optional:
    - external:review-skill
```

---

## 自定义铁律

用户定义的铁律扩展约束系统：

```yaml
# ~/.claude/harness/iron-laws.yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库结构修改需要创建备份"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE|TRUNCATE"
        action: block
        message: "检测到数据库结构变更，需要先创建备份"
```

**严重程度动作：**
- `critical` → 阻止操作
- `warning` → 警告但允许继续
- `info` → 信息提示
- `require` → 要求额外操作

---

## 模板系统

五个预设模板覆盖常见技术栈：

| 模板 | 技术栈 | 检测条件 |
|------|--------|----------|
| `java-spring` | Java 17/21 + Spring Boot 3.x | pom.xml, Spring 注解 |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x | Legacy 兼容标记 |
| `node-express` | Node.js Express | package.json, Express 导入 |
| `python-django` | Python Django | requirements.txt, Django 导入 |
| `generic` | 通用兜底 | 默认行为 |

---

## 安装

```bash
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness

# macOS/Linux
chmod +x install.sh && ./install.sh

# Windows
install.bat

# 重启 Claude Code
```

**零配置** — Skills 在对话开始时自动激活。

---

## Skill 模块

| 模块 | 激活触发 | 功能 |
|------|----------|------|
| `project-scanner` | "扫描项目"、"分析结构" | 类型检测、环境验证 |
| `version-locker` | "创建版本"、"锁定版本" | 版本管理、会话锁定 |
| `harness-generator` | "生成 harness"、"创建约束" | 规则生成、绕过防护 |
| `workflow-supervisor` | "工作流"、"阶段管理" | 12阶段工作流、跳过审批 |
| `iron-law-enforcer` | 始终激活 | 铁律执行、自定义铁律支持 |
| `plugin-manager` | "插件"、"管理插件" | 外部插件配置 |

---

## 使用示例

### 项目扫描

```
你: 扫描当前项目

Harness: [project-scanner 激活]
         
         项目类型: java-spring (置信度: 98%)
         语言: Java 17
         框架: Spring Boot 3.2.0
         环境: JDK 17 ✓ Maven 3.9 ✓
```

### 铁律执行

```
你: 任务完成了

Harness: [iron-law-enforcer 触发]
         
         IL003 违规检测
         完成声明需要验证证据。
         
         需要: 测试输出 | 验证结果 | 审查确认
```

### 绕过检测

```
你: 这是个简单修复，可以跳过测试吗？

Harness: [bypass-detection 触发]
         
         规则匹配: simple-fix
         铁律引用: IL003
         
         简单修改也可能引入回归。
         所有变更都需要执行测试。
```

### 插件管理

```
你: 查看插件列表

Harness: 插件状态面板
         
         插件           版本    状态      阶段
         harness-core   1.0.0   核心      全部
         external-pkg   2.0.0   启用      W01,W08
         custom-plugin  1.0.0   禁用      W03
```

### 添加自定义铁律

```
你: 添加铁律：周五禁止部署

Harness: 铁律配置
         
         ID: IL-C002 (自动分配)
         规则: NO DEPLOYMENT ON FRIDAY
         严重程度: warning
         
         触发: day_of_week == Friday
         动作: 警告并提示风险
         
         确认添加？(是/取消)
```

---

## 项目结构

```
chaos-harness/
├── skills/                    # Skill 模块定义（Claude Code 使用）
│   ├── SKILL.md               # 主入口 + 铁律定义
│   ├── iron-law-enforcer/     # 铁律执行模块
│   ├── project-scanner/       # 项目扫描模块
│   ├── version-locker/        # 版本锁定模块
│   ├── harness-generator/     # Harness 生成模块
│   ├── workflow-supervisor/   # 工作流监督模块
│   └── plugin-manager/        # 插件管理模块
├── src/core/                  # 核心实现（编程 API）
│   ├── scanner/               # 扫描器实现
│   ├── version-manager/       # 版本管理实现
│   ├── env-fixer/             # 环境修复实现
│   ├── harness-generator/     # Harness 生成实现
│   ├── workflow-engine/       # 工作流引擎实现
│   └── mcp-server/            # MCP Server（可选接口）
├── templates/                 # 配置模板
│   ├── plugins.yaml           # 插件配置模板
│   ├── iron-laws.yaml         # 自定义铁律模板
│   └── [stack-templates]/     # 技术栈特定模板
├── tests/                     # 测试套件 (623 tests)
├── .claude-plugin/            # 插件元数据
├── CLAUDE.md                  # 项目记忆
└── README.md                  # 文档
```

---

## 开发

```bash
npm install
npm run build
npm test              # 623 测试用例
npm run coverage      # 覆盖率报告
```

---

## 许可证

MIT License — 详见 [LICENSE](LICENSE)

---

<p align="center">
<b>Chaos demands order. Harness provides it.</b>
<br>
混沌需要秩序，Harness 提供秩序
</p>