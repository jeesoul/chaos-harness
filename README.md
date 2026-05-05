# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.3-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>AI 编程的质量门禁系统 — Gate 状态机 + 硬拦截</strong></p>
<p align="center"><em>v1.3.3 — 从需求到发布，11 道质量关卡，AI 不能跳过任何一个</em></p>
<p align="center"><em>Gate demands quality. Harness enforces it.</em></p>

---

## 核心问题

AI 辅助开发的根本问题：**AI 行为不确定，自然语言提示词是软性建议，AI 会跳过验证、绕过约束、声称完成但没有实际验证。**

Chaos Harness 的解法：

- **Gate 状态机** — 把约束编码为硬拦截，不可绕过
- **16 种生产级验证器** — 覆盖率、安全审计、架构分层、分支规范、提交规范
- **Hooks 自动拦截** — SessionStart/PreToolUse/PostToolUse 自动触发，AI 无法绕过
- **团队协作支持** — chaos-harness.yaml 提交 git，全团队共享规则

**核心差异化：** 不是提示词，是真正的硬拦截（AI 绕不过去）

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

# 验证
/chaos-harness:overview
```

> Windows：路径不能含中文和空格。

### 基本使用

```bash
# 查看 Gate 状态
node scripts/gate-visualizer.mjs

# 运行 Gate 检查
node scripts/gate-enforcer.mjs gate-w10-testing

# 生成 PR 描述
node scripts/gate-visualizer.mjs --pr-description

# CI 集成
node scripts/ci-gate-check.mjs
```

---

## 核心能力

### 1. Gate 状态机（核心）

11 个 Gates（6 阶段 + 5 质量），hard/soft 两级强制，依赖关系自动检查。

#### 阶段 Gates（6 个）

| Gate ID | 阶段 | 检查内容 |
|---------|------|---------|
| `gate-w01-requirements` | 需求 | 项目扫描，识别技术栈 |
| `gate-w03-architecture` | 架构 | PRD 质量检查 |
| `gate-w08-development` | 开发 | 架构文档存在 |
| `gate-w09-code-review` | 代码审查 | 至少 1 个 commit |
| `gate-w10-testing` | 测试 | 无语法错误 + 覆盖率 60% + 无 FIXME |
| `gate-w12-release` | 发布 | 测试通过 + 安全审计 + 覆盖率 80% |

#### 质量 Gates（5 个）

| Gate ID | 触发时机 | 检查内容 |
|---------|---------|---------|
| `gate-quality-iron-law` | pre-write | 铁律检查 |
| `gate-quality-tests` | pre-commit | 测试套件通过 |
| `gate-quality-format` | pre-commit | 代码格式检查 |
| `gate-quality-ui` | pre-write | UI 规范检查 |
| `gate-quality-architecture` | pre-write | 架构分层检查 |

### 2. 16 种验证器（生产级）

| 验证器 | 检查内容 | 适用场景 |
|--------|---------|---------|
| `project-scan` | 扫描项目类型和技术栈 | 项目初始化 |
| `file-exists` | 检查文件是否存在 | 阶段依赖 |
| `prd-quality-check` | PRD 文档质量 | 架构阶段 |
| `git-has-commits` | 至少 N 个 commit | 代码审查 |
| `no-syntax-errors` | 无语法错误 | 测试阶段 |
| `test-suite-pass` | 测试套件通过 | 发布阶段 |
| `iron-law-check` | 铁律检查 | 所有阶段 |
| **`coverage-threshold`** | **覆盖率达标** | **测试/发布** |
| **`no-todo-critical`** | **无 FIXME/TODO(critical)** | **测试/发布** |
| **`security-audit`** | **安全漏洞检查** | **发布阶段** |
| **`architecture-layer`** | **架构分层检查** | **开发阶段** |
| **`branch-naming`** | **分支命名规范** | **所有阶段** |
| **`commit-message`** | **提交信息规范** | **发布阶段** |
| `format-check` | 代码格式检查 | 提交前 |
| `ui-compliance` | UI 规范检查 | 前端开发 |
| `custom-script` | 自定义脚本 | 任意场景 |

### 3. Hooks 硬拦截

SessionStart/PreToolUse/PostToolUse 自动触发，exit 1 阻断。

```json
{
  "SessionStart": "node scripts/session-start-hook.mjs",
  "PreToolUse": "node scripts/pre-tool-use-hook.mjs",
  "PostToolUse": "node scripts/post-tool-use-hook.mjs"
}
```

### 4. Gate 可视化

Mermaid / ASCII 格式状态图，失败诊断 + 修复建议。

```bash
# ASCII 格式（终端）
node scripts/gate-visualizer.mjs

# Mermaid 格式（Markdown）
node scripts/gate-visualizer.mjs --mermaid

