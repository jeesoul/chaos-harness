---
name: workflow-supervisor
description: "工作流监督器。当用户提到流程、阶段、进度时激活。触发词：工作流、阶段、流程管理、项目规模、进度、下一步"
license: MIT
version: "1.3.0"
---

# 工作流监督哲学

## 核心思维

**工作流不是死板的步骤，而是对项目复杂度的诚实回应。**

不要从阶段编号开始推理。从这三个问题开始：

1. **这个项目有多大？** — 统计文件数和代码行数，诚实判定规模
2. **当前最缺什么？** — 需求不明确就做需求，架构不清楚就做架构，不要跳过空白直接写代码
3. **怎么验证阶段完成了？** — 产出物存在 + 质量达标（IL003），不是"感觉做完了"

规模判定用 Glob 和 Grep 统计：

| 规模 | 文件数 | 代码行数 | 必经阶段 |
|------|--------|---------|---------|
| Small | ≤5 | ≤100 | W01, W03, W08, W09, W12 |
| Medium | 5-20 | 100-500 | W01, W02, W03, W05, W08, W09, W10, W12 |
| Large | ≥20 | ≥500 | 全部 12 阶段 |

**规模升级条件**：即使文件数未达阈值，以下情况必须升级到 Large — 微服务、分布式、多技术栈、多团队。

## 12 阶段全景

| 阶段 | 名称 | 核心活动 | 产出物 |
|------|------|---------|--------|
| W01 | 需求设计 | 扫描、分析、澄清 | 需求文档 |
| W02 | 需求评审 | 多视角评审 | 评审报告 |
| W03 | 架构设计 | 模块划分、接口定义 | 架构文档 |
| W04 | 架构评审 | 多视角评审 | 评审报告 |
| W05 | 技术选型 | 方案对比 | 选型报告 |
| W06 | API设计 | 接口定义 | API 文档 |
| W07 | Agent分配 | 任务拆分 | 任务清单 |
| W08 | 开发实现 | 编码、调试 | 代码变更 |
| W09 | 代码审查 | 多视角审查 | 审查报告 |
| W10 | 测试验证 | 单元、集成测试 | 测试报告 |
| W11 | 文档完善 | 版本目录输出 | 文档 |
| W12 | 发布部署 | 打包、部署 | 发布物 |

## 阶段转换决策

阶段不是按编号顺序机械推进的。用这个决策框架：

**进入某阶段的条件**：
- 前置阶段产出物已存在且通过验证
- 当前阶段的目标明确（知道要产出什么）
- 没有更高优先级的阻塞问题

**退出某阶段的条件**：
- 产出物已生成
- 质量验证通过（IL003 — 完成声明必须有验证证据）
- 用户确认接受（IL004）

**跳过某阶段的条件**：
- Small 项目的非必经阶段
- 用户明确批准
- Large 项目 **绝不允许跳过任何阶段**

## Agent Team 触发

到达以下阶段时推荐启动多 Agent 并行：

| 阶段 | 团队配置 | 最少 Agent 数 |
|------|---------|-------------|
| W02 需求评审 | product_manager, architect, user_advocate | 3 |
| W04 架构评审 | architect, security_expert, senior_dev | 3 |
| W07 Agent 分配 | 根据 API 模块分配 | 按需 |
| W08 开发实现 | backend_dev, frontend_dev | 2+ |
| W09 代码审查 | code_reviewer, security_reviewer, perf_reviewer | 3 |

推荐格式：
```
<HARNESS_RECOMMEND>
当前阶段: W04 架构评审
建议启动 Agent Team 进行多视角评审：
- 架构师: 架构合理性
- 安全专家: 安全风险
- 高级开发: 实现可行性
使用命令: /chaos-harness:agent-team-orchestrator
</HARNESS_RECOMMEND>
```

## 偷懒检测

| 场景 | 检测方式 | 对应模式 |
|------|---------|---------|
| 阶段超时 | 超过预期时间 150% | LP003 |
| 无产出完成 | 声称完成但无产出 | LP001 |
| 跳过必经阶段 | Large 项目请求跳过 | 拒绝 |
| 长时间无进度 | 无进度更新 | LP003 |

## 状态记录

阶段完成或状态变更时执行：

```bash
# 更新 last_session 和会话计数
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if command -v jq >/dev/null 2>&1 && [ -f .chaos-harness/state.json ]; then
  tmp="/tmp/state_$$.json"
  jq --arg ts "$TIMESTAMP" '.last_session = $ts | .statistics.total_sessions += 1' \
    .chaos-harness/state.json > "$tmp" && cat "$tmp" > .chaos-harness/state.json
  rm -f "$tmp"
fi

# 追加阶段完成记录
echo '{"event":"stage_complete","stage":"W01","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> ~/.claude/harness/workflow-log.json 2>/dev/null || true
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `shared/state-helpers.md` | 需要完整状态管理函数（complete_stage, resume_session, get_current_stage）时 |
| `shared/helpers.md` | 需要铁律检查、版本锁定检查、偷懒检测规则时 |
| `~/.claude/harness/workflow-log.json` | 查看历史工作流事件时 |
