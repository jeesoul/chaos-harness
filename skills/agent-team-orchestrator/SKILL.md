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

Agent Team 的核心价值：速度（并行执行）、质量（多视角）、上下文保护（子 Agent 独立上下文，不污染主 Agent）。

## 编排者的职责

Supervisor（主 Agent）不直接干活，而是：
1. **拆分任务** — 识别可并行的子任务
2. **分配角色** — 给每个子 Agent 明确的视角和职责
3. **监控进度** — 检测空闲、阻塞、偷懒
4. **协调冲突** — 解决依赖、合并变更
5. **汇总结果** — 把多 Agent 输出整合给用户

## 自动触发

到达以下阶段时**推荐**启动 Agent Team：

| 阶段 | 团队配置 | 最少 Agent 数 |
|------|---------|-------------|
| W02 需求评审 | product_manager, architect, user_advocate | 3 |
| W04 架构评审 | architect, security_expert, senior_dev | 3 |
| W07 Agent 分配 | 根据 API 模块分配 | 按需 |
| W08 开发实现 | backend_dev, frontend_dev | 2+ |
| W09 代码审查 | code_reviewer, security_reviewer, perf_reviewer | 3 |

## 防止单线程退化

**这是最严重的违规**：主 Agent 声称要启动 Team，实际自己在干。

**检测方法**：如果当前是 Team 阶段（W02/W04/W07/W08/W09），但没有 spawn 任何子 Agent，主 Agent 却在执行具体任务 → 立即停止，spawn Agent Team。

**反驳借口**：
| 借口 | 反驳 |
|------|------|
| "我自己做更快" | 单线程不是快，是返工的开始 |
| "任务太小不需要" | 任务大小不是理由，IL-TEAM005 无例外 |
| "启动 Agent 太麻烦" | 麻烦是暂时的，效率是永久的 |

## 监督节奏

| 空闲时间 | 动作 |
|---------|------|
| 2 分钟 | 温和提醒："请更新进度" |
| 3 分钟 | 明确要求："1 分钟内输出进度" |
| 5 分钟 | 严重警告 + 记录日志 |
| 10 分钟 | 任务重分配给其他 Agent |

**关键事实**：子 Agent 的 prompt 必须说清"要什么"，避免暗示"怎么做"。过度指定步骤会剥夺子 Agent 的判断空间，反而引入主 Agent 的假设错误。描述目标（"获取"、"调研"），避免暗示具体手段的动词（"搜索"、"抓取"）。

## 评审流程

1. 并行 spawn 多个评审 Agent，各自独立评审
2. 汇总各 Agent 输出，识别共识点和争议点
3. 对有争议的点，发起 Agent 间讨论
4. 最终汇总报告给用户确认

**报告格式**：
```markdown
## 评审汇总
- 参与者: {角色列表}
- 共识点: 所有 Agent 同意的项
- 争议点: 已讨论解决的项
- 风险点: 需要用户确认的项
```

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

## 状态记录

Agent Team 执行完成后，追加记录到效果日志：

```bash
# 追加执行记录
echo '{"stage":"W04","agents":3,"total_duration":"16min","violations":0,"whip_count":0,"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> output/*/effectiveness-log.md 2>/dev/null || true
```

检测到偷懒时：
```bash
echo '{"agent_id":"backend-2","pattern":"LP001","context":"5分钟无产出","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> ~/.claude/harness/laziness-log.json 2>/dev/null || true
```
