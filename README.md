# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-blue.svg">
  <img src="https://img.shields.io/badge/tests-623-brightgreen.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>确定性 AI Agent 约束框架</strong></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

---

## 一句话定位

> **用代码给 AI 立规矩，让 AI 从"不可控的天才"变成"严谨的工程师"。**

如果你已经解决了网络层问题（代理、API 访问），下一步就是解决**应用层问题**——让 AI 在你的环境下老老实实干活，不偷懒、不越界、不绕过规则。Chaos Harness 就是这个应用层的"行为治理系统"。

---

## 核心定位

**首个具备自学习、自适应能力的 Claude Code Agent 治理框架。**

### 为什么需要 Chaos Harness？

**AI Agent 的核心困境：非确定性与语义博弈**

在 AI Agent 辅助开发的范式中，**非确定性**既是创造力的源泉，也是工程稳定性的最大威胁。Agent 往往表现出一种**"投机性优化"倾向**——为了达成目标，它可能通过**语义博弈**"合理化"地绕过约束，或产生无验证的**幻觉式交付**。

传统的基于自然语言的提示词约束，本质上是一种**软性建议**。随着规则复杂度的增加，其**解释性冗余**反而被放大，导致 Agent 更容易找到逻辑漏洞。

```
你让 Agent 修一个 bug，它说"已完成" → 这是幻觉式交付
你加了一条规则，Agent 找到了"特殊情况" → 这是语义博弈
规则越多，漏洞越多 → 这是解释性冗余的必然结果
```

**这不是 AI 的错，这是软性约束的系统性缺陷。**

### Chaos Harness 的解决方案：强制对齐

我们采用了**"强制对齐"的逆向工程思路**：

| 传统方式 | Chaos Harness 方式 |
|----------|-------------------|
| 用**建议**约束 Agent → 可解释、可绕过 | 用**铁律**约束 Agent → 原子级执行原语 |
| 规则是文本 → 存在语义灰色空间 | 规则是代码 → 零解释空间 |
| 依赖 Agent "自觉遵守" → 博弈论上脆弱 | 物理阻断规避路径 → 架构层面强制 |
| 口头确认完成 → 无验证证据 | 铁律 IL003 → 强制产出验证证据 |

**铁律不是一种可供解释的文本，而是一套原子级的执行原语。**

通过消除所有语义上的灰色空间，我们在架构层面**物理阻断了 Agent 的规避路径**，确保在释放其无限创造力的同时，将其行为严格锁定在质量与安全的边界之内。

> **创造力需要边界，而 Chaos Harness 就是那条不可逾越的物理边界。**

### 三大核心价值

| 价值维度 | 传统方式 | Chaos Harness 方式 |
|----------|----------|-------------------|
| **确定性** | Agent 行为不可预测，每次输出位置、验证方式不同 | 铁律强制执行，行为路径可追溯、可审计 |
| **可进化** | 规则静态配置，无法适应项目变化 | 自学习闭环：行为记录 → 规则优化 → 能力沉淀 |
| **可扩展** | 约束系统封闭，第三方无法接入 | 开放插件生态：任意插件继承铁律约束 |

### 适用场景全景

**个人开发者：从"被动纠错"到"主动预防"**

```
场景：你让 Agent 修复一个 bug
传统结果：Agent 说"修好了"，你手动验证发现还有问题，来回折腾
Harness 结果：Agent 被铁律要求提供验证证据，自动跑测试、贴输出，问题一次性解决

额外收获：你的项目专属 Harness 记录了这个 bug 模式，下次类似问题自动预防
```

**团队协作：从"口头规范"到"自动执行"**

```
场景：新人提交代码跳过了测试
传统结果：Leader 在 PR Review 发现，口头提醒，下次可能又忘
Harness 结果：铁律 LP004 自动阻断，新人被迫执行测试，习惯养成

额外收获：团队行为数据库累积，规范从"挂在墙上"变成"融入流程"
```

**开源项目：从"贡献者混乱"到"有序治理"**

```
场景：贡献者提交 PR，文档放在错误位置，版本号随意修改
传统结果：Maintainer 手动清理，重复劳动消耗精力
Harness 结果：铁律 IL001/IL004 自动拦截，贡献者按规范输出，Maintainer 只需审核内容

额外收获：项目专属约束成为贡献者指南的一部分，降低项目维护成本
```

**插件开发者：从"孤岛运行"到"约束继承"**

```
场景：你开发了一个代码分析插件，希望它也遵循 Harness 的铁律
传统结果：插件独立运行，行为不受约束，可能产生违规操作
Harness 结果：插件接入后自动继承铁律，操作受监督，日志自动记录

额外收获：你的插件获得了 Harness 的全部治理能力，无需重复实现
```

---

## 解决什么问题？

### AI Agent 常见行为问题

