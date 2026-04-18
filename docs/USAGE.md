# Chaos Harness 使用文档 v1.3.1 孔明Pro

## 目录

- [快速开始](#快速开始)
- [铁律系统](#铁律系统)
- [v1.3.1 新增系统](#v131-新增系统)
  - [持续学习系统 2.0](#持续学习系统-20)
  - [评测驱动开发](#评测驱动开发)
  - [Schema-Driven 工作流](#schema-driven-工作流)
  - [深度防御](#深度防御)
  - [战略压缩](#战略压缩)
  - [迭代检索](#迭代检索)
- [Skill 模块详解](#skill-模块详解)
- [钩子系统](#钩子系统)
- [超频模式](#超频模式)
- [自定义铁律](#自定义铁律)
- [斜杠命令](#斜杠命令)
- [常见场景](#常见场景)
- [故障排除](#故障排除)

---

## 快速开始

### 安装

**方式一：标准安装**

```bash
# macOS / Linux
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# Windows (PowerShell)
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# Windows (CMD)
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
claude plugins marketplace add "%CD%"
claude plugins install chaos-harness@chaos-harness
```

重启 Claude Code 后运行 `/chaos-harness:overview` 验证。

> **无需手动配置 settings.json！** 插件安装后，Skills 和 Hooks（hooks.json）会被 Claude Code 插件系统自动加载。

**Windows 路径注意事项：**

| 问题 | 解决 |
|------|------|
| 路径含中文 | 使用纯英文路径，如 `D:\\chaos-harness` |
| 空格 | 路径用双引号包裹 |
| marketplace 格式 | 必须使用绝对路径，不支持相对路径 |
| CMD vs PowerShell | CMD 用 `%CD%`，PowerShell 用 `$(pwd)` |

**验证安装：**

```bash
# macOS / Linux
bash install.sh

# Windows（双击或 CMD）
install.bat
```

### 手动配置（高级）

如果你使用本地路径安装且 hooks 未自动加载，需要手动配置 settings.json。

**步骤：**

1. 找到 Claude Code settings.json 路径：
   - **Windows:** `%USERPROFILE%\\.claude\\settings.json`
   - **macOS/Linux:** `~/.claude/settings.json`

   示例 Windows 完整路径：
   ```
   C:\\Users\\你的用户名\\.claude\\settings.json
   ```

2. 获取插件安装路径（运行以下命令）：
   ```bash
   # Windows PowerShell
   (Get-Item ~).FullName + '\\.claude\\plugins\\chaos-harness@chaos-harness'

   # macOS / Linux
   echo ~/.claude/plugins/chaos-harness@chaos-harness
   ```

3. 编辑 settings.json，在 `"hooks"` 部分添加 Chaos Harness 的 hooks。

**示例配置（Windows）：**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\session-start.mjs\"",
            "async": false
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\iron-law-check.mjs\"",
            "async": false
          }
        ]
      },
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\overdrive.mjs\"",
            "async": true
          },
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\intent-analyzer.mjs\"",
            "async": true
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\laziness-detect.mjs\"",
            "async": true
          }
        ]
      },
      {
        "matcher": "Write|Edit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\instinct-collector.mjs\"",
            "async": true
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\eval-collector.mjs\"",
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "end_turn",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\stop.mjs\"",
            "async": false
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness\\scripts\\pre-compact.mjs\"",
            "async": false
          }
        ]
      }
    ]
  }
}
```

> **注意：** 将 `C:\\Users\\你的用户名\\.claude\\plugins\\chaos-harness@chaos-harness` 替换为你的实际插件路径。
> 路径中的 `\\` 在 JSON 中需要转义为 `\\\\`。

**验证手动配置：**

```bash
# 验证 settings.json 格式
node -e "JSON.parse(require('fs').readFileSync('%USERPROFILE%/.claude/settings.json','utf8')); console.log('valid')"
```

### 升级

```bash
cd /path/to/chaos-harness && git pull origin main
claude plugins marketplace remove chaos-harness
claude plugins marketplace add "$(pwd)"
claude plugins uninstall chaos-harness@chaos-harness
claude plugins install chaos-harness@chaos-harness
```

### 基本使用

安装完成后，直接在 Claude Code 中对话即可：

```
你: 帮我扫描当前项目
你: 创建版本 v0.1
你: 生成这个项目的 Harness
你: 列出所有铁律
你: 启动工作流
```

### 智能触发

无需记住命令，用自然语言即可触发对应 Skill：

| 你说... | 自动激活 |
|---------|---------|
| "紧急"、"超频"、"overdrive"、"立刻解决" | **overdrive**（最高优先级） |
| "需求"、"PRD"、"原型" | product-lifecycle |
| "直觉"、"本能"、"置信度" | instinct-system |
| "评测"、"pass@k"、"回归评测" | eval-harness |
| "迭代检索"、"上下文优化" | iterative-retrieval |
| "工作流"、"Schema"、"阶段依赖" | schema-workflow |
| "深度防御"、"多层验证" | defense-in-depth |
| "压缩"、"strategic" | strategic-compact |
| "评审"、"审查" | collaboration-reviewer |
| "测试用例"、"E2E" | test-assistant |
| "扫描项目" | project-scanner |
| "继续"、"恢复" | project-state |

---

## 铁律系统

### 核心铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | 所有文档必须在版本目录下 |
| IL002 | NO HARNESS WITHOUT SCAN RESULTS | Harness 需要项目扫描数据 |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 完成声明需要实际验证 |
| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT | 版本变更需要用户确认 |
| IL005 | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL | 敏感配置修改需要批准 |

### Agent Team 铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL-TEAM001 | REVIEW REQUIRES MULTIPLE AGENTS | 评审必须多 Agent 并行 |
| IL-TEAM002 | DEVELOPMENT REQUIRES PARALLEL AGENTS | 开发必须并行 |
| IL-TEAM003 | MONITORING MUST BE CONTINUOUS | 监督必须持续进行 |
| IL-TEAM004 | RESULTS REQUIRE USER CONFIRMATION | 结果必须用户确认 |
| IL-TEAM005 | NO SINGLE-THREAD DEGRADATION | 禁止单线程退化 |

### 偷懒模式

| ID | 模式 | 严重程度 |
|----|------|---------|
| LP001 | 声称完成但无验证证据 | critical |
| LP002 | 跳过根因分析直接修复 | critical |
| LP003 | 长时间无产出 | warning |
| LP004 | 试图跳过测试 | critical |
| LP005 | 擅自更改版本号 | critical |
| LP006 | 自动处理高风险配置 | critical |
| LP007 | Team 阶段主 Agent 代劳 | critical |

### 铁律执行流程

```
操作请求
    │
    ▼
[PreToolUse Hook] intent-analyzer 意图分析
    │
    ├── 铁律违规 → 预警 + 阻止 + 提示原因
    │
    └── 通过 → 允许执行
              │
              ▼
[Stop Hook] 验证完成（IL003）
              │
              ▼
[PostToolUse Hook] 本能收集 + 评测采集
```

---

## v1.3.1 新增系统

### 持续学习系统 2.0

**版本：** `skills/instinct-system/SKILL.md`

从行为记录进化为原子本能学习，通过 PostToolUse 钩子 100% 确定性采集。

#### 与 v1.3.0 的区别

| 特性 | v1.3.0 | v1.3.1 |
|------|--------|--------|
| 观测方式 | Stop 钩子（概率性） | PostToolUse 钩子（100% 确定） |
| 学习单元 | 完整技能 | 原子本能 |
| 置信度 | 无 | 0.3-0.9 加权评分 |
| 演进 | 直接到技能 | 本能 → 聚类 → 技能/命令/Agent |
| 分享 | 无 | 导出/导入本能 JSON |

#### 使用方式

```
你: 查看本能状态

Harness: Instincts: 0 | Clusters: 0 | Exports: 0

你: 导出高置信度本能

Harness: 已导出 0 个本能到 instincts/export.json

你: 查看铁律违规模式

Harness: 无高置信度违规模式
```

#### 数据文件

```
instincts/
├── instincts.json      # 本体存储（已提交）
└── observations.jsonl  # 观测记录（已忽略）
```

---

### 评测驱动开发

**版本：** `skills/eval-harness/SKILL.md`

评测驱动开发，不再仅基于主观判断，而是结合 pass@k 数据。

#### 评测指标

| 指标 | 含义 |
|------|------|
| pass@1 | 首次通过率（一次通过的概率） |
| pass@3 | 3 次通过率（3 次尝试至少 1 次通过） |
| pass^3 | 平均通过率（3 次尝试的平均通过率） |

#### 评分器

| 类型 | 说明 |
|------|------|
| 代码评分 | 自动执行测试命令，解析结果 |
| 模型评分 | AI 评估代码质量 |
| 人工评分 | 用户确认 |

#### 使用方式

```
你: 创建能力评测

Harness: 能力评测已创建，执行测试以获取 pass@k 数据

你: 查看评测报告

Harness: Evals: 0 | Capability: 0 | Regression: 0 | Last Run: never

你: 查看能力评测列表

Harness: /eval-harness list capability
```

#### 数据文件

```
evals/
├── capability/         # 能力评测定义
├── regression/         # 回归评测定义
└── results/
    └── registry.json   # 评测结果注册表
```

---

### Schema-Driven 工作流

**版本：** `skills/schema-workflow/SKILL.md`

YAML 定义工作流 + 依赖图 + 自定义验证。

#### 与 v1.3.0 的区别

| 特性 | v1.3.0 | v1.3.1 |
|------|--------|--------|
| 工作流定义 | 硬编码 12 阶段 | YAML Schema + 依赖图 |
| 阶段管理 | 固定流程 | 动态解析 + 自定义验证脚本 |
| 自定义 | 无 | schemas/custom/ 目录 |
| 模板 | 无 | default + product-lifecycle |

#### 使用方式

```
你: 查看可用工作流

Harness: Available schemas: default, product-lifecycle

你: 查看默认工作流执行顺序

Harness: Execution order: W01_requirements -> W03_architecture -> W08_development

你: 切换到产品生命周期工作流

Harness: 加载 product-lifecycle Schema（9 阶段）
```

#### Schema 文件

```
schemas/
├── default.yaml              # 默认 3 阶段工作流
├── product-lifecycle.yaml    # 产品 9 阶段工作流
└── custom/                   # 自定义工作流目录
```

#### 依赖解析

使用 Kahn 拓扑排序算法自动计算阶段执行顺序，支持自定义依赖关系。

---

### 深度防御

**版本：** `skills/defense-in-depth/SKILL.md`

4 层验证框架，消除约束灰色空间。

| 层级 | 检查内容 | 实现 |
|------|----------|------|
| L1 入口层 | 参数验证、权限检查 | PreToolUse Hook（intent-analyzer） |
| L2 业务层 | 铁律合规、逻辑验证 | iron-law-enforcer |
| L3 环境层 | 依赖完整性、版本兼容性 | project-scanner |
| L4 调试层 | 失败诊断、根因分析 | learning-analyzer |

#### 意图分析器

PreToolUse Hook 自动检测以下绕过模式：

| 绕过借口 | 铁律引用 | 反驳 |
|---------|---------|------|
| "简单修复" | IL003 | 简单也需要验证 |
| "跳过测试" | IL003 | 测试是基本验证 |
| "就这一次" | IL001 | 每次例外都是先例 |
| "老项目" | IL002 | 老项目更需要约束 |

---

### 战略压缩

**版本：** `skills/strategic-compact/SKILL.md`

逻辑边界压缩 + 工具调用计数阈值检测，防止上下文膨胀。

| 阈值 | 行为 |
|------|------|
| 50 次 | 压缩子 Agent 上下文，只传递必要信息 |
| 100 次 | 主 Agent 保存状态快照，重新分配简化任务 |
| 150 次 | 保存关键决策后重启上下文 |

#### 使用方式

```
你: 查看压缩状态

Harness: 工具调用计数: 0 | 会话开始: 2026-04-18T15:48:55Z
```

---

### 迭代检索

**版本：** `skills/iterative-retrieval/SKILL.md`

4 阶段检索循环（DISPATCH/EVALUATE/REFINE/LOOP），优化代码库上下文检索质量。

| 阶段 | 说明 |
|------|------|
| DISPATCH | 广泛搜索相关文件和模式 |
| EVALUATE | 评估每个文件的相关性（高/中/低/无） |
| REFINE | 基于高相关性文件更新搜索标准 |
| LOOP | 最多 3 次循环，或找到 5+ 高相关性文件 |

#### 使用方式

```
你: 检索用户认证相关代码

Harness: 开始迭代检索循环...
         Cycle 0: 候选文件 []
         请提供更具体的搜索模式或确认检索完成
```

---

## Skill 模块详解

### project-scanner

**触发：** "扫描项目"、"分析项目结构"

```
你: 扫描当前项目

Harness: 项目类型: java-spring (98%)
         语言: Java 17
         框架: Spring Boot 3.2.0
```

### version-locker

**触发：** "创建版本"、"版本管理"

```
你: 创建版本 v0.1

Harness: 版本: v0.1 | 状态: 已锁定
         目录: ./output/v0.1/
```

### harness-generator

**触发：** "生成 Harness"、"创建约束"

基于扫描数据生成专属 Harness，自动匹配项目类型模板。

### workflow-supervisor

**触发：** "工作流"、"阶段管理"

支持两种工作流模式：
- **传统模式：** 12 阶段工作流（按项目规模裁剪）
- **Schema 模式：** YAML 定义工作流（动态解析依赖图）

### iron-law-enforcer

**触发：** 始终激活

铁律执行 + 绕过检测 + 偷懒模式监控。不可禁用。

### overdrive（超频模式）

**触发：** "紧急"、"超频"、"overdrive"、"立刻解决"

最高优先级紧急处理模式：
- **时间目标：** 14 分钟完成定位→决策→执行→验证
- **Agent 配置：** 3+ Agent 并行
- **效率指令：** 零铺垫、不解释、快速拍板

### collaboration-reviewer

**触发：** "评审"、"审查"

多 Agent 协作评审，结合评测数据（pass@k）进行质量门禁。

支持快速确认模式：变更 < 50 行 + 不涉及核心逻辑 → 单个评审 Agent 快速通过。

### agent-team-orchestrator

**触发：** 由工作流或评审自动调度

Agent Team 编排，支持：
- 并行检索（集成 iterative-retrieval）
- 本能反馈（经验自动记录到 instinct-system）
- 战略压缩集成

### learning-analyzer

**触发：** "学习记录"、"自学习"

自学习分析：失败模式识别、规则优化、铁律演进。

### instinct-system

**触发：** "直觉"、"本能"、"置信度"

持续学习系统 2.0：
- 原子本能存储
- 置信度演进（0.3-0.9）
- 导出/分享

### eval-harness

**触发：** "评测"、"pass@k"、"回归评测"

评测驱动开发：
- pass@k 指标
- 能力 + 回归评测
- 3 种评分器

### iterative-retrieval

**触发：** "迭代检索"、"上下文优化"

4 阶段检索循环，优化代码库上下文检索质量。

### schema-workflow

**触发：** "工作流"、"Schema"、"阶段依赖"

YAML 定义工作流，支持依赖图和自定义验证。

### defense-in-depth

**触发：** "深度防御"、"多层验证"

4 层验证框架（入口→业务→环境→调试）。

### strategic-compact

**触发：** "压缩"、"strategic"

逻辑边界压缩 + 工具调用计数阈值。

### 其他 Skills

| Skill | 触发词 | 功能 |
|-------|--------|------|
| auto-context | 后台自动 | 智能场景感知 |
| auto-toolkit-installer | 工具链、安装 | 自动化工具检测安装 |
| hooks-manager | 钩子、hooks | 查看钩子状态 |
| plugin-manager | 插件、配置 | 插件和铁律管理 |
| project-state | 继续、恢复 | 会话持久化 |
| product-lifecycle | PRD、需求、原型 | 产品全生命周期 |
| product-manager | 需求分析、竞品分析、Kano | 产品经理工作助手 |
| prd-validator | PRD检查、PRD验证 | PRD 质量检查器 |
| test-assistant | 测试用例、E2E、覆盖率 | 测试工程师工作助手 |
| visual-regression | 视觉回归、截图对比 | 可视化回归测试（CDP） |
| ui-generator | 生成界面、UI生成 | 从 PRD 生成可运行的前端界面 |
| adaptive-harness | 自适应优化、应用建议 | 从学习数据自动强化铁律 |
| web-access | 搜索、网页、CDP、浏览器 | 联网操作与 CDP 浏览器自动化 |
| java-checkstyle | Java 项目 | Java 代码规范 |

---

## 钩子系统

Chaos Harness 通过 Hook 实现自动化检查和数据采集。

### Hook 类型

| Hook | 触发时机 | 功能 |
|------|----------|------|
| SessionStart | 会话开始 | 注入铁律 + 恢复状态 + 学习分析 |
| PreToolUse | 工具调用前 | 铁律预检 + 意图分析预警 |
| PostToolUse | 工具调用后 | 本能收集 + 评测采集 + 偷懒检测 |
| Stop | 回合结束 | 完成声明分析 |
| PreCompact | 对话压缩前 | 保存上下文 + 团队退化检测 |

### 已注册 Hooks（v1.3.1）

| 事件 | 匹配模式 | 脚本 |
|------|----------|------|
| SessionStart | * | session-start.mjs |
| PreToolUse | Write\|Edit | iron-law-check.mjs |
| PreToolUse | .* | intent-analyzer.mjs |
| PostToolUse | Write\|Edit | laziness-detect.mjs |
| PostToolUse | Write\|Edit\|Bash | instinct-collector.mjs |
| PostToolUse | Bash | eval-collector.mjs |
| Stop | * | stop.mjs |
| PreCompact | * | pre-compact.mjs |

### 查看钩子状态

```
你: 查看钩子状态

Harness: 已注册 8 个钩子：
         - SessionStart: 1
         - PreToolUse: 2
         - PostToolUse: 3
         - Stop: 1
         - PreCompact: 1
```

---

## 超频模式

超频模式不是正常流程的加速版，而是完全不同的作战状态。

### 激活条件

- 用户说 "紧急"/"超频"/"overdrive"/"优先处理"
- 用户说 "立刻解决"/"马上"/"热修复"
- auto-context 检测到用户情绪紧迫

### 超频模式流程

```
并行定位（3+ Agent）→ 收敛决策 → 并行执行 → 验证输出
     (3 min)              (1 min)      (8 min)      (2 min)
```

### 铁律调整

| 铁律 | 正常模式 | 超频模式 |
|------|---------|---------|
| IL001 版本目录 | 必须遵守 | 遵守 |
| IL002 扫描数据 | 必须先扫描 | **跳过** — 基于已有上下文 |
| IL003 完成验证 | 必须验证 | 遵守 |
| IL005 敏感配置 | 需审批 | 遵守 |

### 修复报告格式

```markdown
## 超频修复报告

| 字段 | 内容 |
|------|------|
| 问题 | {一句话描述} |
| 类型 | 代码/需求/架构/测试/运维 |
| 根因 | {根因分析} |
| 方案 | {解决方案} |
| 修改 | {具体变更} |
| 验证 | {通过/失败 + 证据} |
| Agent 数 | {参与数量} |
```

---

## 自定义铁律

### 添加铁律

**方式一：对话添加**

```
你: 添加铁律：周五禁止部署

Harness: 铁律配置
         ID: IL-C002 (自动分配)
         Rule: NO DEPLOYMENT ON FRIDAY
         确认添加？(是/取消)
```

**方式二：配置文件**

编辑 `~/.claude/harness/iron-laws.yaml`：

```yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库变更需要备份"
    severity: critical
    triggers:
      - type: pattern
        pattern: "ALTER TABLE|DROP TABLE"
        action: block
```

### 铁律 ID 命名

| 前缀 | 说明 |
|------|------|
| `IL001-IL099` | 核心铁律 |
| `IL-C001+` | 用户自定义 |
| `IL-T001+` | 团队铁律 |
| `IL-P001+` | 项目铁律 |
| `IL-J001+` | Java 栈特定 |
| `IL-TEAM001+` | Agent Team 铁律 |

---

## 斜杠命令

完整命令列表（30 个 Skills 对应命令）：

| 命令 | 功能 |
|------|------|
| `/chaos-harness:overview` | 系统概览 |
| `/chaos-harness:overdrive` | 超频模式 |
| `/chaos-harness:project-scanner` | 项目扫描 |
| `/chaos-harness:version-locker` | 版本管理 |
| `/chaos-harness:harness-generator` | 约束生成 |
| `/chaos-harness:workflow-supervisor` | 工作流管理 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行 |
| `/chaos-harness:collaboration-reviewer` | 多 Agent 评审 |
| `/chaos-harness:agent-team-orchestrator` | Agent 编排 |
| `/chaos-harness:hooks-manager` | 钩子管理 |
| `/chaos-harness:plugin-manager` | 插件管理 |
| `/chaos-harness:project-state` | 状态恢复 |
| `/chaos-harness:auto-toolkit-installer` | 工具链检测 |
| `/chaos-harness:learning-analyzer` | 自学习分析 |
| `/chaos-harness:product-lifecycle` | 产品全生命周期 |
| `/chaos-harness:product-manager` | 产品经理助手 |
| `/chaos-harness:prd-validator` | PRD 质量检查 |
| `/chaos-harness:test-assistant` | 测试助手 |
| `/chaos-harness:visual-regression` | 视觉回归测试 |
| `/chaos-harness:ui-generator` | UI 生成 |
| `/chaos-harness:adaptive-harness` | 自适应优化 |
| `/chaos-harness:web-access` | 联网操作 |
| `/chaos-harness:instinct-system` | 直觉系统 |
| `/chaos-harness:eval-harness` | 评测系统 |
| `/chaos-harness:iterative-retrieval` | 迭代检索 |
| `/chaos-harness:schema-workflow` | Schema 工作流 |
| `/chaos-harness:defense-in-depth` | 深度防御 |
| `/chaos-harness:strategic-compact` | 战略压缩 |

---

## 常见场景

### 场景一：新项目初始化

```
你: 扫描当前项目
Harness: [扫描结果...]

你: 创建版本 v0.1
Harness: 版本已锁定: v0.1

你: 生成这个项目的 Harness
Harness: Harness 已生成到 ./output/v0.1/
```

### 场景二：紧急 bug 修复（超频模式）

```
你: 线上 bug，紧急修复！

Harness: ⚡ 超频模式已激活
         优先级: P0
         所有 Agent 全速运行

[3+ Agent 并行定位 → 收敛决策 → 并行执行 → 验证输出]

Harness: ## 超频修复报告
         问题: 用户登录失败
         根因: Token 过期逻辑错误
         方案: 修复 Token 校验逻辑
         验证: 通过（5/5 测试通过）
         Agent 数: 4
```

### 场景三：任务完成验证

```
你: 功能开发完成

Harness: [IL003] 需要验证证据
         请提供测试输出或验证结果

你: [粘贴测试输出]

Harness: ✓ 验证通过
         任务已完成
```

### 场景四：Schema 工作流

```
你: 使用产品生命周期工作流

Harness: 加载 product-lifecycle Schema
         9 阶段: P01 → P02 → ... → P09

你: 当前阶段

Harness: 当前阶段: P02_需求分析
         已完成: P01
         下一步: 完成需求分析后进入 P03
```

### 场景五：评测驱动开发

```
你: 创建能力评测

Harness: 评测已创建，执行测试...

你: 查看评测结果

Harness: pass@1: 0.85 | pass@3: 0.92 | pass^3: 0.88
```

### 场景六：本能系统查看

```
你: 查看本能状态

Harness: Instincts: 15 | Clusters: 3 | Exports: 0
         高置信度本能 (≥0.7): 5 条

你: 查看铁律违规模式

Harness: IL003 违规: confidence 0.65
         模式: 声称完成但无测试证据
```

---

## 故障排除

### Skill 未激活

检查插件安装：
```bash
ls ~/.claude/plugins/chaos-harness/skills/
```

确保 SKILL.md 使用 LF 行尾（CRLF 会导致无法注册）。

### 铁律未生效

检查自定义配置：
```bash
cat ~/.claude/harness/iron-laws.yaml
```

### 钩子未触发

查看钩子注册状态：
```
/chaos-harness:hooks-manager
```

确认 hooks.json 语法正确：
```bash
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8')); console.log('valid')"
```

### 脚本执行失败

检查 Node.js 版本：
```bash
node --version  # 需要 >= 18.0
```

验证脚本语法：
```bash
node --check scripts/*.mjs
```

### 版本号不一致

```
/chaos-harness:version-locker
```

查看当前版本锁定状态。

---

## 数据目录

```
chaos-harness/
├── instincts/
│   ├── instincts.json      # 本能存储（已提交）
│   └── observations.jsonl  # 观测记录（已忽略）
├── evals/
│   ├── capability/         # 能力评测定义
│   ├── regression/         # 回归评测定义
│   └── results/
│       └── registry.json   # 评测结果
├── schemas/
│   ├── default.yaml        # 默认工作流
│   ├── product-lifecycle.yaml
│   └── custom/             # 自定义工作流
└── output/
    └── v{version}/         # 版本输出目录
```

---

*Chaos demands order. Harness provides it.*
