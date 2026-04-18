---
name: schema-workflow
description: "Schema-Driven 工作流 — YAML 定义、依赖图、自定义验证、预置模板。触发词：工作流、Schema、依赖图、阶段"
license: MIT
version: "1.3.1"
---

# Schema-Driven 工作流系统

## 核心理念

**工作流不是硬编码逻辑，而是可定制的 Schema 定义。**

通过 YAML 定义阶段、工件、依赖关系和验证规则，实现灵活适配不同项目类型的工作流。

## Schema 结构

```yaml
name: default
version: "1.0"
stages:
  - id: W01_requirements
    name: "需求分析"
    artifacts: [...]
    dependencies: []
    iron_laws: [IL001]
    multi_agent_required: false

transitions:
  - from: W01_requirements
    to: W03_architecture
    conditions: [...]

validation_rules:
  - id: version_check
    description: "所有工件必须在版本目录下"
    severity: critical
```

## 依赖图（Kahn 拓扑排序）

工作流阶段通过 Kahn 算法自动解析执行顺序：

```
W01_requirements → W03_architecture → W08_development
```

- 无依赖的阶段先执行
- 循环依赖会被检测并拒绝
- 并行可执行的阶段会被识别

## 预置模板

| Schema | 描述 | 阶段数 |
|--------|------|--------|
| `default` | 默认工作流 | 3 |
| `product-lifecycle` | 产品全生命周期 | 9 |
| `custom/` | 用户自定义 | 自定义 |

## 自定义

用户可通过 `schemas/custom/` 目录添加自定义工作流：

1. 创建 `schemas/custom/my-workflow.yaml`
2. 定义 stages、dependencies、validation_rules
3. 使用 `/schema-workflow activate my-workflow` 激活

## 命令

| 命令 | 描述 |
|------|------|
| `/schema-workflow list` | 列出可用 Schema |
| `/schema-workflow show <name>` | 显示 Schema 详情 |
| `/schema-workflow activate <name>` | 激活 Schema |
| `/schema-workflow status` | 显示工作流进度 |
| `/schema-workflow complete <stage-id>` | 标记阶段完成 |
| `/schema-workflow reset` | 重置工作流状态 |

## 数据存储

```
schemas/
├── default.yaml                # 默认工作流
├── product-lifecycle.yaml      # 产品全生命周期
└── custom/                     # 用户自定义

.chaos-harness/
└── workflow-state.json         # 工作流状态
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `schemas/default.yaml` | 使用默认工作流时 |
| `schemas/product-lifecycle.yaml` | 使用产品生命周期工作流时 |
| `scripts/schema-utils.mjs` | 需要操作 Schema 时 |
| `.chaos-harness/workflow-state.json` | 需要查看工作流进度时 |
