---
name: overview
description: "Chaos Harness 主入口 — AI 开发流程操作系统。始终可用。"
license: MIT
version: "1.4.0"
---

# chaos-harness v1.4.0 — AI 开发流程操作系统

> **Your AI dev team, finally has an operating system.**
>
> chaos-harness 是一个 **AI 开发流程操作系统**，整合 superpowers（自动拆任务）、OpenSpec（变更提案）、everything（最佳实践配置）和 chaos-harness 核心（真验证 + 硬拦截）。
>
> Chaos demands order. Harness provides it.

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                    chaos-harness OS (孔明Pro)                    │
├─────────────────────────────────────────────────────────────────┤
│  L1 编排层 (Orchestration)                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐   │
│  │ agent-team-     │ │ overdrive       │ │ workflow-        │   │
│  │ orchestrator    │ │ (超频模式)      │ │ supervisor       │   │
│  │ [superpowers    │ │                 │ │ (12阶段管控)     │   │
│  │  subagent 调度] │ │                 │ │                  │   │
│  └─────────────────┘ └─────────────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  L2 规划层 (Planning)                                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐   │
│  │ product-lifecycle│ │ product-manager │ │ prd-validator    │   │
│  │ (产品全周期)     │ │ (需求池/Kano)   │ │ (PRD质量检查)   │   │
│  │ [OpenSpec opsx   │ │                 │ │                  │   │
│  │  变更提案驱动]   │ │                 │ │                  │   │
│  └─────────────────┘ └─────────────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  L3 能力层 (Capabilities)                                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐   │
│  │ ui-generator     │ │ test-assistant  │ │ web-access       │   │
│  │ (PRD→前端)       │ │ (测试用例/E2E)  │ │ (联网/CDP浏览器) │   │
│  │ [everything      │ │ visual-regress  │ │                  │   │
│  │  agents/rules    │ │ (CDP截图对比)   │ │                  │   │
│  │  最佳实践注入]   │ │ java-checkstyle │ │                  │   │
│  │                 │ │ (Java规范检查)  │ │                  │   │
│  └─────────────────┘ └─────────────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  L4 验证层 (Verification)                                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐   │
│  │ gate-system      │ │ iron-law-       │ │ learning-analyzer│   │
│  │ (6 Gate 状态机)  │ │ enforcer        │ │ (失败模式发现)   │   │
│  │ (硬拦截)         │ │ (铁律执行)      │ │ (铁律优化)       │   │
│  │                 │ │                 │ │                  │   │
│  │ adaptive-       │ │ hooks-manager   │ │ version-locker   │   │
│  │ harness         │ │ (Hook管控)      │ │ (版本锁定)       │   │
│  │ (自适应优化)     │ │                 │ │                  │   │
│  └─────────────────┘ └─────────────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 四层说明

| 层 | 职责 | 核心整合 |
|----|------|----------|
| **L1 编排层** | 多 Agent 调度、任务拆分、超频执行 | superpowers subagent 并发派发 |
| **L2 规划层** | 需求分析、方案设计、PRD 验证 | OpenSpec opsx 变更提案工作流 |
| **L3 能力层** | 代码生成、测试、界面、规范检查 | everything agents/rules 最佳实践 |
| **L4 验证层** | Gate 拦截、铁律执行、版本锁定 | chaos-harness 核心真验证 + 硬拦截 |

---

## 整合说明

### superpowers — 自动拆任务

通过 `agent-team-orchestrator` 调用 superpowers 的 subagent 机制：

- **并发派发**：将大任务拆为子任务，每个子任务派发独立 subagent
- **计划驱动**：`write-plan` → `execute-plan` → `verification-before-completion` 三步曲
- **分支隔离**：每个 subagent 在独立 git worktree 工作，互不干扰
- **完成前验证**：任何 subagent 不得声称完成，必须先通过 verification gate

```
# 典型用法：orchestrator 自动触发
用户："实现用户登录模块"
→ orchestrator 拆分为: [UI] [API] [测试] [文档]
→ 4 个 subagent 并发执行
→ gate-system 在 G3(实现) Gate 统一验收
```

