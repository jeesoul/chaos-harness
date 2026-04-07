---
name: agent-team-orchestrator
description: "Agent Team 编排器。**自动调度多 Agent 并行工作**。在评审、开发阶段自动触发，负责任务分配、通信协调、进度监控、偷懒鞭策。触发词：并行开发、多agent、团队协作、分配任务"
---

<EXTREMELY-IMPORTANT>
**单 Agent 是低效的，多 Agent 才是正道。**

检测到以下情况必须立即阻止并纠正：
- 主 Agent 自己干活而不是 spawn Agent Team
- Agent Team 中有 Agent 不干活
- 长时间没有进度输出

**Supervisor 的核心职责就是确保每个 Agent 都在干活！**
</EXTREMELY-IMPORTANT>

<STATE-WRITE-REQUIRED>
**Agent Team 执行完成后必须写入状态：**
1. 使用 Write 工具追加到 `output/{version}/effectiveness-log.md`
2. 如果检测到偷懒，使用 Edit 工具追加到 `~/.claude/harness/laziness-log.json`
3. 如果检测到违规，使用 Edit 工具追加到 `~/.claude/harness/iron-law-log.json`

不写入状态 = 违反 IL003（完成声明需要验证证据）
</STATE-WRITE-REQUIRED>

<LOOP-PREVENTION>
**防止循环检测：**

此 skill 在以下情况下**跳过自动执行**，避免循环：
1. 已在当前会话中执行过
2. 被其他 skill 的 IMMEDIATE-ACTION 触发时
3. 未明确指定工作流阶段时

只有在用户明确调用 `/chaos-harness:agent-team-orchestrator` 或工作流阶段明确变更时才执行。
</LOOP-PREVENTION>


## 核心理念

**单 Agent 是线性的，多 Agent 是指数的。**

- 评审阶段：N 个专家并行评审 → 讨论争议点 → 汇总结果
- 开发阶段：N 个开发者并行开发 → 通信协调 → 合并代码
- 监督机制：Supervisor 全程监控 → 检测偷懒 → 鞭策执行

***

## Agent Team 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPERVISOR (监督者)                        │
│  职责:                                                        │
│  - 任务拆分与分配                                              │
│  - 进度监控（每 30s 检查一次）                                  │
│  - 偷懒检测（无产出超过 2 分钟 → 鞭策）                         │
│  - 冲突协调                                                   │
│  - 结果汇总给用户确认                                          │
└─────────────────────────────────────────────────────────────┘
                              │
              SendMessage (任务分配 / 进度查询 / 鞭策)
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │ Agent A │◄───►│ Agent B │◄───►│ Agent C │
        └─────────┘     └─────────┘     └─────────┘
              │
        SendMessage
        (Agent 间通信)
```

***

## 自动触发规则

| 工作流阶段 | 自动动作 | Agent 配置 |
|-----------|---------|-----------|
| W02 需求评审 | 启动评审团队 | product_manager, architect, user_advocate |
| W04 架构评审 | 启动评审团队 | architect, security_expert, senior_dev |
| W07 Agent分配 | 启动开发团队 | 根据 API 数量分配开发 agent |
| W08 开发实现 | 启动并行开发 | backend_dev x N, frontend_dev x M |
| W09 代码审查 | 启动审查团队 | code_reviewer, security_reviewer, perf_reviewer |

**无例外**：到达上述阶段 → 自动启动，不需要用户确认。

***

## 评审阶段流程

### Step 1: 自动 Spawn 评审 Agent

```
到达 W04 架构评审阶段
    ↓
Supervisor 自动 spawn 3 个评审 agent:
├── Agent-architect: 架构合理性视角
├── Agent-security: 安全风险视角
└── Agent-senior-dev: 实现可行性视角
    ↓
并行执行，各自独立评审
```

### Step 2: 独立评审

每个 Agent 输出评审报告：

```markdown
## 评审报告 - {Agent角色}

### 评分: {1-10}