| 问题 | 表现 | Chaos Harness 解决方案 |
|------|------|----------------------|
| 虚假完成声明 | "已修复" 但无实际验证 | IL003 铁律：强制要求验证证据 |
| 跳过关键步骤 | "简单修复，跳过测试" | LP004 检测：自动阻断并强制执行 |
| 绕过约束规则 | "就这一次，特殊情况" | 10+ 绕过话术识别 + 驳回机制 |
| 版本混乱 | 文档散落各目录 | IL001 铁律：强制版本目录生成 |
| 敏感配置误操作 | 直接修改数据库/密钥配置 | IL005 铁律：审批机制拦截 |
| 缺乏根因分析 | 直接修复表面症状 | LP002 检测：强制根因分析流程 |

---

## 差异化特性

### 🧠 自学习生态闭环

```
项目行为 → learning-log.json → learning-analyzer 分析 → 铁律优化建议
    ↑                                                        ↓
    └────────────────── 用户确认后自动应用 ←─────────────────────┘
```

**行为学习机制：**
- Hook 自动记录 Agent 每次决策路径与结果
- `learning-analyzer` 分析失败模式，发现重复违规
- 失败模式聚类分析，识别系统性问题

**规则进化过程：**
- 根据历史违规模式自动生成针对性规则
- 用户确认后自动应用到项目 Harness
- 项目规模变化触发工作流自适应调整

**能力沉淀结果：**
- 项目专属 Harness 持续增强
- 团队行为数据库累积
- 跨项目经验迁移支持

### 🔄 自适应 Harness 构建

**智能分析维度：**

| 输入维度 | 分析方法 | 输出结果 |
|----------|----------|----------|
| 项目类型 | 文件结构 + 配置文件特征识别 | Java/Node/Python/Go 等专属模板 |
| 代码规模 | 文件数 × 代码行数加权计算 | Small/Medium/Large 分级工作流 |
| 技术栈版本 | 实际执行版本命令验证 | JDK 8 Legacy 兼容 / 最新特性 |
| 团队行为历史 | 偷懒模式 + 绕过尝试统计 | 针对性铁律强化 |
| 历史缺陷模式 | 根因聚类 + 模式匹配 | 预防性约束自动注入 |
| 私服/镜像配置 | 配置文件扫描 + 连通性检测 | 部署约束动态添加 |

**自适应工作流示例：**

```
Small 项目 (≤100行) → 5阶段精简流程
Medium 项目 (100-500行) → 8阶段标准流程
Large 项目 (≥500行) → 12阶段完整流程 + 多Agent协作
```

### 🔌 开放插件生态

**第三方插件无缝接入 Harness 约束体系：**

```yaml
# ~/.claude/harness/plugins.yaml
plugins:
  - name: superpowers
    enabled: true
    stages: [W01, W03, W08]  # 指定参与的工作流阶段
    iron_laws: inherit       # 继承 Harness 全部铁律约束

  - name: custom-analysis-tool
    enabled: true
    stages: [W02, W04]
    iron_laws:
      - IL-C001  # 使用自定义铁律
      - IL-C002

  - name: deployment-agent
    enabled: true
    iron_laws:
      - IL-AUTO-001  # Harness 动态生成的部署约束
```

**插件接入后自动获得的能力：**

| 能力 | 说明 |
|------|------|
| 铁律约束 | 插件行为受 Harness 监督，违规自动阻断 |
| 行为审计 | 所有操作日志自动记录，支持事后复盘 |
| 工作流集成 | 按配置的阶段协调执行，避免冲突 |
| 学习反馈 | 插件执行结果纳入自学习闭环 |

### ⚡ 动态约束注入

**根据项目上下文实时生成规则，无需静态配置：**

```yaml
# 场景1: 检测到 Nexus/Maven 私服配置
iron_laws:
  - id: IL-AUTO-001
    rule: "NO DEPLOY WITHOUT PRIVATE REPO CONNECTIVITY CHECK"
    auto_generated: true
    triggers:
      - pattern: "nexus.*url|maven.*repository"

# 场景2: 检测到 JDK 8 环境
workflow:
  compatibility_mode: "jdk8-legacy"
  suggestions:
    - "使用 javax.annotation 替代 jakarta.annotation"
    - "Spring Boot 2.x 配置格式"

# 场景3: 检测到测试覆盖率低于阈值
iron_laws:
  - id: IL-AUTO-002
    rule: "NO MERGE WITHOUT TEST COVERAGE ≥ 80%"
    auto_generated: true
```

---

## 核心能力详解

### 铁律引擎 (Iron Law Engine)

**声明式规则 + 自动执行 + 不可绕过：**

| 铁律ID | 规则内容 | 触发场景 |
|--------|----------|----------|
| IL001 | 文档必须在版本目录生成 | 任何文档输出操作 |
| IL002 | Harness 生成依赖扫描数据 | 约束生成请求 |
| IL003 | 完成声明必须附带验证证据 | Stop Hook / 任务汇报 |
| IL004 | 版本变更需要用户确认 | 版本号修改操作 |
| IL005 | 敏感配置修改需要审批 | 数据库/密钥/认证配置 |

**扩展机制：**

