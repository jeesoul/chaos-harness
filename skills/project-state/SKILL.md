---
name: project-state
description: 项目状态持久化与恢复。触发词：状态恢复、继续上次、项目进度、会话恢复、更新状态
---

# 项目状态管理 (Project State)

<IMMEDIATE-ACTION>
加载此 skill 后，根据上下文执行：
- 如果用户说"继续"、"恢复" → 执行状态恢复
- 如果用户说"更新状态" → 执行状态更新
- 如果用户说"查看状态" → 输出当前状态
- 否则检测状态文件是否存在并引导用户
</IMMEDIATE-ACTION>

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

**如果不存在状态文件：**

初始化新项目状态，使用 Write 创建 `.chaos-harness/state.json`：

```json
{
  "project_name": "项目名称",
  "project_root": "项目路径",
  "harness_version": "1.0.0",
  "created_at": "2026-04-03T10:00:00Z",
  "last_session": "2026-04-03T10:00:00Z",
  "current_version": null,
  "workflow": {
    "scale": null,
    "current_stage": null,
    "stages_completed": [],
    "stages_pending": []
  },
  "statistics": {
    "total_sessions": 0,
    "total_duration_minutes": 0,
    "iron_law_triggers": 0,
    "bypass_attempts": 0
  }
}
```

### Step 3: 更新会话状态

每次会话开始时更新 `last_session`，会话结束时更新统计数据。

## 状态文件结构

### `.chaos-harness/state.json`

```json
{
  "project_name": "my-project",
  "project_root": "/path/to/project",
  "harness_version": "1.0.0",
  
  "created_at": "2026-04-02T22:00:00Z",
  "last_session": "2026-04-03T10:30:00Z",
  
  "current_version": "v0.1",
  "version_history": ["v0.1"],
  
  "workflow": {
    "scale": "medium",
    "current_stage": "W08_development",
    "stage_start_time": "2026-04-03T08:00:00Z",
    "stages_completed": [
      {
        "stage": "W01_requirements",
        "completed_at": "2026-04-02T22:30:00Z",
        "output_path": "output/v0.1/W01"
      },
      {
        "stage": "W03_architecture",
        "completed_at": "2026-04-02T23:00:00Z",
        "output_path": "output/v0.1/W03"
      }
    ],
    "stages_pending": ["W09_code_review", "W10_testing", "W12_release"],
    "stages_skipped": ["W02", "W04", "W05"]
  },
  
  "scan_result": {
    "cached_at": "2026-04-02T22:00:00Z",
    "project_type": "java-spring",
    "framework": "Spring Boot 3.2",
    "java_version": "17"
  },
  
  "statistics": {
    "total_sessions": 5,
    "total_duration_minutes": 480,
    "iron_law_triggers": 3,
    "bypass_attempts": 2,
    "files_modified": 15,
    "tests_written": 8
  },
  
  "last_events": [
    {
      "type": "iron_law",
      "id": "IL003",
      "message": "完成验证缺失",
      "timestamp": "2026-04-03T09:45:00Z"
    }
  ]
}
```

### `.chaos-harness/scan-result.json`

缓存扫描结果，避免重复扫描：

```json
{
  "scanned_at": "2026-04-02T22:00:00Z",
  "project_type": "java-spring",
  "confidence": 0.95,
  "frameworks": ["Spring Boot 3.2", "Maven"],
  "java_version": "17",
  "build_tool": "maven",
  "test_framework": "junit5",
  "dependencies": [...],
  "recommendations": [...]
}
```

### `.chaos-harness/decisions-log.json`

记录关键决策，防止遗忘：

```json
[
  {
    "id": "D001",
    "decision": "使用 Spring Data JPA 而非 MyBatis",
    "reason": "团队更熟悉 JPA，维护成本更低",
    "alternatives": ["MyBatis", "JOOQ"],
    "made_at": "2026-04-02T23:15:00Z",
    "stage": "W05_tech_selection"
  }
]
```

### `.chaos-harness/harness.yaml`

当前项目的 Harness 配置：

```yaml
project:
  name: my-project
  type: java-spring
  
iron_laws:
  - IL001
  - IL002
  - IL003
  - IL004
  - IL005
  - IL-C001  # 自定义：数据库备份

templates:
  active: java-spring
  
workflow:
  scale: medium
  required_stages: [W01, W02, W03, W05, W08, W09, W10, W12]
  
hooks:
  session_start: auto_inject
  iron_law_check: enabled
  learning_update: enabled
```

