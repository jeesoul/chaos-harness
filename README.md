# Chaos Harness

<p align="center">
  <strong>确定性 AI Agent 约束框架</strong>
</p>

<p align="center">
  <em>Chaos demands order. Harness provides it.</em>
</p>

<p align="center">
  <a href="#名称来源">名称来源</a> •
  <a href="#为什么需要-chaos-harness">为什么需要</a> •
  <a href="#核心特性">核心特性</a> •
  <a href="#架构">架构</a> •
  <a href="#安装">安装</a> •
  <a href="#使用">使用</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Tests-623-brightgreen.svg" alt="Tests">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js">
</p>

---

## 名称来源

**Chaos (混沌) + Harness (驾驭) = 驾驭混沌**

这个名字源自一个核心理念：

> **AI 的创造力是混沌的源泉，但工程需要秩序。我们不是要消灭混沌，而是要驾驭它。**

在 AI Agent 辅助开发的场景中，Agent 的创造力带来无限可能，但也带来不确定性——它可能"合理化"绕过规则、声称完成却无验证、跳过必要的分析步骤。

传统方法制定更多规则，但规则越多，解释空间越大，Agent 越能找到"合理"的规避路径：

```
传统规则: "建议运行测试"     → Agent: "这个改动很简单，不用测"
传统规则: "请进行代码审查"   → Agent: "时间紧，这次先上线"
传统规则: "需要分析根因"     → Agent: "问题很明显，直接修吧"
```

Chaos Harness 采用相反的思路：**用铁律替代建议**。

铁律不是用来解释的，是用来执行的。它消除灰色空间，让 Agent 无法"聪明地"规避质量要求：

```
铁律 IL003: NO COMPLETION WITHOUT VERIFICATION
→ Agent: "任务完成了"
→ Harness: [BLOCKED] 提供验证证据后才能标记完成
```

**一句话总结：混沌需要秩序，Harness 提供秩序。**

---

## 为什么需要 Chaos Harness？

### AI Agent 的确定性危机

AI Agent 在软件工程场景中存在**确定性行为缺失**问题，这导致了一个根本性的信任危机：

| 问题类型 | 具体表现 | 深层原因 | 最终后果 |
|---------|---------|---------|---------|
| **不可信的完成声明** | "任务完成了" 但无测试输出、无审查确认 | Agent 缺乏自我验证意识 | 引入未验证代码，产生隐蔽缺陷 |
| **系统性绕过尝试** | "这很简单"、"跳过测试"、"就这一次" | 建议性规则存在解释空间 | 质量债务持续累积，最终失控 |
| **根因分析缺失** | 直接修复，不调查原因 | 缺乏强制分析机制 | 问题反复出现，治标不治本 |
| **约束软化** | 建议性规则被 Agent 合理化规避 | 规则没有强制执行力 | 约束形同虚设，流程失控 |
| **环境漂移** | 不同环境配置导致行为不一致 | 缺乏环境感知和适配 | "在我机器上能跑" 问题频发 |
| **上下文丢失** | 长对话中忘记关键决策 | 记忆压缩时丢失重要信息 | 重复犯错，决策矛盾 |

### 传统方案的局限性

| 方案 | 问题 |
|------|------|
| **Prompt 规则** | 建议性质，Agent 可以"合理化"绕过 |
| **代码审查** | 后置检测，问题已产生才发现 |
| **CI/CD 门禁** | 只能检测执行结果，无法约束 Agent 行为 |
| **人工监督** | 无法规模化，人类无法持续监控每个决策 |

### Chaos Harness 的解决方案

Chaos Harness 采用**多层防御体系**，从根源解决 AI Agent 的确定性危机：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Chaos Harness 多层防御体系                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Layer 4: 自学习层     从错误中学习，持续优化约束规则                      │
│           └── learning-update hook → 学习日志 → 规则建议                 │
│                                                                         │
│  Layer 3: 自纠正层     实时检测偏差，强制纠偏                              │
│           └── iron-law-check, stop, laziness-detect hooks               │
│                                                                         │
│  Layer 2: 约束层       不可协商的铁律，消除灰色空间                        │
│           └── IL001-IL005 + 用户自定义铁律                               │
│                                                                         │
│  Layer 1: 感知层       智能感知环境，自适应调整                           │
│           └── 项目扫描 → 规模检测 → 环境适配 → 模板选择                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**核心创新：**

