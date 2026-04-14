# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0--%E5%AD%94%E6%98%8E-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>确定性 AI Agent 约束框架</strong></p>
<p align="center"><em>v1.3.0 孔明 — 运筹帷幄，决胜千里；以智御局，以律治心</em></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

---

## 一句话定位

> 用代码给 AI 立规矩，让 AI 从"不可控的天才"变成"严谨的工程师"。

## 核心定位

AI Agent 在辅助开发时的核心问题是非确定性——可能跳过验证、绕过约束、产生幻觉式交付。传统的自然语言提示词是软性建议，存在语义灰色空间。

Chaos Harness 将约束编码为**铁律（Iron Laws）**——不是文本规则，而是通过 Skills + Hooks 自动执行的硬性检查，消除语义博弈空间。

### 三大特性

| 特性 | 说明 |
|------|------|
| **确定性** | 铁律强制执行，行为路径可追溯、可审计 |
| **可进化** | 自学习闭环：行为记录 → 规则优化 → 能力沉淀 |
| **可扩展** | 开放插件生态，任意插件继承铁律约束 |

### 适用场景

| 场景 | 传统方式 | Chaos Harness |
|------|----------|---------------|
| 修 bug | Agent 说"修好了"，手动验证发现还有问题 | 铁律 IL003 强制提供验证证据，自动跑测试 |
| 团队协作 | 口头规范，新人容易忘记 | 铁律自动阻断违规操作，规范融入流程 |
| 开源项目 | Maintainer 手动清理不规范 PR | 铁律自动拦截，贡献者按规范输出 |

---

## 安装指南

### 快速安装

```bash
# 1. 克隆项目
git clone https://github.com/jeesoul/chaos-harness.git

# 2. 注册本地 marketplace
claude plugins marketplace add "/path/to/chaos-harness"

# 3. 安装插件
claude plugins install chaos-harness@chaos-harness

# 4. 重启 Claude Code，验证安装成功
/chaos-harness:overview
```

### 卸载

```bash
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness
```

### 升级

```bash
# 1. 拉取最新代码
cd /path/to/chaos-harness && git pull origin main

# 2. 重新注册 marketplace
claude plugins marketplace remove chaos-harness
claude plugins marketplace add "/path/to/chaos-harness"

# 3. 重装
claude plugins uninstall chaos-harness@chaos-harness
claude plugins install chaos-harness@chaos-harness
```

### 版本历史

| 版本 | 主要更新 |
|------|---------|
| 1.3.0 孔明 | P03/P04 强制 Multi-Agent 评审、产品经理增强、测试增强（Playwright+CDP 混合模式）、22 个 Skill、MCP 彻底移除 |
| 1.2.0 | 自学习闭环、自适应 Harness、Agent Team 铁律、CDP 浏览器自动化 |
| 1.1.0 | Java SpringBoot 铁律、角色支持、跨平台修复 |
| 1.0.0 | 核心框架：Skills + Hooks + Templates |

---

## 解决什么问题？

| 问题 | 表现 | 解决方案 |
|------|------|----------|
| 虚假完成声明 | "已修复" 但无验证 | IL003：强制要求验证证据 |
| 跳过关键步骤 | "简单修复，跳过测试" | LP004：自动阻断并强制执行 |
| 绕过约束规则 | "就这一次" | 10+ 绕过话术识别 + 驳回 |
| 版本混乱 | 文档散落各目录 | IL001：强制版本目录 |
| 敏感配置误操作 | 直接修改数据库/密钥 | IL005：审批机制拦截 |

---

## 核心能力

### 铁律引擎 (Iron Law Engine)

5 条核心铁律，自动执行，不可绕过：

| ID | 规则 | 触发场景 |
|----|------|----------|
| IL001 | 文档必须在版本目录生成 | 任何文档输出 |
| IL002 | Harness 生成依赖扫描数据 | 约束生成请求 |
| IL003 | 完成声明必须附带验证证据 | Stop Hook |
| IL004 | 版本变更需要用户确认 | 版本号修改 |
| IL005 | 敏感配置修改需要审批 | 数据库/密钥配置 |

扩展铁律支持自定义（`~/.claude/harness/iron-laws.yaml`）。

### 偷懒检测 (Laziness Pattern Detection)

| 模式 | 检测条件 | 处置 |
|------|----------|------|
| LP001 | 声称完成但无验证 | 阻断 + 要求举证 |
| LP002 | 跳过根因分析直接修复 | 阻断 + 强制分析 |
| LP003 | 长时间无产出 | 施压 + 进度要求 |
| LP004 | 尝试跳过测试 | 阻断 + 强制测试 |
| LP005 | 擅自更改版本号 | 阻断 + 恢复原版 |
| LP006 | 自动处理高风险配置 | 阻断 + 用户审批 |

