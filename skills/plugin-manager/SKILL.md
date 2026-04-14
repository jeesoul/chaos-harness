---
name: plugin-manager
description: "查看插件和铁律配置。触发词：插件管理、配置插件、添加铁律、自定义铁律"
license: MIT
version: "1.3.0"
---

# Plugin Manager

## 核心思维

**插件不是独立运行的工具，而是 Harness 约束下的参与者。**

所有插件必须接受铁律约束、在版本目录下工作、提供验证证据。

## 插件配置

```
~/.claude/harness/
├── plugins.yaml           # 插件配置
├── iron-laws.yaml         # 自定义铁律
├── plugin-log.json        # 插件执行日志
└── iron-law-log.json      # 铁律触发日志
```

## 查看插件

```bash
# 查看已注册插件
claude plugins list 2>/dev/null || echo "插件命令不可用"
```

## 添加自定义铁律

在 `~/.claude/harness/iron-laws.yaml` 中添加：

```yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE"
        action: block
```

铁律 ID 命名：
- `IL-C001-IL-C099` — 用户自定义
- `IL-J001-IL-J099` — Java 栈特定
- `IL-N001-IL-N099` — Node 栈特定

## 插件来源

| 来源 | 格式 |
|------|------|
| GitHub | `github:owner/repo` |
| 本地 | `local:/path` |
| npm | `npm:package-name` |

## 快捷命令

| 你说 | 动作 |
|------|------|
| "查看插件列表" | 列出已安装插件 |
| "添加铁律: xxx" | 添加到 iron-laws.yaml |
| "查看自定义铁律" | 读取 iron-laws.yaml |
