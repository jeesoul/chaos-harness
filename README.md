# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-blue.svg">
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
| SessionStart | 会话开始/恢复 | 注入铁律上下文 + 恢复项目状态 |
| PreToolUse | 工具调用前 | IL001/IL005 铁律预检 |
| PostToolUse | 工具调用后 | 偷懒模式检测 + 学习记录 |
| Stop | 回合结束 | IL003 完成声明分析 |
| PreCompact | 对话压缩前 | 保存关键上下文到存档 |

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

---

## 命令速查

| 命令 | 功能描述 |
|------|----------|
| `/chaos-harness:overview` | 系统概览：铁律状态、学习进度、项目统计 |
| `/chaos-harness:project-scanner` | 项目扫描：类型检测、技术栈分析、自适应建议 |
| `/chaos-harness:version-locker` | 版本管理：锁定、创建、变更追踪 |
| `/chaos-harness:harness-generator` | 约束生成：基于扫描数据生成专属 Harness |
| `/chaos-harness:workflow-supervisor` | 工作流编排：阶段控制、进度监控、Agent协调 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行：自定义规则、绕过检测、驳回生成 |
| `/chaos-harness:collaboration-reviewer` | 多Agent协作：角色分配、冲突检测、结果合并 |
| `/chaos-harness:hooks-manager` | 钩子配置：启用/禁用、日志查看、行为审计 |
| `/chaos-harness:plugin-manager` | 插件管理：第三方接入、约束配置、阶段映射 |
| `/chaos-harness:project-state` | 状态持久化：进度保存、会话恢复、断点续传 |
| `/chaos-harness:auto-toolkit-installer` | 工具链检测：自动安装依赖工具、镜像加速 |
| `/chaos-harness:learning-analyzer` | 自学习分析：失败模式识别、铁律优化建议、闭环迭代 |
| `/chaos-harness:product-lifecycle` | 产品全生命周期：需求→原型→开发→测试→发布→迭代 |

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

### 手动安装

如需手动安装工具链：

```bash
# skill-creator - 自动创建 skill
claude plugins install skill-creator@claude-plugins-official

# superpowers-chrome - Chrome DevTools MCP
claude plugins install superpowers-chrome@superpowers-marketplace

# ui-ux-pro-max - UI/UX 评审 + Playwright
claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill

# webapp-testing - Playwright 自动化测试
claude plugins install webapp-testing@anthropics/skills
```

**镜像安装 (国内用户)：**

```bash
# 克隆镜像仓库
git clone https://kgithub.com/anthropics/claude-plugins-official.git
git clone https://ghproxy.com/https://github.com/NicsterV2/ui-ux-pro-max-skill.git
git clone https://kgithub.com/anthropics/skills.git

# 注册 marketplace
claude plugins marketplace add ./claude-plugins-official
claude plugins marketplace add ./ui-ux-pro-max-skill
claude plugins marketplace add ./skills

# 安装
claude plugins install skill-creator@claude-plugins-official
claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill
claude plugins install webapp-testing@anthropics/skills
```

---

## MCP Server 支持

Chaos Harness 提供 MCP (Model Context Protocol) Server，支持外部系统调用核心能力。

### MCP 工具清单

| 工具分类 | 工具数量 | 功能描述 |
|----------|----------|----------|
| Scanner | 4 | 项目扫描、类型检测、环境分析 |
| Version | 5 | 版本锁定、目录创建、变更追踪 |
| Harness | 6 | 约束生成、模板加载、效果追踪 |
| Workflow | 8 | 工作流编排、阶段控制、Agent 协调 |
| **总计** | **23** | 完整 Harness 能力 API |

### 使用场景

```
┌─────────────────────────────────────────────────────────────┐
│  Claude Code 内部                                            │
│  └── Skills (SKILL.md) → 直接调用，无需 MCP                  │
├─────────────────────────────────────────────────────────────┤
│  外部系统集成                                                 │
│  ├── IDE 插件 (VS Code, JetBrains)                           │
│  ├── 其他 AI 工具 (Cursor, Copilot)                          │
│  ├── CI/CD 平台 (GitHub Actions, Jenkins)                    │
│  └── 自定义 Agent 系统                                        │
│  └── 通过 MCP Server 调用 Harness 能力                       │
└─────────────────────────────────────────────────────────────┘
```

### MCP 配置示例

```json
{
  "mcpServers": {
    "chaos-harness": {
      "command": "node",
      "args": ["path/to/chaos-harness/dist/mcp-server.js"],
      "env": {}
    }
  }
}
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

<p align="center"><strong>Chaos demands order. Harness provides it.</strong></p>