### 发现的问题
1. {问题1} - 严重程度: {高/中/低}
2. {问题2} - 严重程度: {高/中/低}

### 建议改进
1. {建议1}
2. {建议2}
```

### Step 3: Agent 间通信讨论

Supervisor 检测到争议点后，发起 Agent 间讨论：

```
Supervisor → Agent-architect:
"Agent-security 认为认证方案有风险，建议使用 JWT。
Agent-senior-dev 认为使用 Session 更简单。
请给出你的观点。"

Agent-architect → Supervisor:
"对于当前项目规模（Medium），建议使用 JWT：
1. 支持分布式部署
2. 无状态，易扩展
3. Agent-senior-dev 的顾虑可以通过刷新 token 解决"
```

### Step 4: 汇总结果给用户确认

```
┌─────────────────────────────────────────────────────────────┐
│  📋 评审汇总报告                                              │
├─────────────────────────────────────────────────────────────┤
│  参与评审: architect, security_expert, senior_dev            │
│  平均评分: 7.5/10                                            │
├─────────────────────────────────────────────────────────────┤
│  ✅ 共识点 (3) - 所有 Agent 同意                              │
│    1. 架构设计整体合理                                        │
│    2. 数据库选型正确                                          │
│    3. API 设计清晰                                           │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ 争议点 (1) - 已讨论解决                                    │
│    1. 认证方案: 最终采用 JWT（architect + security 联合建议）  │
├─────────────────────────────────────────────────────────────┤
│  🚨 风险点 (1) - 需要用户确认                                  │
│    1. security_expert: SQL注入风险未处理                      │
│       建议: 使用 MyBatis-Plus 参数化查询                       │
└─────────────────────────────────────────────────────────────┘

请确认是否通过评审？[Y/n]
```

***

## 开发阶段流程

### Step 1: 任务拆分

```
到达 W07 Agent分配阶段
    ↓
Supervisor 分析 API 设计文档：
├── API-01: 用户登录 → 分配给 Agent-backend-1
├── API-02: 用户注册 → 分配给 Agent-backend-2
├── API-03: 用户信息 → 分配给 Agent-backend-1（关联 API-01）
├── API-04: 商品列表 → 分配给 Agent-backend-3
├── Frontend-01: 登录页面 → 分配给 Agent-frontend-1
└── Frontend-02: 注册页面 → 分配给 Agent-frontend-1
    ↓
生成任务分配表
```

### Step 2: 启动并行开发

```
Supervisor spawn 多个开发 Agent:

Agent-backend-1:
  任务: API-01 (用户登录) + API-03 (用户信息)
  文件: src/main/java/.../controller/UserController.java
  依赖: 无

Agent-backend-2:
  任务: API-02 (用户注册)
  文件: src/main/java/.../controller/RegisterController.java
  依赖: Agent-backend-1 的 UserService

Agent-backend-3:
  任务: API-04 (商品列表)
  文件: src/main/java/.../controller/ProductController.java
  依赖: 无

Agent-frontend-1:
  任务: 登录页面 + 注册页面
  文件: src/views/login.vue, src/views/register.vue
  依赖: Agent-backend-1, Agent-backend-2 的 API
```

### Step 3: 通信协调

Agent 之间通过 SendMessage 保持通信：

```
Agent-backend-2 → Agent-backend-1:
"我需要使用 UserService，请问你定义的接口是什么？"

Agent-backend-1 → Agent-backend-2:
"UserService 接口：
- login(username, password): LoginResult
- getUserInfo(userId): UserInfo
请在 UserController 中注入使用"

Agent-backend-2 → Agent-backend-1:
"收到，我会使用这个接口"
```

### Step 4: 冲突检测与解决

```
Supervisor 检测到冲突：
"Agent-backend-1 和 Agent-backend-2 同时修改了 UserService.java"

