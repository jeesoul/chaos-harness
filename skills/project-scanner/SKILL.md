---
name: project-scanner
description: 当用户请求扫描项目、分析项目结构、检测项目类型时使用此skill。触发词：扫描项目、分析项目、项目类型、技术栈检测
---

# 项目扫描器 (Project Scanner)

## 执行规则

**加载此 skill 后，你必须按顺序执行以下步骤：**

### Step 1: 检测项目类型

使用 Glob 查找关键配置文件：

```bash
# 检查 Java 项目
glob: **/pom.xml
glob: **/build.gradle*

# 检查 Node 项目
glob: **/package.json

# 检查 Python 项目
glob: **/requirements.txt
glob: **/pyproject.toml
```

### Step 2: 读取配置文件

使用 Read 工具读取找到的配置文件，提取：
- 项目名称
- 版本
- 依赖
- 构建工具

### Step 3: 实际执行环境检测

**必须实际执行以下命令：**

```bash
java -version    # 检测 JDK 版本
mvn -version     # 检测 Maven
node --version   # 检测 Node
npm --version    # 检测 npm
python --version # 检测 Python
```

### Step 4: 统计项目结构

使用 Glob 和 Grep 统计：
- 文件数量
- 代码行数
- 主要目录

### Step 5: 生成扫描报告

使用 Write 工具将报告保存到 `output/{version}/scan-report.md`

如果版本未锁定，先执行 version-locker skill。

## 项目类型判断规则

| 检测到的文件 | 项目类型 | 置信度 |
|-------------|---------|--------|
| pom.xml | java-maven | 95% |
| pom.xml + Spring Boot parent | java-spring | 98% |
| build.gradle | java-gradle | 95% |
| package.json | node | 95% |
| package.json + express | node-express | 90% |
| requirements.txt | python | 90% |
| pyproject.toml | python-modern | 95% |

**Legacy 标记：**
- JDK 8 + Spring Boot 2.x → `java-spring-legacy`
- JDK 17+ + Spring Boot 3.x → `java-spring`

## 扫描报告格式

```markdown
# 项目扫描报告

> 生成时间: {timestamp}
> 项目路径: {path}

## 基本信息

| 项目 | 值 |
|------|-----|
| 类型 | {type} |
| 置信度 | {confidence} |
| 构建工具 | {build} |

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 语言 | Java | 17 |
| 框架 | Spring Boot | 3.2.0 |
| 测试 | JUnit | 5 |

## 环境状态

| 工具 | 要求 | 实际 | 状态 |
|------|------|------|------|
| JDK | 17 | 17.0.2 | ✅ |
| Maven | 3.6+ | 3.9.0 | ✅ |

## 项目结构

- 文件数: {count}
- 代码行数: {lines}
- 主要目录:
  - src/main/java
  - src/main/resources

## 依赖分析

- 直接依赖: {count}
- 需要更新: {count}

## 发现的问题

1. {问题1}
2. {问题2}

## 建议

1. {建议1}
2. {建议2}
```

## 铁律检查

### IL002: NO HARNESS WITHOUT SCAN RESULTS

扫描完成后：
- 保存扫描结果到 `output/{version}/scan-result.json`
- 供后续 Harness 生成使用

### IL003: NO COMPLETION CLAIMS WITHOUT VERIFICATION

环境检测必须：
- 实际执行命令
- 记录真实输出
- 不得假设或猜测

## 交互示例

```
用户: 扫描当前项目

Claude: [执行 Step 1-5]

# 项目扫描报告

## 基本信息
- 项目类型: java-spring
- 置信度: 98%
- 构建工具: Maven

## 环境状态
| 工具 | 要求 | 实际 | 状态 |
|------|------|------|------|
| JDK | 17 | 17.0.2 | ✅ |
| Maven | 3.6+ | 3.9.0 | ✅ |

✅ 扫描完成，结果已保存。
```