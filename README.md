# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.4.0-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
  <img src="https://img.shields.io/badge/tests-14%2F14%20passing-brightgreen.svg">
  <img src="https://img.shields.io/badge/integrations-Superpowers%20%7C%20OpenSpec%20%7C%20Everything-orange.svg">
</p>

<p align="center"><strong>AI 开发流程操作系统</strong></p>
<p align="center"><em>Your AI dev team, finally has an operating system.</em></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

---

## 一句话定位

> 整合最优秀的 AI 开发框架，让 AI 从"不可控的天才"变成"可验证的工程"。

## 核心定位

Chaos Harness v1.4.0 不是又一个 AI 约束框架，是**让所有 AI 开发框架能一起工作的操作系统**。

- **Superpowers** 负责自动拆任务、子代理调度
- **OpenSpec** 负责变更提案、规范驱动
- **Everything** 负责最佳实践配置、Agent 库
- **chaos-harness** 负责真验证、硬拦截、失败恢复

## 安装

### 方式一：Claude Code 插件安装（推荐）

```bash
# 1. 克隆
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
git checkout v1.4.0

# 2. 注册 marketplace
claude plugins marketplace add "/path/to/chaos-harness"

# 3. 安装
claude plugins install chaos-harness@chaos-harness

# 4. 重启 Claude Code，验证安装
/chaos-harness:overview
```

### 方式二：直接复制 hooks.json

如果不使用插件系统，将 `hooks/hooks.json` 复制到你的 Claude Code 配置：

```bash
# 复制到项目级 .claude/
cp hooks/hooks.json /your-project/.claude/hooks.json

# 或复制到全局 ~/.claude/
cp hooks/hooks.json ~/.claude/hooks.json
```

> 注意：直接复制时需要将 hooks.json 中的 `${CLAUDE_PLUGIN_ROOT}` 替换为 chaos-harness 的实际路径。

## 使用

### 日常开发

安装后自动生效，无需额外配置。Hooks 会自动在 Claude Code 会话中触发：

| 时机 | 自动执行 |
|------|----------|
| 会话开始 | 扫描插件 + 恢复状态 + 注入铁律 |
| 写/改代码前 | Gate 状态机检查 + 铁律预检 |
| 写/改代码后 | 学习记录 + 经验积累 + 工作流追踪 |
| 回合结束 | 偷懒检测 + 状态保存 |
| 对话压缩前 | 保存关键上下文 |

### 6 个 Slash Commands

| 命令 | 功能 |
|------|------|
| `/chaos-harness:overview` | 系统总览：铁律状态、Gate 进度、插件检测 |
| `/chaos-harness:gate-system` | Gate 状态机：推进 Gate、查看状态 |
| `/chaos-harness:iron-law-enforcer` | 铁律执行：自定义规则、绕过检测 |
| `/chaos-harness:overdrive` | 超频模式：紧急任务，最高优先级 |
| `/chaos-harness:project-scanner` | 项目扫描：类型检测、技术栈分析 |
| `/chaos-harness:web-access` | 浏览器访问：CDP 搜索、抓取、自动化 |

### Gate 流程

当你开始一个任务时，orchestrator 自动规划最优路径：

```
你: "创建一个新的 REST API"
    ↓
orchestrator 自动:
  1. 检测可用插件 → 只有 chaos-harness（无外部插件）
  2. 规划执行路径 → G0 问题定义 → G3 实现 → G4 测试 → G5 发布
  3. 执行 Gate → 初始化状态机
  4. 硬拦截 → 防止跳过 Gate
    ↓
你: "修复构建错误"
    ↓
orchestrator 自动:
  1. 识别为 Bug 修复意图
  2. 使用内置系统调试策略 (reproduce → isolate → fix → verify)
  3. 推荐 opus 模型（复杂调试）
```

### 插件编排

Orchestrator 启动时自动检测外部插件，检测到了就自动使用：

