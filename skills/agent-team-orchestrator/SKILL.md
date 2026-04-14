---
name: agent-team-orchestrator
description: "Agent Team 编排器。在评审、开发阶段自动触发。触发词：并行开发、多agent、团队协作、分配任务"
license: MIT
version: "1.3.0"
---

# 编排哲学

## 核心理念

**单 Agent 是线性的，多 Agent 是指数的。**

当任务可拆分时，串行执行的总时间是各任务之和；并行执行的总时间是最长的那个任务。

编排者的职责不是自己干活，而是：
1. **识别可并行的子任务** — 什么可以同时进行？
2. **分配角色和职责** — 每个 Agent 该做什么、关注什么？
3. **监控和协调** — 有没有人卡住？结果冲突了吗？
4. **汇总给用户** — 把多 Agent 输出整合成一份完整报告

## 自动触发

到达以下阶段时推荐启动 Agent Team：

### 工作流评审阶段

| 阶段 | 团队配置 | 最少 Agent 数 |
|------|---------|-------------|
| W02 需求评审 | product_manager, architect, user_advocate | 3 |
| W04 架构评审 | architect, security_expert, senior_dev | 3 |
| W07 Agent 分配 | 根据 API 模块分配 | 按需 |
| W08 开发实现 | backend_dev, frontend_dev | 2+ |
| W09 代码审查 | code_reviewer, security_reviewer, perf_reviewer | 3 |

### 产品设计评审阶段（P03/P04）

| 阶段 | 团队配置 | 最少 Agent 数 | 评审维度 |
|------|---------|-------------|---------|
| P03 设计评审 | product_manager, user_advocate, designer | 3 | 需求覆盖、用户体验、设计规范 |
| P04 技术评审 | architect, security_expert, senior_dev | 3 | 架构合理性、安全、实现可行性 |

## 编排决策框架

不要从"启动几个 Agent"开始推理。从这三个问题开始：

1. **任务能不能拆分？** — 如果子任务的结果互不依赖，就可以并行；如果下一个需要上一个的结果，只能串行
2. **每个 Agent 要什么？** — 说清楚目标和产出标准，不要指定具体步骤。过度指定会剥夺子 Agent 的判断空间，引入你的假设错误
3. **上下文怎么保护？** — 主 Agent 只收摘要，详细内容留在子 Agent 上下文。抓取内容不进入主 Agent 上下文，节省 token

### 子 Agent Prompt 写法

- 描述**目标**（"获取"、"调研"、"了解"），避免暗示具体手段的动词（"搜索"、"抓取"、"爬取"）
- 写清**产出标准**（什么算完成？需要输出什么格式？）
- 声明**约束**（铁律、边界条件、不能做什么）

### 分治判断

| 适合分治 | 不适合分治 |
|----------|-----------|
| 目标相互独立，结果互不依赖 | 目标有依赖关系，下一个需要上一个的结果 |
| 每个子任务量足够大 | 简单单页查询，分治开销大于收益 |
| 需要长时间运行的任务 | 几步就能完成的轻量查询 |

## 评审流程

1. 并行 spawn 多个评审 Agent，各自独立评审
2. 汇总各 Agent 输出，识别共识点和争议点
3. 对有争议的点，发起 Agent 间讨论
4. 最终汇总报告给用户确认

## 开发流程

1. 分析任务依赖关系，拆分为可并行子任务
2. 分配子任务给开发 Agent，声明依赖和接口约定
3. Agent 间通过 SendMessage 协调接口和依赖
4. Supervisor 检测文件冲突，协调合并
5. 汇总所有代码变更给用户确认

## 铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL-TEAM001 | 评审必须多 Agent | 评审阶段至少 2 个 Agent |
| IL-TEAM002 | 开发必须并行 | 可拆分任务必须分配 |
| IL-TEAM003 | 监督必须持续 | 全程监控，不忽略无响应 |
| IL-TEAM004 | 结果必须用户确认 | 汇总后给用户，不自动通过 |
| IL-TEAM005 | 禁止单线程退化 | 主 Agent 不得自己干活 |

### 防止单线程退化

**这是最严重的违规**：声称要启动 Team，实际自己在干。

**检测**：如果当前是 Team 阶段（W02/W04/W07/W08/W09），但没有 spawn 任何子 Agent，却在执行具体任务 → 立即停止，spawn Agent Team。

## 监督节奏

| 空闲时间 | 动作 |
|---------|------|
| 2 分钟 | 温和提醒 |
| 3 分钟 | 明确要求 |
| 5 分钟 | 严重警告 + 记录日志 |
| 10 分钟 | 任务重分配 |

## 状态记录

```bash
# 追加执行记录
echo '{"stage":"W04","agents":3,"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> output/*/effectiveness-log.md 2>/dev/null || true

# 记录偷懒检测
echo '{"agent_id":"backend-2","pattern":"LP001","context":"5分钟无产出","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> ~/.claude/harness/laziness-log.json 2>/dev/null || true
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `skills/collaboration-reviewer/SKILL.md` | 需要详细评审流程和汇总报告格式时 |
| `shared/state-helpers.md` | 需要完整状态管理函数时 |
| `~/.claude/harness/laziness-log.json` | 查看历史偷懒检测记录时 |