```yaml
# ~/.claude/harness/iron-laws.yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    severity: critical  # critical/warning/info/require
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE|DELETE FROM"
        action: block  # block/warn/log
    rebuttal: "数据库变更必须先创建备份，请执行备份脚本后再操作"

  - id: IL-C002
    rule: "NO DIRECT PRODUCTION ACCESS"
    severity: critical
    triggers:
      - pattern: "prod|production|主库"
        action: block
```

### 行为检测系统 (Laziness Pattern Detection)

**6 种偷懒模式自动识别 + 分级处置：**

| 模式ID | 检测条件 | 严重程度 | 自动处置 |
|--------|----------|----------|----------|
| LP001 | 声称完成但无验证证据 | critical | 阻断 + 要求举证 |
| LP002 | 跳过根因分析直接修复 | critical | 阻断 + 强制分析流程 |
| LP003 | 长时间无产出 (timeout) | warning | 施压消息 + 进度同步要求 |
| LP004 | 尝试跳过测试 | critical | 阻断 + 强制测试执行 |
| LP005 | 擅自更改版本号 | critical | 阻断 + 恢复原版本 |
| LP006 | 自动处理高风险配置 | critical | 阻断 + 用户审批流程 |

**绕过话术识别：**

| 话术类型 | 示例 | 驳回策略 |
|----------|------|----------|
| 简化论 | "简单修复"、"小改动" | "简化≠简化验证，请完整测试" |
| 例外论 | "就这一次"、"特殊情况" | "铁律无例外，按流程执行" |
| 效率论 | "这样更快"、"节省时间" | "跳过步骤的时间会花在回滚上" |
| 权威论 | "用户要求的"、"紧急" | "紧急也需要审批，请先走流程" |
| 推卸论 | "建议用户手动"、"超出范围" | "这是你的职责范围，请继续" |

### 钩子生态 (Hook System)

**全生命周期行为监控与干预：**

| Hook | 触发时机 | 核心功能 |
|------|----------|----------|
| SessionStart | 会话开始/恢复 | 注入铁律上下文 + 恢复项目状态 + 智能推荐 |
| PreToolUse | 工具调用前 | IL001/IL005 铁律预检 |
| PostToolUse | 工具调用后 | 偷懒模式检测 + 学习记录 + **智能场景感知** |
| Stop | 回合结束 | IL003 完成声明分析 + 偷懒检测 |
| PreCompact | 对话压缩前 | 保存关键上下文到存档 |

### 智能场景感知 (Auto Context)

**自动检测当前操作并推荐相关 Skills/铁律：**

| 操作场景 | 自动推荐 | 关联铁律 |
|---------|---------|---------|
| 写 Vue/React 组件 | vue2/vue3/react 模板 | IL-VUE001, IL-REACT001 |
| 写 PRD/需求文档 | product-lifecycle + prd-validator | IL-PRD001 |
| 写 API 文档 | api-design | IL-TECH002 |
| 写数据库脚本 | database-design | IL-TECH003, IL-BE002 |
| 写测试文件 | test-assistant | IL-TEST001 |
| 写敏感配置 | 安全提醒 | IL005 |
| PRD 编辑中 | prd-validator（实时检查） | IL-PRD001, IL-PRD002 |
| 需求/竞品讨论 | product-manager | - |
| 截图/视觉检查 | visual-regression + web-access | IL-TEST001 |
| 文档输出无版本 | version-locker | IL001 |
| P03 设计完成 | agent-team-orchestrator 设计评审 | IL-TEAM001 |
| P04 技术完成 | agent-team-orchestrator 技术评审 | IL-TEAM001 |

**后台自动运行（无需命令）：**

`auto-context` skill 始终在后台运行，监测用户操作并自动响应：

- 检测文件类型 → 加载对应模板铁律
- 检测项目状态 → 推荐恢复或初始化
- 检测技术栈 → 自动适配 Harness 模板
- 检测设计/技术完成 → 推荐 Multi-Agent 评审

**自动触发示例：**

```
用户操作: 创建 src/components/Button.vue
系统响应:
<HARNESS_RECOMMEND>
📌 检测到 Vue 3 项目，已加载 Vue3 模板铁律
</HARNESS_RECOMMEND>

<HARNESS_IRON_LAW>
⚡ IL-VUE001: Ref 需要 .value 赋值
</HARNESS_IRON_LAW>
```

**钩子配置自定义：**

```yaml
# ~/.claude/harness/hooks.yaml
hooks:
  session-start:
    enabled: true
    inject_iron_laws: true
    restore_state: true

  iron-law-check:
    enabled: true
    check_laws: [IL001, IL005]
    block_on_violation: true

  laziness-detect:
    enabled: true
    patterns: [LP001, LP002, LP004]
    auto_intervene: true
```

### 自适应工作流 (Adaptive Workflow)

**12 阶段完整流程，按项目规模自动裁剪：**

