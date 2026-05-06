---
name: impact-analyzer
description: 需求影响分析
allowed-tools: Bash, Read, Glob, Grep
---

# 需求影响分析

分析新需求对现有系统的影响。

## 使用方式

```
/chaos-harness:impact-analyzer "用户导出 Excel"
```

## 执行步骤

1. 检查项目知识图谱是否存在
2. 如果不存在，先运行 `node scripts/project-knowledge-engine.mjs --scan`
3. 运行 `node scripts/impact-analyzer.mjs --requirement "$ARGS"`
4. 展示影响分析报告