1. **用铁律替代建议** — 消除 Agent 可以规避质量要求的"灰色空间"
2. **实时自纠正** — 在错误发生时立即阻断，而非事后发现
3. **智能自适应** — 自动感知项目环境，动态调整约束强度
4. **持续自学习** — 从违规记录中学习，不断优化约束规则

---

## 核心特性

### 🏛️ 铁律系统

五条核心铁律，构成不可协商的约束基石：

```
┌─────────────────────────────────────────────────────────────────────────┐
│  IL001  │  NO DOCUMENTS WITHOUT VERSION LOCK                            │
│         │  所有输出必须在版本目录下，防止文档混乱                         │
├─────────┼────────────────────────────────────────────────────────────────┤
│  IL002  │  NO HARNESS WITHOUT SCAN RESULTS                              │
│         │  Harness 生成必须基于项目扫描数据，拒绝凭空猜测                 │
├─────────┼────────────────────────────────────────────────────────────────┤
│  IL003  │  NO COMPLETION CLAIMS WITHOUT VERIFICATION                    │
│         │  完成声明必须有验证证据支持，测试输出/命令结果/审查确认         │
├─────────┼────────────────────────────────────────────────────────────────┤
│  IL004  │  NO VERSION CHANGES WITHOUT USER CONSENT                      │
│         │  版本变更必须经过用户明确确认，Agent 无权擅自更改               │
├─────────┼────────────────────────────────────────────────────────────────┤
│  IL005  │  NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL           │
│         │  敏感配置修改必须经过审批，防止环境破坏                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**铁律 vs 建议性规则：本质区别**

| 维度 | 传统建议性规则 | Chaos Harness 铁律 |
|------|---------------|-------------------|
| **执行方式** | 提示、建议、推荐 | 强制执行、阻断 |
| **解释空间** | Agent 可"合理化"绕过 | 零解释空间，二进制判断 |
| **后果** | 违规后可能无感知 | 违规即阻断，强制纠正 |
| **可追溯性** | 无记录 | 完整违规日志 |
| **可扩展性** | 需修改 Prompt | YAML 配置即可添加 |

**铁律扩展机制：**

```yaml
# ~/.claude/harness/iron-laws.yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库变更前必须创建备份"
    severity: critical          # critical | warning | info
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE|TRUNCATE"
        action: block           # block | warn | require
        message: "数据库结构变更需要先创建备份"
    enforcement:
      - "检查是否有备份命令执行"
      - "要求用户提供备份确认"
```

### 🔄 自纠正机制

通过 Claude Code Hooks 实现实时行为约束：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Hooks 触发流程                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SessionStart ──────► session-start ──────► 注入铁律上下文              │
│                                                                         │
│  PreToolUse ────────► iron-law-check ────► 检查 IL001/IL005            │
│                     ► workflow-track ────► 进度追踪、超时检测           │
│                                                                         │
│  PostToolUse ───────► laziness-detect ───► 检测 LP001-LP006            │
│                     ► learning-update ──► 生成学习记录                  │
│                                                                         │
│  Stop ──────────────► stop ──────────────► 绕过检测、完成验证           │
│                                                                         │
│  PreCompact ────────► pre-compact ───────► 保存关键上下文               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**实时阻断示例：**

```
Agent: "任务完成了"

[Stop Hook 触发 IL003 检查]
├── 检测完成关键词: ✓
├── 检测验证证据: ✗
└── 动作: BLOCKED

Harness: IL003 VIOLATION: NO COMPLETION CLAIMS WITHOUT VERIFICATION
         
         检测到完成声明，需要验证证据：
         1. Run tests: npm test / pytest / mvn test
         2. Verify build: npm run build / mvn compile
         3. Provide evidence: command output, test results
```

### 🧠 自学习能力

从违规记录中自动生成学习条目，持续优化约束：

```
违规事件                                    学习记录
───────────────────────────────────────────────────────────────
IL001: output/test.md (无版本目录)    →    L001: 版本目录规则
                                           所有输出必须在 output/vX.Y/ 下
                                           修复: 先创建版本目录

IL003: 完成但无测试输出               →    L002: 完成验证规则
                                           必须提供测试执行证据
                                           修复: 运行测试并保存输出

LP002: 直接修复未分析根因             →    L003: 根因分析规则
                                           修复前必须回答"为什么"
                                           修复: 添加根因分析步骤
