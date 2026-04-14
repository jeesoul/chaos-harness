---
name: adaptive-harness
description: "自适应优化 Harness 配置。从学习数据中自动强化铁律。触发词：自适应优化、应用建议、强化铁律、优化配置"
license: MIT
version: "1.3.0"
---

# Adaptive Harness

## 核心思维

**自适应不是自动修改配置，而是基于数据的诚实反馈。**

学习数据告诉你什么在失败、什么在重复、什么需要强化。自适应把这些信号变成行动。

## 自动触发

**session-start hook 已内置自动触发**：当 `analysis-suggestions.json` 存在且包含建议时，自动运行。

## 手动触发

```bash
node scripts/adaptive-harness.mjs           # 应用所有建议
node scripts/adaptive-harness.mjs --dry-run # 预览不修改
```

## 工作流程

1. 读取 `~/.claude/harness/analysis-suggestions.json`（由 learning-analyzer 生成）
2. 按优先级处理建议：
   - **high** → 自动写入 `iron-laws.yaml`（铁律强化）
   - **medium** → 记录到 `adaptive-report.md` 待确认区
   - **low** → 记录到观察区
3. 生成 `adaptive-report.md` 优化报告
4. 记录事件到 `learning-log.json`

## 输出文件

| 文件 | 说明 |
|------|------|
| `~/.claude/harness/iron-laws.yaml` | 自适应强化后的铁律配置 |
| `~/.claude/harness/adaptive-report.md` | 优化报告（已应用/待确认/观察） |
| `output/{version}/adaptive-report.md` | 项目版本目录副本 |

## 防重复机制

每条高优先级建议生成唯一 `adaptive_reinforce_{law}` 标识，避免重复强化同一条铁律。

## 快捷命令

| 你说 | 动作 |
|------|------|
| "自适应优化" | 运行 adaptive-harness 应用建议 |
| "预览优化建议" | dry-run 模式 |
| "查看优化报告" | 读取 adaptive-report.md |
| "查看铁律配置" | 读取 iron-laws.yaml |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `~/.claude/harness/analysis-suggestions.json` | 读取机器可读建议时 |
| `~/.claude/harness/iron-laws.yaml` | 查看当前铁律配置时 |
| `~/.claude/harness/adaptive-report.md` | 查看优化报告时 |
| `scripts/adaptive-harness.mjs` | 手动触发优化时 |
| `skills/harness-generator/SKILL.md` | 了解自适应闭环上下文时 |
