---
allowed-tools: Read, Bash(node:*)
description: 检测上次会话是否中断并输出可读 resume 提示
---

Run: `node scripts/resume.mjs`

读取输出并：
1. 若 exit 0：说明上次会话正常结束，无需 resume
2. 若 exit 10：上次中断，根据输出的 "Recent frames"、"current_task"、"Snapshot" 提示恢复

需要更多细节时：
- `node scripts/snapshot.mjs read` 读最近会话快照全文
- `node scripts/loop-journal.mjs tail --n 30` 看更长 frame 流水
