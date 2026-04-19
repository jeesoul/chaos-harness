---
name: gate-system
description: "Gate 门控系统 — 真门控状态机，6 个 Gate 强制流程，硬拦截、checksum 锁定、失败恢复。替代 phase-guard 成为核心约束机制。"
license: MIT
version: "1.3.1"
---

# Gate System（门控系统）

## 核心哲学

**Prompt 规则 compliance rate ~20%。机械拦截 compliance rate 100%。**

Phase Guard 时代用 regex 检测意图然后打印"建议"，Gate System 用真状态机 + checksum 锁定 + exit 1 硬拦截。

## 6 个 Gate

| Gate | 名称 | 产出 | 必要字段 | 评审 |
|------|------|------|---------|------|
| G0 | 问题定义 | problem.md | 问题描述、影响范围、预期行为、复现步骤 | 必须 |
| G1 | 方案设计 | design.md | 架构设计、接口定义、数据模型、风险点 | 必须 |
| G2 | 任务拆分 | tasks.md | 任务列表、依赖关系、验收标准、估算 | 必须 |
| G3 | 实现 | 代码文件 | 无 | 必须 |
| G4 | 测试 | test-report.md | 测试用例、覆盖率、通过状态 | 必须 |
| G5 | 发布 | release.md | 变更日志、回滚方案、验证清单 | 必须 |

## 硬规则

| 规则 | 说明 |
|------|------|
| NO SKIP | 不能跳过 Gate，只能 +1 推进 |
| NO BACK | Gate 一旦 passed，不能回退（除非恢复流程） |
| NO WRITE BEFORE G3 | G3 之前禁止 Write/Edit 代码文件 |
| NO MODIFY LOCKED | 已通过 Gate 的产出文件禁止非评审者修改 |
| NO TEST BEFORE G4 | G3 完成前禁止运行测试 |
| CHECKSUM LOCK | 每个 Gate 产出有 checksum，篡改即失败 |

## 脚本

| 脚本 | 用途 |
|------|------|
| `scripts/gate-machine.mjs` | 状态机核心：init/advance/verify/submit/recover/status |
| `scripts/gate-validator.mjs` | 产出验证器：artifact/content/checksum/code/test |
| `scripts/gate-recovery.mjs` | 失败恢复：检测失败类型，判断策略，生成恢复计划 |
| `scripts/gate-enforcer.mjs` | PreToolUse Hook：硬拦截违规操作 |

## 命令

```bash
# 初始化 Gate 流程
node scripts/gate-machine.mjs init "问题描述"

# 查看状态
node scripts/gate-machine.mjs status

# 验证 Gate 产出
node scripts/gate-machine.mjs verify 0

# 推进到下一个 Gate
node scripts/gate-machine.mjs advance 1

# 失败恢复
node scripts/gate-recovery.mjs --recover
```

## 与 wow-harness 对比

| 维度 | wow-harness | chaos-harness gate-system |
|------|-------------|---------------------------|
| 门控数 | 8 (G0-G8) | 6 (G0-G5) |
| 硬拦截 | exit 1 (deploy-guard.py) | exit 1 (gate-enforcer.mjs) |
| 产出锁定 | 无 checksum | SHA-256 checksum |
| 恢复 | 无 | gate-recovery.mjs 自动恢复 |
| 语言 | Python | Node.js |
| 测试 | CI | node:test, 14 个测试用例 |

## 与 phase-guard 的关系

phase-guard 仍然保留，作为 **意图检测层**。当用户说"帮我写一个..."时，phase-guard 先检测意图，然后 gate-system 接管流程控制。

| 系统 | 角色 | 触发时机 |
|------|------|---------|
| phase-guard | 意图检测 | PreToolUse，检测创建类请求 |
| gate-system | 流程控制 | 全流程，硬拦截违规操作 |
| gate-enforcer | 硬拦截 | PreToolUse，exit 1 阻断 |

## 铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL-GATE001 | NO SKIP GATES | 不可跳过任何 Gate |
| IL-GATE002 | NO CODING BEFORE G3 | 不可在实现阶段前写代码 |
| IL-GATE003 | NO MODIFY LOCKED | 不可修改已锁定的产出 |
| IL-GATE004 | NO TESTING BEFORE G4 | 不可在实现完成前测试 |
| IL-GATE005 | RECOVERY REQUIRED | 失败必须走恢复流程 |

## References

| 文件 | 何时加载 |
|------|---------|
| `skills/phase-guard/SKILL.md` | 意图检测时 |
| `skills/overdrive/SKILL.md` | 超频模式恢复时 |
| `skills/iron-law-enforcer/SKILL.md` | 铁律违规时 |