# PR 描述格式
node scripts/gate-visualizer.mjs --pr-description
```

### 5. 团队协作

chaos-harness.yaml 可提交 git，全团队共享规则。

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

### 6. CI 集成

GitHub Actions 注解格式，exit 0/1/2。

```yaml
# .github/workflows/ci.yml
- name: Chaos Harness Gate Check
  run: node scripts/ci-gate-check.mjs
```

---

## 使用场景

### 场景 1：个人开发

```bash
# 查看 Gate 状态
node scripts/gate-visualizer.mjs

# 手动检查
node scripts/gate-enforcer.mjs gate-w10-testing
```

### 场景 2：团队协作

```bash
# 创建团队配置
cat > chaos-harness.yaml << EOF
gates:
  coverage-threshold: 80
  security-audit: high
EOF

# 提交到 git
git add chaos-harness.yaml
git commit -m "chore: add chaos-harness config"
```

### 场景 3：CI/CD 集成

```yaml
# .github/workflows/ci.yml
jobs:
  gate-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: node scripts/ci-gate-check.mjs
```

---

## 核心命令

| 命令 | 用途 |
|------|------|
| `node scripts/gate-visualizer.mjs` | 查看 Gate 状态（ASCII） |
| `node scripts/gate-visualizer.mjs --mermaid` | 生成 Mermaid 图 |
| `node scripts/gate-visualizer.mjs --pr-description` | 生成 PR 描述 |
| `node scripts/gate-enforcer.mjs <gate-id>` | 运行单个 Gate |
| `node scripts/ci-gate-check.mjs` | 运行所有 quality Gate（CI 用） |
| `node scripts/gate-reporter.mjs` | 生成详细报告 |
| `/gate-manager status` | 查看 Gate 状态（Slash 命令） |
| `/gate-manager transition W10_testing` | 切换到测试阶段 |
| `/gate-manager recheck <gate-id>` | 重新检查 Gate |

---

## 可选增强功能

以下功能需要额外依赖（Python），作为可选增强：

### 项目知识引擎

扫描代码结构、依赖约束、JPA 实体，生成 `project-knowledge.json`。

```bash
node scripts/project-knowledge-engine.mjs --scan
```

### 需求影响分析

输入需求，输出影响范围 / 复用建议 / 约束提醒 / 风险预警。

```bash
node scripts/impact-analyzer.mjs --requirement "用户导出 Excel"
```

### Graphify 知识图谱

基于 [Graphify](https://github.com/safishamsi/graphify) 的深度代码结构分析。

```bash
pip install graphifyy
/chaos-harness:graphify generate
```

---

## 文档

- **[核心总结](docs/CORE-SUMMARY.md)** — 核心能力、使用场景、命令速查
- **[使用文档](docs/USAGE.md)** — 按角色（产品经理/架构师/开发/QA）的使用指南
- **[项目记忆](CLAUDE.md)** — 项目定位、版本历史、设计原则

---

## 架构总览

```
用户交互 (自然语言 / CLI / Slash Command)
         │
         ▼
┌─────────────────────────────────────────────┐
│  Hooks 自动拦截 (hooks.json)                  │
│  SessionStart → PreToolUse → PostToolUse      │
└──────────┬──────────────────────────────────┘
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
  37 Scripts · 18 Skills · 20 Commands
```

---

## 文件结构

```
chaos-harness/
├── skills/              # 18 个 Skill（能力入口）
├── scripts/             # 37 个脚本（执行引擎）
│   ├── gate-machine.mjs              # 阶段状态机
│   ├── gate-enforcer.mjs             # Gate 执行器（含失败诊断）
│   ├── gate-validator.mjs            # 验证器调度（16 种验证器）
│   ├── gate-visualizer.mjs           # Gate 可视化（Mermaid/ASCII）
│   ├── gate-reporter.mjs             # Gate 报告生成
│   ├── ci-gate-check.mjs             # CI 集成入口
│   └── ...
├── data/                # 6 个核心 CSV（精简后）
│   ├── gate-patterns.csv
│   ├── iron-law-rules.csv
│   ├── prd-quality-rules.csv
│   ├── test-patterns.csv
│   ├── anti-patterns.csv
│   ├── ui-patterns.csv
│   └── archived/        # 归档的 9 个 UI CSV
├── hooks/               # hooks.json + 硬拦截脚本
├── commands/            # 20 个 Slash 命令
├── chaos-harness.yaml   # 团队共享配置（可提交 git）
└── .chaos-harness/      # 运行时状态（不提交）
    └── gates/           # Gate 状态缓存
```

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

## 贡献

欢迎提交 Issue 和 PR。

- GitHub: https://github.com/jeesoul/chaos-harness
- 参考: [superpowers](https://github.com/obra/superpowers) | [everything-claude-code-zh](https://github.com/canthavesheep/everything-claude-code-zh)

---

## License

MIT © jeesoul