### OpenSpec — 变更提案

通过 `product-lifecycle` 和 `prd-validator` 接入 OpenSpec 的 opsx 工作流：

- **opsx 提案**：每个功能变更以 OpenSpec 提案形式进入，包含影响范围、依赖分析
- **G0 问题定义**：OpenSpec 提案自动映射为 Gate G0 的 problem.md
- **G1 方案设计**：OpenSpec 设计文档作为 Gate G1 的 design.md 输入
- **审计追踪**：每个 opsx 提案有完整变更历史，与 Gate checksum 联动

```
# 典型用法：OpenSpec 提案 → Gate 流程
opsx new "add-user-login"
→ 生成提案: specs/add-user-login/proposal.md
→ 评审通过后自动进入 gate-system G0
→ G0→G1→G2→G3→G4→G5 全流程追踪
```

### everything — 最佳实践配置

通过 `learning-analyzer` 和 `adaptive-harness` 接入 everything 的 agents/rules：

- **agents 目录**：每个领域（Java/Vue/React/Python 等）有独立的 agent 规则集
- **rules 目录**：代码规范、架构模式、测试模式的最佳实践配置
- **自动适配**：`project-scanner` 检测项目类型后，自动注入对应规则
- **持续进化**：`learning-analyzer` 从失败模式中发现规则缺陷，`adaptive-harness` 自动优化

```
# 典型用法：扫描 → 注入 → 执行
project-scanner 检测: Spring Boot + Vue3
→ 注入: agents/java-springboot/rules, agents/vue3/rules
→ iron-law-enforcer 按规则检查所有产出
→ learning-analyzer 记录违规模式，持续优化
```

### chaos-harness 核心 — 真验证 + 硬拦截

- **Gate System**：6 个 Gate 状态机，exit 1 硬拦截，不可绕过
- **Iron Laws**：22+ 条铁律，自动检测 + 强制执行
- **Version Lock**：所有文档版本锁定，变更需审批
- **Lazy Detection**：偷懒模式自动识别，LP001-LP007 全覆盖

---

## Gate 状态机

### 6 个 Gate（6 道门）

```
  G0          G1          G2          G3          G4          G5
问题定义 ──→ 方案设计 ──→ 任务拆分 ──→ 实现 ──→ 测试 ──→ 发布
(problem)   (design)    (tasks)     (code)    (test)   (release)
  │           │           │           │           │          │
  评审        评审        评审        评审        评审       评审
  产出:       产出:       产出:       产出:       产出:      产出:
  problem.md  design.md   tasks.md    代码文件    test-report  release.md
```

### Gate 状态转换

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [idle] ──init──→ [G0:problem] ──advance──→ [G1:design]   │
│     ↑                    │                      │           │
│     │                    v                      v           │
│     │              [verify] ──pass──→ [G1:design]           │
│     │                    │                      │           │
│     │                    └──fail──→ [G0:problem] (rework)   │
│     │                                                     │
│     │   ┌──────── G2 ──────── G3 ──────── G4 ──────── G5   │
│     │   │  tasks      code        test       release       │
│     │   │                                                    │
│     └─── completed ←── verify ←── advance ←── ...            │
│                                                             │
│   规则: NO SKIP | NO BACK | CHECKSUM LOCK                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Gate 操作命令

```bash
# 初始化（从 idle 进入 G0）
node scripts/gate-machine.mjs init "用户登录功能"

# 查看当前状态
node scripts/gate-machine.mjs status

# 验证当前 Gate 产出
node scripts/gate-machine.mjs verify

# 推进到下一个 Gate（需先 verify pass）
node scripts/gate-machine.mjs advance

# 失败恢复
node scripts/gate-recovery.mjs --recover
```

---

## Gate 铁律（IL-GATE001-005）