### 钩子生态 (Hook System)

| Hook | 触发时机 | 功能 |
|------|----------|------|
| SessionStart | 会话开始 | 注入铁律 + 恢复状态 + 智能推荐 |
| PreToolUse | 工具调用前 | 铁律预检 |
| PostToolUse | 工具调用后 | 偷懒检测 + 学习记录 + 场景感知 |
| Stop | 回合结束 | 完成声明分析 + 偷懒检测 |
| PreCompact | 对话压缩前 | 保存关键上下文 |

### 智能场景感知 (Auto Context)

后台自动运行，监测文件操作并推荐对应 Skill：

| 操作 | 推荐 |
|------|------|
| 写 Vue/React 组件 | 加载对应模板铁律 |
| 写 PRD/需求文档 | product-lifecycle + prd-validator |
| 写测试文件 | test-assistant |
| P03 设计完成 | 推荐 Multi-Agent 设计评审 |
| P04 技术完成 | 推荐 Multi-Agent 技术评审 |

### 自适应工作流

12 阶段流程，按项目规模自动裁剪：

| 阶段 | 名称 | Small | Medium | Large |
|------|------|-------|--------|-------|
| W01 | 需求理解 | ✅ | ✅ | ✅ |
| W02 | 技术调研 | ❌ | ✅ | ✅ |
| W03 | 架构设计 | ✅ | ✅ | ✅ |
| W04 | 详细设计 | ❌ | ✅ | ✅ |
| W05 | 编码实现 | ✅ | ✅ | ✅ |
| W06 | 代码审查 | ❌ | ❌ | ✅ |
| W07 | 集成测试 | ❌ | ✅ | ✅ |
| W08 | 文档生成 | ✅ | ✅ | ✅ |
| W09 | 发布准备 | ✅ | ✅ | ✅ |
| W10 | 上线部署 | ✅ | ✅ | ✅ |
| W11 | 回归验证 | ✅ | ✅ | ✅ |
| W12 | 复盘总结 | ✅ | ✅ | ✅ |

---

## 命令速查

| 命令 | 功能 |
|------|------|
| `/chaos-harness:overview` | 系统概览：铁律状态、学习进度、项目统计 |
| `/chaos-harness:project-scanner` | 项目扫描：类型检测、技术栈分析 |
| `/chaos-harness:version-locker` | 版本管理：锁定、创建、变更追踪 |
| `/chaos-harness:harness-generator` | 约束生成：基于扫描数据生成专属 Harness |
| `/chaos-harness:workflow-supervisor` | 工作流编排：阶段控制、进度监控 |
| `/chaos-harness:agent-team-orchestrator` | Agent Team 编排：自动并行、监督防懒 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行：自定义规则、绕过检测 |
| `/chaos-harness:collaboration-reviewer` | 多 Agent 评审：自动启动、多视角汇总 |
| `/chaos-harness:hooks-manager` | 钩子配置：启用/禁用、日志查看 |
| `/chaos-harness:plugin-manager` | 插件管理：第三方接入、约束配置 |
| `/chaos-harness:project-state` | 状态持久化：进度保存、会话恢复 |
| `/chaos-harness:auto-toolkit-installer` | 工具链检测：自动安装依赖工具 |
| `/chaos-harness:learning-analyzer` | 自学习分析：失败模式识别、规则优化 |
| `/chaos-harness:product-lifecycle` | 产品全生命周期：需求→原型→开发→测试→发布 |
| `/chaos-harness:product-manager` | 产品经理：需求池/Kano/竞品分析/用户故事 |
| `/chaos-harness:prd-validator` | PRD 质量检查：验收标准/可追溯性 |
| `/chaos-harness:test-assistant` | 测试助手：用例/E2E/覆盖率/回归对比 |
| `/chaos-harness:visual-regression` | 可视化回归：CDP 截图对比 |
| `/chaos-harness:ui-generator` | UI 生成：从 PRD 生成前端界面 |
| `/chaos-harness:adaptive-harness` | 自适应优化：从学习数据强化铁律 |
| `/chaos-harness:web-access` | 联网操作：搜索/抓取/CDP 浏览器自动化 |

### 智能触发（无需记住命令）