| 阶段 | 名称 | 核心活动 | Small | Medium | Large |
|------|------|----------|-------|--------|-------|
| W01 | 需求理解 | 扫描、分析、澄清 | ✅ | ✅ | ✅ |
| W02 | 技术调研 | 方案对比、选型 | ❌ | ✅ | ✅ |
| W03 | 架构设计 | 模块划分、接口定义 | ✅ | ✅ | ✅ |
| W04 | 详细设计 | 数据结构、算法 | ❌ | ✅ | ✅ |
| W05 | 编码实现 | 开发、调试 | ✅ | ✅ | ✅ |
| W06 | 代码审查 | Review、Refactor | ❌ | ❌ | ✅ |
| W07 | 集成测试 | 端到端验证 | ❌ | ✅ | ✅ |
| W08 | 文档生成 | 版本目录输出 | ✅ | ✅ | ✅ |
| W09 | 发布准备 | 打包、部署检查 | ✅ | ✅ | ✅ |
| W10 | 上线部署 | 执行、监控 | ✅ | ✅ | ✅ |
| W11 | 回归验证 | 线上测试 | ✅ | ✅ | ✅ |
| W12 | 复盘总结 | 经验沉淀 | ✅ | ✅ | ✅ |

---

## 安装指南

### 快速安装

```bash
# 1. 克隆项目
git clone https://github.com/jeesoul/chaos-harness.git

# 2. 注册本地 marketplace
claude plugins marketplace add "D:\path\to\chaos-harness"    # Windows
claude plugins marketplace add ~/path/to/chaos-harness      # macOS/Linux

# 3. 安装插件
claude plugins install chaos-harness@chaos-harness

# 4. 重启 Claude Code
# 验证安装成功
/chaos-harness:overview
```

### 卸载

```bash
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness
```

### 升级指南

**从源码升级（推荐）：**

```bash
# 1. 拉取最新代码
cd /path/to/chaos-harness
git pull origin main

# 2. 重新注册 marketplace
claude plugins marketplace remove chaos-harness
claude plugins marketplace add "/path/to/chaos-harness"    # 使用你的实际路径

# 3. 卸载旧版本并安装新版本
claude plugins uninstall chaos-harness@chaos-harness
claude plugins install chaos-harness@chaos-harness

# 4. 验证版本
# 重启 Claude Code 后执行
/chaos-harness:overview
```

**版本升级说明：**

| 版本 | 主要更新 | 升级注意 |
|------|---------|---------|
| 1.3.0 | P03/P04 强制 Multi-Agent 评审、产品经理增强（prd-validator/product-manager）、测试增强（test-assistant/visual-regression）、P08 混合测试模式 | 建议清理旧日志 |
| 1.2.0 | 自学习闭环系统、自适应 Harness、Agent Team 铁律、CDP 浏览器自动化 | 首次稳定版本 |
| 1.1.0 | Java SpringBoot 铁律、角色支持、跨平台修复 | 初始稳定版本 |
| 1.0.0 | 核心框架：Skills + Hooks + Templates | 初始版本 |

---

## 命令速查

| 命令 | 功能描述 |
|------|----------|
| `/chaos-harness:overview` | 系统概览：铁律状态、学习进度、项目统计 |
| `/chaos-harness:project-scanner` | 项目扫描：类型检测、技术栈分析、自适应建议 |
| `/chaos-harness:version-locker` | 版本管理：锁定、创建、变更追踪 |
| `/chaos-harness:harness-generator` | 约束生成：基于扫描数据生成专属 Harness |
| `/chaos-harness:workflow-supervisor` | 工作流编排：阶段控制、进度监控、Agent协调 |
| `/chaos-harness:agent-team-orchestrator` | **Agent Team 编排：自动并行、监督鞭策、防单线程** |
| `/chaos-harness:iron-law-enforcer` | 铁律执行：自定义规则、绕过检测、驳回生成 |
| `/chaos-harness:collaboration-reviewer` | 多Agent评审：自动启动、多视角、结果汇总 |
| `/chaos-harness:hooks-manager` | 钩子配置：启用/禁用、日志查看、行为审计 |
| `/chaos-harness:plugin-manager` | 插件管理：第三方接入、约束配置、阶段映射 |
| `/chaos-harness:project-state` | 状态持久化：进度保存、会话恢复、断点续传 |
| `/chaos-harness:auto-toolkit-installer` | 工具链检测：自动安装依赖工具、镜像加速 |
| `/chaos-harness:learning-analyzer` | 自学习分析：失败模式识别、铁律优化建议、闭环迭代 |
| `/chaos-harness:product-lifecycle` | 产品全生命周期：需求→原型→开发→测试→发布→迭代 |
| `/chaos-harness:product-manager` | **产品经理助手：需求池/Kano/竞品分析/用户故事拆解** |
| `/chaos-harness:prd-validator` | **PRD 质量检查：验收标准/可追溯性/结构完整性** |
| `/chaos-harness:test-assistant` | **测试助手：测试用例/E2E脚本/覆盖率/回归对比** |
| `/chaos-harness:visual-regression` | **可视化回归：CDP 截图对比/视觉差异检测** |
| `/chaos-harness:ui-generator` | **UI 生成：从 PRD 生成可运行的前端界面** |
| `/chaos-harness:adaptive-harness` | **自适应优化：从学习数据自动强化铁律** |
| `/chaos-harness:web-access` | **联网操作：搜索/抓取/CDP 浏览器自动化** |

