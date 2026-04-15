---
name: plugin-manager
description: "查看插件和铁律配置，管理外部插件更新。触发词：插件管理、配置插件、添加铁律、自定义铁律、更新插件、检查更新"
license: MIT
version: "1.3.0"
---

# Plugin Manager

## 核心思维

**插件不是独立运行的工具，而是 Harness 约束下的参与者。**

所有插件必须接受铁律约束、在版本目录下工作、提供验证证据。

## 外部插件同步

内置外部插件（如 web-access）通过 `plugin-sync.mjs` 管理版本同步：

```bash
# 检查所有插件更新
node scripts/plugin-sync.mjs

# 检查特定插件
node scripts/plugin-sync.mjs web-access

# 自动同步更新
node scripts/plugin-sync.mjs web-access --sync
```

同步流程：检查 GitHub 最新版本 → 版本对比 → 浅克隆 → 覆盖 SKILL.md/scripts/references。
本地修改的 SKILL.md（如铁律集成部分）会被覆盖，需重新适配。

## 插件配置

```
~/.claude/harness/
| 文件 | 用途 |
|------|------|
| plugins.yaml | 插件配置 |
| iron-laws.yaml | 自定义铁律 |
| plugin-log.json | 插件执行日志 |
| iron-law-log.json | 铁律触发日志 |
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
| "检查插件更新" | 运行 plugin-sync.mjs 检查 |
| "更新 web-access" | 运行 plugin-sync.mjs web-access --sync |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `~/.claude/harness/plugins.yaml` | 查看插件配置时 |
| `~/.claude/harness/iron-laws.yaml` | 查看或添加自定义铁律时 |
| `~/.claude/harness/plugin-log.json` | 查看插件执行日志时 |
| `~/.claude/harness/iron-law-log.json` | 查看铁律触发日志时 |
