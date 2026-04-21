# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.2--Gate-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
</p>

<p align="center"><strong>Gate 状态机 + 硬拦截 — AI 开发流程操作系统</strong></p>
<p align="center"><em>v1.3.2 — Gate 状态机·硬拦截·跨平台·真验证·自学习</em></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

---

## 一句话定位

> 用 Gate 状态机给 AI 开发流程立规矩，让每一步操作都经过验证。

## 核心定位

AI Agent 在辅助开发时的核心问题是非确定性——可能跳过验证、绕过约束、产生幻觉式交付。传统的自然语言提示词是软性建议，存在语义灰色空间。

Chaos Harness 将约束编码为**Gate 状态机**——不是文本规则，而是通过 Gates + Hooks 自动执行的硬性检查，消除语义博弈空间。

### 三大特性

| 特性 | 说明 |
|------|------|
| **确定性** | Gate 分级执行（hard 阻断 / soft 警告），行为路径可追溯、可审计 |
| **可进化** | 自学习闭环：Gate 失败 → 阈值调整 → 规则优化 |
| **可扩展** | 开放插件生态，任意项目继承 Gate 约束 |

### 适用场景

| 场景 | 传统方式 | Chaos Harness |
|------|----------|---------------|
| 修 bug | Agent 说"修好了"，手动验证发现还有问题 | Gate 强制提供验证证据，自动跑测试 |
| 阶段推进 | 口头确认"开发完了"，进入下一阶段 | Gate 检查前置条件，不通过不放行 |
| 代码提交 | 直接 commit，可能包含未测试代码 | Gate 拦截未测试的提交 |

---

## 安装指南

### 快速安装

**方式一：GitHub 远程安装**

```bash
claude plugins marketplace add github:jeesoul/chaos-harness
claude plugins install chaos-harness@chaos-harness
# 重启 Claude Code
/chaos-harness:overview
```

**方式二：本地安装（推荐）**

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

**Windows 路径注意事项：**

| 问题 | 解决 |
|------|------|
| 路径含中文 | 使用纯英文路径，如 `D:\chaos-harness` |
| 空格 | 路径用双引号包裹 |
| 转义 | CMD 中使用 `%CD%`，PowerShell 中使用 `$(pwd)` |
| marketplace 格式 | 必须使用绝对路径，不支持相对路径 |

**验证安装：**

```bash
# macOS / Linux
bash install.sh

# Windows（双击或 CMD）
install.bat
```

> **无需手动配置 settings.json！** 插件安装后，Skills 和 Hooks（hooks.json）会被 Claude Code 插件系统自动加载。

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
| **1.3.2 Gate** | **Gate 状态机 + 硬拦截**：9 个 Gates（6 阶段 + 3 质量）、分级策略（hard/soft）、真验证（6 种验证器）、跨平台路径统一（node .mjs 入口）、自学习闭环（阈值动态调整）、Skill 精简（33 → 12）、恢复机制（suggest/override/history） |
| 1.3.1 孔明Pro | 持续学习系统 2.0（原子本能+PostToolUse 100% 确定）、评测驱动开发（pass@k + 3 种评分器）、Schema-Driven 工作流（YAML + 依赖图）、深度防御（4 层验证 + PreToolUse 预警）、战略压缩（逻辑边界 + 调用计数阈值）、迭代检索（4 阶段循环）、30 个 Skill、27 个 Command、21 个 Script |
| 1.3.0 孔明 | overdrive 超频模式（14 分钟全流程紧急处理）、P03/P04 强制 Multi-Agent 评审、LP007 Team 退化检测、产品经理增强、测试增强（Playwright+CDP 混合模式）、23 个 Skill、跨平台兼容修复（纯 Node.js API） |
| 1.2.0 | 自学习闭环、自适应 Harness、Agent Team 铁律、CDP 浏览器自动化 |
| 1.1.0 | Java SpringBoot 铁律、角色支持、跨平台修复 |
| 1.0.0 | 核心框架：Skills + Hooks + Templates |