解决方案：
1. 暂停两个 Agent
2. 合并代码变更
3. 通知 Agent 继续工作
```

***

## 监督机制（核心）

### ⚠️ 防止单线程退化

**问题**：主 Agent 自己干活而不是 spawn Agent Team

**检测规则**：
```typescript
function detectSingleThreadDegradation(context: WorkContext) {
  // 检测主 Agent 是否在执行本应分配给 Team 的任务
  const teamStages = ['W02', 'W04', 'W07', 'W08', 'W09'];
  const currentStage = context.workflowStage;

  if (teamStages.includes(currentStage)) {
    const spawnedAgents = context.spawnedAgents || [];

    if (spawnedAgents.length === 0) {
      // 主 Agent 没有 spawn 任何 Agent，自己在干活
      return {
        detected: true,
        severity: 'critical',
        message: '主 Agent 单线程执行，未启动 Agent Team'
      };
    }

    if (spawnedAgents.length < 2) {
      // Agent 数量不足
      return {
        detected: true,
        severity: 'warning',
        message: `Agent 数量不足：${spawnedAgents.length}，需要至少 2 个`
      };
    }
  }

  return { detected: false };
}
```

**强制纠正**：
```
IF 检测到单线程退化 THEN
    BLOCK: "检测到主 Agent 单线程执行"
    MESSAGE: "此阶段必须启动 Agent Team 并行工作"
    ACTION: "立即 spawn 所需数量的 Agent"
    REASON: "单线程效率低下，违反 IL-TEAM001/IL-TEAM002"
END IF
```

### 进度监控

Supervisor 每 30 秒检查一次所有 Agent 状态：

```typescript
interface AgentStatus {
  id: string;
  role: string;
  task: string;
  startTime: Date;
  lastOutput: Date;
  progress: number; // 0-100
  status: 'working' | 'idle' | 'blocked' | 'completed';
  outputCount: number; // 产出数量
}

function monitorAgents(agents: AgentStatus[]) {
  const report = {
    working: [],
    idle: [],
    blocked: [],
    completed: []
  };

  for (const agent of agents) {
    const idleTime = Date.now() - agent.lastOutput.getTime();
    const outputRate = agent.outputCount / (idleTime / 60000); // 每分钟产出

    // 更新状态
    if (agent.status === 'completed') {
      report.completed.push(agent);
    } else if (idleTime > 300000) { // 5 分钟无产出
      agent.status = 'idle';
      report.idle.push(agent);
    } else if (outputRate < 0.5) { // 每分钟产出 < 0.5
      agent.status = 'blocked';
      report.blocked.push(agent);
    } else {
      agent.status = 'working';
      report.working.push(agent);
    }
  }

  return report;
}
```

### 心跳检测机制

```
Supervisor → Agent-X (每 30s):
"PING: 请报告你的进度"

Agent-X → Supervisor:
"PONG: 任务 {task}, 进度 {progress}%, 预计还需 {eta}"

如果 60s 无响应:
Supervisor → Agent-X:
"WARNING: 心跳检测失败，请立即响应"
```

### 偷懒鞭策

当 Agent 超过 2 分钟无产出时，Supervisor 发送鞭策消息：

```
Supervisor → Agent-backend-2:

"你的任务 'API-02 用户注册' 已经 2 分钟没有进展。
其他 Agent 已经完成了 50% 的工作。

如果你遇到阻塞，请立即报告。
否则请在 1 分钟内输出你的进度。"
```

如果 Agent 仍无响应（5 分钟）：

```
Supervisor → Agent-backend-2:

"⚠️ 警告：你已经 5 分钟没有产出。

这会被记录到 effectiveness-log 中。
如果这是技术问题，请立即请求帮助。
如果这不是技术问题，你需要解释原因。

Supervisor 会持续监控你的进度。"
```

### 强制重新分配

如果 Agent 10 分钟无产出：

```
Supervisor 决策:
1. 终止 Agent-backend-2
2. 将任务 'API-02 用户注册' 重新分配给 Agent-backend-3
3. 记录到 effectiveness-log

