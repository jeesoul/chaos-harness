---
name: collaboration-reviewer
description: "多 Agent 协作评审。由 agent-team-orchestrator 调度。触发词：评审、审查、协作"
license: MIT
version: "1.3.0"
---

# Collaboration Reviewer

## 核心理念

**评审是强制性的质量门禁，不是可选的建议环节。**

- 多视角：至少 2 个 Agent 并行评审
- 通信讨论：Agent 间讨论争议点
- 用户确认：最终结果必须由用户确认

## 评审配置

| 阶段 | Agent 配置 | 最少 Agent 数 |
|------|-----------|--------------|
| W02 需求评审 | product_manager, architect, user_advocate | 3 |
| W04 架构评审 | architect, security_expert, senior_dev | 3 |
| W09 代码审查 | code_reviewer, security_reviewer, perf_reviewer | 3 |

## 评审流程

1. **启动** — agent-team-orchestrator spawn 多个评审 Agent
2. **独立评审** — 每个 Agent 输出评审报告（评分、问题、建议）
3. **讨论争议** — Supervisor 检测到分歧后发起 Agent 间讨论
4. **汇总确认** — 共识点、争议点、风险点汇总给用户

**汇总报告格式**：
```markdown
## 评审汇总
- 参与者: {角色列表}
- 评分: {平均分}
- 共识点: 所有 Agent 同意的项
- 争议点: 已讨论解决的项
- 风险点: 需要用户确认的项（严重程度、位置、建议）
```

## 用户确认规则

**必须确认**：
- 存在高风险点
- 平均评分 < 6
- 有未解决的争议

**可自动通过**（仍需通知用户）：
- 平均评分 ≥ 8
- 无高风险点
- 无未解决争议
- 所有 Agent 完成评审

## 铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL-TEAM001 | 评审必须多 Agent | 最少 2 个 Agent |
| IL-TEAM004 | 结果必须汇总 | 必须输出汇总报告 |
| IL003 | 完成需验证 | 所有 Agent 报告齐全 + 用户确认 |

## 状态记录

评审完成后追加记录：

```bash
echo '{"stage":"W04","score":7.5,"agents":3,"risks":1,"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> output/*/review-log.md 2>/dev/null || true
```
