# Chaos Harness 用户自定义配置

此目录用于存放用户自定义的铁律、模板和触发规则。

## 目录结构

```
~/.claude/harness/
├── iron-laws.yaml          # 自定义铁律
├── templates/              # 自定义模板
│   ├── my-template/
│   │   └── harness.yaml
│   └── ...
├── triggers.yaml           # 自定义触发规则
├── settings.yaml           # 全局设置
└── custom-commands.yaml    # 自定义命令别名
```

---

## 1. 自定义铁律 (iron-laws.yaml)

```yaml
# ~/.claude/harness/iron-laws.yaml

# 用户自定义铁律
# ID 范围: IL-C001 ~ IL-C099

custom_iron_laws:
  # 示例 1: 数据库安全
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库变更前必须创建备份"
    severity: critical  # critical | warning | info
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE|DELETE FROM|TRUNCATE"
        action: block   # block | warn | log
    rebuttal: |
      数据库变更存在风险，请先创建备份：
      1. 执行备份脚本
      2. 确认备份成功
      3. 再执行变更操作
    exceptions:
      - "开发环境"
      - "用户明确确认"

  # 示例 2: 生产环境保护
  - id: IL-C002
    rule: "NO DIRECT PRODUCTION ACCESS"
    description: "禁止直接访问生产环境"
    severity: critical
    triggers:
      - pattern: "prod|production|主库|线上"
        action: block
    rebuttal: |
      ⚠️ 生产环境操作需要审批
      请通过正式流程申请访问权限

  # 示例 3: 代码审查
  - id: IL-C003
    rule: "NO MERGE WITHOUT CODE REVIEW"
    description: "代码合并前必须经过审查"
    severity: warning
    triggers:
      - pattern: "merge|合并|push to main"
        action: warn
    rebuttal: |
      代码需要经过 Review 后才能合并
      请创建 PR 并等待审查

  # 示例 4: 文档更新
  - id: IL-C004
    rule: "NO FEATURE WITHOUT DOCUMENTATION"
    description: "新功能必须有文档说明"
    severity: warning
    triggers:
      - pattern: "新功能|new feature|feature:"
        action: warn
    rebuttal: |
      新功能需要同步更新文档：
      - API 文档
      - 用户手册
      - CHANGELOG

  # 示例 5: 测试覆盖
  - id: IL-C005
    rule: "NO CODE WITHOUT TESTS"
    description: "代码提交必须有测试"
    severity: warning
    triggers:
      - pattern: "commit|提交"
        action: warn
    rebuttal: |
      请为新代码添加测试用例
      测试覆盖率要求: ≥ 80%
```

---

## 2. 自定义模板

### 创建自定义模板

```bash
# 创建模板目录
mkdir -p ~/.claude/harness/templates/my-project-type

# 创建 harness.yaml
cat > ~/.claude/harness/templates/my-project-type/harness.yaml << 'EOF'
identity:
  name: my-project-type-harness
  version: "1.0.0"
  suitableFor:
    - my-framework
    - custom-tech-stack

ironLaws:
  - id: "IL-C001"
    # 继承用户自定义铁律

antiBypass:
  - id: "AB-CUSTOM-001"
    excuse: "这是特殊情况"
    rebuttal: "没有特殊情况，按流程执行"
EOF
```

### 模板继承

```yaml
# ~/.claude/harness/templates/my-spring-extended/harness.yaml

inherit: "java-spring"  # 继承官方模板

# 覆盖或扩展
ironLaws:
  - id: "IL-CUSTOM-001"
    rule: "MY CUSTOM RULE"
    # ...

# 扩展防绕过规则
antiBypass:
  - id: "AB-CUSTOM-001"
    excuse: "..."
    rebuttal: "..."
```

---

## 3. 自定义触发规则 (triggers.yaml)