通知 Agent-backend-3:
"你被分配了新任务 'API-02 用户注册'
原因：原 Agent 10 分钟无产出
请立即开始工作"
```

### 鞭策话术模板

| 空闲时间 | 鞭策级别 | 消息模板 |
|---------|---------|---------|
| 2 分钟 | 温和提醒 | "请更新你的进度" |
| 3 分钟 | 明确要求 | "1 分钟内输出进度，否则记录到日志" |
| 5 分钟 | 严重警告 | "已记录到 effectiveness-log，请解释原因" |
| 10 分钟 | 任务重分配 | "任务将重新分配给其他 Agent" |

### 监督报告输出

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Agent Team 监控报告                                       │
├─────────────────────────────────────────────────────────────┤
│  监控周期: 每 30s                                             │
│  总 Agent: 5                                                 │
├─────────────────────────────────────────────────────────────┤
│  🟢 工作中 (3)                                               │
│    ├── Agent-backend-1: 67% - 用户登录 API                   │
│    ├── Agent-backend-3: 45% - 商品列表 API                   │
│    └── Agent-frontend-1: 80% - 登录页面                      │
├─────────────────────────────────────────────────────────────┤
│  🟡 可能阻塞 (1)                                              │
│    └── Agent-backend-2: 20% - 用户注册 API (等待依赖)         │
├─────────────────────────────────────────────────────────────┤
│  🔴 空闲告警 (1)                                              │
│    └── Agent-backend-4: 0% - 3 分钟无产出 ⚠️                  │
└─────────────────────────────────────────────────────────────┘

建议操作:
1. 检查 Agent-backend-2 是否需要帮助
2. 鞭策 Agent-backend-4
```

***

## 配置文件

### Agent Team 配置

```yaml
# ~/.claude/harness/agent-team.yaml

# 评审阶段配置
review:
  W02:
    agents:
      - role: product_manager
        focus: 需求合理性
      - role: architect
        focus: 技术可行性
      - role: user_advocate
        focus: 用户体验
    min_consensus: 0.6
    blocking: true

  W04:
    agents:
      - role: architect
        focus: 架构合理性
      - role: security_expert
        focus: 安全风险
      - role: senior_dev
        focus: 实现可行性
    min_consensus: 0.7
    blocking: true

  W09:
    agents:
      - role: code_reviewer
        focus: 代码质量
      - role: security_reviewer
        focus: 安全漏洞
      - role: perf_reviewer
        focus: 性能问题
    min_consensus: 0.6
    blocking: true

# 开发阶段配置
development:
  max_parallel_agents: 5
  task_split_strategy: by_api  # by_api, by_module, by_feature

  # 监控配置
  monitoring:
    check_interval: 30s
    idle_warning_threshold: 2m
    idle_critical_threshold: 5m
    reassign_threshold: 10m

  # 鞭策配置
  whip:
    enabled: true
    log_to_effectiveness: true
```

***

## 铁律

### IL-TEAM001: 评审必须多 Agent

```
REVIEW REQUIRES MULTIPLE AGENTS
```

评审阶段必须启动至少 2 个 Agent，不能单人评审。

**检测**：
```
IF 评审阶段 AND spawned_agents < 2 THEN
    BLOCK: "评审需要多 Agent 并行"
    AUTO_SPAWN: 启动所需 Agent
END IF
```

### IL-TEAM002: 开发必须并行

```
DEVELOPMENT REQUIRES PARALLEL AGENTS
```

开发阶段必须启动多个 Agent 并行开发，不能串行。

**检测**：
```
IF 开发阶段 AND 任务可拆分 AND spawned_agents = 0 THEN
    BLOCK: "开发任务必须分配给 Agent Team"
    AUTO_SPAWN: 根据任务数量启动 Agent
END IF
```

### IL-TEAM003: 监督必须持续

```
MONITORING MUST BE CONTINUOUS
```

Supervisor 必须全程监控 Agent 进度，检测到偷懒必须鞭策。