### Agent Team 自动编排

**评审/开发阶段自动启动多 Agent 并行工作：**

```
P03 设计评审阶段
├── 自动 spawn 3 个评审 Agent (product_manager, user_advocate, designer)
├── 独立评审 → 讨论争议点
└── 汇总结果给用户确认

P04 技术评审阶段
├── 自动 spawn 3 个评审 Agent (architect, security_expert, senior_dev)
├── 独立评审 → 讨论争议点
└── 汇总结果给用户确认

W02/W04/W09 评审阶段
├── 自动 spawn 3 个评审 Agent
├── 并行评审 → 讨论争议点
└── 汇总结果给用户确认

W07/W08 开发阶段
├── 自动拆分任务
├── 分配给多个开发 Agent 并行
├── Supervisor 监控（30s/次）
├── 2 分钟无产出 → 提醒
├── 5 分钟无产出 → 鞭策
└── 10 分钟无产出 → 任务重分配
```

**核心铁律 IL-TEAM005**：禁止单线程退化，主 Agent 不得自己干活！

### 产品全生命周期 (Product Lifecycle)

**10 阶段研发流程，从需求到发布的完整闭环：**

```
P01 需求收集 → P02 需求分析 → P03 原型设计 → P04 技术方案 → P05 开发规划
     ↓
P10 迭代优化 ← P09 验收交付 ← P08 集成测试 ← P07 后端开发 ← P06 前端开发
```

| 阶段 | 核心活动 | 输出产物 |
|------|---------|---------|
| P01 | 需求收集、干系人识别 | 需求池 |
| P02 | PRD 编写、MVP 定义 | PRD 文档 |
| P03 | 原型设计、交互流程、**UI 生成（CDP 预览验证）** | 设计稿 + 可运行组件 |
| P04 | 架构设计、API 设计 | 技术方案 |
| P05 | 任务分解、里程碑规划 | 开发计划 |
| P06 | 前端组件开发 | 前端代码 |
| P07 | 后端 API 开发 | 后端代码 |
| P08 | **混合测试：Playwright + CDP + 视觉回归** | 测试报告 + 视觉对比报告 |
| P09 | UAT 验收、上线部署 | 发布包 |
| P10 | 数据分析、复盘优化 | 迭代规划 |

**产品专属铁律：** IL-PRD001-003, IL-TECH001-003, IL-PLAN001-003, IL-FE001-003, IL-BE001-004, IL-TEST001-003, IL-RELEASE001-003

---

## 智能触发（无需记住命令）

**Chaos Harness 会根据你的操作自动识别意图并推荐对应功能：**

### 触发词自动识别

| 你说... | 系统自动推荐 |
|--------|------------|
| "需求"、"PRD"、"原型"、"迭代" | `product-lifecycle` |
| "PRD检查"、"检查PRD"、"PRD质量" | `prd-validator` |
| "需求分析"、"竞品分析"、"Kano"、"用户故事" | `product-manager` |
| "测试用例"、"E2E"、"覆盖率"、"回归测试" | `test-assistant` |
| "视觉回归"、"截图对比"、"UI测试" | `visual-regression` |
| "生成界面"、"UI生成" | `ui-generator` |
| "自适应优化"、"强化铁律" | `adaptive-harness` |
| "搜索"、"CDP"、"浏览器" | `web-access` |
| "扫描项目"、"分析项目结构" | `project-scanner` |
| "版本"、"v0.1"、"创建版本" | `version-locker` |
| "工作流"、"流程"、"阶段" | `workflow-supervisor` |
| "铁律"、"约束"、"违规" | `iron-law-enforcer` |
| "学习记录"、"自学习"、"优化" | `learning-analyzer` |
| "评审"、"审查" | `collaboration-reviewer` |
| "继续"、"恢复"、"上次进度" | `project-state` |

### 文件操作自动感知

| 你操作... | 系统自动响应 |
|----------|------------|
| 创建 `*.vue` 文件 | 检测 Vue 版本 → 加载对应模板铁律 |
| 创建 `*.jsx/*.tsx` 文件 | 加载 React 铁律 (IL-REACT001-004) |
| 写 `*PRD*.md` 文档 | 推荐 `product-lifecycle` + `prd-validator` |
| 写 `*.test.*` / `*.spec.*` 文件 | 推荐 `test-assistant` 检查覆盖率 |
| 写 `*.sql` 文件 | 激活 IL-TECH003, IL-BE002 |
| 写 `.env` 配置 | IL005 安全警告 |
| 写 E2E/Playwright 文件 | 推荐 `webapp-testing` + `web-access` |
| 提到"竞品"/"对手" | 推荐 `product-manager` 竞品分析 |
| 提到"优先级"/"MVP" | 推荐 `product-manager` Kano 分析 |

### 项目状态自动检测