```bash
# 查看当前检测到的所有插件
node scripts/orchestrator.mjs detect

# 查看执行计划
node scripts/orchestrator.mjs plan "创建用户登录功能"

# 完整编排循环
node scripts/orchestrator.mjs orchestrate "添加 API 限流"
```

当安装了外部插件后，orchestrator 会自动升级执行路径：

| 安装的插件 | 自动获得的能力 |
|-----------|--------------|
| Superpowers | 子代理拆解任务、并行执行、模型自动选择 |
| OpenSpec | 变更提案生成、spec 驱动开发 |
| Everything | Agent 推荐、规则注入、上下文模式 |
| 都没装 | 内置 fallback（任务拆解引擎 + Gate 验证） |

## 架构

```
L1 编排层: orchestrator (插件发现) → registry (组件注册) → 意图分类
    ↓
L2 规划层: OpenSpec adapter (变更提案) → Gate 映射
    ↓
L3 执行层: Superpowers adapter (子代理分发) → 模型选择
    ↓
L4 验证层: Gate 状态机 (6 门) → 5 验证器 → 硬拦截 → 失败恢复
```

## 核心能力

### Gate 状态机（6 阶段强制流程）

```
G0 问题定义 → G1 方案设计 → G2 任务拆分 → G3 实现 → G4 测试 → G5 发布
```

每个 Gate 有明确产出、必要字段、checksum 锁定。不能跳过、不能回退、不能篡改。

### 真验证（不是关键词匹配）

| 验证器 | 做什么 |
|--------|--------|
| artifact | 产出文件存在且有内容 |
| content | 必要字段完整性 |
| checksum | SHA-256 文件未被篡改 |
| code | lint + type check 通过 |
| test | 测试真的跑过且通过 |

### 硬拦截（不是打印警告）

Gate 未通过时，PreToolUse Hook 直接 `exit 1` 阻断，不是打印提醒。

### 插件编排

自动发现并调度：Superpowers（子代理）+ OpenSpec（变更提案）+ Everything（Agent/规则）。根据用户意图（创建/修改/Bug/评审/测试）自动选择最优执行路径。

## 与 v1.3.1 的对比

| 维度 | v1.3.1 | v1.4.0 |
|------|-------------|--------|
| 定位 | 确定性 AI Agent 约束框架 | AI 开发流程操作系统 |
| 核心能力 | 23 个 Skill（自然语言提示） | Gate 状态机 + 真验证 + 插件编排 |
| 拦截方式 | 关键词匹配打印警告 | PreToolUse Hook `exit 1` 硬拦截 |
| 状态管理 | `.chaos-harness/state.json` 简单记录 | 6 门状态机，checksum 锁定，不可回退 |
| 失败恢复 | 无 | 自动检测失败类型 → 回退/重试/超频拆分 |
| 插件集成 | 无 | Superpowers + OpenSpec + Everything 自动发现 |
| Skills | 23 个（提示语型） | 6 个（执行器型），1:1 对应 slash commands |
| 测试 | 0 个 | 14 个，全部通过 |
| CI | 无 | GitHub Actions（语法检查 + 测试 + 格式验证） |
| 代码量 | ~3000 行 | ~4800 行（核心脚本 15 个 + 集成适配器 4 个） |

## v1.3.1 保留能力

以下 v1.3.1 核心能力在 v1.4.0 中保留并增强：

| 能力 | v1.4.0 变化 |
|------|-------------|
| 5 条核心铁律 (IL001-IL005) | Gate 状态机强制联动 |
| 7 种偷懒检测 (LP001-LP007) | 新增 LP001 空文件、LP002 空函数、LP004 行数不足 |
| overdrive 超频模式 | 保留，Gate 流程可跳过前置门直接进入 G3 |
| web-access CDP | 保留，完整 Chrome DevTools 集成 |
| 学习记录 + 自适应 | 保留，PostToolUse 自动记录 |

## 许可证

MIT