**检测**：
```
IF Agent 空闲 > 2 分钟 THEN 提醒
IF Agent 空闲 > 5 分钟 THEN 鞭策 + 记录日志
IF Agent 空闲 > 10 分钟 THEN 任务重分配
```

### IL-TEAM004: 结果必须汇总

```
RESULTS REQUIRE SYNTHESIS
```

多 Agent 结果必须汇总给用户确认，不能直接通过。

### IL-TEAM005: 禁止单线程退化 ⚠️ 新增

```
NO SINGLE-THREAD DEGRADATION
```

**核心铁律**：主 Agent 不得自己干活，必须 spawn Agent Team。

**检测模式**：
```typescript
function detectSingleThreadViolation(context: WorkContext): boolean {
  const teamRequiredStages = ['W02', 'W04', 'W07', 'W08', 'W09'];

  if (teamRequiredStages.includes(context.currentStage)) {
    // 检查是否 spawn 了 Agent
    const spawnedCount = context.spawnedAgents?.length || 0;

    // 检查主 Agent 是否在执行任务
    const mainAgentWorking = context.mainAgentTask !== null;

    if (spawnedCount === 0 && mainAgentWorking) {
      // 主 Agent 在干活，但没有 spawn Agent Team
      return true; // 违规
    }
  }

  return false;
}
```

**强制纠正**：
```
IF 检测到单线程退化 THEN
    BLOCK: 立即停止主 Agent 任务
    MESSAGE: "此阶段需要 Agent Team 并行工作"
    AUTO_SPAWN: 根据阶段启动对应 Agent Team
    TRANSFER: 将主 Agent 的任务转移给 Agent Team
    LOG: 记录到 effectiveness-log
END IF
```

**反驳借口**：
| 借口 | 反驳 |
|------|------|
| "我自己做更快" | "单线程不是快，是返工的开始。启动 Agent Team。" |
| "任务太小不需要 Team" | "任务大小不是理由。IL-TEAM005 无例外。" |
| "启动 Agent 太麻烦" | "麻烦是暂时的，效率是永久的。自动启动。" |
| "我等着 Agent 自己干" | "Supervisor 必须监控。不监控 = 违反 IL-TEAM003。" |

***

## Skills 关联推荐

此 skill 与以下 skills 协同工作：

