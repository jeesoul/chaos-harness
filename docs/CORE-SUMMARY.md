# Chaos Harness 核心总结

## 一、现在达到了什么程度？

**成熟度：⭐⭐⭐⭐ 生产可用（4/5）**

| 维度 | 状态 | 说明 |
|------|------|------|
| **核心功能** | ✅ 完整 | Gate 状态机 + 16 种验证器 + 硬拦截 |
| **团队协作** | ✅ 完整 | 配置共享 + CI 集成 |
| **可视化** | ✅ 完整 | Mermaid/ASCII 状态图 + 失败诊断 |
| **文档** | ✅ 完整 | README + USAGE + 命令文档 |
| **测试** | ✅ 完整 | 7 个测试文件，覆盖核心验证器 |
| **生态** | ⚠️ 初期 | 暂无社区贡献，仅个人项目 |

**可以做什么：**
- ✅ 在真实项目中使用（Spring Boot / Vue / React / FastAPI）
- ✅ 团队协作（多人共享 Gate 配置）
- ✅ CI/CD 集成（GitHub Actions / GitLab CI）
- ✅ 自定义验证规则（通过 chaos-harness.yaml）

**还不能做什么：**
- ❌ 可视化 Web 界面（当前只有 CLI）
- ❌ 插件市场（暂无第三方验证器）
- ❌ 多语言支持（文档和输出都是中文）

---

## 二、核心到底是什么？

### 用一句话说

**"AI 写代码时的自动质量检查点，不通过就不让继续"**

### 核心价值

**问题：** AI 写代码会跳过测试、忽略规范、声称完成但没验证

**解法：** Gate 状态机 = 11 个检查点，AI 必须通过才能进入下一阶段

### 核心机制

```
AI 要写代码
    ↓
Hooks 自动拦截（SessionStart/PreToolUse/PostToolUse）
    ↓
运行 Gate 验证器（覆盖率/安全/架构/分支规范...）
    ↓
通过 → 继续
失败 → exit 1 阻断 + 给出修复建议
```

### 核心差异化

| 对比 | 传统方式 | Chaos Harness |
|------|---------|---------------|
| **约束方式** | 提示词（软性建议） | Hooks + exit 1（硬拦截） |
| **AI 能否绕过** | ✅ 能（AI 会忽略提示词） | ❌ 不能（进程级阻断） |
| **验证时机** | 事后检查 | 事前拦截 |
| **团队共享** | 每人自己配置 | chaos-harness.yaml 提交 git |

---

## 三、该怎么用？

### 场景 1：个人开发者（最简单）

**目标：** 让 AI 写代码时自动检查质量

**步骤：**

1. **查看当前 Gate 状态**
   ```bash
   node scripts/gate-visualizer.mjs
   ```

2. **让 AI 写代码**
   - AI 写代码时，Hooks 会自动触发 Gate 检查
   - 如果失败，会看到详细的错误信息 + 修复建议

3. **手动运行 Gate 检查**
   ```bash
   # 检查测试阶段 Gate
   node scripts/gate-enforcer.mjs gate-w10-testing

   # 检查发布阶段 Gate
   node scripts/gate-enforcer.mjs gate-w12-release
   ```

---

### 场景 2：团队协作（推荐）

**目标：** 全团队共享同一套质量标准

**步骤：**

1. **创建团队配置**
   ```yaml
   # chaos-harness.yaml（提交到 git）
   version: "1.3.3"
   
   gates:
     coverage-threshold: 80
     security-audit: high
     branch-naming: "^(feature|fix|chore)/.+"
   ```

2. **提交到 git**
   ```bash
   git add chaos-harness.yaml
   git commit -m "chore: add chaos-harness team config"
   ```

3. **查看团队 Gate 状态**
   ```bash
   node scripts/gate-visualizer.mjs --pr-description
   ```

---

### 场景 3：CI/CD 集成（生产环境）

**步骤：**

1. **创建 GitHub Actions 配置**
   ```yaml
   # .github/workflows/ci.yml
   - name: Chaos Harness Gate Check
     run: node scripts/ci-gate-check.mjs
   ```

