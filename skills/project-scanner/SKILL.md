---
name: project-scanner
description: "项目扫描器。**当用户提到项目类型、技术栈、环境检测时自动触发**。触发词：扫描项目、分析项目、项目类型、技术栈检测、项目结构、环境状态"
---

<STATE-WRITE-REQUIRED>
**扫描完成后必须写入状态：**
1. 使用 Write 工具创建 `output/{version}/scan-result.json`
2. 使用 Edit 工具更新 `.chaos-harness/state.json` 的 scan_result
3. 使用 Edit 工具追加到 `~/.claude/harness/workflow-log.json`

调用 `shared/state-helpers.md` 中的函数：
- Update-Project-State({ scan_result: scanData })

不写入状态 = 违反 IL003（完成声明需要验证证据）
</STATE-WRITE-REQUIRED>

<EXTREMELY-IMPORTANT>
**此 skill 只加载一次。**
加载后不要重复调用 Skill 工具来加载 project-scanner。
不要在执行过程中再次触发此 skill。
</EXTREMELY-IMPORTANT>

# 项目扫描器 (Project Scanner)

<IMMEDIATE-ACTION>
加载此 skill 后，检查是否满足执行条件：
1. 是否有明确的扫描请求？
2. 是否已在本次会话扫描过？

如果满足条件，立即开始执行以下步骤。
如果不满足，输出使用说明等待用户明确调用。

**注意：此 skill 只加载一次，不要重复调用 Skill 工具。**
</IMMEDIATE-ACTION>

## 执行步骤

### Step 1: 检测项目类型

使用 Glob 查找关键配置文件：

```
检查 Java 项目: **/pom.xml, **/build.gradle*
检查 Node 项目: **/package.json
检查 Python 项目: **/requirements.txt, **/pyproject.toml
```

### Step 2: 读取配置文件

读取找到的配置文件，提取：项目名称、版本、依赖、构建工具

### Step 3: 实际执行环境检测

**必须实际执行以下命令并记录输出：**

```bash
java -version    # 检测 JDK 版本
node --version   # 检测 Node
python --version # 检测 Python
```

### Step 4: 统计项目结构

使用 Glob 统计：文件数量、主要目录

### Step 5: 输出扫描结果

输出格式化的扫描报告。

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

**Legacy 标记：**
- JDK 8 + Spring Boot 2.x → `java-spring-legacy`
- JDK 17+ + Spring Boot 3.x → `java-spring`

**前端框架检测：**
- Vue 2.x + Vue CLI → `vue2`
- Vue 3.x + Vite → `vue3`
- React + Vite/CRA → `react`
- React + Next.js → `next-js`

## 铁律

- **IL002**: NO HARNESS WITHOUT SCAN RESULTS - 扫描结果供后续 Harness 生成使用
- **IL003**: NO COMPLETION CLAIMS WITHOUT VERIFICATION - 环境检测必须实际执行，不得假设

## 扫描报告格式

```markdown
# 项目扫描报告

## 基本信息
- 项目类型: {type}
- 置信度: {confidence}%
- 构建工具: {build}

## 环境状态
| 工具 | 实际版本 | 状态 |
|------|---------|------|
| JDK | {version} | ✅/❌ |

## 项目结构
- 文件数: {count}
- 主要目录: {dirs}

## 发现的问题
1. {问题}
```