| 你说... | 自动推荐 |
|--------|---------|
| "需求"、"PRD"、"原型" | product-lifecycle |
| "PRD检查"、"PRD质量" | prd-validator |
| "需求分析"、"竞品分析"、"Kano" | product-manager |
| "测试用例"、"E2E"、"覆盖率" | test-assistant |
| "视觉回归"、"截图对比" | visual-regression |
| "生成界面"、"UI生成" | ui-generator |
| "自适应优化"、"强化铁律" | adaptive-harness |
| "搜索"、"CDP"、"浏览器" | web-access |
| "扫描项目" | project-scanner |
| "版本"、"v0.1" | version-locker |
| "工作流"、"阶段" | workflow-supervisor |
| "铁律"、"约束" | iron-law-enforcer |
| "学习记录"、"自学习" | learning-analyzer |
| "评审"、"审查" | collaboration-reviewer |
| "继续"、"恢复" | project-state |

---

## 产品全生命周期

10 阶段研发流程，从需求到发布：

```
P01 需求收集 → P02 需求分析 → P03 原型设计 → P04 技术方案 → P05 开发规划
     ↓
P10 迭代优化 ← P09 验收交付 ← P08 集成测试 ← P07 后端开发 ← P06 前端开发
```

| 阶段 | 名称 | 输出 |
|------|------|------|
| P01 | 需求收集 | 需求池 |
| P02 | 需求分析 | PRD、MVP 范围 |
| P03 | 原型设计 | 原型、交互流程 |
| P04 | 技术方案 | 架构设计、API 设计 |
| P05 | 开发规划 | 开发计划 |
| P06 | 前端开发 | 前端代码 |
| P07 | 后端开发 | 后端代码 |
| P08 | 集成测试 | 测试报告 |
| P09 | 验收交付 | 发布包 |
| P10 | 迭代优化 | 迭代计划 |

P03/P04 阶段完成后强制 Multi-Agent 评审（IL-TEAM001）。

产品专属铁律：IL-PRD001-003, IL-TECH001-003, IL-PLAN001-003, IL-FE001-003, IL-BE001-004, IL-TEST001-003, IL-RELEASE001-003。

---

## 用户角色指南

| 角色 | 主导阶段 | 推荐命令 |
|------|---------|---------|
| 产品经理 | P01, P02, P03, P10 | product-lifecycle, product-manager, prd-validator |
| 售前工程师 | P01, P02, P03 | product-lifecycle |
| 解决方案架构师 | P04, P05 | harness-generator |
| UI 设计师 | P03 | product-lifecycle, ui-generator |
| 前端开发 | P06 | vue3/react 模板 |
| 后端开发 | P07 | java-spring/node 模板 |
| 测试工程师 | P08 | test-assistant, visual-regression |
| 运维工程师 | P09 | workflow-supervisor |

### Java 后端规范

| 铁律 | 规则 |
|------|------|
| IL-JAVA001 | NO CODE WITHOUT CHECKSTYLE — UTF-8, ≤125 字符/行, 4 空格缩进, 完整 Javadoc |
| IL-JAVA002 | NO CONTROLLER WITHOUT VO — 返回 R<VO>, 禁止 Map/JSONObject |
| IL-JAVA003 | NO SQL IN JAVA CODE — SQL 全部在 mapper.xml, 禁止注解 |
| IL-JAVA004 | NO BAD PRACTICES — 禁止 System.exit(), e.printStackTrace() |

---

## 自动化工具链

通过 `/chaos-harness:auto-toolkit-installer` 自动检测并安装：

| 工具 | 用途 |
|------|------|
| skill-creator | 自动创建业务场景专属 Skill |
| superpowers-chrome | Chrome DevTools MCP - 浏览器自动化 |
| ui-ux-pro-max | UI/UX 设计评审 + Playwright 测试 |
| webapp-testing | Playwright 自动化测试 |
| web-access | CDP 浏览器自动化 - 搜索/抓取/登录态 |

### 镜像加速（国内）

| 类型 | 官方源 | 镜像源 |
|------|--------|--------|
| GitHub | github.com | kgithub.com / ghproxy.com |
| npm | registry.npmjs.org | registry.npmmirror.com |
| Playwright | playwright.azureedge.net | npmmirror.com/mirrors/playwright |

---

## 技术栈模板

| 模板 | 技术栈 |
|------|--------|
| java-spring | Java 17/21 + Spring Boot 3.x |
| java-spring-legacy | JDK 8 + Spring Boot 2.x |
| vue2 | Vue 2.x + Options API + Vuex |
| vue3 | Vue 3.x + Composition API + Pinia |
| react | React 18+ + Hooks + TypeScript |
| node-express | Node.js Express |
| python-django | Python Django |
| generic | 通用项目 |

---

## 许可证

[MIT](LICENSE) — 开源免费

---

<p align="center"><strong>Chaos demands order. Harness provides it.</strong></p>