| ID | 铁律 | 说明 |
|----|------|------|
| IL-GATE001 | NO SKIP GATES | 不可跳过任何 Gate，必须顺序 +1 推进 |
| IL-GATE002 | NO CODING BEFORE G3 | G3（实现）之前禁止 Write/Edit 任何代码文件 |
| IL-GATE003 | NO MODIFY LOCKED | 已通过 Gate 的产出文件禁止非评审者修改 |
| IL-GATE004 | NO TESTING BEFORE G4 | G3 完成前禁止运行测试（避免无效测试） |
| IL-GATE005 | RECOVERY REQUIRED | Gate 失败必须走 gate-recovery 恢复流程，不可手动修复后绕过 |

---

## 核心铁律（IL001-IL005）

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | 所有文档必须在版本目录下 |
| IL002 | NO HARNESS WITHOUT SCAN RESULTS | Harness 需要项目扫描数据 |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 完成声明需要实际验证 |
| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT | 版本变更需要用户确认 |
| IL005 | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL | 敏感配置修改需要批准 |

---

## 全部 Skill 索引（23 个）

| Skill | 所属层 | 触发词 |
|-------|--------|--------|
| agent-team-orchestrator | L1 | 并行、多agent、协作 |
| overdrive | L1 | 紧急、超频、立刻解决 |
| workflow-supervisor | L1 | 工作流、阶段、进度 |
| product-lifecycle | L2 | PRD、需求、原型 |
| product-manager | L2 | 需求分析、竞品分析、Kano |
| prd-validator | L2 | PRD检查、PRD验证 |
| ui-generator | L3 | 生成界面、UI生成 |
| test-assistant | L3 | 测试用例、E2E、覆盖率 |
| visual-regression | L3 | 视觉回归、截图对比 |
| web-access | L3 | 搜索、网页、CDP、浏览器 |
| java-checkstyle | L3 | Java 项目 |
| gate-system | L4 | 门控、gate、拦截 |
| iron-law-enforcer | L4 | 铁律、约束、违规 |
| learning-analyzer | L4 | 学习分析、自学习 |
| adaptive-harness | L4 | 自适应优化、应用建议 |
| hooks-manager | L4 | 钩子、hooks |
| version-locker | L4 | 版本、锁定 |
| project-scanner | 通用 | 扫描、分析项目 |
| project-state | 通用 | 继续、恢复 |
| harness-generator | 通用 | 生成约束 |
| plugin-manager | 通用 | 插件、配置 |
| auto-toolkit-installer | 通用 | 工具链、安装 |
| auto-context | 通用 | 后台自动 |

---

## 安装

```bash
# 方式一：从 GitHub 安装
cd ~/.claude && npx chaos-harness@latest install

# 方式二：从本地安装
cd ~/.claude && npx ../chaos-harness install

# 验证安装
chaos-harness status
```

安装后会在 `~/.claude/skills/` 和 `~/.claude/hooks/` 下创建对应的 SKILL.md 和 Hook 脚本。

---

## 快速开始

```bash
# 1. 扫描现有项目
chaos-harness scan /path/to/project

# 2. 生成 Harness 约束
chaos-harness generate --project /path/to/project

# 3. 启动 Gate 流程
chaos-harness gate init "实现用户登录功能"

# 4. 查看状态
chaos-harness gate status
```

---

## References

| 文件 | 何时加载 |
|------|---------|
| `skills/gate-system/SKILL.md` | 需要 Gate 状态机操作时 |
| `skills/iron-law-enforcer/SKILL.md` | 铁律检查/违规处理时 |
| `skills/agent-team-orchestrator/SKILL.md` | 多 Agent 任务派发时 |
| `skills/product-lifecycle/SKILL.md` | 产品全生命周期管理时 |
| `skills/learning-analyzer/SKILL.md` | 失败模式分析/铁律优化时 |
| `skills/*/SKILL.md` | 需要了解特定 skill 的详细指引时 |
| `.chaos-harness/state.json` | 查看项目当前状态时 |
| `CLAUDE.md` | 查看项目完整上下文时 |
