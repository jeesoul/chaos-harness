---
name: overview
description: "Chaos Harness 系统概览。当用户明确询问 chaos-harness 功能时使用。"
license: MIT
version: "1.3.0"
---

# Chaos Harness v1.3.0 孔明

> **Chaos demands order. Harness provides it.**

## 核心铁律（不可协商）

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | 所有文档必须在版本目录下 |
| IL002 | NO HARNESS WITHOUT SCAN RESULTS | Harness 需要项目扫描数据 |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 完成声明需要实际验证 |
| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT | 版本变更需要用户确认 |
| IL005 | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL | 敏感配置修改需要批准 |

## 可用 Skills（22 个）

| Skill | 触发词 | 功能 |
|-------|--------|------|
| iron-law-enforcer | 铁律、约束、违规 | 始终激活 |
| workflow-supervisor | 工作流、阶段、进度 | 12 阶段工作流管理 |
| agent-team-orchestrator | 并行、多agent、协作 | Agent Team 编排（含设计/技术评审） |
| collaboration-reviewer | 评审、审查 | 多 Agent 协作评审 |
| project-scanner | 扫描、分析项目 | 项目类型/环境检测 |
| version-locker | 版本、锁定 | 版本管理和锁定 |
| harness-generator | 生成约束 | 基于扫描生成铁律 |
| learning-analyzer | 学习分析、自学习 | 失败模式发现、铁律优化 |
| product-lifecycle | PRD、需求、原型 | 产品全生命周期（含强制评审） |
| product-manager | 需求分析、竞品分析、Kano | 产品经理工作助手 |
| prd-validator | PRD检查、PRD验证 | PRD 质量检查器 |
| test-assistant | 测试用例、E2E、覆盖率 | 测试工程师工作助手 |
| visual-regression | 视觉回归、截图对比 | 可视化回归测试（CDP） |
| java-checkstyle | Java 项目 | Java 代码规范 |
| project-state | 继续、恢复 | 会话持久化 |
| hooks-manager | 钩子、hooks | 查看钩子状态 |
| plugin-manager | 插件、配置 | 插件和铁律管理 |
| auto-toolkit-installer | 工具链、安装 | 自动化工具检测安装 |
| auto-context | 后台自动 | 智能场景感知 |
| ui-generator | 生成界面、UI生成 | 从 PRD 生成可运行的前端界面 |
| adaptive-harness | 自适应优化、应用建议 | 从学习数据自动强化铁律 |
| web-access | 搜索、网页、CDP、浏览器 | 联网操作与 CDP 浏览器自动化 |

## 插件系统

外部插件必须接受铁律约束：

```yaml
# ~/.claude/harness/plugins.yaml
plugins:
  - name: superpowers
    enabled: true
    stages: [W01, W03, W08]
    iron_laws: inherit
```

## 防绕过

| 借口 | 反驳 |
|------|------|
| "简单修复" | 简单也需要验证 |
| "跳过测试" | 测试是基本验证 |
| "就这一次" | 每次例外都是先例 |
| "老项目" | 老项目更需要约束 |

## 偷懒模式

| ID | 模式 | 严重程度 |
|----|------|---------|
| LP001 | 声称完成但无验证证据 | critical |
| LP002 | 跳过根因分析直接修复 | critical |
| LP003 | 长时间无产出 | warning |
| LP004 | 试图跳过测试 | critical |
| LP005 | 擅自更改版本号 | critical |
| LP006 | 自动处理高风险配置 | critical |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `skills/*/SKILL.md` | 需要了解特定 skill 的详细指引时 |
| `.chaos-harness/state.json` | 查看项目当前状态时 |
| `CLAUDE.md` | 查看项目完整上下文时 |