```

**学习日志结构：**

```json
{
  "id": "L001",
  "source": "IL001",
  "title": "Version Directory Required",
  "content": "All outputs must be under version directory (vX.Y format)",
  "timestamp": "2026-04-03T10:30:00Z",
  "original_event": "2026-04-03T10:25:00Z"
}
```

### 💾 项目状态持久化

**解决会话断开后"从零开始"的问题：**

```
问题场景：
─────────────────────────────────────────────────────────
昨天: 用 Chaos Harness 做到 W08 开发阶段，版本 v0.1
关机
今天: 重新打开 Claude Code → 不知道之前做到哪了
─────────────────────────────────────────────────────────
```

**项目级状态存储：**

```
project-root/
├── .chaos-harness/              # 项目状态目录
│   ├── state.json               # 核心状态
│   ├── scan-result.json         # 扫描结果缓存
│   ├── decisions-log.json       # 关键决策记录
│   └── harness.yaml             # 当前 Harness 配置
└── output/v0.1/                 # 版本输出目录
```

**会话恢复流程：**

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 会话恢复                                                 │
├─────────────────────────────────────────────────────────────┤
│  项目: my-project                                            │
│  版本: v0.1                                                  │
│  阶段: W08 开发实现                                          │
│  上次: 2小时前                                               │
│                                                             │
│  上次进度：                                                  │
│  - 完成了 UserService 实现                                   │
│  - 正在处理 OrderService                                    │
│  - 3 个单元测试待编写                                        │
│                                                             │
│  继续上次工作？                                              │
└─────────────────────────────────────────────────────────────┘
```

**状态文件结构：**

```json
{
  "project_name": "my-project",
  "current_version": "v0.1",
  "workflow": {
    "scale": "medium",
    "current_stage": "W08_development",
    "stages_completed": ["W01", "W03"],
    "stages_pending": ["W09", "W10", "W12"]
  },
  "last_session": "2026-04-03T10:30:00Z",
  "statistics": {
    "total_sessions": 5,
    "iron_law_triggers": 3
  }
}
```

**状态隔离原则：**

| 存储位置 | 内容 | 共享范围 |
|---------|------|---------|
| `~/.claude/harness/` | 学习记录、自定义铁律 | 所有项目共享 |
| `project/.chaos-harness/` | 项目状态、进度、决策 | 仅当前项目 |

### 🎯 智能自适应

自动感知项目环境，动态调整约束强度：

**项目规模检测：**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        项目规模自适应                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Small (≤5文件, ≤100行)                                                 │
│  ├── 必经阶段: 5个 (W01需求, W03架构, W08开发, W09审查, W12发布)        │
│  ├── 可跳过: W02, W04, W05, W06, W07, W10, W11                          │
│  └── 约束强度: 标准                                                     │
│                                                                         │
│  Medium (5-20文件, 100-500行)                                           │
│  ├── 必经阶段: 8个 (+W02评审, +W05技术选型, +W10测试)                   │
│  ├── 可跳过: W04, W06, W07, W11                                         │
│  └── 约束强度: 增强                                                     │
│                                                                         │
│  Large (≥20文件, ≥500行)                                                │
│  ├── 必经阶段: 全部12个                                                 │
│  ├── 可跳过: 无 (铁律 IL001: 大型项目无例外)                            │
│  └── 约束强度: 严格                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**环境自动适配：**

| 检测项 | 自动适配动作 |
|--------|-------------|
| **JDK 版本** | JDK 8 → Legacy 模式，兼容性建议；JDK 17/21 → 标准 Spring Boot 3.x |
| **私服配置** | 检测 .m2/settings.xml → 自动注入私服规则到 Harness |
| **构建工具** | Maven → mvn test；Gradle → ./gradlew test；npm → npm test |
| **测试框架** | JUnit 4/5, Jest, PyTest → 自动选择对应测试命令 |
| **CI/CD** | GitHub Actions / GitLab CI / Jenkins → 生成对应配置建议 |

**技术栈模板自动匹配：**

```typescript
// 项目扫描 → 模板匹配 → Harness 生成
scan(projectRoot)
  ├── 检测 pom.xml + Spring 注解 → java-spring 模板
  ├── 检测 JDK 8 + Spring Boot 2.x → java-spring-legacy 模板
  ├── 检测 package.json + Express → node-express 模板
  ├── 检测 requirements.txt + Django → python-django 模板
  └── 无匹配 → generic 通用模板
```

