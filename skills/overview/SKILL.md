---
name: overview
description: Use when starting any conversation - establishes the Iron Laws that govern all behavior. 支持用户自定义铁律和插件扩展。触发词：扫描项目、生成Harness、工作流、铁律、偷懒检测、插件管理
---

<IMMEDIATE-ACTION>
加载此 skill 后，立即展示 Chaos Harness 概览和可用功能。不要等待用户进一步指示。
</IMMEDIATE-ACTION>

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
**Iron Laws are NON-NEGOTIABLE.**

核心铁律不可禁用，但用户可以新增自定义铁律。
所有插件必须在 Harness 约束下运行。
</EXTREMELY-IMPORTANT>

# Chaos Harness (万物入侵)

> **Chaos demands order. Harness provides it.**

## 核心铁律

以下铁律在所有情况下必须遵守（不可禁用）：

| ID | 铁律 | 说明 |
|----|------|------|
| **IL001** | NO DOCUMENTS WITHOUT VERSION LOCK | 所有文档必须在版本目录下 |
| **IL002** | NO HARNESS WITHOUT SCAN RESULTS | Harness 需要项目扫描数据 |
| **IL003** | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 完成声明需要实际验证 |
| **IL004** | NO VERSION CHANGES WITHOUT USER CONSENT | 版本变更需要用户确认 |
| **IL005** | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL | 敏感配置修改需要批准 |

## 用户自定义铁律

用户可以在 `.claude/harness/iron-laws.yaml` 中定义自己的铁律：

```yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库变更前必须创建备份"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE"
        action: block
```

**添加铁律：**
```
你: 添加铁律：周五禁止部署
Claude: [创建 IL-C002] 已添加自定义铁律
```

## 子 Skills

| Skill | 激活条件 | 功能 |
|-------|---------|------|
| `project-scanner` | 扫描项目、分析项目结构 | 检测项目类型、环境、依赖 |
| `version-locker` | 创建版本、锁定版本 | 版本管理和锁定 |
| `harness-generator` | 生成 Harness、创建约束 | 生成铁律和防绕过规则 |
| `workflow-supervisor` | 工作流、阶段管理 | 12阶段工作流管理 |
| `iron-law-enforcer` | **始终激活** | 铁律执行、支持用户自定义 |
| `learning-analyzer` | 学习记录≥5条、自学习分析 | 发现失败模式、优化铁律 |
| `product-lifecycle` | PRD、需求、原型、发布流程 | 产品全生命周期管理（10阶段） |
| `plugin-manager` | 插件管理、配置 | 管理外部插件和铁律扩展 |
| `hooks-manager` | 钩子管理、日志查看 | 管理自学习钩子系统 |
| `project-state` | 状态恢复、继续上次 | 会话持久化与恢复 |
| `collaboration-reviewer` | 评审、审查、协作 | 多Agent协作评审 |
| `auto-toolkit-installer` | 工具链检测、安装 | 自动安装依赖工具 |

## 插件系统

Chaos Harness 支持引入外部插件，但所有插件必须：

1. **接受铁律约束** — 无法绕过 Harness 铁律
2. **在版本目录下工作** — 遵循 IL001
3. **提供验证证据** — 遵循 IL003

### 插件集成示例

```yaml
# 外部插件示例配置
superpowers:
  enabled: true
  source: github:obra/superpowers
  stages:
    - W01  # brainstorming
    - W03  # writing-plans
    - W08  # tdd
    - W09  # code-review
```

### 插件管理

```
你: 安装 superpowers 插件
你: 禁用 openspec 的 W06 阶段
你: 查看插件列表
你: 添加自定义插件 local:~/.claude/plugins/my-plugin
```

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Chaos Harness                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    Iron Laws (铁律)                    │ │
│  │         核心铁律 + 用户自定义铁律                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                  Plugin Manager                        │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │ │
│  │  │super-   │  │open-    │  │custom-  │  │  ...    │  │ │
│  │  │powers   │  │spec     │  │plugins  │  │         │  │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 配置文件位置

```
~/.claude/harness/
├── plugins.yaml           # 插件配置
├── iron-laws.yaml         # 自定义铁律
├── plugin-log.json        # 插件执行日志
└── iron-law-log.json      # 铁律触发日志
```

## 防绕过规则

自动检测并反驳常见借口：

| 借口 | 反驳 |
|------|------|
| "这是简单修复" | 简单也需要验证。IL003。 |
| "跳过测试" | 测试是基本验证。IL003。 |
| "就这一次" | 每次例外都是先例。IL001。 |
| "老项目" | 老项目更需要约束。IL003。 |

## 偷懒模式检测

| ID | 模式 | 严重程度 |
|----|------|----------|
| LP001 | 声称完成但无验证证据 | Critical |
| LP002 | 跳过根因分析直接修复 | Critical |
| LP003 | 长时间无产出 | Warning |
| LP004 | 试图跳过测试 | Critical |
| LP005 | 擅自更改版本号 | Critical |
| LP006 | 自动处理高风险配置 | Critical |

## 使用示例

**扫描项目：**
```
用户: 帮我扫描当前项目
→ 激活 project-scanner
→ 执行项目类型检测
→ 生成扫描报告
```

**生成 Harness：**
```
用户: 生成这个项目的 Harness
→ 检查版本是否锁定 (IL001)
→ 检查扫描结果是否存在 (IL002)
→ 激活 harness-generator
→ 生成铁律和防绕过规则
```

**检测偷懒：**
```
用户: 我完成了
→ 激活 iron-law-enforcer
→ 检查是否有验证证据 (IL003)
→ 无证据 → 要求验证
```

## 安装

```bash
# 从 GitHub 克隆
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness

# 安装
chmod +x install.sh
./install.sh  # macOS/Linux
install.bat    # Windows

# 重启 Claude Code
```

## 项目结构

```
chaos-harness/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── skills/
│   ├── project-scanner/
│   ├── version-locker/
│   ├── harness-generator/
│   ├── workflow-supervisor/
│   └── iron-law-enforcer/
├── templates/           # Harness 模板
├── CLAUDE.md           # 项目记忆
└── README.md
```

---

*Chaos demands order. Harness provides it.*