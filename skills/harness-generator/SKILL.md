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

当用户请求 `--adaptive` 或 `自适应生成 Harness` 时：

1. 检查 `output/{version}/analysis-report.md` 是否存在，存在则读取优化建议
2. 如果不存在，检查 `~/.claude/harness/learning-log.json` 记录数量
3. learning-log ≥ 5 条时，提示用户先运行 learning-analyzer

自适应闭环：learning-log.json → learning-analyzer → analysis-report → harness-generator --adaptive → 应用优化 → 新行为

**自适应规则应用**：

| 优先级 | 应用规则 |
|--------|---------|
| 高优先级 | 自动新增铁律到 iron-laws.yaml |
| 高优先级 | 自动强化 hook 检查脚本 |
| 中优先级 | 提示用户确认后应用 |
| 待观察 | 仅记录，不自动应用 |

**自适应生成示例**：

```yaml
identity:
  name: "项目名称"
  type: java-spring
  adaptive: true
  based_on_analysis: "output/v0.1/analysis-report.md"

iron_laws:
  - id: IL001
    rule: "NO DOCUMENTS WITHOUT VERSION LOCK"

  # 自适应新增
  - id: IL-C003
    rule: "NO COMPLETION WITHOUT TEST OUTPUT"
    adaptive_added: true
    reason: "IL003 违规 50% 都是'完成无验证'"
```

**自适应触发条件**：

| 条件 | 触发 |
|------|------|
| learning-log ≥ 5 条 | 提示用户运行 learning-analyzer |
| analysis-report 存在 | 自动读取建议 |
| analysis-report 建议高优先级 | 自动应用 |
| 用户请求 `--adaptive` | 强制进入自适应模式 |

## 输出要求

1. **必须** 输出到版本目录下的 `Harness/` 子目录
2. **必须** 包含完整的铁律定义
3. **必须** 包含防绕过规则
4. **必须** 包含偷懒模式检测配置
5. **应该** 根据项目类型选择合适模板
6. **自适应模式** 必须读取并应用 analysis-report 建议

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `shared/state-helpers.md` | 需要状态管理函数时 |
| `output/{version}/scan-result.json` | 读取扫描结果选择模板时 |
| `output/{version}/analysis-report.md` | 自适应模式读取优化建议时 |
| `~/.claude/harness/learning-log.json` | 自适应模式检查学习记录数时 |
| `templates/` | 读取 Harness 模板文件时 |
