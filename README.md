# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.3-blue.svg">
  <img src="https://img.shields.io/badge/Claude_Code-Plugin-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>Claude Code 的质量门禁插件 — Gate 状态机 + 硬拦截</strong></p>
<p align="center"><em>从需求到发布，11 道质量关卡，AI 不能跳过任何一个</em></p>

---

## 这是什么？

**一个 Claude Code 插件**，在 AI 写代码时自动检查质量，不通过就不让继续。

### 核心问题

AI 写代码会跳过测试、忽略规范、声称完成但没验证。

### 解决方案

- **Gate 状态机** — 11 个检查点，AI 必须通过才能进入下一阶段
- **Hooks 硬拦截** — SessionStart/PreToolUse/PostToolUse 自动触发，exit 1 阻断
- **16 种验证器** — 覆盖率、安全审计、架构分层、分支规范、提交规范
- **Slash 命令** — 在 Claude Code 中直接使用，无需命令行

**核心差异化：** 不是提示词，是进程级硬拦截（AI 绕不过去）

---

## 快速开始

### 安装

```bash
# 远程安装
claude plugins marketplace add github:jeesoul/chaos-harness
claude plugins install chaos-harness@chaos-harness

# 本地安装
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness
```

> Windows：路径不能含中文和空格

### 基本使用（在 Claude Code 中）

```
# 查看系统概览
/chaos-harness:overview

# 查看 Gate 状态
/gate-manager status

# 切换到测试阶段
/gate-manager transition W10_testing

# 重新检查某个 Gate
/gate-manager recheck gate-w10-testing
```

---

## 核心能力

### 1. Gate 状态机（11 个检查点）

#### 阶段 Gates（6 个）— 控制开发流程

| Gate | 阶段 | 检查内容 | 触发方式 |
|------|------|---------|---------|
| `gate-w01-requirements` | 需求 | 项目扫描，识别技术栈 | `/gate-manager transition W01_requirements` |
| `gate-w03-architecture` | 架构 | PRD 质量检查 | `/gate-manager transition W03_architecture` |
| `gate-w08-development` | 开发 | 架构文档存在 | `/gate-manager transition W08_development` |
| `gate-w09-code-review` | 代码审查 | 至少 1 个 commit | `/gate-manager transition W09_code_review` |
| `gate-w10-testing` | 测试 | 无语法错误 + 覆盖率 60% | `/gate-manager transition W10_testing` |
| `gate-w12-release` | 发布 | 测试通过 + 安全审计 + 覆盖率 80% | `/gate-manager transition W12_release` |

#### 质量 Gates（5 个）— 自动拦截

| Gate | 触发时机 | 检查内容 |
|------|---------|---------|
| `gate-quality-iron-law` | AI 写文件前 | 铁律检查 |
| `gate-quality-tests` | git commit 前 | 测试套件通过 |
| `gate-quality-format` | git commit 前 | 代码格式检查 |
| `gate-quality-ui` | AI 写文件前 | UI 规范检查 |
| `gate-quality-architecture` | AI 写文件前 | 架构分层检查 |

### 2. 16 种验证器（生产级）

| 验证器 | 检查内容 | 失败时的修复建议 |
|--------|---------|-----------------|
| `coverage-threshold` | 覆盖率达标 | 📊 运行测试生成覆盖率报告 |
| `security-audit` | 安全漏洞检查 | 🔒 运行 npm audit fix |
| `architecture-layer` | 架构分层检查 | 🏗️ Controller → Service → Repository |
| `branch-naming` | 分支命名规范 | 🌿 使用 feature/xxx 格式 |
| `commit-message` | 提交信息规范 | 💬 使用 feat: xxx 格式 |
| `no-todo-critical` | 无 FIXME/TODO(critical) | 📝 解决代码中的关键 TODO |
| `no-syntax-errors` | 无语法错误 | 🔧 运行 lint 工具 |
| `test-suite-pass` | 测试套件通过 | 🧪 修复失败的测试 |
| `prd-quality-check` | PRD 文档质量 | 📋 补充验收标准、性能指标 |
| `git-has-commits` | 至少 N 个 commit | 提交代码 |
| `iron-law-check` | 铁律检查 | 遵守项目铁律 |
| `file-exists` | 文件存在检查 | 创建必需文件 |
| `project-scan` | 项目扫描 | 自动执行 |
| `format-check` | 代码格式 | 运行格式化工具 |
| `ui-compliance` | UI 规范 | 遵守 UI 设计规范 |
| `custom-script` | 自定义脚本 | 按脚本输出修复 |

### 3. Hooks 硬拦截（自动触发）

AI 在以下时机会被自动拦截：