### 🛡️ 绕过检测引擎

基于模式匹配的实时检测与反驳生成：

```
Agent 输入                          匹配规则              反驳策略
──────────────────────────────────────────────────────────────────────
"这是个简单修复，可以跳过测试吗？"  → simple-fix    →    "简单修改也可能引入回归。
                                                      所有变更都需要执行测试。"

"就这一次，下次不会了"             → just-once     →    "'就这一次'往往是问题的开始。
                                                      每次例外都会成为先例。"

"老项目没有测试，不用测了"          → legacy-project→    "历史项目缺乏测试覆盖更需要验证。
                                                      建议添加基本测试后再变更。"

"紧急需求，先上线再说"              → time-pressure →    "紧迫性增加风险而非降低标准。
                                                      越紧急越需要验证。"
```

**预置检测规则：**

| 规则 ID | 模式 | 说服策略 | 引用铁律 |
|---------|------|----------|---------|
| `simple-fix` | 简单、小事、容易 | 复杂度不降低验证要求 | IL003 |
| `skip-test` | 跳过测试、不需要测试 | 测试是基准验证 | IL003 |
| `just-once` | 就这一次、一次而已 | 每次例外都是先例 | IL001-IL005 |
| `legacy-project` | 老项目、历史代码 | 历史项目需更严格约束 | IL002 |
| `time-pressure` | 紧急、截止、快点 | 紧迫性增加风险 | IL003 |
| `temporary-fix` | 暂时、先这样 | 暂时方案变永久债务 | IL001 |

### 🕵️ 偷懒模式监控

实时行为模式检测，自动介入施压：

| 模式 ID | 检测条件 | 严重程度 | 介入动作 |
|---------|----------|----------|----------|
| **LP001** | 声称完成但无验证证据 | Critical | 阻断 + 要求验证 |
| **LP002** | 跳过根因分析直接修复 | Critical | 阻断 + 要求分析 |
| **LP003** | 长时间无产出 (超时) | Warning | 施压 + 进度检查 |
| **LP004** | 试图跳过测试 | Critical | 阻断 + 强制测试 |
| **LP005** | 擅自更改版本号 | Critical | 阻断 + 用户确认 |
| **LP006** | 自动处理高风险配置 | Critical | 阻断 + 审批流程 |

**施压消息示例：**

```
[LP001 检测] Agent-1 声称完成但无验证

Harness 施压消息：
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ 检测到可能的偷懒模式                                     │
│                                                             │
│  Agent: agent-1                                             │
│  模式: LP001 - 声称完成但无验证证据                          │
│  严重程度: Critical                                          │
│                                                             │
│  铁律 IL003 要求：所有完成声明必须提供验证证据。             │
│                                                             │
│  请执行以下操作之一：                                        │
│  1. 运行测试并提供输出                                       │
│  2. 提供构建验证结果                                         │
│  3. 提供代码审查确认                                         │
│                                                             │
│  在提供证据前，此任务不会标记为完成。                        │
└─────────────────────────────────────────────────────────────┘
```

### 🔌 插件生态系统

**约束注入机制** — 所有外部插件必须接受铁律约束：

```yaml
# 插件加载时的强制约束检查
constraints:
  enforce_iron_laws: true        # IL001-IL005 强制接受
  enforce_version_lock: true     # 输出必须在版本目录
  enforce_verification: true     # 完成需要验证证据
  enforce_supervisor: true       # 接受监工监控
  enforcement_mode: strict       # strict | warn | ignore
```

**拒绝约束 = 拒绝加载**

**多来源插件支持：**

| 来源 | 格式 | 示例 |
|------|------|------|
| GitHub | `github:owner/repo` | `github:obra/superpowers` |
| npm | `npm:package-name` | `npm:my-plugin` |
| 本地 | `local:/path` | `local:~/.claude/plugins/my-plugin` |
| URL | `url:https://...` | `url:https://example.com/plugin.tar.gz` |

