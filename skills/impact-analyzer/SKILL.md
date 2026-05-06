---
name: impact-analyzer
description: 需求影响分析引擎 — 分析新需求对现有系统的影响
trigger_words:
  - 影响分析
  - 需求影响
  - impact
  - 影响范围
  - 复用建议
  - 风险预警
  - 工作量估算
---

# 需求影响分析引擎

## 能力

分析新需求对现有系统的影响，生成影响分析报告：

1. **影响范围** — 哪些模块受影响
2. **复用建议** — 哪些代码可复用
3. **约束提醒** — 哪些约束不能违反
4. **风险预警** — 哪些地方可能出问题
5. **工作量估算** — 大概需要多久

## 使用方式

### 自然语言触发

用户说"影响分析"、"需求影响"、"风险预警"时自动触发。

### CLI

```bash
node scripts/impact-analyzer.mjs --requirement "用户导出 Excel"
node scripts/impact-analyzer.mjs --requirement "添加缓存层" --json
```

## 前置条件

需要先生成项目知识图谱：

```bash
node scripts/project-knowledge-engine.mjs --scan
```

## 输出

- 影响分析报告（Markdown 格式）
- 保存到 `.chaos-harness/impact-report.md`
