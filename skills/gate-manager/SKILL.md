---
name: gate-manager
description: Manage Gate state machine - view status, recheck gates, transition stages, override soft gates
---

# Gate Manager

管理 Chaos Harness v1.3.2 Gate 状态机。

## Commands

### /gate-manager status

查看所有 Gates 状态仪表盘。

Run: `node <plugin-root>/scripts/gate-machine.mjs --status`

### /gate-manager status <gate-id>

查看单个 Gate 详情。

Read: `<plugin-root>/.chaos-harness/gates/<gate-id>.json`

### /gate-manager recheck <gate-id>

手动重新验证某个 Gate。

Run: `node <plugin-root>/scripts/gate-enforcer.mjs <gate-id> --root <plugin-root>`

### /gate-manager transition <stage-id>

发起阶段切换请求。

1. 确认用户请求的阶段 ID
2. Run: `node <plugin-root>/scripts/gate-machine.mjs --transition <stage-id> --root <plugin-root>`

### /gate-manager override <gate-id> --reason "xxx"

绕过 soft Gate（不可用于 hard Gate）。

Run: `node <plugin-root>/scripts/gate-recovery.mjs override <gate-id> --reason "xxx"`

### /gate-manager history

查看 Gate 绕过日志。

Run: `node <plugin-root>/scripts/gate-recovery.mjs history`

### /gate-manager list

列出所有 Gates 及定义。

Read: `<plugin-root>/.chaos-harness/gates/gate-registry.json`

### /gate-manager reset <gate-id>

重置某个 Gate 状态为 pending。

Delete: `<plugin-root>/.chaos-harness/gates/<gate-id>.json`

## Self-Learning Integration

Gate 的自学习功能整合了以下原有 Skill 的能力：

- **learning-analyzer**: 分析学习记录，作为 Gate 阈值调整的输入信号
- **instinct-system**: 直觉评分影响 Gate 的验证优先级
- **adaptive-harness**: 动态调整约束
- **strategic-compact**: 压缩策略优化

这些 Skill 的脚本（learning-update.mjs, instinct-collector.mjs 等）保持不变，
但它们的业务逻辑已通过 gate-learning.json 统一由 Gate Manager 管理。
