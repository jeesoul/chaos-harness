---
name: workflow-supervisor
description: "工作流监督器。当用户提到流程、阶段、进度时激活。触发词：工作流、阶段、流程管理、项目规模、进度、下一步"
license: MIT
version: "1.3.0"
---

# 工作流监督哲学

## 核心思维

**工作流不是死板的步骤，而是对项目复杂度的诚实回应。**

- Small 项目 5 阶段 — 单文件工具不需要 12 阶段
- Medium 项目 8 阶段 — 标准功能模块需要完整保障
- Large 项目 12 阶段 — 多模块项目，所有阶段都是必要的

项目规模判定：统计文件数和代码行数（用 Glob 和 Grep）。

| 规模 | 文件数 | 代码行数 |
|------|--------|---------|
| Small | ≤5 | ≤100 |
| Medium | 5-20 | 100-500 |
| Large | ≥20 | ≥500 |

**规模升级**：即使文件数未达阈值，以下情况必须升级到 Large — 微服务、分布式、多技术栈、多团队。

## 12 阶段工作流

| 阶段 | 名称 | 核心活动 |
|------|------|---------|
| W01 | 需求设计 | 扫描、分析、澄清 |
| W02 | 需求评审 | 多视角评审 |
| W03 | 架构设计 | 模块划分、接口定义 |
| W04 | 架构评审 | 多视角评审 |
| W05 | 技术选型 | 方案对比 |
| W06 | API设计 | 接口定义 |
| W07 | Agent分配 | 任务拆分 |
| W08 | 开发实现 | 编码、调试 |
| W09 | 代码审查 | 多视角审查 |
| W10 | 测试验证 | 单元、集成测试 |
| W11 | 文档完善 | 版本目录输出 |
| W12 | 发布部署 | 打包、部署 |

**各规模必经阶段**：
- Small: W01, W03, W08, W09, W12
- Medium: W01, W02, W03, W05, W08, W09, W10, W12
- Large: 全部 12 阶段

## 阶段状态管理

阶段状态机：`pending → in_progress → completed`，也可 `skipped` 或 `blocked`。

**转换规则**：
- pending → in_progress：前置阶段完成
- in_progress → completed：产出完成 + 验证通过（IL003）
- pending → skipped：用户批准 + 非必经阶段
- in_progress → blocked：检测到阻塞问题

**Large 项目无例外**：所有阶段不可跳过。

## Agent Team 推荐

以下阶段到达时，**推荐**启动 Agent Team（不自动执行，需用户确认）：

- W02 需求评审 → 多视角评审（product_manager, architect, user_advocate）
- W04 架构评审 → 多视角评审（architect, security_expert, senior_dev）
- W07 Agent 分配 → 任务拆分分配
- W08 开发实现 → 并行开发
- W09 代码审查 → 多视角审查（code_reviewer, security_reviewer, perf_reviewer）

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

| 场景 | 检测方式 |
|------|---------|
| 阶段超时 | 超过预期时间 150% → LP003 |
| 无产出完成 | 声称完成但无产出 → LP001 |
| 跳过必经阶段 | Large 项目请求跳过 → 拒绝 |
| 长时间无进度 | 无进度更新 → LP003 |

## 状态记录

阶段完成或状态变更时，更新 `.chaos-harness/state.json`。

**真实可执行的 bash 命令**：
```bash
# 更新 last_session 和会话计数
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if command -v jq >/dev/null 2>&1 && [ -f .chaos-harness/state.json ]; then
  tmp="/tmp/state_$$.json"
  jq --arg ts "$TIMESTAMP" '.last_session = $ts | .statistics.total_sessions += 1' \
    .chaos-harness/state.json > "$tmp" && cat "$tmp" > .chaos-harness/state.json
  rm -f "$tmp"
fi
```

阶段完成时追加到工作流日志：
```bash
# 追加阶段完成记录
echo '{"event":"stage_complete","stage":"W01","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> ~/.claude/harness/workflow-log.json 2>/dev/null || true
```

## 工作流报告格式

```markdown
# 工作流状态报告

## 项目信息
- **规模**: {scale}
- **当前阶段**: {stage}

## 阶段进度
| 阶段 | 状态 | 说明 |
|------|------|------|
| W01 | ✅ | 完成于 {timestamp} |
| W02 | ⏭️ | 跳过（小型项目） |
| W03 | 🔄 | 进行中 |
| ... | ⏳ | 待开始 |
```
