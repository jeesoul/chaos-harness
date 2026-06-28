# 状态辅助函数 (State Helpers)

所有 skill 都应使用以下命令来更新状态，保证一致性。

**优先使用 Node.js 脚本** — 跨平台、零依赖、无需 `jq`。

---

## Node.js 脚本（推荐）

所有 hook 逻辑已重写为 Node.js ES 模块，位于 `scripts/` 目录：

```bash
# Hook 脚本（由 hooks.json 自动调用，也可手动执行）
node scripts/session-start.mjs          # 会话启动
node scripts/iron-law-check.mjs write   # 铁律检查（Write|Edit 前）
node scripts/stop.mjs                   # 会话结束
node scripts/laziness-detect.mjs        # 偷懒检测
node scripts/pre-compact.mjs            # 压缩前快照
node scripts/learning-update.mjs        # 学习记录
node scripts/workflow-track.mjs         # 工作流追踪
```

### 共享工具模块

`scripts/hook-utils.mjs` 提供所有 hook 共用的函数：

```javascript
import {
  detectProjectRoot,    // 向上查找项目根目录
  readProjectState,     // 读取 .chaos-harness/state.json
  updateProjectState,   // 更新状态字段
  appendLog,            // 追加日志条目
  readJson,             // 安全读取 JSON
  writeJson,            // 安全写入 JSON
  utcTimestamp,         // ISO 时间戳
  printIronLawsContext, // 输出铁律上下文
} from './hook-utils.mjs';
```

---

## Bash 备用函数

在 Node.js 不可用时，使用以下 bash 命令（需要 `jq`）：

### 追加 JSON 日志

```bash
append_json_log() {
  local file="$1" entry="$2"
  mkdir -p "$(dirname "$file")"
  [ ! -f "$file" ] && printf '[]\n' > "$file"
  local tmp="/tmp/log_$$.json"
  printf '%s\n' "$(cat "$file")" | jq --argjson e "$entry" '. += [$e]' > "$tmp" && \
    cat "$tmp" > "$file"
  rm -f "$tmp"
}
```

### 阶段完成标记

```bash
complete_stage() {
  local stage="$1" output="${2:-}" ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  if [ -f .chaos-harness/state.json ] && command -v jq >/dev/null 2>&1; then
    local tmp="/tmp/state_$$.json"
    jq --arg ts "$ts" --arg stage "$stage" --arg output "$output" '
      .last_session = $ts |
      .workflow.stages_completed += [{"stage": $stage, "completed_at": $ts, "output_path": $output}] |
      .workflow.stages_pending = [.workflow.stages_pending[] | select(. != $stage)]
    ' .chaos-harness/state.json > "$tmp" && cat "$tmp" > .chaos-harness/state.json
    rm -f "$tmp"
  fi
}
```

### 读取当前阶段

```bash
get_current_stage() {
  if [ -f .chaos-harness/state.json ] && command -v jq >/dev/null 2>&1; then
    jq -r '.workflow.current_stage // "W01"' .chaos-harness/state.json
  else
    echo "W01"
  fi
}
```
