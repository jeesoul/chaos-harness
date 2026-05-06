---
name: project-scanner
description: "项目扫描与分析 — 识别项目类型、技术栈、目录结构、依赖、测试框架、代码质量基线。触发词：扫描项目、分析项目、project scan、项目类型检测、技术栈识别"
license: MIT
version: "1.3.2"
---

# Project Scanner v1.3.2

自动扫描目标项目，输出结构化分析结果到 `.chaos-harness/scan-result.json`，供 Gate 状态机和其他 Skills 消费。

## 何时使用

- 用户说"扫描项目"、"分析项目"
- Harness 生成前需要项目类型识别（IL002 前置条件）
- Gate W01_requirements 进入时自动触发
- 用户切换了正在工作的项目目录

## 使用方法

```bash
# 扫描当前目录
node <plugin-root>/scripts/project-scanner.mjs

# 扫描指定目录
node <plugin-root>/scripts/project-scanner.mjs --root /path/to/project

# 详细模式（输出完整报告）
node <plugin-root>/scripts/project-scanner.mjs --verbose
```

## 扫描输出

结果写入 `.chaos-harness/scan-result.json`：

```json
{
  "scanned_at": "2026-04-23T10:00:00Z",
  "project_root": "/path/to/project",
  "project_type": "java-spring",
  "language": "Java",
  "framework": "Spring Boot 3.2",
  "build_tool": "Maven",
  "test_framework": "JUnit 5",
  "has_ci": true,
  "directories": { "source": "src/main/java", "test": "src/test/java", "resources": "src/main/resources" },
  "dependency_count": 42,
  "source_file_count": 156,
  "test_file_count": 38,
  "test_coverage_estimate": "low",
  "key_files": ["pom.xml", "application.yml"],
  "warnings": [],
  "harness_template": "java-spring"
}
```

## 支持的项目类型

| 类型 | 识别信号 | 对应 Harness 模板 |
|------|----------|-------------------|
| java-spring | pom.xml + spring-boot | java-spring |
| java-spring-legacy | pom.xml + javax.* | java-spring-legacy |
| java-maven | pom.xml（无 spring-boot） | java-maven |
| java-gradle | build.gradle | java-gradle |
| vue3 | package.json + vue@3 | vue3 |
| vue2 | package.json + vue@2 | vue2 |
| react | package.json + react | react |
| next-js | package.json + next | react |
| node-express | package.json + express | node-express |
| python-fastapi | requirements.txt/ pyproject.toml + fastapi | python-fastapi |
| python-django | requirements.txt/ pyproject.toml + django | python-django |
| typescript-plugin | package.json + claude code plugin | generic |
| unknown | 无匹配 | generic |

## Gate 集成

Gate W01_requirements 在 transition 时自动运行此扫描，将结果写入 state.json 的 `scan_result` 字段。后续 Skill（harness-generator、ui-generator 等）读取 `scan_result` 而不需要用户手动触发。

## References

| 文件 | 何时读取 |
|------|---------|
| `.chaos-harness/scan-result.json` | 读取最近扫描结果时 |
| `scripts/project-scanner.mjs` | 手动触发扫描时 |
| `stacks/*.yaml` | 读取技术栈适配配置时 |
