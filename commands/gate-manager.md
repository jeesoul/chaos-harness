---
allowed-tools: Read, Bash(node:*)
description: Gate 管理 + Hooks 状态（v1.4.0 合并 hooks-manager）
---

Skill: `gate-manager`

```
/gate-manager status                # 仪表盘
/gate-manager status <gate-id>      # 单个 Gate 详情
/gate-manager recheck <gate-id>     # 重新验证
/gate-manager transition <stage>    # 阶段切换
/gate-manager override <id> --reason "..."  # 绕过 soft Gate
/gate-manager history               # 绕过日志
/gate-manager list                  # 所有 Gates 列表
```

Hooks 速查与调试：见 skill SKILL.md。

CLI 等价：
- `node scripts/gate-machine.mjs --status`
- `node scripts/gate-enforcer.mjs <gate-id> --root .`
- `node scripts/gate-recovery.mjs history`
