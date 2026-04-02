# Chaos Harness 插件管理器

---
name: plugin-manager
description: 管理和配置插件、铁律扩展。触发词：插件管理、配置插件、添加铁律、自定义铁律
---

# 插件管理器 (Plugin Manager)

## 使用方式

### 查看已安装插件

```
你: 查看插件列表

Claude: ┌─────────────────────────────────────────────────────────┐
        │  Chaos Harness 插件状态                                 │
        ├─────────────────────────────────────────────────────────┤
        │  插件           │ 版本   │ 状态   │ 阶段               │
        ├─────────────────────────────────────────────────────────┤
        │  harness-core   │ 1.0.0  │ 🔒核心 │ 全部               │
        │  superpowers    │ 5.0.7  │ ✅启用 │ W01,W03,W08,W09   │
        │  openspec       │ 1.0.0  │ ✅启用 │ W01,W06           │
        │  my-custom      │ 1.0.0  │ ⏸️禁用 │ W08               │
        └─────────────────────────────────────────────────────────┘
        
        🔒 = 核心组件，不可禁用
```

### 安装插件

```
你: 安装 superpowers 插件

Claude: 正在安装 superpowers...

        ✅ 已从 github:obra/superpowers 克隆
        ✅ 插件元数据验证通过
        ✅ 铁律约束已注入
        
        可用 Skills:
        - brainstorming
        - writing-plans
        - test-driven-development
        - systematic-debugging
        - requesting-code-review
        
        默认启用阶段: W01, W03, W08, W09, W10
        是否使用默认配置？
```

### 配置插件阶段

```
你: superpowers 只在开发阶段使用

Claude: 已更新 superpowers 配置：
        
        启用阶段: W08_development
        
        其他阶段的 superpowers skills 将不会激活。
        是否保存配置？
```

### 添加自定义铁律

```
你: 添加铁律：禁止周五部署

Claude: 请确认铁律详情：
        
        ┌─────────────────────────────────────────────────────────┐
        │  ID: IL-C002 (自动分配)                                 │
        │  Rule: NO DEPLOYMENT ON FRIDAY                         │
        │  Description: 周五禁止部署                              │
        │  Severity: warning                                      │
        │                                                         │
        │  触发条件:                                              │
        │  - 当前日期为周五                                       │
        │  - 检测到部署相关命令                                   │
        │                                                         │
        │  执行动作: 警告 + 提示风险                              │
        └─────────────────────────────────────────────────────────┘
        
        确认添加？(是的/修改/取消)
```

### 查看铁律列表

```
你: 查看所有铁律

Claude: ┌─────────────────────────────────────────────────────────┐
        │  Chaos Harness 铁律列表                                 │
        ├─────────────────────────────────────────────────────────┤
        │  ID      │ 规则                              │ 来源     │
        ├─────────────────────────────────────────────────────────┤
        │  IL001   │ 无版本锁定，不生成文档            │ 🔒核心   │
        │  IL002   │ 无扫描结果，不生成Harness         │ 🔒核心   │
        │  IL003   │ 无验证证据，不声称完成            │ 🔒核心   │
        │  IL004   │ 无用户同意，不更改版本            │ 🔒核心   │
        │  IL005   │ 无明确批准，不改高风险配置        │ 🔒核心   │
        ├─────────────────────────────────────────────────────────┤
        │  IL-C001 │ 数据库变更前必须备份              │ 用户定义 │
        │  IL-C002 │ 周五禁止部署                      │ 用户定义 │
        └─────────────────────────────────────────────────────────┘
        
        🔒 = 核心铁律，不可禁用
```

## 配置文件位置

```
~/.claude/harness/
├── plugins.yaml           # 插件配置
├── iron-laws.yaml         # 自定义铁律
├── plugin-log.json        # 插件执行日志
└── iron-law-log.json      # 铁律触发日志
```

## 插件来源支持

| 来源 | 格式 | 示例 |
|------|------|------|
| GitHub | `github:owner/repo` | `github:obra/superpowers` |
| npm | `npm:package-name` | `npm:my-plugin` |
| 本地 | `local:/path` | `local:~/.claude/plugins/my-plugin` |
| URL | `url:https://...` | `url:https://example.com/plugin.tar.gz` |

## 内置插件模板

Chaos Harness 提供常用插件集成模板：

### superpowers 集成模板

```yaml
superpowers:
  enabled: true
  source: github:obra/superpowers
  skills:
    - brainstorming
    - writing-plans
    - test-driven-development
    - systematic-debugging
    - requesting-code-review
  stages:
    - W01_requirements_design
    - W03_architecture_design
    - W08_development
    - W09_code_review
    - W10_testing
```

### openspec 集成模板

```yaml
openspec:
  enabled: true
  source: github:openspec/openspec
  skills:
    - spec-writing
    - spec-validation
  stages:
    - W01_requirements_design
    - W06_api_design
```

## 创建自定义插件

### 插件目录结构

```
my-plugin/
├── plugin.yaml           # 插件元数据
├── skills/
│   └── my-skill/
│       └── SKILL.md      # Skill 定义
└── README.md
```

### plugin.yaml 示例

```yaml
name: my-custom-plugin
version: 1.0.0
description: 我的自定义插件
author: your-name

# 插件要求
requires:
  harness: ">=1.0.0"
  iron_laws: true      # 接受铁律约束
  version_lock: true   # 接受版本锁定

# 提供的 skills
provides:
  skills:
    - name: my-skill
      description: 我的 skill
      triggers:
        - "执行 my-skill"
        - "使用自定义功能"

# 兼容的阶段
compatible_stages:
  - W08_development
  - W10_testing

# 接受的约束
accepts_constraints:
  - enforce_iron_laws
  - enforce_version_lock
  - enforce_verification
```

### SKILL.md 示例

```markdown
---
name: my-skill
description: 我的自定义 skill
harness:
  iron_laws: bound      # 受铁律约束
  version_lock: bound   # 受版本锁定约束
---

# My Skill

## Harness 约束

此 skill 在 Harness 环境中执行，必须遵守：

1. **IL001**: 输出必须在版本目录下
2. **IL003**: 完成需要验证证据

## 使用方式

当用户说 "执行 my-skill" 时激活。

## 功能

...
```

## 管理命令

```
你: 安装插件 github:owner/repo
你: 卸载插件 my-plugin
你: 启用插件 my-plugin
你: 禁用插件 my-plugin
你: 更新插件 my-plugin
你: 查看插件详情 my-plugin
你: 添加铁律 "NO XXXX"
你: 删除铁律 IL-C001
你: 导出配置
你: 导入配置
```