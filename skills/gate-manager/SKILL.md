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

**铁律：阶段切换必须经过用户明确确认，禁止任何形式的自动推进。**

1. 确认用户请求的阶段 ID
2. 运行 Gate 预检查（`node <plugin-root>/scripts/gate-machine.mjs --transition <stage-id> --root <plugin-root>`）
3. **将检查结果完整展示给用户，等待用户明确回复**
4. 只有用户明确说"确认"、"继续"、"yes"、"推进"等明确意图后，才能执行实际切换

**禁止行为：**
- 禁止在写完文档/代码后自动执行阶段切换
- 禁止在用户没明确同意的情况下假设用户想要推进
- 禁止因 Gate 预检查失败而自动跳过或绕行

如果 Gate 预检查失败，必须向用户报告失败原因和修复建议，等待用户决定如何处理。

### /gate-manager override <gate-id> --reason "xxx"

绕过 soft Gate（不可用于 hard Gate）。

Run: `node <plugin-root>/scripts/gate-recovery.mjs override <gate-id> --reason "xxx"`

### /gate-manager history

查看 Gate 绕过日志。

Run: `node <plugin-root>/scripts/gate-recovery.mjs history`

### /gate-manager list

列出所有 Gates 及定义。

Read: `<plugin-root>/data/gate-registry.json`

### /gate-manager reset <gate-id>

重置某个 Gate 状态为 pending。

Delete: `<plugin-root>/.chaos-harness/gates/<gate-id>.json`

## Self-Learning Integration

Gate 的自学习功能通过 `project-scan` 验证器在 W01 阶段自动扫描项目，将结果写入 `scan-result.json` 供后续流程使用。


