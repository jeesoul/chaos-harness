# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.3-blue.svg">
  <img src="https://img.shields.io/badge/Claude_Code-Plugin-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>AI 编程协作增强系统 — 对 AI 编程行为的全程管控</strong></p>
<p align="center"><em>事前声明 · 事中硬拦截 · 事后验证 · 持续学习</em></p>

---

## 这是什么？

**一个 Claude Code 插件**，通过 Gate 状态机 + Hooks 硬拦截管控 AI 的编程行为，配合 Task Contract 和自学习系统形成完整闭环。

```
声明意图（事前）→ Gate 硬拦截（事中）→ 验证结果（事后）→ 学习积累（持续）
```

### 核心问题

AI 写代码会静默假设、跳过验证、声称完成但没有真正做到。

### 解决方案

- **Gate 状态机** — 11 个检查点，AI 必须通过才能进入下一阶段
- **Hooks 硬拦截** — PreToolUse exit 1 阻断，AI 绕不过去
- **Task Contract** — 写代码前声明意图和验收标准，事后自动验证
- **自学习系统** — 每次会话自动分析行为模式，持续积累项目经验

**核心差异化：** 不是提示词软约束，是进程级硬拦截 + 闭环验证

---

## 快速开始

### 安装

```bash
# 作为 Claude Code 插件安装
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# 验证安装
/chaos-harness:overview
```

> Windows：路径不能含中文和空格

### 两种使用方式

#### 方式 1：Slash 命令（推荐，在 Claude Code 中）

```
# 查看系统概览
/chaos-harness:overview

# 查看 Gate 状态
/gate-manager status

# 切换开发阶段
/gate-manager transition W10_testing

# 重新检查 Gate
/gate-manager recheck gate-w10-testing
```

#### 方式 2：CLI 命令（高级用户、脚本、CI 集成）

```bash
# Gate 可视化
node scripts/gate-visualizer.mjs
node scripts/gate-visualizer.mjs --mermaid
node scripts/gate-visualizer.mjs --pr-description

# Gate 报告
node scripts/gate-reporter.mjs
node scripts/gate-reporter.mjs --json

# CI 集成
node scripts/ci-gate-check.mjs

# Gate 执行
node scripts/gate-enforcer.mjs gate-w10-testing
```

---

## 核心能力

### 1. Gate 状态机（11 个检查点）

#### 阶段 Gates（6 个）— 控制开发流程

| Gate | 阶段 | 检查内容 | 使用方式 |
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

### 3. Task Contract（任务契约）

**事前声明 + 事后验证** — 解决 AI "静默假设然后一路跑下去" 的问题

#### 工作流程

```
1. AI 声明契约（事前）
   → /chaos-harness:task-contract declare
   → 声明：任务描述、影响范围、假设前提、验收标准

2. AI 写代码
   → PreToolUse Hook 检查契约存在（无契约则阻断）
   → PostToolUse Hook 自动验证 success_criteria

3. 会话结束
   → Stop Hook 标记过期契约（2 小时超时）
   → 学习系统统计契约完成率
```

#### 验收标准格式

```bash
# 文件存在检查
file-exists:src/UserService.java

# 无新增 FIXME
no-new-fixme

# 自定义标准（待人工确认）
custom:UserService.createUser() 方法存在
```

#### 使用示例

```
# 声明契约
/chaos-harness:task-contract declare \
  --desc "实现用户注册功能" \
  --scope "src/UserService.java,src/UserController.java" \
  --assume "数据库已连接,JWT 已配置" \
  --criteria "file-exists:src/UserService.java,no-new-fixme"

# 查看契约状态
/chaos-harness:task-contract status

# 标记完成
/chaos-harness:task-contract complete

# 放弃契约
/chaos-harness:task-contract clear
```

#### 与 karpathy-skills 的差异

| 特性 | karpathy-skills | Task Contract |
|------|----------------|---------------|
| 实现方式 | CLAUDE.md 软提示 | 进程级硬拦截（exit 1） |
| 可绕过性 | AI 可忽略 | AI 无法绕过 |
| 验证方式 | 无自动验证 | PostToolUse 自动验证 |
| 学习系统 | 无 | 契约完成率统计 |

### 4. Hooks 硬拦截（自动触发）

AI 在以下时机会被自动拦截：

```json
{
  "SessionStart": "检查项目状态，加载 Gate 配置",
  "PreToolUse": "AI 写文件前，运行 quality Gates + 检查 Task Contract",
  "PostToolUse": "AI 写文件后，验证结果 + 验证契约标准",
  "PreCommit": "git commit 前，运行测试和格式检查",
  "Stop": "会话结束，标记过期契约 + 自动学习分析"
}
```

**失败时：** exit 1 阻断 + 显示修复建议

### 5. 自学习系统（自动激活）

**Stop Hook 自动触发** — 每次会话结束自动分析

```bash
# 会话结束时自动运行
learning-analyzer.mjs

# 分析内容
- Gate 通过率统计
- 验证器失败模式
- 任务契约完成率
- 声明准确率（scope vs 实际修改文件）
```

**学习数据存储：**
- `~/.claude/harness/learning-log.jsonl` — Gate 学习数据
- `~/.claude/harness/contract-log.jsonl` — 契约学习数据

### 6. Gate 可视化（CLI 工具）

