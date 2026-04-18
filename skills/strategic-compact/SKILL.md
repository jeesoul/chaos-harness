---
name: strategic-compact
description: "逻辑边界压缩 — 工具调用计数阈值检测、PreCompact 钩子。触发词：压缩、上下文优化、strategic、compact"
license: MIT
version: "1.3.1"
---

# 策略性上下文压缩

## 核心理念

**按逻辑边界压缩，而非随机自动压缩。**

保留关键上下文（当前任务），压缩历史上下文（已完成任务）。

## 工具调用计数阈值

| 阈值 | 动作 |
|------|------|
| 50 次调用 | 建议压缩（警告） |
| 100 次调用 | 强制压缩（自动保存状态快照） |
| 150 次调用 | 触发 PreCompact Hook |

## 逻辑边界压缩原则

1. **按任务边界压缩** — 一个任务完成后，压缩其上下文
2. **保留当前任务** — 当前正在进行的任务上下文不压缩
3. **保留铁律检查** — 铁律相关检查记录不压缩
4. **保留关键决策** — 重要技术决策记录不压缩

## PreCompact Hook

压缩前保存关键上下文快照：

```json
{
  "current_task": "实现认证模块",
  "current_stage": "W08_development",
  "open_files": ["src/auth.ts", "src/session.ts"],
  "recent_decisions": ["使用 JWT 而非 session cookie"],
  "iron_law_checks": ["IL001: 通过", "IL003: 待验证"]
}
```

## 命令

| 命令 | 描述 |
|------|------|
| `/strategic-compact status` | 显示调用计数和压缩状态 |
| `/strategic-compact reset` | 重置调用计数器 |

## 数据存储

```
.chaos-harness/
└── call-counter.json    # 工具调用计数和快照
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `.chaos-harness/call-counter.json` | 需要查看调用计数时 |
| `scripts/strategic-compact.mjs` | 需要执行压缩操作时 |