---

## 解决什么问题？

| 问题 | 表现 | 解决方案 |
|------|------|----------|
| 虚假完成声明 | "已修复" 但无验证 | Gate 强制要求验证证据 |
| 跳过关键步骤 | "简单修复，跳过测试" | gate-quality-tests 阻断未测试提交 |
| 阶段混乱 | 开发未完成就进入测试 | gate-w*-stage 检查前置条件 |
| 版本混乱 | 文档散落各目录 | IL001 + gate-quality-iron-law 强制版本目录 |
| 敏感配置误操作 | 直接修改数据库/密钥 | IL005：审批机制拦截 |
| 紧急任务低效 | Agent 说"我看看" | overdrive：所有 Agent 全速运行 |

---

## 核心能力

### Gate 状态机 (Gate State Machine)

v1.3.2 拳头产品。9 个 Gates，分级执行，真验证。

**阶段 Gates（6 个）：**

| Gate | Level | 说明 |
|------|-------|------|
| gate-w01-requirements | hard | 需求阶段进入检查 |
| gate-w03-architecture | hard | 架构阶段进入检查 |
| gate-w08-development | hard | 开发阶段进入检查 |
| gate-w09-code-review | hard | 代码审查阶段进入检查 |
| gate-w10-testing | hard | 测试阶段进入检查 |
| gate-w12-release | hard | 发布阶段进入检查 |

**质量 Gates（3 个）：**

| Gate | Level | 说明 |
|------|-------|------|
| gate-quality-iron-law | hard | 铁律违规零容忍 |
| gate-quality-tests | hard | 测试必须通过 |
| gate-quality-format | soft | 代码格式建议（可绕过） |

**执行策略：**

| Level | 行为 | 说明 |
|-------|------|------|
| hard | exit 1 阻断 | 不可绕过，必须修复 |
| soft | exit 0 警告 | 可绕过（单 session 最多 3 次） |

**验证器（6 种）：**

| 验证器 | 验证方式 | 说明 |
|--------|---------|------|
| file-exists | fs.access() + 手动 glob | 阶段前置文档是否存在 |
| no-syntax-errors | node --check | 项目代码无语法错误 |
| test-suite-pass | 动态检测 vitest/jest/mocha | 测试套件全部通过 |
| iron-law-check | 调用现有脚本 | 铁律零违规 |
| lint-check | 执行 eslint | 代码格式检查 |
| git-has-commits | git log 计数 | 开发阶段有实际产出 |

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

### 深度防御框架 (Defense-in-Depth)

4 层验证，与 Gate 集成：

| 层级 | 对应 Gate | 检查内容 |
|------|-----------|---------|
| L1 入口层 | gate-quality-iron-law | 版本目录格式、文件存在性 |
| L2 业务层 | gate-quality-iron-law | 铁律合规、上下文验证 |
| L3 环境层 | Stage Gates | 阶段条件、环境守卫 |
| L4 调试层 | gate-quality-tests | 测试通过、日志记录 |

### 跨平台路径方案

所有 hooks 统一通过 `node` 调用 `.mjs` 文件，避免 shell 脚本的跨平台问题：

