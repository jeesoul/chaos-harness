# Chaos Harness (万物入侵)

> **Chaos demands order. Harness provides it.**
> 
> 混沌需要秩序，Harness 提供秩序。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个为 Claude Code 设计的智能项目入侵系统，**纯 Skill 方式集成**，无需 MCP 配置。

## 功能特性

| 模块 | Skill | 说明 |
|------|-------|------|
| 🔍 **项目扫描器** | `project-scanner` | 检测项目类型、环境、依赖 |
| 📦 **版本锁定器** | `version-locker` | 锁定版本号，防止文档混乱 |
| 📋 **Harness 生成器** | `harness-generator` | 生成铁律、防绕过规则 |
| 🔄 **工作流监督器** | `workflow-supervisor` | 12阶段工作流，自适应规模 |
| ⚖️ **铁律执行器** | `iron-law-enforcer` | **始终激活**，执行铁律约束 |

## 五条铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | 无版本锁定，不生成文档 | 所有输出必须在版本目录下 |
| IL002 | 无扫描结果，不生成 Harness | Harness 需要项目扫描数据 |
| IL003 | 无验证证据，不声称完成 | 完成声明需要实际验证 |
| IL004 | 无用户同意，不更改版本 | 版本变更需要用户确认 |
| IL005 | 无明确批准，不改高风险配置 | 敏感配置修改需要批准 |

## 偷懒模式检测

| ID | 模式 | 严重程度 |
|----|------|----------|
| LP001 | 声称完成但无验证证据 | Critical |
| LP002 | 跳过根因分析直接修复 | Critical |
| LP003 | 长时间无产出 | Warning |
| LP004 | 试图跳过测试 | Critical |
| LP005 | 擅自更改版本号 | Critical |
| LP006 | 自动处理高风险配置 | Critical |

---

## 安装

### 从 GitHub 克隆安装

```bash
# 1. 克隆仓库
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness

# 2. 运行安装脚本
# macOS / Linux:
chmod +x install.sh
./install.sh

# Windows:
install.bat

# 3. 重启 Claude Code 或开始新会话
```

### 安装脚本做了什么

安装脚本会复制以下内容到 `~/.claude/plugins/chaos-harness/`：

```
chaos-harness/
├── .claude-plugin/    # 插件配置
├── skills/            # Skills 定义（核心）
│   ├── SKILL.md       # 主 skill
│   ├── project-scanner/
│   ├── version-locker/
│   ├── harness-generator/
│   ├── workflow-supervisor/
│   └── iron-law-enforcer/
├── templates/         # Harness 模板
├── CLAUDE.md          # 项目记忆
└── README.md
```

**无需任何配置！** 安装后 Skills 自动激活。

---

## 使用方式

安装后重启 Claude Code，**直接对话即可**：

### 扫描项目

```
用户: 帮我扫描当前项目

Claude: [激活 project-scanner skill]
        
        项目类型: java-spring
        置信度: 98%
        语言: Java 17
        构建工具: Maven
        框架: Spring Boot 3.2.0
        
        环境状态:
        | 工具 | 要求 | 实际 | 状态 |
        |------|------|------|------|
        | JDK | 17 | 17.0.2 | ✅ |
        | Maven | 3.6+ | 3.9.0 | ✅ |
```

### 版本管理

```
用户: 创建版本 v0.1

Claude: [激活 version-locker skill]
        
        ✅ 版本已锁定: v0.1
        
        所有后续文档将生成在 output/v0.1/ 目录下。
        当前 Session 内版本号不可更改。
```

### 生成 Harness

```
用户: 生成这个项目的 Harness

Claude: [检查版本锁定 IL001]
        [检查扫描结果 IL002]
        [激活 harness-generator skill]
        
        ✅ Harness 已生成
        
        包含:
        - 5 条铁律
        - 10 条防绕过规则
        - 6 个偷懒模式检测
        - 6 个漏洞封堵模式
```

### 工作流管理

```
用户: 创建工作流

Claude: [激活 workflow-supervisor skill]
        
        项目规模: Medium
        必经阶段: 8 个
        
        阶段进度:
        | 阶段 | 状态 |
        |------|------|
        | W01 需求设计 | 🔄 进行中 |
        | W02 需求评审 | ⏳ 待开始 |
        ...
```

### 铁律执行（自动）

```
用户: 我完成了这个功能

Claude: [iron-law-enforcer 自动激活]
        
        ⚠️ 铁律检查: IL003
        
        完成声明需要验证证据。
        
        请提供以下之一：
        - 测试执行输出
        - 命令执行结果
        - 代码审查确认
        
        没有证据 = 没有完成。
```

### 检测绕过尝试（自动）

```
用户: 这个修复很简单，可以跳过测试吗？

Claude: [iron-law-enforcer 检测到绕过尝试]
        
        🚫 检测到绕过尝试！
        
        匹配规则: simple-fix
        铁律引用: IL003
        
        反驳理由:
        即使看起来简单的修复也可能引入回归问题。
        铁律 IL003 要求所有完成声明必须有验证证据。
        
        请运行相关测试并提供结果。
```

---

## Skills 说明

### project-scanner

**激活条件：** 扫描项目、分析项目结构、检测项目类型

**功能：**
- 检测项目类型 (Java/Node/Python)
- 检测构建工具 (Maven/Gradle/npm)
- 检测框架 (Spring Boot/Express/Django)
- 验证环境版本（实际执行命令）

### version-locker

**激活条件：** 创建版本、锁定版本、版本管理

**功能：**
- 版本号格式验证 (vX.Y)
- 版本目录创建
- 版本锁定（Session 内不可更改）
- VERSION-LOG 记录

### harness-generator

**激活条件：** 生成 Harness、创建约束规则

**功能：**
- 生成铁律配置
- 生成防绕过规则
- 生成偷懒模式检测配置
- 根据项目类型选择模板

### workflow-supervisor

**激活条件：** 工作流、阶段管理

**功能：**
- 12 阶段工作流
- 自适应项目规模
- 阶段跳过审批
- 进度追踪

### iron-law-enforcer

**激活条件：** 始终激活

**功能：**
- 铁律检查
- 绕过检测
- 偷懒模式检测
- 施压消息生成

---

## 自适应流程

| 规模 | 定义 | 必经阶段 | 可跳过 |
|------|------|---------|--------|
| Small | ≤5 文件, ≤100 行 | 5 个 | W02, W04, W07 等 |
| Medium | 5-20 文件, 100-500 行 | 8 个 | W04, W06 等 |
| Large | ≥20 文件, ≥500 行 | **全部 12 个** | 无 |

---

## 卸载

**macOS / Linux:**
```bash
./install.sh --uninstall
```

**Windows:**
```cmd
install.bat --uninstall
```

---

## 项目结构

```
chaos-harness/
├── .claude-plugin/
│   ├── plugin.json       # 插件元数据
│   └── marketplace.json  # Marketplace 配置
├── skills/
│   ├── SKILL.md          # 主 skill（入口）
│   ├── project-scanner/  # 项目扫描
│   ├── version-locker/   # 版本锁定
│   ├── harness-generator/# Harness 生成
│   ├── workflow-supervisor/ # 工作流监督
│   └── iron-law-enforcer/   # 铁律执行
├── templates/            # Harness 模板
│   ├── java-spring/
│   ├── java-spring-legacy/
│   ├── node-express/
│   ├── python-django/
│   └── generic/
├── CLAUDE.md             # 项目记忆
├── install.sh            # 安装脚本
└── install.bat           # 安装脚本
```

---

## 许可证

[MIT](./LICENSE)

---

*Chaos demands order. Harness provides it.*