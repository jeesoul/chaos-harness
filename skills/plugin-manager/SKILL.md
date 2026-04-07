---
name: plugin-manager
description: 管理和配置插件、铁律扩展。触发词：插件管理、配置插件、添加铁律、自定义铁律
---

<STATE-WRITE-REQUIRED>
**插件配置变更后必须写入状态：**
1. 使用 Edit 工具更新 `.chaos-harness/plugins.yaml`
2. 使用 Edit 工具追加到 `~/.claude/harness/workflow-log.json`

不写入状态 = 配置变更未被持久化
</STATE-WRITE-REQUIRED>

# Chaos Harness 插件管理器

## 执行规则

**加载此 skill 后，根据用户请求执行：**

### 查看插件列表

使用 Read 工具读取：
- `~/.claude/plugins/installed_plugins.json`
- `~/.claude/harness/plugins.yaml`

输出格式：

```
┌─────────────────────────────────────────────────────────────┐
│  已安装插件                                                  │
├─────────────────────────────────────────────────────────────┤
│  插件名              │ 版本   │ 状态                        │
├─────────────────────────────────────────────────────────────┤
│  chaos-harness       │ 1.0.0  │ 🔒 核心                      │
│  superpowers         │ 5.0.2  │ ✅ 启用                      │
│  pua                 │ 1.2.0  │ ✅ 启用                      │
└─────────────────────────────────────────────────────────────┘
```

### 添加自定义铁律

**步骤：**
1. 使用 Read 检查 `.claude/harness/iron-laws.yaml`
2. 如果不存在，使用 Write 创建
3. 使用 Edit 添加新铁律

**格式：**
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

### 管理配置目录

使用 Bash 创建必要的目录：

```bash
mkdir -p ~/.claude/harness
```

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
        │  example-plugin │ 1.0.0  │ ✅启用 │ W01,W03,W08       │
        └─────────────────────────────────────────────────────────┘
```

### 安装插件

```
你: 安装插件 github:owner/plugin

Claude: 正在安装...
        ✅ 已克隆
        ✅ 元数据验证通过
        ✅ 约束已注入
        
        可用 Skills: skill-1, skill-2
        默认阶段: W01, W08
        是否使用默认配置？
```

### 添加自定义铁律

```
你: 添加铁律：周五禁止部署

Claude: 请确认铁律详情：
        
        ID: IL-C002 (自动分配)
        Rule: NO DEPLOYMENT ON FRIDAY
        Description: 周五禁止部署
        Severity: warning
        
        确认添加？
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

## 管理命令

```
你: 安装插件 github:owner/repo
你: 卸载插件 my-plugin
你: 启用插件 my-plugin
你: 禁用插件 my-plugin
你: 查看插件列表
你: 添加铁律 "NO XXXX"
你: 删除铁律 IL-C001
```