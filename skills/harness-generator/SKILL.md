---
name: harness-generator
description: "Harness 生成器。**当检测到新项目或首次运行时自动建议生成约束**。触发词：生成Harness、创建约束、铁律配置、防绕过规则、项目约束"
license: MIT
---

# Harness 生成哲学

## 核心思维

**Harness 不是模板填充，而是对项目真实约束的诚实回应。**

不要从"选模板→填参数→输出"开始推理。从这三个问题开始：

1. **项目扫描过了吗？** — 不了解项目就生成约束 = 盲人摸象（IL002）
2. **版本锁定了吗？** — 不知道输出到哪，就不知道约束属于谁（IL001）
3. **这个项目的特殊约束是什么？** — 通用模板是起点，不是终点

## 铁律

```
NO HARNESS WITHOUT SCAN RESULTS
```

## 生成决策框架

**检查前置条件**：
- 版本锁定检查 → `output/{version}/VERSION-LOCK` 是否存在
- 扫描结果检查 → `output/{version}/scan-result.json` 是否存在

缺失时先补前置条件：
- 版本未锁定 → 执行 version-locker
- 扫描结果不存在 → 执行 project-scanner

**选择模板**：

| 项目类型 | 模板 |
|---------|------|
| java-spring | java-spring |
| java-spring-legacy | java-spring-legacy |
| vue2 | vue2 |
| vue3 | vue3 |
| react | react |
| next-js | react (兼容) |
| node-express | node-express |
| python-django | python-django |
| 其他 | generic |

**生成内容**：
1. `output/{version}/Harness/harness.yaml` — 主配置
2. `output/{version}/Harness/anti-bypass.yaml` — 防绕过规则

**铁律检查**：

| 检查项 | 失败处理 |
|--------|---------|
| 版本是否锁定 | 提示用户先锁定版本 |
| 扫描结果是否存在 | 执行项目扫描 |
| 输出路径是否正确 | 纠正到版本目录 |

## Harness 结构参考

生成的 harness.yaml 应包含以下核心结构：

```yaml
identity:
  name: "项目名称"
  type: java-spring
  created: 2026-04-02
  version: v0.1

iron_laws:
  - id: IL001
    rule: "NO DOCUMENTS WITHOUT VERSION LOCK"
    description: "所有文档必须在版本目录下生成"
  # ... IL002-IL005

anti_bypass:
  - id: "simple-fix"
    pattern: "这是简单修复|很简单|小修改"
    iron_law_ref: "IL003"
  # ... 更多防绕过规则

laziness_patterns:
  - id: LP001
    pattern: "声称完成但无验证证据"
    severity: critical
  # ... 更多偷懒模式检测
```

## 自适应 Harness (--adaptive)

**核心闭环：从历史学习自动优化 Harness 配置**

**已实现**：`scripts/adaptive-harness.mjs` — 读取 `analysis-suggestions.json` 并自动应用优化建议。

当用户请求 `--adaptive` 或 `自适应生成 Harness` 时：

```bash
# 手动触发
node scripts/adaptive-harness.mjs

# 预览模式（不修改文件）
node scripts/adaptive-harness.mjs --dry-run
```

**session-start hook 已内置自动触发**：当 analysis-suggestions.json 存在且包含建议时，自动运行 adaptive-harness。

自适应闭环：
```
learning-log.json → learning-analyzer → analysis-report.md
    → analysis-suggestions.json (机器可读)
    → adaptive-harness.mjs → iron-laws.yaml (自动强化)
    → 新行为
```

**自适应规则应用**：

| 优先级 | 应用规则 |
|--------|---------|
| 高优先级 | 自动新增/强化铁律到 `~/.claude/harness/iron-laws.yaml` |
| 中优先级 | 提示用户确认（记录到 adaptive-report.md 待确认区） |
| 低优先级 | 仅记录到观察区，不自动应用 |

**自适应输出文件**：

| 文件 | 说明 |
|------|------|
| `~/.claude/harness/adaptive-report.md` | 优化报告（已应用/待确认/观察记录） |
| `~/.claude/harness/iron-laws.yaml` | 自适应强化后的铁律配置 |
| `~/.claude/harness/analysis-suggestions.json` | 机器可读建议（learning-analyzer 生成） |
| `output/{version}/adaptive-report.md` | 项目版本目录副本 |

## 输出要求

1. **必须** 输出到版本目录下的 `Harness/` 子目录
2. **必须** 包含完整的铁律定义
3. **必须** 包含防绕过规则
4. **必须** 包含偷懒模式检测配置
5. **应该** 根据项目类型选择合适模板
6. **自适应模式** 必须读取并应用 analysis-suggestions.json 建议

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `shared/state-helpers.md` | 需要状态管理函数时 |
| `output/{version}/scan-result.json` | 读取扫描结果选择模板时 |
| `output/{version}/analysis-report.md` | 人类阅读分析报告时 |
| `~/.claude/harness/analysis-suggestions.json` | 自适应模式读取机器可读建议时 |
| `~/.claude/harness/iron-laws.yaml` | 查看自适应铁律配置时 |
| `~/.claude/harness/adaptive-report.md` | 查看自适应优化报告时 |
| `scripts/adaptive-harness.mjs` | 手动触发自适应优化时 |
| `scripts/learning-analyzer.mjs` | 手动触发分析时 |
| `templates/` | 读取 Harness 模板文件时 |
