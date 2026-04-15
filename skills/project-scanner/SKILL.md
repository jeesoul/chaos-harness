---
name: project-scanner
description: "项目扫描器。**当用户提到项目类型、技术栈、环境检测时自动触发**。触发词：扫描项目、分析项目、项目类型、技术栈检测、项目结构、环境状态"
license: MIT
---

# 项目扫描哲学

## 核心思维

**不了解项目就生成约束 = 盲人摸象。**

扫描的核心不是步骤，而是回答三个问题：

1. **这是什么项目？** — 通过配置文件判断类型
2. **运行环境是什么？** — 必须实际执行命令验证，不得假设
3. **项目规模有多大？** — 统计数据支撑后续阶段裁剪

## 扫描流程

1. **检测项目类型** — Glob 查找关键配置文件：`pom.xml`、`build.gradle`、`package.json`、`requirements.txt`、`pyproject.toml`
2. **读取配置** — 提取项目名称、版本、依赖、构建工具
3. **实际执行环境检测** — 必须执行 `java -version`、`node --version`、`python --version`，不得假设
4. **统计项目结构** — 文件数量、主要目录
5. **输出报告** — 格式化的扫描报告，写入状态

## 项目类型判断规则

| 检测到的文件/依赖 | 项目类型 | 置信度 |
|------------------|---------|--------|
| pom.xml | java-maven | 95% |
| pom.xml + Spring Boot parent | java-spring | 98% |
| build.gradle | java-gradle | 95% |
| package.json | node | 95% |
| package.json + vue (^2.) | vue2 | 98% |
| package.json + vue (^3.) | vue3 | 98% |
| package.json + react | react | 98% |
| package.json + next | next-js | 98% |
| requirements.txt | python | 90% |

**Legacy 标记**：
- JDK 8 + Spring Boot 2.x → `java-spring-legacy`
- JDK 17+ + Spring Boot 3.x → `java-spring`

## 铁律

- **IL002**: NO HARNESS WITHOUT SCAN RESULTS
- **IL003**: 环境检测必须实际执行，不得假设

## 扫描报告格式

```markdown
# 项目扫描报告

- 项目类型: {type}
- 置信度: {confidence}%
- 构建工具: {build}
- JDK/Node/Python 实际版本: {version}
- 文件数: {count}
- 发现的问题: {问题}
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `shared/state-helpers.md` | 需要状态管理函数时 |
| `.chaos-harness/state.json` | 读取已有扫描结果时 |
| `output/{version}/scan-result.json` | 查看历史扫描报告时 |
