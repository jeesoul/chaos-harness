# Chaos Harness

<p align="center"><strong>确定性 AI Agent 约束框架</strong></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg">
  <img src="https://img.shields.io/badge/Tests-623-brightgreen.svg">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg">
</p>

---

## 核心问题

AI Agent 常见问题：声称完成但无验证、跳过测试、绕过约束。Chaos Harness 通过**铁律机制**强制执行确定性行为。

---

## 安装

```bash
# 1. 克隆项目
git clone https://github.com/jeesoul/chaos-harness.git

# 2. 注册并安装（三平台命令相同）
claude plugins marketplace add "路径"    # Windows 需要引号
claude plugins install chaos-harness@chaos-harness

# 3. 重启 Claude Code，验证
/chaos-harness:overview
```

**卸载：**
```bash
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness
```

---

## 命令

| 命令 | 功能 |
|------|------|
| `/chaos-harness:overview` | 系统概览、铁律列表 |
| `/chaos-harness:project-scanner` | 项目扫描、类型检测 |
| `/chaos-harness:version-locker` | 版本锁定、目录管理 |
| `/chaos-harness:harness-generator` | 约束生成、规则配置 |
| `/chaos-harness:workflow-supervisor` | 工作流管理、阶段控制 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行、绕过检测 |
| `/chaos-harness:collaboration-reviewer` | 多Agent协作评审 |
| `/chaos-harness:hooks-manager` | 钩子配置、日志查看 |
| `/chaos-harness:plugin-manager` | 插件管理、扩展配置 |
| `/chaos-harness:project-state` | 状态持久化、进度恢复 |

---

## 铁律体系

**核心铁律（不可禁用）：**

| ID | 规则 |
|----|------|
| IL001 | 文档必须在版本目录 |
| IL002 | Harness 需要扫描数据 |
| IL003 | 完成声明需要验证证据 |
| IL004 | 版本变更需要用户确认 |
| IL005 | 敏感配置需要审批 |

**自定义铁律：**
```yaml
# ~/.claude/harness/iron-laws.yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE"
        action: block
```

---

## 检测机制

**偷懒模式检测：**

| 模式 | 触发条件 |
|------|---------|
| LP001 | 声称完成但无验证证据 |
| LP002 | 跳过根因分析直接修复 |
| LP003 | 长时间无产出 |
| LP004 | 试图跳过测试 |

**绕过检测：** 自动识别 "简单修复"、"跳过测试"、"就这一次" 等关键词并驳回。

---

## 钩子系统

| Hook | 作用 |
|------|------|
| SessionStart | 注入铁律上下文 |
| PreToolUse | 铁律预检查 |
| PostToolUse | 偷懒检测、学习记录 |
| Stop | 完成声明验证 |
| PreCompact | 压缩前保存上下文 |

---

## 模板支持

| 模板 | 技术栈 |
|------|--------|
| `java-spring` | Java 17/21 + Spring Boot 3.x |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x |
| `node-express` | Node.js Express |
| `python-django` | Python Django |
| `generic` | 通用项目 |

---

## 开发

```bash
npm install && npm run build && npm test
```

---

## 许可证

[MIT](LICENSE)

<p align="center"><strong>Chaos demands order. Harness provides it.</strong></p>