```yaml
# ~/.claude/harness/triggers.yaml

# 自动触发规则
# 当检测到特定条件时自动激活对应 Skill

custom_triggers:
  # 基于文件类型的触发
  file_patterns:
    - pattern: "*.graphql"
      recommend: "api-design"
      message: "检测到 GraphQL schema，建议遵循 API 设计规范"

    - pattern: "Dockerfile*"
      recommend: "deployment"
      message: "检测到 Dockerfile，确保部署配置正确"

    - pattern: "*.proto"
      recommend: "api-design"
      message: "检测到 Protobuf，建议遵循 API 版本管理"

  # 基于关键词的触发
  keywords:
    - words: ["性能优化", "performance", "慢查询"]
      recommend: "performance-analysis"
      message: "检测到性能相关内容"

    - words: ["安全", "security", "漏洞", "vulnerability"]
      recommend: "security-review"
      message: "检测到安全相关内容"

    - words: ["重构", "refactor", "优化代码"]
      recommend: "code-review"
      message: "重构需要代码审查"

  # 基于时间的触发
  time_based:
    - condition: "friday"
      message: "今天是周五，建议避免重大变更"
      iron_laws:
        - IL-C-FRIDAY

    - condition: "end_of_sprint"
      recommend: "sprint-review"
      message: "冲刺结束，建议进行复盘"

  # 基于项目状态的触发
  state_based:
    - condition: "no_tests"
      message: "项目缺少测试文件"
      recommend: "auto-toolkit-installer"

    - condition: "low_coverage"
      threshold: 50
      message: "测试覆盖率低于 50%"
      recommend: "testing-workflow"
```

---

## 4. 全局设置 (settings.yaml)

```yaml
# ~/.claude/harness/settings.yaml

# 全局配置
global:
  language: "zh-CN"           # 语言设置
  auto_trigger: true          # 自动触发开关
  auto_recommend: true        # 自动推荐开关
  log_level: "info"           # debug | info | warn | error

# 铁律设置
iron_laws:
  core_enabled: true          # 核心铁律（不可禁用）
  custom_enabled: true        # 用户自定义铁律
  block_on_critical: true     # critical 级别是否阻断

# 学习设置
learning:
  enabled: true               # 自学习开关
  log_retention_days: 30      # 学习日志保留天数
  analysis_threshold: 5       # 触发分析的最小记录数

# 工作流设置
workflow:
  auto_detect_scale: true     # 自动检测项目规模
  default_scale: "medium"     # 默认规模
  skip_allowed: false         # 是否允许跳过阶段

# 模板设置
templates:
  search_paths:
    - "~/.claude/harness/templates"
    - "./templates"
  cache_enabled: true

# 钩子设置
hooks:
  session_start: true
  pre_tool_use: true
  post_tool_use: true
  stop: true
  pre_compact: true
```

---

## 5. 自定义命令别名 (custom-commands.yaml)

```yaml
# ~/.claude/harness/custom-commands.yaml

# 命令别名
aliases:
  # 简化命令
  "scan": "project-scanner"
  "lock": "version-locker"
  "gen": "harness-generator"
  "flow": "workflow-supervisor"
  "law": "iron-law-enforcer"
  "learn": "learning-analyzer"
  "product": "product-lifecycle"
  "plugin": "plugin-manager"
  "state": "project-state"

  # 组合命令
  "init":                    # 一键初始化
    steps:
      - "project-scanner"
      - "version-locker"
      - "harness-generator"
    message: "项目初始化完成"

  "check":                   # 一键检查
    steps:
      - "iron-law-enforcer"
      - "learning-analyzer"
    message: "检查完成"

  "prd":                     # PRD 工作流
    steps:
      - "product-lifecycle"
    args:
      stage: "P02"

  "deploy":                  # 部署检查
    steps:
      - "workflow-supervisor"
      - "iron-law-enforcer"
    args:
      stage: "P09"
```

---

## 使用方式

### 1. 创建自定义铁律

```bash
# 编辑铁律文件
vim ~/.claude/harness/iron-laws.yaml

# 或通过命令添加
你: 添加铁律：周五禁止部署
Claude: [创建 IL-C006] 已添加自定义铁律 "NO DEPLOY ON FRIDAY"
```

### 2. 使用自定义模板

```bash
# 创建模板
mkdir -p ~/.claude/harness/templates/my-template

# Harness 生成时自动发现
/chaos-harness:harness-generator
# 会列出: java-spring, vue3, react, my-template, ...
```

### 3. 查看当前配置

```bash
你: 查看我的自定义配置
Claude: [显示 iron-laws.yaml, triggers.yaml 等内容]
```

### 4. 禁用/启用功能

```bash
你: 禁用自动触发
Claude: [更新 settings.yaml] 已禁用自动触发

你: 启用自学习
Claude: [更新 settings.yaml] 已启用自学习
```

---

## 铁律优先级

```
用户自定义铁律 (IL-C001-IL-C099)
        ↓
模板铁律 (IL-VUE001, IL-REACT001, ...)
        ↓
系统核心铁律 (IL001-IL005) ← 最高优先级，不可覆盖
```

---

## 配置同步

配置文件可以通过 Git 同步：

```bash
cd ~/.claude/harness
git init
git remote add origin your-config-repo.git
git add .
git commit -m "Sync harness config"
git push
```