| 问题 | 解决 |
|------|------|
| Windows `\` vs Unix `/` | path-utils.mjs 统一转换 |
| `%VAR%` vs `$VAR` | 不依赖环境变量，从 import.meta.url 推导 |
| CRLF 路径转换 | 统一 node 入口，无 shell 脚本 |

### 恢复机制 (Gate Recovery)

Gate 失败后的三重恢复：

| 方式 | 说明 | 限制 |
|------|------|------|
| 自动恢复 | 测试失败 rerun、语法错误提示、文件缺失生成模板 | 可配置 |
| 手动恢复 | `/gate-manager recheck <gate-id>` | 无 |
| 强制绕过 | `/gate-manager override <gate-id> --reason "xxx"` | 仅 soft Gate，单 session 最多 3 次 |

### 超频模式 (Overdrive)

当遇到紧急任务时，一键激活最高优先级处理模式：

- **触发词**：紧急、超频、overdrive、立刻解决、线上问题
- **适用范围**：bug 修复 / 需求变更 / 架构修改 / 测试调整 / 运维事故
- **效率保障**：零铺垫、不解释、快速拍板、最小上下文
- **时间目标**：14 分钟完成定位→决策→执行→验证全流程
- **Agent 配置**：自动分配 3+ Agent 并行处理，主 Agent 只做协调
- **监督加速**：空闲阈值减半（1/2/3/5 分钟快速响应）
- **铁律策略**：跳过前置扫描，保留底线验证（版本/验证/安全不可跳过）

### 自学习闭环

Gate 阈值动态调整：

| 场景 | 自动行为 |
|------|---------|
| soft Gate 连续 3 次 override | 阈值放宽（warning → info） |
| soft Gate 连续 5 次 override | 降级为 info-only（不再阻止流程） |
| 某 Gate 一直 passed | 缓存跳过次数 +1（减少重复验证开销） |
| 新版本首次触发 Gate | 不自动学习，等待用户确认 |

---

## 命令速查

| 命令 | 功能 |
|------|------|
| `/gate-manager status` | Gate 状态仪表盘 |
| `/gate-manager recheck <id>` | 手动重新验证 Gate |
| `/gate-manager transition <stage>` | 发起阶段切换 |
| `/gate-manager override <id> --reason "xxx"` | 绕过 soft Gate |
| `/gate-manager history` | 查看绕过日志 |
| `/gate-manager list` | 列出所有 Gates |
| `/gate-manager reset <id>` | 重置 Gate 状态 |
| `/chaos-harness:overview` | 系统概览 |
| `/chaos-harness:overdrive` | 超频模式 |
| `/chaos-harness:harness-generator` | 约束生成 |
| `/chaos-harness:version-locker` | 版本管理 |
| `/chaos-harness:hooks-manager` | 钩子配置 |
| `/chaos-harness:project-state` | 状态持久化 |
| `/chaos-harness:product-manager` | 产品经理（需求/Kano/PRD/生命周期） |
| `/chaos-harness:test-assistant` | 测试助手 |
| `/chaos-harness:ui-generator` | UI 生成 |
| `/chaos-harness:web-access` | 联网操作/浏览器自动化 |

### 智能触发（无需记住命令）

| 你说... | 自动推荐 |
|--------|---------|
| "紧急"、"超频"、"立刻解决" | **overdrive**（最高优先级，直接激活） |
| "Gate 状态"、"阶段切换" | **gate-manager** |
| "需求"、"PRD"、"原型" | product-manager |
| "测试用例"、"E2E"、"覆盖率" | test-assistant |
| "生成界面"、"UI生成" | ui-generator |
| "搜索"、"CDP"、"浏览器" | web-access |
| "铁律"、"约束" | iron-law-enforcer |
| "继续"、"恢复" | project-state |

---

## 技能清单

### 核心 Skills（8 个）

| Skill | 说明 |
|-------|------|
| `gate-manager` | Gate 状态机用户交互层 |
| `overview` | 项目总览入口 |
| `project-state` | 状态持久化 |
| `hooks-manager` | 钩子管理 |
| `iron-law-enforcer` | 铁律执行 + 深度防御 |
| `overdrive` | 应急模式 |
| `harness-generator` | 约束生成 |
| `version-locker` | 版本管理 |

### 可选 Skills（4 个）

| Skill | 说明 |
|-------|------|
| `product-manager` | 产品经理（需求/Kano/PRD/生命周期 7 合 1） |
| `java-checkstyle` | Java 代码检查 |
| `ui-generator` | UI 生成工具 |
| `web-access` | 浏览器访问 |

---

## 许可证

[MIT](LICENSE) — 开源免费

---

<p align="center"><strong>Chaos demands order. Harness provides it.</strong></p>