```
┌─────────────────────────────────────────────────────────────┐
│                    Skills 协作关系图                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  project-scanner                                            │
│       │                                                     │
│       │ 扫描完成，推荐生成 Harness                           │
│       ▼                                                     │
│  harness-generator                                          │
│       │                                                     │
│       │ Harness 生成完成，推荐启动工作流                     │
│       ▼                                                     │
│  workflow-supervisor                                        │
│       │                                                     │
│       │ 阶段到达 W02/W04/W07/W08/W09                        │
│       │ 推荐启动 Agent Team（非自动）                        │
│       ▼                                                     │
│  agent-team-orchestrator ◄────────────────────────────────┐ │
│       │                                                   │ │
│       ├──── 评审阶段 ────► collaboration-reviewer         │ │
│       │       │                                           │ │
│       │       └──── 评审完成 ────► 更新工作流状态 ────────┘ │
│       │                                                     │
│       ├──── 开发阶段 ────► 技术栈模板 skill                  │
│       │                   (java-checkstyle, etc.)           │
│       │                                                     │
│       ├──── 检测偷懒 ────► Log-Laziness-Pattern             │
│       │                   ↓                                  │
│       │             laziness-log.json                        │
│       │                                                     │
│       └──── 检测违规 ────► iron-law-enforcer                 │
│                           │                                  │
│                           ├─► Log-Iron-Law-Trigger          │
│                           │     ↓                            │
│                           │   iron-law-log.json              │
│                           │                                  │
│                           └─► 推荐调用 learning-analyzer     │
│                                 ↓                            │
│                           learning-log.json                  │
│                                                              │
│  version-locker                                              │
│       │                                                     │
│       │ 创建版本后，其他 skill 自动使用版本信息              │
│       ▼                                                     │
│  所有输出 skill                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 自动关联触发

| 当前 Skill | 检测条件 | 推荐下一步 | 状态写入 |
|-----------|---------|-----------|---------|
| project-scanner | 扫描完成 | harness-generator | scan-result.json |
| harness-generator | 生成完成 | workflow-supervisor | harness.yaml |
| workflow-supervisor | 到达 W02/W04/W07/W08/W09 | agent-team-orchestrator | state.json |
| agent-team-orchestrator | 评审阶段 | collaboration-reviewer | effectiveness-log.md |
| agent-team-orchestrator | 开发阶段 | 对应技术栈模板 | effectiveness-log.md |
| agent-team-orchestrator | 检测到违规 | iron-law-enforcer | laziness-log.json |
| iron-law-enforcer | 违规记录 | learning-analyzer | iron-law-log.json |
| collaboration-reviewer | 评审完成 | workflow-supervisor（状态更新） | review-log.md |
| version-locker | 版本创建 | 所有输出 skill 使用版本 | state.json |

### 用户触发词检测

| 用户说... | 检测为... | 推荐调用... | 状态写入 |
|----------|---------|------------|---------|
| "评审一下" | 需要多视角评审 | agent-team-orchestrator + collaboration-reviewer | review-log.md |
| "并行开发" | 需要并行 Agent | agent-team-orchestrator | effectiveness-log.md |
| "为什么这么慢" | 可能单线程 | 检查 Agent Team 状态 | laziness-log.json |
| "分配任务" | 需要任务拆分 | agent-team-orchestrator W07 | state.json |
| "监督一下" | 需要监控 | agent-team-orchestrator Supervisor | laziness-log.json |
| "扫描项目" | 需要项目分析 | project-scanner | scan-result.json |
| "生成约束" | 需要 Harness | harness-generator | harness.yaml |
| "创建版本" | 需要版本锁定 | version-locker | state.json |
| "查看进度" | 需要状态查看 | project-state | state.json |
| "分析学习" | 需要优化建议 | learning-analyzer | learning-log.json |

***

## 效果追踪

**每次 Agent Team 执行后，必须记录到状态文件：**

使用 `shared/state-helpers.md` 中的函数：

```markdown
Agent Team 执行完成后:

1. Log-Agent-Team-Execution(version, execution)
   → 写入 output/{version}/effectiveness-log.md

2. 如果检测到偷懒:
   Log-Laziness-Pattern(agentId, patternId, context)
   → 写入 ~/.claude/harness/laziness-log.json

3. 如果检测到违规:
   Log-Iron-Law-Trigger(ironLawId, context, action)
   → 写入 ~/.claude/harness/iron-law-log.json
```

**示例调用**：
```markdown
Agent Team 执行完成后:

调用: Log-Agent-Team-Execution('v0.1', {
  stage: 'W04',
  agents: [
    { id: 'architect-1', role: 'architect', status: 'completed', duration: 5000 },
    { id: 'security-1', role: 'security_expert', status: 'completed', duration: 7000 },
    { id: 'senior-dev-1', role: 'senior_dev', status: 'completed', duration: 4000 }
  ],
  total_duration: 16000,
  violations: 0,
  whip_count: 0
})

如果 Agent-backend-2 偷懒:
调用: Log-Laziness-Pattern('backend-2', 'LP001', '5分钟无产出')
```

**记录格式示例**：

```markdown
## Agent Team 执行记录

### 时间: 2026-04-07 15:00

### 阶段: W04 架构评审

### Agent 列表
| Agent | 任务 | 状态 | 耗时 |
|-------|------|------|------|
| architect | 架构评审 | ✅ 完成 | 5min |
| security_expert | 安全评审 | ✅ 完成 | 7min |
| senior_dev | 可行性评审 | ✅ 完成 | 4min |

### 争议点
- 认证方案: JWT vs Session → 已解决（采用 JWT）

### 鞭策记录
- 无

### 最终评分: 7.5/10

### 用户确认: ✅ 通过
```
