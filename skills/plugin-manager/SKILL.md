---
name: plugin-manager
description: 管理和配置插件、铁律扩展。触发词：插件管理、配置插件、添加铁律、自定义铁律
---

# Chaos Harness 插件管理器

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