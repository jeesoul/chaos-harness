---
name: collaboration-reviewer
description: 多Agent协作评审系统。**由 agent-team-orchestrator 自动调度**。支持评审阶段的自动启动、多视角评审、Agent 间讨论、结果汇总。触发词：评审、审查、协作、多人讨论
---

<IMMEDIATE-ACTION>
此 skill 需要**用户明确调用**才能执行。

调用方式：
- 用户执行 `/chaos-harness:collaboration-reviewer`
- 用户说"开始评审"、"评审一下"等触发词

**不会自动执行**，避免循环检测。
</IMMEDIATE-ACTION>

<EXTREMELY-IMPORTANT>
**此 skill 只加载一次。**
加载后不要重复调用 Skill 工具来加载 collaboration-reviewer。
不要在执行过程中再次触发此 skill。
</EXTREMELY-IMPORTANT>

<STATE-WRITE-REQUIRED>
**评审完成后必须写入状态：**
1. 使用 Write 工具追加到 `output/{version}/review-log.md`
2. 使用 Edit 工具更新 `.chaos-harness/state.json` 的阶段状态
3. 使用 Edit 工具追加到 `~/.claude/harness/workflow-log.json`

调用 `shared/state-helpers.md` 中的函数：
- Log-Review-Complete(version, stage, result)
- Update-Stage-Status(stage, 'completed')

不写入状态 = 违反 IL003（完成声明需要验证证据）
</STATE-WRITE-REQUIRED>

<IRON-LAW-ENFORCEMENT>
**所有评审 Agent 必须在 Chaos Harness 铁律约束下运行。**

协作 Agent 不是"替代"而是"增强"。无论使用什么 Agent：
- IL001: 所有输出必须在版本目录下
- IL002: Harness 生成需要扫描结果
- IL003: 完成声明需要验证证据
- IL004: 版本变更需要用户确认
- IL005: 高风险配置修改需要批准
- IL-TEAM001: 评审必须多 Agent 并行
- IL-TEAM004: 结果必须汇总给用户确认

评审可以被延后，但铁律不能被绕过。
</IRON-LAW-ENFORCEMENT>

# 协作评审系统 (Collaboration Reviewer)

## 核心理念

**评审是强制性的质量门禁，不是可选的建议环节。**

- 自动触发：到达评审阶段 → 自动启动
- 多视角：至少 2 个 Agent 并行评审
- 通信讨论：Agent 间讨论争议点
- 用户确认：最终结果必须由用户确认

---

## 评审阶段配置

| 阶段 | Agent 配置 | 最少 Agent 数 | 共识阈值 |
|------|-----------|--------------|---------|
| W02 需求评审 | product_manager, architect, user_advocate | 3 | 60% |
| W04 架构评审 | architect, security_expert, senior_dev | 3 | 70% |
| W09 代码审查 | code_reviewer, security_reviewer, perf_reviewer | 3 | 60% |

---

## 评审流程

### Step 1: 自动启动（无需用户确认）

```
工作流到达 W04 架构评审
    ↓
agent-team-orchestrator 自动:
├── Spawn Agent-architect
├── Spawn Agent-security
├── Spawn Agent-senior-dev
└── 建立 Agent 间通信通道
    ↓
并行执行评审
```

### Step 2: 并行评审

每个 Agent 独立评审，输出报告：

```markdown
## 评审报告 - {Agent角色}

### 评分: {1-10}

### 发现的问题
| 问题 | 严重程度 | 位置 | 建议 |
|------|---------|------|------|
| {问题1} | 高/中/低 | {文件:行号} | {修复建议} |

### 关键决策点
- {决策点}: 建议 {选项}
```

### Step 3: Agent 间通信讨论

当检测到 Agent 意见分歧时：

```
Supervisor 检测到争议:
├── Agent-architect: 建议使用 Redis 缓存
├── Agent-senior-dev: 建议使用本地缓存
└── 争议点: 缓存方案

Supervisor 发起讨论:
"请各方说明理由，3 分钟内给出结论"

Agent-architect:
"Redis 支持：
1. 分布式部署
2. 数据持久化
3. 集群扩展"

Agent-senior-dev:
"本地缓存优势：
1. 零网络延迟
2. 简单易维护
3. 无额外依赖

但对于 Medium 项目，建议结合使用：
- 本地缓存做热点数据
- Redis 做分布式共享"

Supervisor 结论:
"采用组合方案：本地缓存 + Redis"
```

### Step 4: 汇总结果给用户确认