2. **查看 CI 结果**
   - 失败时会在 PR 中显示注解（文件 + 行号）

---

## 四、核心命令速查

| 命令 | 用途 |
|------|------|
| `node scripts/gate-visualizer.mjs` | 查看 Gate 状态（ASCII） |
| `node scripts/gate-visualizer.mjs --mermaid` | 生成 Mermaid 图 |
| `node scripts/gate-visualizer.mjs --pr-description` | 生成 PR 描述 |
| `node scripts/gate-enforcer.mjs <gate-id>` | 运行单个 Gate |
| `node scripts/ci-gate-check.mjs` | 运行所有 quality Gate（CI 用） |
| `node scripts/gate-reporter.mjs` | 生成详细报告 |

---

## 五、11 个 Gate 清单

### 阶段 Gates（6 个）

| Gate ID | 阶段 | 检查内容 |
|---------|------|---------|
| `gate-w01-requirements` | 需求 | 项目扫描，识别技术栈 |
| `gate-w03-architecture` | 架构 | PRD 质量检查 |
| `gate-w08-development` | 开发 | 架构文档存在 |
| `gate-w09-code-review` | 代码审查 | 至少 1 个 commit |
| `gate-w10-testing` | 测试 | 无语法错误 + 覆盖率 60% + 无 FIXME |
| `gate-w12-release` | 发布 | 测试通过 + 安全审计 + 覆盖率 80% |

### 质量 Gates（5 个）

| Gate ID | 触发时机 | 检查内容 |
|---------|---------|---------|
| `gate-quality-iron-law` | pre-write | 铁律检查 |
| `gate-quality-tests` | pre-commit | 测试套件通过 |
| `gate-quality-format` | pre-commit | 代码格式检查 |
| `gate-quality-ui` | pre-write | UI 规范检查 |
| `gate-quality-architecture` | pre-write | 架构分层检查 |

---

## 六、16 种验证器清单

| 验证器 | 检查内容 | 适用场景 |
|--------|---------|---------|
| `project-scan` | 扫描项目类型和技术栈 | 项目初始化 |
| `file-exists` | 检查文件是否存在 | 阶段依赖 |
| `prd-quality-check` | PRD 文档质量 | 架构阶段 |
| `git-has-commits` | 至少 N 个 commit | 代码审查 |
| `no-syntax-errors` | 无语法错误 | 测试阶段 |
| `test-suite-pass` | 测试套件通过 | 发布阶段 |
| `iron-law-check` | 铁律检查 | 所有阶段 |
| `coverage-threshold` | 覆盖率达标 | 测试/发布 |
| `no-todo-critical` | 无 FIXME/TODO(critical) | 测试/发布 |
| `security-audit` | 安全漏洞检查 | 发布阶段 |
| `architecture-layer` | 架构分层检查 | 开发阶段 |
| `branch-naming` | 分支命名规范 | 所有阶段 |
| `commit-message` | 提交信息规范 | 发布阶段 |
| `format-check` | 代码格式检查 | 提交前 |
| `ui-compliance` | UI 规范检查 | 前端开发 |
| `custom-script` | 自定义脚本 | 任意场景 |

---

## 七、总结

### 核心价值

**"让 AI 写代码时，自动检查质量，不通过就不让继续"**

### 三个关键特性

1. **硬拦截** — 不是提示词，是进程级阻断（exit 1）
2. **生产级验证** — 覆盖率、安全、架构、分支规范，真实场景
3. **团队协作** — chaos-harness.yaml 提交 git，全团队共享

### 适合谁用

- ✅ 使用 Claude Code / Cursor / GitHub Copilot 的开发者
- ✅ 有代码规范、架构约束的团队
- ✅ 需要 CI/CD 集成的项目

---

**现在你知道了：**
1. **达到了什么程度** — 生产可用（4/5），核心功能完整
2. **核心是什么** — Gate 状态机 + 硬拦截 + 16 种验证器
3. **该怎么用** — 个人开发 / 团队协作 / CI 集成