```bash
# ASCII 格式（终端）
node scripts/gate-visualizer.mjs

# Mermaid 格式（可嵌入 Markdown）
node scripts/gate-visualizer.mjs --mermaid

# PR 描述格式
node scripts/gate-visualizer.mjs --pr-description
```

### 7. Gate 报告（CLI 工具）

```bash
# 生成详细报告
node scripts/gate-reporter.mjs

# JSON 格式
node scripts/gate-reporter.mjs --json

# 仅生成 PR 描述
node scripts/gate-reporter.mjs --pr-description
```

### 8. CI 集成（CLI 工具）

```bash
# 在 CI 中运行所有 quality Gates
node scripts/ci-gate-check.mjs

# 预览将检查哪些 Gates
node scripts/ci-gate-check.mjs --dry-run

# 只检查指定 Gates
node scripts/ci-gate-check.mjs --gate gate-quality-tests,gate-quality-format
```

**GitHub Actions 示例：**

```yaml
# .github/workflows/ci.yml
- name: Chaos Harness Gate Check
  run: node scripts/ci-gate-check.mjs
```

### 9. 团队协作（可选）

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

### 场景 1：在 Claude Code 中使用（插件模式）

```
# 1. 初始化项目
/gate-manager transition W01_requirements
→ 自动扫描项目，识别技术栈

# 2. AI 写 PRD 文档
→ 自动保存到 output/v1.0.0/W01_requirements/

# 3. 进入架构阶段
/gate-manager transition W03_architecture
→ 检查 PRD 质量

# 4. AI 写代码
→ PreToolUse Hook 自动触发 quality Gates
→ 失败时显示修复建议

# 5. 查看当前状态
/gate-manager status

# 6. 手动检查某个 Gate
/gate-manager recheck gate-quality-tests
```

### 场景 2：在 CI/CD 中使用（CLI 模式）

```yaml
# .github/workflows/ci.yml
jobs:
  gate-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Gate Check
        run: node scripts/ci-gate-check.mjs
      
      - name: Generate Report
        if: failure()
        run: node scripts/gate-reporter.mjs --pr-description
```

### 场景 3：本地开发（混合模式）

```bash
# 使用 Slash 命令（在 Claude Code 中）
/gate-manager status

# 使用 CLI 命令（在终端）
node scripts/gate-visualizer.mjs
node scripts/gate-reporter.mjs

# 生成 PR 描述
node scripts/gate-visualizer.mjs --pr-description > pr-description.md
```

---

## 核心命令

### Slash 命令（在 Claude Code 中）

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
| `/chaos-harness:task-contract declare` | 声明任务契约 |
| `/chaos-harness:task-contract status` | 查看契约状态 |
| `/chaos-harness:task-contract complete` | 标记契约完成 |
| `/chaos-harness:task-contract clear` | 放弃当前契约 |

### CLI 命令（在终端）

| 命令 | 用途 |
|------|------|
| `node scripts/gate-visualizer.mjs` | Gate 可视化（ASCII） |
| `node scripts/gate-visualizer.mjs --mermaid` | Gate 可视化（Mermaid） |
| `node scripts/gate-visualizer.mjs --pr-description` | 生成 PR 描述 |
| `node scripts/gate-reporter.mjs` | 生成详细报告 |
| `node scripts/gate-reporter.mjs --json` | JSON 格式报告 |
| `node scripts/ci-gate-check.mjs` | CI 集成检查 |
| `node scripts/gate-enforcer.mjs <gate-id>` | 运行单个 Gate |

---

## 可选增强功能

以下功能需要额外依赖（Python），作为可选增强：

### 项目知识引擎

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
使用方式
├── Slash 命令（Claude Code 插件）
│   └── /gate-manager status
│       └── 调用 → node scripts/gate-machine.mjs --status
│
├── CLI 命令（独立工具）
│   ├── node scripts/gate-visualizer.mjs
│   ├── node scripts/gate-reporter.mjs
│   └── node scripts/ci-gate-check.mjs
│
└── Hooks（自动触发）
    ├── SessionStart → gate-machine.mjs
    ├── PreToolUse → gate-enforcer.mjs
    └── PostToolUse → learning-update.mjs
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
| **使用方式** | 提示词 | 配置文件 | 插件 + CLI |
| **团队共享** | 难 | 文件共享 | git 提交 |
| **失败诊断** | 无 | 无 | 修复建议 + 命令 |
| **CI 集成** | 难 | 难 | 原生支持 |

---

## 升级

```bash
# 1. 拉取最新代码
cd /path/to/chaos-harness
git pull origin main

# 2. 重新注册插件（让 Claude Code 加载新文件）
claude plugins marketplace remove chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins uninstall chaos-harness@chaos-harness
claude plugins install chaos-harness@chaos-harness

# 3. 重启 Claude Code，验证版本
/chaos-harness:overview
```

> Windows 用 `%CD%` 替代 `$(pwd)`

---

## 卸载

```bash
# 卸载插件
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness

# 可选：删除本地仓库
rm -rf /path/to/chaos-harness

# 可选：清理运行时数据（学习日志、契约记录等）
rm -rf ~/.claude/harness/
```

> 卸载后重启 Claude Code 生效。运行时数据（`~/.claude/harness/`）保留了学习记录，如需完全清除手动删除。

---

## License

MIT © jeesoul

---

**GitHub:** https://github.com/jeesoul/chaos-harness
