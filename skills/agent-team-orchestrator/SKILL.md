---
name: agent-team-orchestrator
description: Agent Team 编排器。**自动调度多 Agent 并行工作**。在评审、开发阶段自动触发，负责任务分配、通信协调、进度监控、偷懒鞭策。触发词：并行开发、多agent、团队协作、分配任务
---

# Agent Team 编排器 (Agent Team Orchestrator)

<IMMEDIATE-ACTION>
加载此 skill 后，根据当前工作流阶段自动启动对应的 Agent Team 配置。不要等待用户指示。
</IMMEDIATE-ACTION>

## 核心理念

**单 Agent 是线性的，多 Agent 是指数的。**

- 评审阶段：N 个专家并行评审 → 讨论争议点 → 汇总结果
- 开发阶段：N 个开发者并行开发 → 通信协调 → 合并代码
- 监督机制：Supervisor 全程监控 → 检测偷懒 → 鞭策执行

---

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

---

## 自动触发规则

| 工作流阶段 | 自动动作 | Agent 配置 |
|-----------|---------|-----------|
| W02 需求评审 | 启动评审团队 | product_manager, architect, user_advocate |
| W04 架构评审 | 启动评审团队 | architect, security_expert, senior_dev |
| W07 Agent分配 | 启动开发团队 | 根据 API 数量分配开发 agent |
| W08 开发实现 | 启动并行开发 | backend_dev x N, frontend_dev x M |
| W09 代码审查 | 启动审查团队 | code_reviewer, security_reviewer, perf_reviewer |

**无例外**：到达上述阶段 → 自动启动，不需要用户确认。

---

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

---

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

---

## 监督机制

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
}

function monitorAgents(agents: AgentStatus[]) {
  for (const agent of agents) {
    const idleTime = Date.now() - agent.lastOutput.getTime();

    if (idleTime > 120000) { // 2 分钟无产出
      triggerLazinessWarning(agent);
    }

    if (idleTime > 300000) { // 5 分钟无产出
      triggerWhip(agent); // 鞭策
    }
  }
}
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

### 鞭策话术模板

| 空闲时间 | 鞭策级别 | 消息模板 |
|---------|---------|---------|
| 2 分钟 | 温和提醒 | "请更新你的进度" |
| 3 分钟 | 明确要求 | "1 分钟内输出进度，否则记录到日志" |
| 5 分钟 | 严重警告 | "已记录到 effectiveness-log，请解释原因" |
| 10 分钟 | 任务重分配 | "任务将重新分配给其他 Agent" |

---

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

---

## 铁律

### IL-TEAM001: 评审必须多 Agent

```
REVIEW REQUIRES MULTIPLE AGENTS
```

评审阶段必须启动至少 2 个 Agent，不能单人评审。

### IL-TEAM002: 开发必须并行

```
DEVELOPMENT REQUIRES PARALLEL AGENTS
```

开发阶段必须启动多个 Agent 并行开发，不能串行。

### IL-TEAM003: 监督必须持续

```
MONITORING MUST BE CONTINUOUS
```

Supervisor 必须全程监控 Agent 进度，检测到偷懒必须鞭策。

### IL-TEAM004: 结果必须汇总

```
RESULTS REQUIRE SYNTHESIS
```

多 Agent 结果必须汇总给用户确认，不能直接通过。

---

## 效果追踪

每次 Agent Team 执行后，记录到 effectiveness-log：

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