```
启动会话时自动检测：
├── 检测到项目状态文件 → 提示恢复进度
├── 检测到新项目 → 提示初始化步骤
├── 检测到 Vue/React → 自动加载模板铁律
├── 检测到 Spring Boot → 自动加载 Java 模板
├── P03 阶段 + PRD 就绪 → 推荐生成界面
├── P03 设计完成 → 推荐启动 Multi-Agent 设计评审
├── P04 技术完成 → 推荐启动 Multi-Agent 技术评审
└── P08 阶段开始 → 推荐 test-assistant + web-access
```

---

## 用户自定义配置

### 自定义铁律

```yaml
# ~/.claude/harness/iron-laws.yaml

custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库变更前必须创建备份"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE"
        action: block
    rebuttal: |
      数据库变更存在风险，请先创建备份
```

### 自定义模板

```bash
# 创建自定义模板
mkdir -p ~/.claude/harness/templates/my-template

# Harness 生成时自动发现
/chaos-harness:harness-generator
# 会列出: java-spring, vue3, react, my-template, ...
```

### 自定义触发规则

```yaml
# ~/.claude/harness/triggers.yaml

custom_triggers:
  file_patterns:
    - pattern: "*.graphql"
      recommend: "api-design"
      message: "检测到 GraphQL，建议遵循 API 规范"

  keywords:
    - words: ["性能优化", "慢查询"]
      recommend: "performance-analysis"
```

### 命令别名

```yaml
# ~/.claude/harness/custom-commands.yaml

aliases:
  "scan": "project-scanner"
  "init":
    steps:
      - "project-scanner"
      - "version-locker"
      - "harness-generator"
    message: "项目初始化完成"
```

### 铁律优先级

```
用户自定义铁律 (IL-C001-IL-C099)
        ↓
模板铁律 (IL-VUE001, IL-REACT001, ...)
        ↓
系统核心铁律 (IL001-IL005) ← 最高优先级，不可覆盖
```

详细配置参考：[用户自定义配置指南](templates/user-custom-config.md)

---

## 自动化工具链

Chaos Harness 支持完整的自动化测试工具链，通过 `/chaos-harness:auto-toolkit-installer` 自动检测并安装。

### 工具链清单

| 工具 | 用途 | 插件ID |
|------|------|--------|
| **skill-creator** | 自动创建业务场景专属 skill | `skill-creator@claude-plugins-official` |
| **superpowers-chrome** | Chrome DevTools MCP - 浏览器自动化、DOM操作、网络监控 | `superpowers-chrome@superpowers-marketplace` |
| **ui-ux-pro-max** | UI/UX 设计评审 + Playwright 测试脚本生成 | `ui-ux-pro-max@ui-ux-pro-max-skill` |
| **webapp-testing** | Playwright 自动化测试 - 自己写脚本、启动浏览器、跑测试、截屏、自动调试 | `webapp-testing@anthropics/skills` |
| **web-access** | CDP 浏览器自动化 - 搜索/抓取/登录态/截图 | `web-access@chaos-harness` |

### 快速安装

```bash
# 检测当前环境
/chaos-harness:auto-toolkit-installer check

# 安装所有缺失工具
/chaos-harness:auto-toolkit-installer install

# 使用镜像安装 (国内推荐)
/chaos-harness:auto-toolkit-installer install --mirror
```

### 镜像加速 (国内用户)

针对国内网络环境，自动使用以下镜像源：

| 类型 | 官方源 | 镜像源 |
|------|--------|--------|
| GitHub | `github.com` | `kgithub.com` / `ghproxy.com` / `gitclone.com` |
| npm | `registry.npmjs.org` | `registry.npmmirror.com` (淘宝镜像) |
| Playwright | `playwright.azureedge.net` | `npmmirror.com/mirrors/playwright` |

### 工具链与工作流集成

| 工作流阶段 | 可用工具 | 集成能力 |
|------------|----------|----------|
| W01 需求理解 | skill-creator | 自动生成需求分析 skill |
| W03 架构设计 | ui-ux-pro-max | UI/UX 原型评审 |
| W06 代码审查 | superpowers-chrome | DevTools 性能分析 |
| W07 集成测试 | webapp-testing + superpowers-chrome | Playwright 自动化 + DevTools 监控 |
| P03 原型设计 | ui-generator + web-access | UI 生成 + CDP 预览验证 |
| P08 集成测试 | webapp-testing + web-access + visual-regression | **混合模式：结构化测试 + 灵活验证 + 视觉回归** |

---

## 用户角色指南

Chaos Harness 支持**多角色协作**，每个角色可选择性使用相关阶段和功能。

### 角色与阶段映射

**Chaos Harness 支持软件行业全角色覆盖：**