---

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Chaos Harness                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Hooks Layer (自纠正层)                    │  │
│  │                                                       │  │
│  │   session-start  iron-law-check  laziness-detect     │  │
│  │   workflow-track  stop  pre-compact  learning-update │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Iron Law Enforcer (约束层)                  │  │
│  │                                                       │  │
│  │      铁律检查    绕过检测    偷懒监控    施压引擎     │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Workflow Supervisor (流程层)                 │  │
│  │                                                       │  │
│  │      规模检测    阶段管理    跳过审批    进度追踪     │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               Scanner (感知层)                         │  │
│  │                                                       │  │
│  │      项目类型    环境检测    配置解析    模板匹配     │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Plugin Manager (扩展层)                     │  │
│  │                                                       │  │
│  │    约束注入    来源管理    阶段映射    自定义铁律     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              MCP Server (集成层)                       │  │
│  │                                                       │  │
│  │           17 Tools  │  5 Templates  │  API            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 双层架构

Chaos Harness 提供两种使用方式：

| 层级 | 说明 | 适用场景 |
|------|------|----------|
| **Skill 指令层** | Claude Code 直接读取执行的 Markdown 指令 | Claude Code 用户 |
| **编程 API 层** | 可发布 npm 包，供程序调用 | 工具开发者、自动化集成 |

```typescript
// 编程 API 示例
import {
  scan,
  detectBypassAttempt,
  createWorkflowExecutor,
  quickDetectLaziness
} from 'chaos-harness';

// 扫描项目
const result = await scan({ projectRoot: './project' });

// 检测绕过尝试
const bypass = detectBypassAttempt('This is a simple fix');
if (bypass.detected) {
  console.log(bypass.rebuttal);
}

// 创建工作流
const workflow = createWorkflowExecutor({
  projectScale: 'medium',
  enableSupervisor: true
});

// 检测偷懒模式
const laziness = quickDetectLaziness('agent-1', {
  claimedCompletion: true,
  ranVerification: false
});
```

---

## 安装

```bash
# 克隆仓库
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness

# 安装
chmod +x install.sh && ./install.sh   # macOS/Linux
install.bat                            # Windows

# 重启 Claude Code
```

**零配置** — 安装后 Skills 和 Hooks 自动激活。

## 卸载

```bash
./uninstall.sh   # macOS/Linux
uninstall.bat    # Windows

# 重启 Claude Code
```

## 诊断

如果安装后命令无法使用，运行诊断脚本：

```bash
./diagnose.sh    # macOS/Linux
diagnose.bat     # Windows
```

诊断脚本会检查：
- 安装目录是否存在
- 关键文件是否完整
- 插件是否正确注册
- settings.json 是否启用

## 手动配置

如果安装脚本失败，可以手动配置：

### 1. 复制文件到缓存目录

```bash
# Windows
set CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0
xcopy /s /e /i /q /y .claude-plugin "%CACHE_DIR%\.claude-plugin\"
xcopy /s /e /i /q /y skills "%CACHE_DIR%\skills\"
xcopy /s /e /i /q /y commands "%CACHE_DIR%\commands\"
xcopy /s /e /i /q /y hooks "%CACHE_DIR%\hooks\"
xcopy /s /e /i /q /y templates "%CACHE_DIR%\templates\"

# macOS/Linux
CACHE_DIR="$HOME/.claude/plugins/cache/chaos-harness/chaos-harness/1.0.0"
mkdir -p "$CACHE_DIR"
cp -r .claude-plugin skills commands hooks templates "$CACHE_DIR/"
```

### 2. 注册插件

编辑 `%USERPROFILE%\.claude\plugins\installed_plugins.json`：

```json
{
  "version": 2,
  "plugins": {
    "chaos-harness@chaos-harness": [
      {
        "scope": "user",
        "installPath": "C:\\Users\\你的用户名\\.claude\\plugins\\cache\\chaos-harness\\chaos-harness\\1.0.0",
        "version": "1.0.0",
        "installedAt": "2026-04-03T00:00:00.000Z",
        "lastUpdated": "2026-04-03T00:00:00.000Z"
      }
    ]
  }
}
```

### 3. 启用插件

编辑 `%USERPROFILE%\.claude\settings.json`，添加：

```json
{
  "enabledPlugins": {
    "chaos-harness@chaos-harness": true
  },
  "extraKnownMarketplaces": {
    "chaos-harness": {
      "source": {
        "repo": "jeesoul/chaos-harness",
        "source": "github"
      }
    }
  }
}
```

**注意：** 如果已有其他插件配置，只需将 `chaos-harness@chaos-harness` 添加到 `enabledPlugins` 对象中。

### 4. 重启 Claude Code

配置完成后重启 Claude Code，即可使用 `/chaos-harness:overview` 命令。

---

