---
name: context-advisor
description: 上下文感知代码建议器 — 基于项目知识图谱提供编码建议
trigger_words:
  - 上下文建议
  - 编码建议
  - 项目规范
  - 代码风格
  - context
---

# 上下文感知代码建议器

## 能力

基于项目知识图谱，在 AI 生成代码前提供上下文建议：

1. **命名风格** — 和现有代码一致
2. **依赖选择** — 和现有依赖一致
3. **架构模式** — 和现有架构一致
4. **异常处理** — 和现有方式一致
5. **日志格式** — 和现有格式一致

## 使用方式

### 获取编码建议

```bash
node scripts/context-advisor.mjs --advise "创建 UserExportService"
```

### 获取文件上下文

```bash
node scripts/context-advisor.mjs --for-file src/service/UserService.java
```

## 前置条件

需要先生成项目知识图谱：

```bash
node scripts/project-knowledge-engine.mjs --scan
```