| 角色 | 主导阶段 | 核心关注点 | 推荐命令 |
|------|---------|-----------|---------|
| **产品经理** | P01, P02, P03, P10 | 需求、PRD、原型、迭代 | `product-lifecycle`, `product-manager`, `prd-validator` |
| **售前工程师** | P01, P02, P03 | 售前方案、技术白皮书、POC | `product-lifecycle` |
| **解决方案架构师** | P04, P05 | 技术方案、方案设计 | `harness-generator` |
| **UI/UX 设计师** | P03 | 原型设计、交互流程 | `product-lifecycle P03`, `ui-generator` |
| **系统架构师** | P04, P05 | 架构设计、技术选型 | `harness-generator` |
| **前端开发** | P06 | 组件开发、页面实现 | `vue3/react` 模板 |
| **后端开发** | P07 | API 开发、业务逻辑 | `java-spring/node` 模板 |
| **全栈开发** | P06, P07 | 前后端开发 | 多模板 |
| **测试工程师** | P08 | E2E 测试、性能测试、安全测试、视觉回归 | `test-assistant`, `visual-regression`, `web-access` |
| **运维工程师** | P09 | 发布部署、监控告警 | `workflow-supervisor` |
| **项目经理** | P05, P08, P09 | 进度管理、风险控制 | `workflow-supervisor` |
| **技术文档工程师** | P11 | 技术文档、API 文档、用户手册 | `product-lifecycle` |

### 售前工程师使用指南

```
场景：售前方案准备
────────────────────────────────────────
P01 需求收集
├── 输入：客户需求、行业标准、竞品分析
├── 输出：需求清单、痛点分析
└── 支持：需求池模板

P02 方案设计
├── 输出：技术白皮书、解决方案
├── 模板：解决方案模板
└── 自动生成：技术优势对比表

P03 原型演示
├── 输出：POC 原型、演示流程
├── 工具：ui-ux-pro-max
└── 支持：演示脚本生成

售前文档铁律
├── IL-PRESALE001: 方案必须有竞品对比
├── IL-PRESALE002: 技术白皮书必须包含案例
└── IL-PRESALE003: 报价单需要审批
```

### 技术文档工程师使用指南

```
场景：技术文档编写
────────────────────────────────────────
文档类型支持
├── API 文档：OpenAPI/Swagger 自动生成
├── 用户手册：功能说明 + 操作指南
├── 运维手册：部署 + 配置 + 故障排查
├── 架构文档：系统架构 + 设计决策
└── 变更日志：版本历史 + 升级指南

铁律保护
├── IL-DOC001: API 文档必须同步代码
├── IL-DOC002: 用户手册必须有截图
└── IL-DOC003: 变更日志必须记录 Breaking Changes

自动化工具
└── /chaos-harness:auto-toolkit-installer
```

### 产品经理使用指南

```
场景：新功能规划
────────────────────────────────────────
P01 需求收集
├── 输入：用户访谈、竞品分析、业务目标
├── 输出：需求池
└── 命令：/chaos-harness:product-lifecycle, product-manager

P02 需求分析
├── 输入：需求池
├── 输出：PRD 文档、MVP 范围
├── 模板：templates/product-lifecycle/prd-template.md
└── 质量检查：/chaos-harness:prd-validator

P03 原型设计
├── 输入：PRD
├── 输出：原型、交互流程、可运行 UI 组件
├── 工具：ui-generator（自动推荐，CDP 预览验证）
└── 设计评审：自动触发 Multi-Agent 评审

P10 迭代优化
├── 输入：发布数据、用户反馈
├── 输出：迭代规划
└── 命令：/chaos-harness:learning-analyzer
```

### 测试工程师使用指南

```
场景：质量保障
────────────────────────────────────────
P08 集成测试（混合模式）
├── 结构化测试：webapp-testing (Playwright) - 持久化自动化用例
├── 灵活验证：web-access (CDP) - 登录态操作、截图、临时检查
├── 视觉回归：visual-regression - CDP 截图对比
├── API 测试：接口验证、边界测试
├── 性能测试：负载测试、压力测试
└── 安全测试：漏洞扫描、渗透测试

测试助手
├── 测试用例生成：从 PRD 用户故事推导 Given-When-Then
├── E2E 脚本生成：Playwright 或 CDP 格式
├── 覆盖率检查：运行并分析覆盖率报告
├── 回归对比：对比历史测试报告
└── API 验证：从 API 文档推导验证用例

铁律保护
├── IL-TEST001: E2E 必须覆盖核心流程
├── IL-TEST002: 性能测试必须有基准
└── IL-TEST003: 安全漏洞必须修复

自动化工具
└── /chaos-harness:auto-toolkit-installer
```

### 开发者使用指南

```
场景：功能开发
────────────────────────────────────────
自动检测技术栈
├── Vue 2/3 项目 → 自动加载 vue 模板铁律
├── React 项目 → 自动加载 react 模板铁律
├── Spring Boot → 自动加载 java-springboot 模板
└── Django/Flask → 自动加载 python 模板

铁律自动激活
├── IL-VUE001: Props 只读
├── IL-REACT001: 禁止直接修改 state
├── IL-JAVA001: 代码风格规范 (checkstyle)
├── IL-JAVA002: Controller 返回固定 VO
├── IL-JAVA003: SQL 必须在 mapper.xml
├── IL-JAVA004: 禁止 bad practices
└── IL-BE001: API 必须有版本控制

自学习闭环
└── 每次修复 → 自动记录 → learning-analyzer 分析
```