```json
{
  "SessionStart": "检查项目状态，加载 Gate 配置",
  "PreToolUse": "AI 写文件前，运行 quality Gates",
  "PostToolUse": "AI 写文件后，验证结果",
  "PreCommit": "git commit 前，运行测试和格式检查"
}
```

**失败时：** exit 1 阻断 + 显示修复建议

### 4. 团队协作（可选）

创建 `chaos-harness.yaml` 提交到 git，全团队共享规则：

```yaml
# chaos-harness.yaml
version: "1.3.3"

gates:
  coverage-threshold: 80
  security-audit: high
  branch-naming: "^(feature|fix|chore)/.+"

team:
  enforce_branch_naming: true
  shared_iron_laws: true
```

---

## 使用场景

### 场景 1：新项目启动

```
# 1. 初始化项目
/gate-manager transition W01_requirements
→ 自动扫描项目，识别技术栈

# 2. AI 写 PRD 文档
→ 自动保存到 output/v1.0.0/W01_requirements/

# 3. 进入架构阶段
/gate-manager transition W03_architecture
→ 检查 PRD 质量（验收标准、性能指标、数据模型）

# 4. 进入开发阶段
/gate-manager transition W08_development
→ 检查架构文档存在

# 5. AI 写代码
→ 自动触发 quality Gates（铁律、架构分层）

# 6. 代码审查
/gate-manager transition W09_code_review
→ 检查至少有 1 个 commit

# 7. 测试阶段
/gate-manager transition W10_testing
→ 检查无语法错误 + 覆盖率 60% + 无 FIXME

# 8. 准备发布
/gate-manager transition W12_release
→ 检查测试通过 + 安全审计 + 覆盖率 80%
```

### 场景 2：日常开发

```
# 查看当前状态
/gate-manager status

# AI 写代码
→ PreToolUse Hook 自动触发 quality Gates
→ 失败时显示修复建议

# 手动检查某个 Gate
/gate-manager recheck gate-quality-tests

# 绕过 soft Gate（临时）
/gate-manager override gate-quality-format --reason "紧急修复"
```

---

## 核心命令

| 命令 | 用途 |
|------|------|
| `/chaos-harness:overview` | 查看系统概览 |
| `/gate-manager status` | 查看所有 Gate 状态 |
| `/gate-manager status <gate-id>` | 查看单个 Gate 详情 |
| `/gate-manager transition <stage>` | 切换开发阶段 |
| `/gate-manager recheck <gate-id>` | 重新检查 Gate |
| `/gate-manager override <gate-id>` | 绕过 soft Gate |
| `/chaos-harness:project-scanner` | 扫描项目结构 |
| `/chaos-harness:iron-law-enforcer` | 检查铁律违规 |

---

## 可选增强功能

以下功能需要额外依赖，作为可选增强：

### 项目知识引擎（需 Python）

扫描代码结构、依赖约束、JPA 实体。

```
/chaos-harness:graphify generate
```

### 需求影响分析

输入需求，输出影响范围 / 复用建议。

```
/chaos-harness:impact-analyzer
```

---

## 架构

```
Claude Code 会话
         │
         ▼
┌─────────────────────────────────────┐
│  Hooks 自动拦截                      │
│  SessionStart → PreToolUse           │
│  → PostToolUse → PreCommit           │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────────┐
    ▼                 ▼
┌──────────────┐ ┌──────────────┐
│ Gate 状态机  │ │ 可选增强     │
│ 11 Gates     │ │ 知识图谱     │
│ 16 验证器    │ │ 影响分析     │
│ 分级执行     │ │ (需 Python)  │
└──────────────┘ └──────────────┘
         │
         ▼
  18 Skills · 20 Commands
```

---

## 文档

- **[核心总结](docs/CORE-SUMMARY.md)** — 核心能力、使用场景、命令速查
- **[使用文档](docs/USAGE.md)** — 按角色（产品经理/架构师/开发/QA）的使用指南
- **[项目记忆](CLAUDE.md)** — 项目定位、版本历史、设计原则

---

## 与其他工具的区别

| 对比 | 提示词工程 | Cursor Rules | Chaos Harness |
|------|-----------|--------------|---------------|
| **约束方式** | 软性建议 | 软性建议 | 硬拦截（exit 1） |
| **AI 能否绕过** | ✅ 能 | ✅ 能 | ❌ 不能 |
| **验证时机** | 无 | 无 | 事前拦截 |
| **团队共享** | 难 | 文件共享 | git 提交 |
| **失败诊断** | 无 | 无 | 修复建议 + 命令 |

---

## 升级

```bash
git checkout v1.3.3 && git pull origin v1.3.3
claude plugins marketplace remove chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins uninstall chaos-harness@chaos-harness
claude plugins install chaos-harness@chaos-harness
```

---

## License

MIT © jeesoul

---

**GitHub:** https://github.com/jeesoul/chaos-harness
