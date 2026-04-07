---
name: project-state
description: 项目状态持久化与恢复。触发词：状态恢复、继续上次、项目进度、会话恢复、更新状态
---

<STATE-WRITE-REQUIRED>
**状态更新后必须写入：**
1. 使用 Edit 工具更新 `.chaos-harness/state.json`
2. 使用 Edit 工具追加到 `~/.claude/harness/workflow-log.json`

调用 `shared/state-helpers.md` 中的函数：
- Update-Project-State(updates)

不写入状态 = 状态丢失，违反持久化原则
</STATE-WRITE-REQUIRED>

<EXTREMELY-IMPORTANT>
**STOP. DO NOT INVOKE THE SKILL TOOL AGAIN.**

You have already loaded this skill. The skill content is displayed below.

**DO NOT:**
- Call `Skill(chaos-harness:project-state)` again
- Call `Skill` tool for any skill you have already loaded
- Search for skill files - they are already loaded

**READ THE CONTENT BELOW AND EXECUTE. DO NOT LOAD AGAIN.**
</EXTREMELY-IMPORTANT>

# 项目状态管理 (Project State)

## 执行规则

### Step 1: 检测项目状态文件

使用 Glob 检查项目根目录下是否存在 `.chaos-harness/state.json`

### Step 2: 状态恢复或初始化

**如果存在状态文件：**

使用 Read 读取 `.chaos-harness/state.json`，输出：

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 Chaos Harness 会话恢复                                   │
├─────────────────────────────────────────────────────────────┤
│  项目: {project_name}                                        │
│  当前版本: {current_version}                                  │
│  工作流阶段: {current_stage}                                  │
│  上次会话: {last_session}                                     │
│  已运行: {total_duration}                                     │
│                                                             │
│  已完成阶段:                                                 │
│  ✅ W01 需求设计 (完成于 2026-04-02 22:30)                   │
│  ✅ W03 架构设计 (完成于 2026-04-02 23:00)                   │
│  🔄 W08 开发实现 (进行中, 已运行 2小时)                       │
│                                                             │
│  待处理事项:                                                 │
│  - W08 阶段有 3 个任务未完成                                 │
│  - 上次铁律触发: IL003 (完成验证缺失)                         │
│                                                             │
│  是否继续上次进度？                                          │
└─────────────────────────────────────────────────────────────┘
```