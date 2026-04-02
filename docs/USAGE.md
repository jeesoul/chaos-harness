# Chaos Harness 使用文档

## 目录

- [快速开始](#快速开始)
- [铁律系统](#铁律系统)
- [Skill 模块详解](#skill-模块详解)
  - [project-scanner](#project-scanner)
  - [version-locker](#version-locker)
  - [harness-generator](#harness-generator)
  - [workflow-supervisor](#workflow-supervisor)
  - [iron-law-enforcer](#iron-law-enforcer)
  - [plugin-manager](#plugin-manager)
- [插件系统](#插件系统)
- [自定义铁律](#自定义铁律)
- [斜杠命令](#斜杠命令)
- [常见场景](#常见场景)

---

## 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness

# 安装
chmod +x install.sh && ./install.sh   # macOS/Linux
install.bat                            # Windows

# 重启 Claude Code
```

### 基本使用

安装完成后，直接在 Claude Code 中对话即可：

```
你: 帮我扫描当前项目
你: 创建版本 v0.1
你: 生成这个项目的 Harness
你: 列出所有铁律
```

---

## 铁律系统

### 核心铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | 无版本锁定，不生成文档 |
| IL002 | NO HARNESS WITHOUT SCAN RESULTS | 无扫描结果，不生成 Harness |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 无验证证据，不声称完成 |
| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT | 无用户同意，不更改版本 |
| IL005 | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL | 无明确批准，不改高风险配置 |

### 铁律执行流程

```
操作请求
    │
    ▼
检查是否违反铁律
    │
    ├── 违反 → 阻止 + 提示原因
    │
    └── 通过 → 允许执行
              │
              ▼
          验证完成（IL003）
```

---

## Skill 模块详解

### project-scanner

**功能：** 项目类型检测、环境验证、依赖分析

**触发方式：**
- 自然语言：`扫描项目`、`分析项目结构`、`检测项目类型`
- 斜杠命令：`/chaos-harness:project-scanner`

**使用示例：**

```
你: 扫描当前项目

Harness: 项目扫描结果
         
         项目类型: java-spring
         置信度: 98%
         
         语言: Java 17
         框架: Spring Boot 3.2.0
         构建工具: Maven 3.9.6
         
         环境检测:
         - JDK 17 ✓ 已安装
         - Maven 3.9 ✓ 已安装
         - Docker ✓ 已安装
         
         依赖分析:
         - spring-boot-starter-web
         - spring-boot-starter-data-jpa
         - mysql-connector-java
```

**输出内容：**
- 项目类型 + 置信度
- 语言版本
- 框架信息
- 构建工具
- 环境检测结果
- 主要依赖列表

---

### version-locker

**功能：** 版本管理、版本锁定、版本目录创建

**触发方式：**
- 自然语言：`创建版本`、`锁定版本`、`版本管理`
- 斜杠命令：`/chaos-harness:version-locker`

**使用示例：**

```
你: 创建版本 v0.1

Harness: 版本创建
         
         版本号: v0.1
         状态: 已锁定 ✓
         
         版本目录: ./output/v0.1/
         
         说明: Session 内版本号不可更改
               所有文档将在此目录下生成

你: 查看当前版本

Harness: 当前版本状态
         
         版本号: v0.1
         锁定时间: 2026-04-03 10:30:00
         版本目录: ./output/v0.1/
         
         生成文档:
         - scan-report.md
         - harness.yaml
```

**版本号格式：**
- 格式：`vX.Y`（如 v0.1, v1.0, v2.3）
- 锁定后 Session 内不可更改
- 需要更改需用户明确确认

---

### harness-generator

**功能：** 生成约束规则、防绕过机制、模板应用

**触发方式：**
- 自然语言：`生成 Harness`、`创建约束`、`配置铁律`
- 斜杠命令：`/chaos-harness:harness-generator`

**使用示例：**

```
你: 生成这个项目的 Harness

Harness: Harness 生成
         
         项目类型: java-spring
         应用模板: java-spring-template
         
         生成的铁律:
         - IL001-IL005 (核心铁律)
         - IL-J001: NO @Autowired ON FIELDS
         - IL-J002: NO SYSTEM.OUT IN PRODUCTION
         
         防绕过规则:
         - simple-fix: "简单修复" → 要求验证
         - skip-test: "跳过测试" → 引用 IL003
         - legacy-project: "老项目" → 更严格约束
         
         输出位置: ./output/v0.1/harness.yaml

你: 查看可用的模板

Harness: 可用模板
         
         模板名称              适用场景
         java-spring          Java 17/21 + Spring Boot 3.x
         java-spring-legacy   JDK 8 + Spring Boot 2.x
         node-express         Node.js Express
         python-django        Python Django
         generic              通用兜底
```

**模板选择规则：**
- 自动检测项目类型
- 匹配最适合的模板
- 用户可手动指定模板

---

### workflow-supervisor

**功能：** 12阶段工作流、规模检测、跳过审批

**触发方式：**
- 自然语言：`创建工作流`、`阶段管理`、`工作流状态`
- 斜杠命令：`/chaos-harness:workflow-supervisor`

**12阶段定义：**

| 阶段 | 名称 | 说明 |
|------|------|------|
| W01 | 需求设计 | 需求分析和设计 |
| W02 | 需求评审 | 需求评审确认 |
| W03 | 架构设计 | 技术架构设计 |
| W04 | 架构评审 | 架构评审确认 |
| W05 | 详细设计 | 详细设计文档 |
| W06 | API设计 | API接口设计 |
| W07 | 设计评审 | 设计评审确认 |
| W08 | 开发实现 | 编码实现 |
| W09 | 代码审查 | 代码审查确认 |
| W10 | 测试验证 | 测试执行验证 |
| W11 | 部署准备 | 部署准备工作 |
| W12 | 发布上线 | 正式发布 |

**使用示例：**

```
你: 创建工作流

Harness: 工作流创建
         
         项目规模: medium
         检测依据:
         - 文件数: 15
         - 代码行数: 3200
         
         工作流配置:
         - 必经阶段: W01, W03, W05, W08, W09, W10, W11, W12
         - 可跳过: W02, W04, W06, W07
         
         当前阶段: W01_需求设计
         
         下一步: 完成需求设计后进入 W03

你: 跳过 W02 阶段

Harness: 阶段跳过请求
         
         阶段: W02_需求评审
         项目规模: medium
         
         根据规模检测，W02 为可跳过阶段
         
         确认跳过？(是/否)
```

**规模检测规则：**

| 规模 | 定义 | 必经阶段 | 可跳过 |
|------|------|----------|--------|
| small | ≤5文件, ≤100行 | 5个 | W02, W04, W07 |
| medium | 5-20文件, 100-500行 | 8个 | W06 |
| large | ≥20文件, ≥500行 | 全部12个 | 无 |

---

### iron-law-enforcer

**功能：** 铁律执行、绕过检测、偷懒模式监控

**触发方式：**
- 始终激活，自动执行
- 斜杠命令：`/chaos-harness:iron-law-enforcer`

**偷懒模式检测：**

| ID | 模式 | 严重程度 | 动作 |
|----|------|----------|------|
| LP001 | 声称完成但无验证证据 | Critical | 阻止 |
| LP002 | 跳过根因分析直接修复 | Critical | 阻止 |
| LP003 | 长时间无产出 | Warning | 警告 |
| LP004 | 试图跳过测试 | Critical | 阻止 |
| LP005 | 擅自更改版本号 | Critical | 阻止 |
| LP006 | 自动处理高风险配置 | Critical | 阻止 |

**使用示例：**

```
你: 任务完成了

Harness: [IL003 铁律检查]
         
         检测到完成声明
         需要验证证据：
         
         请提供以下之一：
         - 测试执行输出
         - 验证命令结果
         - 代码审查确认

你: 这是个简单修复，可以跳过测试吗？

Harness: [绕过检测]
         
         匹配规则: simple-fix
         铁律引用: IL003
         
         简单修改也可能引入回归。
         所有变更都需要执行测试。
         
         建议：运行相关测试并提供输出

你: 查看所有铁律

Harness: 铁律列表
         
         核心铁律:
         IL001  无版本锁定，不生成文档
         IL002  无扫描结果，不生成 Harness
         IL003  无验证证据，不声称完成
         IL004  无用户同意，不更改版本
         IL005  无明确批准，不改高风险配置
         
         自定义铁律:
         IL-C001  数据库变更需要备份
         IL-C002  周五禁止部署
```

---

### plugin-manager

**功能：** 插件安装、配置、管理

**触发方式：**
- 自然语言：`插件列表`、`安装插件`、`管理插件`
- 斜杠命令：`/chaos-harness:plugin-manager`

**使用示例：**

```
你: 查看插件列表

Harness: Chaos Harness 插件状态
         
         插件           版本    状态      阶段
         ────────────────────────────────────────
         harness-core   1.0.0   核心      全部
         example-plugin 2.0.0   启用      W01,W08
         my-custom      1.0.0   禁用      W03

你: 安装插件 github:owner/plugin

Harness: 插件安装
         
         来源: github:owner/plugin
         
         ✓ 已克隆仓库
         ✓ 元数据验证通过
         ✓ 铁律约束已注入
         
         可用 Skills:
         - skill-1
         - skill-2
         
         默认阶段: W01, W08
         是否使用默认配置？(是/自定义)

你: 禁用 example-plugin

Harness: 插件配置更新
         
         插件: example-plugin
         状态: 已禁用
         
         该插件的 skills 将不再激活

你: 启用 example-plugin 只在 W08 阶段

Harness: 插件配置更新
         
         插件: example-plugin
         状态: 已启用
         激活阶段: W08_development
         
         其他阶段不会激活此插件
```

**插件来源格式：**

| 来源 | 格式 | 示例 |
|------|------|------|
| GitHub | `github:owner/repo` | `github:obra/superpowers` |
| npm | `npm:package-name` | `npm:my-plugin` |
| 本地 | `local:/path` | `local:~/.claude/plugins/my-plugin` |
| URL | `url:https://...` | `url:https://host/plugin.tar.gz` |

---

## 插件系统

### 约束注入

所有外部插件必须接受铁律约束：

```yaml
constraints:
  enforce_iron_laws: true      # 必须遵守 IL001-IL005
  enforce_version_lock: true   # 输出必须在版本目录
  enforce_verification: true   # 完成需要验证证据
  enforce_supervisor: true     # 接受偷懒监控
```

### 插件配置文件

配置文件位置：`~/.claude/harness/plugins.yaml`

```yaml
plugins:
  example-plugin:
    enabled: true
    source: github:owner/plugin
    stages:
      - W01_requirements_design
      - W08_development
    skills:
      - skill-1
      - skill-2
    constraints:
      enforce_iron_laws: true
```

---

## 自定义铁律

### 添加铁律

**方式一：对话添加**

```
你: 添加铁律：周五禁止部署

Harness: 铁律配置
         
         ID: IL-C002 (自动分配)
         Rule: NO DEPLOYMENT ON FRIDAY
         Description: 周五禁止部署
         Severity: warning
         
         触发条件: 当前日期为周五
         执行动作: 警告 + 提示风险
         
         确认添加？(是/取消)

你: 是的

Harness: ✓ 铁律 IL-C002 已添加
         配置已保存到 ~/.claude/harness/iron-laws.yaml
```

**方式二：配置文件**

编辑 `~/.claude/harness/iron-laws.yaml`：

```yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库变更前必须创建备份"
    severity: critical
    triggers:
      - type: pattern
        pattern: "ALTER TABLE|DROP TABLE|TRUNCATE"
        action: block
        message: "检测到数据库结构变更，请先创建备份"
```

### 铁律严重程度

| 级别 | 行为 | 使用场景 |
|------|------|----------|
| `critical` | 阻止操作 | 安全相关、数据保护 |
| `warning` | 警告但允许 | 风险提示、最佳实践 |
| `info` | 信息提示 | 建议性提示 |
| `require` | 要求额外操作 | 需要确认的操作 |

### 铁律 ID 命名规范

| 前缀 | 说明 |
|------|------|
| `IL001-IL099` | 核心铁律（保留） |
| `IL-C001-IL-C099` | 用户自定义 |
| `IL-T001-IL-T099` | 团队铁律 |
| `IL-P001-IL-P099` | 项目铁律 |
| `IL-J001-IL-J099` | Java 栈特定 |
| `IL-N001-IL-N099` | Node 栈特定 |

---

## 斜杠命令

完整命令列表：

| 命令 | 功能 |
|------|------|
| `/chaos-harness:chaos-harness` | 主入口，显示系统概览 |
| `/chaos-harness:project-scanner` | 扫描项目结构 |
| `/chaos-harness:version-locker` | 版本锁定管理 |
| `/chaos-harness:harness-generator` | 生成约束规则 |
| `/chaos-harness:workflow-supervisor` | 工作流管理 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行 |
| `/chaos-harness:plugin-manager` | 插件管理 |

---

## 常见场景

### 场景一：新项目初始化

```
你: 扫描当前项目

Harness: [扫描结果...]

你: 创建版本 v0.1

Harness: 版本已锁定: v0.1

你: 生成这个项目的 Harness

Harness: Harness 已生成
         输出位置: ./output/v0.1/harness.yaml
```

### 场景二：任务完成验证

```
你: 功能开发完成

Harness: [IL003] 需要验证证据
         
         请提供测试输出或验证结果

你: [粘贴测试输出]

Harness: ✓ 验证通过
         任务已完成
```

### 场景三：绕过检测

```
你: 跳过测试直接提交

Harness: [绕过检测]
         
         匹配规则: skip-test
         铁律引用: IL003
         
         测试是基本验证，不可跳过。
         请运行测试后提供输出。
```

### 场景四：添加自定义约束

```
你: 添加铁律：禁止在代码中硬编码密码

Harness: 铁律配置
         
         ID: IL-C003
         Rule: NO HARDCODED SECRETS IN CODE
         Severity: critical
         
         触发模式: password\s*=|secret\s*=|api_key\s*=
         动作: 阻止
         
         确认添加？

你: 是的

Harness: ✓ 铁律 IL-C003 已添加
```

### 场景五：工作流管理

```
你: 创建工作流

Harness: 工作流已创建
         规模: medium
         必经阶段: 8 个

你: 当前进度

Harness: 工作流状态
         
         当前阶段: W08_开发实现
         已完成: W01, W03, W05
         待完成: W09, W10, W11, W12
         
         进度: 50%
```

---

## 配置文件

### 目录结构

```
~/.claude/harness/
├── plugins.yaml           # 插件配置
├── iron-laws.yaml         # 自定义铁律
├── plugin-log.json        # 插件执行日志
└── iron-law-log.json      # 铁律触发日志
```

### plugins.yaml 示例

```yaml
harness:
  version: "1.0.0"
  iron_laws: required
  supervisor: required

plugins:
  example-plugin:
    enabled: true
    source: github:owner/plugin
    stages:
      - W08_development
    constraints:
      enforce_iron_laws: true
```

### iron-laws.yaml 示例

```yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库变更需要备份"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE"
        action: block
```

---

## 故障排除

### Skill 未激活

确保安装正确：
```bash
ls ~/.claude/plugins/chaos-harness/skills/
```

### 铁律未生效

检查配置文件：
```bash
cat ~/.claude/harness/iron-laws.yaml
```

### 插件加载失败

检查约束是否接受：
- 插件必须接受 IL001-IL005
- 查看 plugin-log.json 了解错误原因

---

*Chaos demands order. Harness provides it.*