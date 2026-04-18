---
name: agent-team-orchestrator
description: "Agent Team 编排器。在评审、开发阶段自动触发。触发词：并行开发、多agent、团队协作、分配任务"
license: MIT
version: "1.3.1"
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

### 超频模式（紧急任务 — P0 最高优先级）

| 问题类型 | 团队配置 | 最少 Agent 数 | 目标 |
|---------|---------|-------------|------|
| 代码缺陷 | diagnoser, context-reader, hypothesis-generator | 3 | 3 分钟内定位根因 |
| 需求变更 | product_analyst, impact_reader, scope_adjuster | 3 | 快速评估影响范围 |
| 架构修改 | arch_reader, impact_analyst, alternative_explorer | 3 | 最优方案快速决策 |
| 测试调整 | test_analyst, coverage_reader, case_adjuster | 3 | 紧急调整测试优先级 |
| 运维事故 | log_analyst, infra_reader, fix_generator | 3 | 最短时间恢复服务 |

**超频模式下 Agent 分配规则**：
- 主 Agent 不做具体分析，只负责协调和拍板
- 各 Agent 独立工作，不等待他人结果
- 分歧时主 Agent 1 分钟内拍板，不展开讨论
- 总时间目标：14 分钟完成全流程

## 编排决策框架

不要从"启动几个 Agent"开始推理。从这三个问题开始：

1. **任务能不能拆分？** — 如果子任务的结果互不依赖，就可以并行；如果下一个需要上一个的结果，只能串行
2. **每个 Agent 要什么？** — 说清楚目标和产出标准，不要指定具体步骤。过度指定会剥夺子 Agent 的判断空间，引入你的假设错误
3. **上下文怎么保护？** — 主 Agent 只收摘要，详细内容留在子 Agent 上下文。抓取内容不进入主 Agent 上下文，节省 token

### 子 Agent Prompt 写法

- 描述**目标**（"获取"、"调研"、"了解"），避免暗示具体手段的动词（"搜索"、"抓取"、"爬取"）
- 写清**产出标准**（什么算完成？需要输出什么格式？）
- 声明**约束**（铁律、边界条件、不能做什么）

### 子 Agent Prompt 模板（推荐使用）

每个子 Agent 的 prompt 必须包含以下结构：

```
你是 {角色名}，负责 {具体目标}。

## 目标
{一句话描述要达成什么}

## 产出标准
- 输出格式：{明确格式}
- 完成标志：{什么算做完了}

## 约束
- 铁律：{相关铁律 ID}
- 边界：{不能做什么}

你必须独立完成此任务，不要依赖其他 Agent 的结果。完成后输出上述格式的结果。
```

### 子 Agent 失败/超时处理

**这是最关键的部分**——当子 Agent 不产出或产出不足时：

1. **不要自己接手** — 这是 IL-TEAM005 底线违规
2. **重新 spawn** — 用更明确的 prompt 重新分配同一个任务给新 Agent
3. **追加 Agent** — 在原有基础上增加一个 Agent 做同一任务（冗余执行）
4. **汇总已有结果** — 如果部分 Agent 有产出，先汇总已有的，标记未完成

**错误做法**：
- ❌ "Agent 没干活，我来做"
- ❌ "看起来 Agent 卡住了，我直接分析"
- ❌ "为了节省时间，我自己处理"

**正确做法**：
- ✅ "Agent A 未响应，重新分配任务给 Agent D"
- ✅ "Agent B 产出不足，追加 Agent E 做同一分析"
- ✅ "汇总 Agent A 和 C 的结果，标记 B 未完成"

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

**LP007 检测**：子 Agent 未产出时，主 Agent 代劳 → 立即停止，重新分配或追加 Agent。

**等待规则**：
- 子 Agent spawn 后，**必须等待其完成**，不要提前介入
- 如果 Agent 长时间无响应，**重新 spawn**，不要自己接手
- 汇总时只取**已有结果**，未完成的部分标记为"未完成"，不要补做

## 监督节奏

| 空闲时间 | 正常模式 | 超频模式 |
|---------|---------|---------|
| 1 分钟 | — | 温和提醒 |
| 2 分钟 | 温和提醒 | 明确要求 |
| 3 分钟 | 明确要求 | 严重警告 + 记录日志 |
| 5 分钟 | 严重警告 + 记录日志 | 任务重分配 |
| 10 分钟 | 任务重分配 | 追加冗余 Agent |

**超频模式下监督加速**：IL-TEAM003 要求持续监督，超频模式将所有空闲阈值减半，更快发现和处理 Agent 无响应。

## 状态记录

```bash
# 追加执行记录
echo '{"stage":"W04","agents":3,"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> output/*/effectiveness-log.md 2>/dev/null || true

# 记录偷懒检测
echo '{"agent_id":"backend-2","pattern":"LP001","context":"5分钟无产出","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> ~/.claude/harness/laziness-log.json 2>/dev/null || true
```

## 与迭代检索模式集成

当 Agent Team 需要检索代码库上下文时，使用 iterative-retrieval 4 阶段循环：

### 多 Agent 并行检索

```
检索 Agent（Haiku） → 候选文件列表
评估 Agent（Sonnet） → 相关性评分 + 缺失上下文
精炼 Agent（Sonnet） → 更新搜索标准
```

### 检索任务分配

在子 Agent prompt 中增加检索指令：

```
## 检索策略
使用 iterative-retrieval 4 阶段循环：
1. DISPATCH: 广泛搜索相关文件和模式
2. EVALUATE: 评估每个文件的相关性（高/中/低/无）
3. REFINE: 基于高相关性文件更新搜索关键词
4. LOOP: 最多 3 次循环，或找到 5+ 高相关性文件
```

## 与本能系统集成

每次 Agent Team 执行后，将经验模式写入 instinct-system：

```bash
# 记录协调模式
echo '{"type":"agent_coordination","pattern":"并行检索成功","confidence":0.5,"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' \
  >> instincts/observations.jsonl 2>/dev/null || true
```

当检测到以下模式时自动记录：
- 成功的并行执行模式 → confidence +0.05
- Agent 无响应重分配成功 → 记录重分配策略
- 检索循环命中高相关性文件 → 记录检索关键词

## 与 Schema 工作流集成

当在 Schema 工作流模式下：

| 阶段 | Agent 配置 |
|------|-----------|
| W01/P01 | 单 Agent（无需并行） |
| W03/P04 | 2-3 Agent（架构分析并行） |
| W08/P08 | 2+ Agent（前后端/测试并行） |

通过 `schema-utils.mjs list` 查看可用 Schema，通过 `resolve` 查看执行顺序。

## 与战略压缩集成

当工具调用计数达到阈值时：

| 阈值 | Agent 行为 |
|------|-----------|
| 50 次 | 压缩子 Agent 上下文，只传递必要信息 |
| 100 次 | 主 Agent 保存状态快照，重新分配简化任务 |
| 150 次 | 触发 PreCompact，保存关键决策后重启 |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `skills/collaboration-reviewer/SKILL.md` | 需要详细评审流程和汇总报告格式时 |
| `shared/state-helpers.md` | 需要完整状态管理函数时 |
| `~/.claude/harness/laziness-log.json` | 查看历史偷懒检测记录时 |
| `skills/overdrive/SKILL.md` | 超频模式激活，需要紧急任务分配时 |
