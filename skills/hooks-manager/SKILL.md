---
name: hooks-manager
description: "管理和查看 Chaos Harness 钩子状态。触发词：钩子、hooks、自纠正、自学习"
license: MIT
version: "1.3.0"
---

# Hooks Manager

## 核心思维

**钩子不是装饰，而是铁律的物理执行者。**

铁律是规则，钩子是规则变成代码的地方。没有钩子，铁律只是文本。

## 钩子清单

| Hook | 触发时机 | 功能 |
|------|---------|------|
| session-start | 会话开始 | 注入铁律上下文 + 状态恢复 |
| iron-law-check | PreToolUse (Write/Edit) | IL001 版本目录 + IL005 敏感配置检查 |
| learning-update | PostToolUse (Write/Edit) | 记录操作到学习日志 |
| workflow-track | PostToolUse (Write/Edit) | 追踪工作流事件 |
| stop | 回合结束 | 偷懒模式检测 |
| laziness-detect | 回合结束 | 绕过话术识别 |
| pre-compact | 对话压缩前 | 保存关键上下文快照 |

## 数据文件

```
~/.claude/harness/
├── iron-law-log.json      # 铁律违规记录
├── laziness-log.json      # 偷懒模式检测
├── learning-log.json      # 学习记录
├── workflow-log.json      # 工作流事件
└── last-compact.json      # 压缩前状态快照
```

## 铁律与钩子映射

| 铁律 | 钩子 | 检查内容 |
|------|------|---------|
| IL001 | iron-law-check | 文档输出到 output/ 必须有版本号 |
| IL005 | iron-law-check | 敏感文件修改警告 |
| IL003 | stop | 完成声明必须有验证证据 |

## 查看状态

用 `jq` 读取各日志文件，输出统计：

```bash
# 统计各日志记录数
for f in iron-law-log.json laziness-log.json learning-log.json workflow-log.json; do
  count=$(jq 'length' "$HOME/.claude/harness/$f" 2>/dev/null || echo 0)
  echo "$f: $count 条"
done
```

## 清理日志

```bash
# 重置所有日志
for f in iron-law-log.json laziness-log.json learning-log.json workflow-log.json; do
  printf '[]\n' > "$HOME/.claude/harness/$f"
done
```

## 快捷命令

| 你说 | 动作 |
|------|------|
| "查看钩子状态" | 统计各日志记录数 |
| "查看学习日志" | 读取 learning-log.json |
| "查看铁律日志" | 读取 iron-law-log.json |
| "清理日志" | 重置所有日志文件 |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `~/.claude/harness/iron-law-log.json` | 查看铁律触发历史时 |
| `~/.claude/harness/laziness-log.json` | 查看偷懒检测历史时 |
| `~/.claude/harness/learning-log.json` | 查看学习记录时 |
| `~/.claude/harness/workflow-log.json` | 查看工作流事件时 |
| `~/.claude/harness/last-compact.json` | 查看压缩前状态快照时 |