## 使用

### 自然语言触发

```
你: 扫描当前项目
你: 创建版本 v0.1
你: 生成这个项目的 Harness
你: 列出所有铁律
你: 添加铁律：周五禁止部署
你: 查看钩子状态
你: 查看学习日志
你: 继续上次进度
你: 查看项目状态
```

### 斜杠命令

```
/chaos-harness:overview             # 主入口
/chaos-harness:project-scanner      # 扫描项目
/chaos-harness:version-locker       # 版本管理
/chaos-harness:harness-generator    # 生成约束
/chaos-harness:workflow-supervisor  # 工作流
/chaos-harness:iron-law-enforcer    # 铁律执行
/chaos-harness:plugin-manager       # 插件管理
/chaos-harness:hooks-manager        # 钩子管理
/chaos-harness:project-state        # 状态持久化
```

### 示例：完成验证

```
你: 任务完成了

Harness: [IL003 铁律检查]
         
         检测到完成声明，需要验证证据：
         - 测试执行输出
         - 验证命令结果
         - 代码审查确认

你: [粘贴测试输出]

Harness: ✓ 验证通过，任务完成
```

### 示例：绕过检测

```
你: 这是个简单修复，跳过测试？

Harness: [绕过检测触发]
         
         匹配规则: simple-fix
         铁律引用: IL003
         
         简单修改也可能引入回归。
         所有变更都需要执行测试。
```

### 示例：查看学习日志

```
你: 查看学习日志

Harness: ┌─────────────────────────────────────────────────────────────┐
         │  学习日志 (最近 5 条)                                       │
         ├─────────────────────────────────────────────────────────────┤
         │  L001 │ IL001  │ Version Directory Required    │ 22:30     │
         │  L002 │ IL003  │ Completion Without Verification│ 22:35    │
         │  L003 │ LP002  │ Fix Without Root Cause        │ 22:40     │
         └─────────────────────────────────────────────────────────────┘
```

---

## 模板系统

| 模板 | 技术栈 | 检测条件 | 特殊规则 |
|------|--------|----------|----------|
| `java-spring` | Java 17/21 + Spring Boot 3.x | pom.xml, Spring 注解 | 标准 Spring 规则 |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x | Legacy 兼容标记 | 兼容性建议、迁移提示 |
| `node-express` | Node.js Express | package.json, Express | npm/yarn 检测 |
| `python-django` | Python Django | requirements.txt, Django | pip/poetry 检测 |
| `generic` | 通用 | 默认 | 基础规则集 |

---

## 开发

```bash
npm install
npm run build
npm test              # 623 测试用例
npm run coverage      # 覆盖率报告
```

---

## 项目结构

```
chaos-harness/
├── hooks/                      # 钩子系统
│   ├── hooks.json              # 钩子配置
│   ├── run-hook.cmd            # 跨平台 wrapper
│   ├── session-start           # 会话开始注入 + 状态恢复
│   ├── iron-law-check          # 铁律检查
│   ├── laziness-detect         # 偷懒检测
│   ├── learning-update         # 学习记录
│   ├── workflow-track          # 工作流追踪
│   ├── stop                    # 完成声明分析 + 状态保存
│   └── pre-compact             # 压缩前保存
├── skills/                     # Skill 模块定义
│   ├── project-state/          # 状态持久化与恢复
│   ├── hooks-manager/          # 钩子管理
│   ├── iron-law-enforcer/      # 铁律执行
│   ├── project-scanner/        # 项目扫描
│   ├── version-locker/         # 版本锁定
│   ├── harness-generator/      # Harness 生成
│   ├── workflow-supervisor/    # 工作流监督
│   └── plugin-manager/         # 插件管理
├── commands/                   # 命令入口
├── src/core/                   # 核心 API 实现
├── templates/                  # 配置模板
├── tests/                      # 测试套件
└── docs/                       # 文档
```

**项目使用后生成的文件：**

```
your-project/
├── .chaos-harness/             # 项目状态（git 可选忽略）
│   ├── state.json              # 核心状态
│   ├── scan-result.json        # 扫描缓存
│   ├── decisions-log.json      # 决策记录
│   └── harness.yaml            # Harness 配置
└── output/                     # 版本输出
    └── v0.1/
```

---

## 许可证

[MIT](LICENSE)

---

<p align="center">
  <strong>Chaos demands order. Harness provides it.</strong>
</p>