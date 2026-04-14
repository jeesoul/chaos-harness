# 状态辅助函数 (State Helpers)

所有 skill 都应使用以下 bash 命令来更新状态，保证一致性。

---

## 文件路径

```bash
# 全局日志（所有项目共享）
GLOBAL_DIR="$HOME/.claude/harness"
IRON_LAW_LOG="$GLOBAL_DIR/iron-law-log.json"
LEARNING_LOG="$GLOBAL_DIR/learning-log.json"
LAZINESS_LOG="$GLOBAL_DIR/laziness-log.json"
WORKFLOW_LOG="$GLOBAL_DIR/workflow-log.json"

# 项目状态（项目根目录下）
PROJECT_STATE=".chaos-harness/state.json"
SCAN_RESULT=".chaos-harness/scan-result.json"
DECISIONS_LOG=".chaos-harness/decisions-log.json"

# 版本状态
OUTPUT_PATH="output/<version>"  # 替换 <version> 为实际版本号
```

---

## 通用追加函数

所有 skill 直接使用的 bash 命令，不是伪代码：

### 追加 JSON 日志

```bash
# 用法: append_json_log <file> '<json_object>'
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

### 更新时间戳

```bash
# 更新 .chaos-harness/state.json 的 last_session
update_session_time() {
  if [ -f .chaos-harness/state.json ] && command -v jq >/dev/null 2>&1; then
    local ts tmp
    ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    tmp="/tmp/state_$$.json"
    jq --arg ts "$ts" '.last_session = $ts' .chaos-harness/state.json > "$tmp" && \
      cat "$tmp" > .chaos-harness/state.json
    rm -f "$tmp"
  fi
}
```

---

## 专用状态操作

### 更新项目状态

```bash
# 更新任意字段
# 用法: update_project_state '{"current_stage":"W08"}'
update_project_state() {
  if [ -f .chaos-harness/state.json ] && command -v jq >/dev/null 2>&1; then
    local updates="$1" ts tmp
    ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    tmp="/tmp/state_$$.json"
    jq --arg ts "$ts" --argjson u "$updates" \
      '.last_session = $ts | . * $u' \
      .chaos-harness/state.json > "$tmp" && \
      cat "$tmp" > .chaos-harness/state.json
    rm -f "$tmp"
  fi
}
```

### 阶段完成标记

```bash
# 用法: complete_stage "W01" "output/v1.3.0/W01"
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

  # 追加到工作流日志
  append_json_log "$WORKFLOW_LOG" \
    '{"event":"stage_complete","stage":"'"$stage"'","timestamp":"'"$ts"'"}'
}
```

### 记录铁律触发

```bash
# 用法: log_iron_law "IL001" "文档无版本目录" "block"
log_iron_law() {
  local law="$1" context="$2" action="$3" ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  append_json_log "$IRON_LAW_LOG" \
    '{"iron_law_id":"'"$law"'","context":"'"$context"'","action":"'"$action"'","timestamp":"'"$ts"'"}'
}
```

### 记录偷懒模式

```bash
# 用法: log_laziness "LP001" "声称完成但无验证"
log_laziness() {
  local pattern="$1" context="$2" ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  append_json_log "$LAZINESS_LOG" \
    '{"pattern_id":"'"$pattern"'","context":"'"$context"'","timestamp":"'"$ts"'"}'
}
```

### 记录学习内容

```bash
# 用法: log_learning "error" "铁律IL003触发: 无验证完成声明" "完成必须附带证据"
log_learning() {
  local type="$1" context="$2" lesson="$3" ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  append_json_log "$LEARNING_LOG" \
    '{"type":"'"$type"'","context":"'"$context"'","lesson":"'"$lesson"'","timestamp":"'"$ts"'"}'
}
```

---

## 状态读取

### 读取当前版本

```bash
get_current_version() {
  if [ -f .chaos-harness/state.json ] && command -v jq >/dev/null 2>&1; then
    jq -r '.current_version // empty' .chaos-harness/state.json
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

### 读取项目规模

```bash
get_project_scale() {
  if [ -f .chaos-harness/state.json ] && command -v jq >/dev/null 2>&1; then
    jq -r '.workflow.scale // "medium"' .chaos-harness/state.json
  else
    echo "medium"
  fi
}
```

---

## 使用示例

### 阶段完成时

```bash
complete_stage "W08" "output/v1.3.0/W08"
update_session_time
```

### 铁律触发时

```bash
log_iron_law "IL001" "文档输出到 output/ 但无版本目录" "block"
```

### 检测到偷懒时

```bash
log_laziness "LP003" "Agent-backend-2 超过 5 分钟无产出"
```

### 学习记录

```bash
log_learning "iron_law_violation" "IL003 触发: 完成声明无验证" "完成必须附带测试输出"
```
