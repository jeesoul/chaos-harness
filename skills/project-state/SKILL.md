---
name: project-state
description: "项目状态持久化与恢复。触发词：状态恢复、继续上次、项目进度、会话恢复、更新状态"
license: MIT
---

# 项目状态管理哲学

## 核心思维

**状态文件是跨会话的记忆，不是临时的便签。**

加载此 skill 后：

1. **检测状态** — 读取 `.chaos-harness/state.json`，存在则恢复上下文，不存在则初始化
2. **恢复时输出状态摘要** — 项目名、版本、阶段、上次会话时间
3. **更新时机** — 会话开始时更新 last_session，结束时更新统计数据

## 状态文件结构

### `.chaos-harness/state.json`

```json
{
  "project_name": "my-project",
  "project_root": "/path/to/project",
  "harness_version": "1.3.0",
  "created_at": "2026-04-02T22:00:00Z",
  "last_session": "2026-04-03T10:30:00Z",
  "current_version": "v0.1",
  "version_history": ["v0.1"],
  "workflow": {
    "scale": "medium",
    "current_stage": "W08_development",
    "stages_completed": [
      {"stage": "W01", "completed_at": "2026-04-02T22:30:00Z", "output_path": "output/v0.1/W01"},
      {"stage": "W03", "completed_at": "2026-04-02T23:00:00Z", "output_path": "output/v0.1/W03"}
    ],
    "stages_pending": ["W09", "W10", "W12"],
    "stages_skipped": ["W02", "W04", "W05"]
  },
  "scan_result": {
    "project_type": "java-spring",
    "framework": "Spring Boot 3.2",
    "java_version": "17"
  },
  "statistics": {
    "total_sessions": 5,
    "total_duration_minutes": 480,
    "iron_law_triggers": 3
  }
}
```

### `.chaos-harness/scan-result.json`

缓存扫描结果，避免重复扫描。包含 project_type、frameworks、java_version、build_tool、test_framework 等。

### `.chaos-harness/decisions-log.json`

记录关键决策，防止遗忘。格式：`{id, decision, reason, alternatives[], made_at, stage}`。

### `.chaos-harness/harness.yaml`

当前项目的 Harness 配置：项目类型、铁律列表、模板选择、工作流规模、hooks 开关状态。

## 会话恢复流程

Claude Code 启动 → SessionStart Hook 触发 → 检查 state.json → 存在则读取状态并恢复上下文（注入版本、进度、待处理事项、最近事件）→ 不存在则初始化新项目并引导用户。

## 状态同步机制

| Hook | 状态更新 |
|------|---------|
| `session-start` | 读取状态，恢复上下文 |
| `pre-tool-use` | 检查版本一致性 |
| `post-tool-use` | 更新统计信息 |
| `stop` | 保存当前进度到状态文件 |
| `pre-compact` | 保存关键上下文到决策日志 |

## 版本变更追踪

每次版本变更时：
- 更新 `current_version` 和 `version_history`
- 记录变更原因和时间
- 保留旧版本的状态快照

## 状态更新函数

调用 `shared/state-helpers.md` 中的函数：

```bash
# 更新阶段状态
update_project_state '{"current_stage":"W08","last_session":"..."}'

# 阶段完成标记
complete_stage "W08" "output/v0.1/W08"

# 读取当前版本
get_current_version

# 读取当前阶段
get_current_stage
```

## 全局状态 vs 项目状态

| 路径 | 范围 | 内容 |
|------|------|------|
| `~/.claude/harness/` | 全局 | learning-log.json, iron-law-log.json, custom-iron-laws.yaml |
| `project/.chaos-harness/` | 项目 | state.json, scan-result.json, decisions-log.json, harness.yaml |

**原则：学习共享，状态隔离**

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `shared/state-helpers.md` | 需要状态管理函数时 |
| `.chaos-harness/state.json` | 读取项目当前状态时 |
| `.chaos-harness/decisions-log.json` | 查看历史决策时 |
| `~/.claude/harness/workflow-log.json` | 查看工作流事件历史时 |