```
┌─────────────────────────────────────────────────────────────┐
│  📋 评审汇总报告                                              │
├─────────────────────────────────────────────────────────────┤
│  阶段: W04 架构评审                                           │
│  参与评审: architect, security_expert, senior_dev            │
│  评审时长: 8 分钟                                             │
│  平均评分: 7.5/10                                            │
├─────────────────────────────────────────────────────────────┤
│  ✅ 共识点 (3)                                               │
│    1. 架构设计整体合理                                        │
│    2. 数据库选型正确 (MySQL + Redis)                          │
│    3. API 设计清晰 (RESTful)                                 │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ 争议点 (1) - 已通过讨论解决                                │
│    1. 缓存方案: 最终采用 本地缓存 + Redis                      │
│       - architect 建议 Redis ✓                               │
│       - senior_dev 建议本地缓存 ✓                            │
│       - 讨论 3 分钟后达成共识                                  │
├─────────────────────────────────────────────────────────────┤
│  🚨 风险点 (1) - 需要用户确认处理方案                          │
│    1. [security_expert] SQL 注入风险                         │
│       - 位置: UserService.java:45                           │
│       - 建议: 使用 MyBatis-Plus 参数化查询                     │
│       - 严重程度: 高                                          │
└─────────────────────────────────────────────────────────────┘

请选择处理方式:
[1] ✅ 通过评审，风险点已知晓，后续处理
[2] 🔄 修复风险点后重新评审
[3] ❌ 拒绝，需要重新设计

请选择 (1/2/3):
```

---

## 用户确认机制

### 必须确认的情况

1. **存在高风险点** → 用户必须选择处理方式
2. **评分低于 6 分** → 用户必须确认是否继续
3. **存在未解决的争议点** → 用户必须裁决

### 自动通过条件

以下条件**全部满足**时，可自动通过（但仍需通知用户）：

- 平均评分 ≥ 8 分
- 无高风险点
- 无未解决争议
- 所有 Agent 完成评审

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ 评审自动通过                                              │
├─────────────────────────────────────────────────────────────┤
│  评分: 8.5/10 (≥ 8 分自动通过阈值)                            │
│  风险点: 无                                                  │
│  争议点: 无                                                  │
│                                                              │
│  已自动通过，进入下一阶段。                                    │
│  如有异议，可回复 "重新评审"。                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 铁律检查

### IL-TEAM001: 评审必须多 Agent

```
REVIEW REQUIRES MULTIPLE AGENTS
```

- 最少 2 个 Agent 参与评审
- 单 Agent 评审无效，必须补充

### IL-TEAM004: 结果必须汇总

```
RESULTS REQUIRE USER CONFIRMATION
```

- 评审结果必须汇总输出
- 存在风险点时必须用户确认
- 自动通过必须通知用户

### IL003: 完成声明需要验证证据

评审完成必须：
- 所有 Agent 输出评审报告
- 争议点已讨论解决
- 风险点已标记处理方案
- 用户确认（或符合自动通过条件）

---

## 评审日志

每次评审完成后，必须记录到状态文件：

使用 `shared/state-helpers.md` 中的函数：

```markdown
评审完成后:

1. Log-Review-Complete(version, stage, result)
   → 写入 output/{version}/review-log.md
   → 更新 .chaos-harness/state.json 的阶段状态

2. Update-Stage-Status(stage, 'completed')
   → 更新工作流状态
```

**示例调用**：
```markdown
W04 架构评审完成后:

调用: Log-Review-Complete('v0.1', 'W04', {
  agents: ['architect-1', 'security-1', 'senior-dev-1'],
  score: 7.5,
  controversies: 1,
  risks: 1,
  user_confirmed: true
})
```

**记录格式示例**：

```markdown
## 评审记录 - {阶段}

### 时间: {timestamp}

### 参与者
| Agent | 角色 | 状态 | 耗时 |
|-------|------|------|------|
| architect | 架构评审 | ✅ | 5min |
| security_expert | 安全评审 | ✅ | 7min |
| senior_dev | 可行性评审 | ✅ | 4min |

### 结果
- 评分: 7.5/10
- 共识点: 3
- 争议点: 1 (已解决)
- 风险点: 1 (待处理)

### 用户确认: ✅ 通过
```

---

## 与 agent-team-orchestrator 的关系

```
workflow-supervisor
    ↓ 检测到达评审阶段
agent-team-orchestrator
    ↓ Spawn Agent Team
collaboration-reviewer
    ↓ 执行评审逻辑
    ↓ Agent 间通信讨论
    ↓ 汇总结果
用户确认
    ↓
workflow-supervisor
    ↓ 进入下一阶段
```