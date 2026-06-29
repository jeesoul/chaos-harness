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
- 扫描结果检查 → `.chaos-harness/scan-result.json` 是否存在

缺失时先补前置条件：
- 版本未锁定 → 执行 version-locker
- 扫描结果不存在 → 执行 project-scanner：`node <plugin-root>/scripts/project-scanner.mjs`

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

## 输出要求

1. **必须** 输出到版本目录下的 `Harness/` 子目录
2. **必须** 包含完整的铁律定义
3. **必须** 包含防绕过规则
4. **必须** 包含偷懒模式检测配置
5. **应该** 根据项目类型选择合适模板（从 `scan-result.json` 的 `harness_template` 字段获取）

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `.chaos-harness/scan-result.json` | 读取扫描结果选择模板时 |
| `scripts/project-scanner.mjs` | 需要触发项目扫描时 |
| `templates/` | 读取 Harness 模板文件时 |