## 会话恢复流程

```
┌─────────────────────────────────────────────────────────────┐
│                    会话启动流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Claude Code 启动                                           │
│        │                                                    │
│        ▼                                                    │
│  SessionStart Hook 触发                                     │
│        │                                                    │
│        ▼                                                    │
│  检查 .chaos-harness/state.json                             │
│        │                                                    │
│        ├── 存在 ──► 读取状态                                │
│        │              │                                     │
│        │              ▼                                     │
│        │         恢复上下文                                 │
│        │              │                                     │
│        │              ├── 注入当前版本                      │
│        │              ├── 注入工作流进度                    │
│        │              ├── 注入待处理事项                    │
│        │              └── 注入最近事件                      │
│        │                                                    │
│        └── 不存在 ──► 初始化新项目                          │
│                       │                                     │
│                       ▼                                     │
│                  创建状态文件                               │
│                       │                                     │
│                       ▼                                     │
│                  引导用户开始                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 使用示例

### 首次使用

```
你: 开始使用 chaos-harness

Claude: ┌─────────────────────────────────────────────────────┐
        │  🆕 新项目初始化                                    │
        ├─────────────────────────────────────────────────────┤
        │  未检测到 Chaos Harness 状态文件。                   │
        │                                                     │
        │  准备初始化：                                        │
        │  1. 扫描项目环境                                    │
        │  2. 创建版本 v0.1                                   │
        │  3. 生成 Harness 约束                               │
        │                                                     │
        │  是否开始？                                          │
        └─────────────────────────────────────────────────────┘
```

### 继续上次

```
你: 继续

Claude: ┌─────────────────────────────────────────────────────┐
        │  🔄 会话恢复                                         │
        ├─────────────────────────────────────────────────────┤
        │  项目: my-project                                   │
        │  版本: v0.1                                         │
        │  阶段: W08 开发实现                                  │
        │  上次: 2小时前                                       │
        │                                                     │
        │  上次进度：                                          │
        │  - 完成了 UserService 实现                          │
        │  - 正在处理 OrderService                            │
        │  - 3 个单元测试待编写                                │
        │                                                     │
        │  继续上次工作？                                      │
        └─────────────────────────────────────────────────────┘
```

## 状态同步机制

### Hook 集成

| Hook | 状态更新 |
|------|---------|
| `session-start` | 读取状态，恢复上下文 |
| `pre-tool-use` | 检查版本一致性 |
| `post-tool-use` | 更新统计信息 |
| `stop` | 保存当前进度到状态文件 |
| `pre-compact` | 保存关键上下文到决策日志 |

### 版本变更追踪

```
v0.1 (创建于 2026-04-02)
├── W01 需求设计 ✅
├── W03 架构设计 ✅
└── W08 开发实现 🔄

v0.2 (创建于 2026-04-05)
├── W01 需求补充 ✅
└── W08 开发继续 🔄
```

## 命令

```
你: 查看项目状态
你: 继续上次进度
你: 更新阶段状态 W08 completed
你: 重置项目状态
你: 查看决策历史
你: 导出项目状态
```

## 状态更新辅助函数

### 更新阶段状态

```
updateStageStatus(stage, status):
  1. 读取 .chaos-harness/state.json
  2. 根据 status 更新:
     - completed: 添加到 stages_completed
     - skipped: 添加到 stages_skipped
     - blocked: 记录阻塞原因
  3. 从 stages_pending 移除
  4. 更新 current_stage 为下一阶段
  5. 更新 last_session 时间戳
  6. 写回文件
```

### 阶段完成时调用

```
阶段完成时必须调用:
你: 更新阶段状态 W01 completed

或者使用 skill 内置逻辑:
- workflow-supervisor 在阶段转换时自动调用
- stop hook 在会话结束时保存状态
```

## 与全局状态的关系

```
~/.claude/harness/          # 全局（跨项目学习）
├── learning-log.json       # 学习记录（所有项目共享）
├── iron-law-log.json       # 铁律日志（所有项目共享）
└── custom-iron-laws.yaml   # 用户自定义铁律

project/.chaos-harness/     # 项目级（特定项目）
├── state.json              # 项目状态
├── scan-result.json        # 扫描缓存
├── decisions-log.json      # 决策记录
└── harness.yaml            # Harness 配置
```

**原则：学习共享，状态隔离**