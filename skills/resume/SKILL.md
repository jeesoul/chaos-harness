---
name: resume
description: "会话中断恢复与断点管理,当用户说'继续'、'恢复'、'上次进度'或会话重启时自动提示断点位置与快照"
license: MIT
version: "1.4.0"
---

# Resume / Session Snapshot

v1.4.0 — chaos-harness 的"断电重启可继续"能力。

由原 project-state skill 改造而成，融入 Loop Engine 的 cursor + journal + wiki/sessions/。

---

## 1. 核心机制

会话状态有三层：

| 层 | 数据 | 位置 |
|----|------|------|
| L1 Gate | 各 Gate 通过/失败 | `.chaos-harness/gates/*.json` |
| L2 Loop cursor | session_id / tick / last_frame / current_task | `.chaos-harness/loop/cursor.json` |
| L3 Session 快照 | 三层合一的可读 Markdown | `.chaos-harness/wiki/sessions/<id>.md` + `last.md` |

SessionStart 自动调用 `resume.mjs`：

- cursor 的 `last_frame !== reflect` → 判定上次会话**中断**
- 输出 "🔄 previous session was interrupted" 提示
- 显示 last tick / current task / 最近 5 frames / snapshot 路径
- exit code 10（约定）告知 Claude Code 需要继续上次工作

---

## 2. 触发词到行为

| 你说 | 自动行为 |
|------|---------|
| "继续" / "恢复" / "上次进度" | 读 `wiki/sessions/last.md` + cursor，输出可读摘要 |
| "查看快照列表" | `node scripts/snapshot.mjs latest` |
| "查看上次中断点" | `node scripts/resume.mjs` |
| "手动写快照" | `node scripts/snapshot.mjs write --status in-progress --title "..."` |

---

## 3. CLI 命令

```bash
# 检测当前是否需要 resume（exit 0=clean, exit 10=needs resume）
node scripts/resume.mjs
node scripts/resume.mjs --json
node scripts/resume.mjs --silent   # 仅 exit code

# 快照
node scripts/snapshot.mjs write --status in-progress
node scripts/snapshot.mjs read              # 读 last.md
node scripts/snapshot.mjs read --id ses-xxx
node scripts/snapshot.mjs latest            # 列最近 5 个

# Cursor 调试
node scripts/loop-cursor.mjs read
node scripts/loop-cursor.mjs reset

# Journal 调试
node scripts/loop-journal.mjs stats
node scripts/loop-journal.mjs tail --n 20
```

---

## 4. 会话快照结构

`wiki/sessions/<id>.md`：

```yaml
---
id: ses-2026-06-29-1023-abcdef12
type: session
title: "Session ses-..."
tags: [status:in-progress]
status: in-progress | completed | interrupted | compacted
cursor_tick: 42
last_frame: act
created/updated: ISO8601
---

## Progress
- [x] task#1 ...
- [ ] task#2 ...

## Loop Cursor
- session_id, tick, last_frame, current_task

## Gate States
| Gate | Status | Last checked |

## Recent Frames (last 10)
| Tick | Frame | Detail |

## Resume Hints
- 关键恢复提示
```

---

## 5. 项目状态文件

仍然存在并使用，但变为"长期状态"：

`.chaos-harness/state.json`：
```json
{
  "project_name": "...",
  "harness_version": "1.4.0",
  "current_version": "v1.4.0",
  "workflow": { ... },
  "statistics": { ... }
}
```

会话级状态（哪一步、上次中断、本会话决策）改由 Loop Engine + Wiki Snapshot 承担。

---

## 6. 与 Gate 状态机的关系

| 场景 | 谁负责 |
|------|--------|
| 工作流阶段（W01→W12） | gate-manager + state.json |
| 会话中断恢复（断电/重启） | **resume + snapshot + loop cursor** |
| 跨会话长期记忆（pattern/decision） | **wiki + dev-intelligence** |

三者协同：

```
state.json   → 长期阶段
loop cursor  → 本会话精确位置
wiki         → 跨会话知识沉淀
```

---

## 7. References 索引

| 文件 | 何时加载 |
|------|---------|
| `.chaos-harness/state.json` | 长期项目状态 |
| `.chaos-harness/loop/cursor.json` | 本会话游标 |
| `.chaos-harness/wiki/sessions/last.md` | 上次会话快照 |
| `scripts/resume.mjs` | 恢复检测脚本 |
| `scripts/snapshot.mjs` | 快照写入脚本 |
