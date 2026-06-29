---
name: gate-manager
description: Gate 状态机管理与 Hooks 配置,处理阶段切换、Gate 检查、钩子调试、绕过审批等场景
license: MIT
version: "1.4.0"
---

# Gate Manager

> v1.4.0 — Gate 状态机 + Hooks 自动拦截 + Loop Engine 集成。
>
> 由原 gate-manager 与 hooks-manager 合并而成。

---

## 1. Gate 命令

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

Run: `node <plugin-root>/scripts/gate-machine.mjs --transition <stage-id> --root <plugin-root>`

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

---

## 2. Hooks 速查

| Hook | 触发时机 | 主要任务 |
|------|---------|---------|
| SessionStart | 启动 / resume | resume.mjs + gate-machine session-start |
| PreToolUse (Write\|Edit) | 写文件前 | loop observe → iron-law check → loop decide |
| PreToolUse (Bash) | 执行命令前 | loop observe |
| PostToolUse (Write\|Edit\|Bash) | 工具执行后 | **post-write-dispatcher**（含 loop act） |
| PostToolUse (Bash) | bash 后额外 | eval-collector |
| Stop | 回合结束 | loop reflect + snapshot + stop + laziness-detect |
| PreCompact | 压缩前 | snapshot（compacted）+ pre-compact |

v1.4.0 改进：

- **统一 PostToolUse 入口**：4 个独立 hook → `post-write-dispatcher.mjs`（含 5 秒 debounce）
- **Loop Engine 集成**：每次工具调用自动产生 observe/decide/act/reflect 帧
- **断电恢复**：Stop 与 PreCompact 时写 wiki/sessions/last.md，下次 SessionStart 时 resume.mjs 检测

---

## 3. 自学习闭环

```
Write/Edit
   │
   ├── PreToolUse:  iron-law-check        → iron-law-log.json
   ├── loop observe + decide              → .chaos-harness/loop/journal.jsonl
   │
PostToolUse: post-write-dispatcher
   ├── loop act
   ├── learning-update.mjs                → learning-log.json
   ├── project-pattern-writer.mjs         → wiki/patterns/*.md (v1.4.0 新)
   ├── workflow-track.mjs                 → workflow-log.json
   └── wiki-indexer build                 → 双向链接 + index.md

Stop:
   ├── loop reflect                       → journal.jsonl
   ├── snapshot write                     → wiki/sessions/<id>.md  + last.md
   ├── stop.mjs                           → 状态保存
   └── laziness-detect.mjs                → laziness-log.json
```

**自动触发条件**：
- learning-log ≥ 5 条 → 自动运行 learning-analyzer
- iron-law-log ≥ 3 条 → 自动运行 learning-analyzer
- analysis-suggestions.json 有建议 → 自动运行 adaptive-harness

---

## 4. 调试钩子

```bash
# 查看 PostToolUse dispatcher 是否触发
CHAOS_DEBUG=1 node scripts/post-write-dispatcher.mjs

# 查看 loop journal 最近 20 帧
node scripts/loop-journal.mjs tail --n 20

# 查看 loop cursor
node scripts/loop-cursor.mjs read

# 查看 dispatcher debounce 状态
cat .chaos-harness/dispatcher-debounce.json
```

---

## 5. References 索引

| 文件 | 何时加载 |
|------|---------|
| `.chaos-harness/gates/gate-registry.json` | 查看 Gate 配置 |
| `.chaos-harness/gates/*.json` | 查看单个 Gate 状态 |
| `.chaos-harness/loop/cursor.json` | 查看当前 loop 位置 |
| `.chaos-harness/loop/journal.jsonl` | 查看 hook 行为流水 |
| `~/.claude/harness/iron-law-log.json` | 查看铁律触发历史 |
| `~/.claude/harness/laziness-log.json` | 查看偷懒检测历史 |
| `hooks/hooks.json` | 查看完整 hook 配置 |
