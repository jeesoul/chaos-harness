---
name: project-scanner
description: 项目扫描器。**当用户提到项目类型、技术栈、环境检测时自动触发**。触发词：扫描项目、分析项目、项目类型、技术栈检测、项目结构、环境状态
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
**STOP. DO NOT INVOKE THE SKILL TOOL AGAIN.**

You have already loaded this skill. The skill content is displayed below.

**DO NOT:**
- Call `Skill(chaos-harness:project-scanner)` again
- Call `Skill` tool for any skill you have already loaded
- Search for skill files - they are already loaded

**READ THE CONTENT BELOW AND EXECUTE. DO NOT LOAD AGAIN.**
</EXTREMELY-IMPORTANT>

# 项目扫描器 (Project Scanner)

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