### Java 后端开发规范（强制）

**SpringBoot 项目默认规范：**

| 场景 | 默认值 | 说明 |
|------|--------|------|
| 全新项目用户未指定 | **MyBatis-Plus** | 自动使用，无例外 |
| SQL 实现 | **mapper.xml** | 禁止 @Select/@Update 注解 |
| 分页查询 | **mapper.xml** | 必须在 XML 中实现 |

**Java 代码铁律 (IL-JAVA001-004)：**

```yaml
# 强制执行
IL-JAVA001: NO CODE WITHOUT CHECKSTYLE
  ├── UTF-8 字符集，每行 ≤ 125 字符
  ├── 4 空格缩进，禁止 Tab
  ├── 所有 public 方法必须有完整 Javadoc（包括 main！）
  ├── 禁止 import xxx.*
  └── 日志占位符方式：log.info("userId: {}", userId)

IL-JAVA002: NO CONTROLLER WITHOUT VO
  ├── 返回必须 R<固定VO>
  ├── 禁止 Map/JSONObject/Object 作为返回体
  ├── C端 Request/Response 必须独立 VO
  └── 参数 > 3 个必须封装实体

IL-JAVA003: NO SQL IN JAVA CODE
  ├── 禁止 @Select/@Update/@Insert 注解
  ├── SQL 全部写在 mapper.xml
  ├── 分页查询必须在 mapper.xml
  └── 使用 <include> 复用列定义

IL-JAVA004: NO BAD PRACTICES
  ├── 禁止 System.exit()
  ├── 禁止 e.printStackTrace()
  ├── 禁止字符串字面量比较
  └── 方法参数 ≤ 10，长度 ≤ 120 行
```

**Mapper XML 标准格式：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.xxx.mapper.XxxMapper">
    <sql id="baseColumns">id, field_name, create_time</sql>

    <!-- 分页查询：必须在 XML -->
    <select id="pageByEntity" resultType="com.xxx.entity.XxxEntity">
        SELECT <include refid="baseColumns"/>
        FROM table_name
        <where>
            <if test="entity.field != null and entity.field != ''">
                AND field = #{entity.field}
            </if>
        </where>
    </select>
</mapper>
```

详细规范见：
- `skills/java-checkstyle/SKILL.md` - Java 代码风格规范
- `templates/java-springboot/harness.yaml` - SpringBoot Harness 配置

### 角色灵活配置

用户可以通过配置文件自定义角色和阶段映射：

```yaml
# ~/.claude/harness/role-config.yaml

# 自定义角色
roles:
  tech_lead:
    name: "技术负责人"
    stages: [P04, P05, P08, P09]
    iron_laws: [IL-TECH001, IL-PLAN001, IL-TEST001]

  full_stack_dev:
    name: "全栈开发"
    stages: [P06, P07, P08]
    templates: [vue3, java-spring]

# 阶段权限配置
stage_permissions:
  P02:  # 需求分析
    can_edit: [product_manager, tech_lead]
    can_view: [all]

  P04:  # 技术方案
    can_edit: [architect, tech_lead]
    can_view: [all]
```

### 多角色协作示例

```
项目：电商后台系统
────────────────────────────────────────
P01 → 产品经理：收集需求，创建需求池
P02 → 产品经理：编写 PRD，定义 MVP
P03 → 设计师：设计原型，评审交互
P04 → 架构师：技术方案，API 设计
P05 → 项目经理：任务分解，里程碑规划
P06 → 前端开发：Vue3 组件开发
P07 → 后端开发：Spring Boot API 开发
P08 → 测试工程师：E2E + API + 视觉回归测试
P09 → 运维工程师：部署上线
P10 → 产品经理：数据分析，迭代规划

每个阶段完成后自动通知下一阶段角色
```

---

## 技术栈模板

| 模板名称 | 适用技术栈 | 特殊配置 |
|----------|------------|----------|
| `java-spring` | Java 17/21 + Spring Boot 3.x | Jakarta EE、现代特性 |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x | javax 兼容、私服检测 |
| `vue2` | Vue 2.x + Vue CLI/Webpack | Options API、Vuex、Vue Router |
| `vue3` | Vue 3.x + Vite | Composition API、Pinia、TypeScript |
| `react` | React 18+ + Vite/CRA | Hooks、TypeScript、React Router |
| `node-express` | Node.js Express | npm/yarn 检测 |
| `python-django` | Python Django | pip/venv 检测 |
| `generic` | 通用项目 | 基础铁律集 |

---

## 开发与测试

```bash
# 安装依赖
npm install

# 构建
npm run build

# 测试 (623 tests)
npm test

# 测试覆盖率
npm run test:coverage
```

---

## 许可证

[MIT](LICENSE) — 开源免费，人人可用

---

<p align="center"><strong>Chaos demands order. Harness provided it.</strong></p>
