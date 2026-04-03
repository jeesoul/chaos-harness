---
name: hooks-manager
description: 管理和配置Chaos Harness钩子系统。触发词：钩子、hooks、自纠正、自学习
---

# Hooks Manager (钩子管理器)

## 执行规则

**加载此 skill 后，根据用户请求执行：**

### 查看钩子状态

使用 Read 工具读取：
- `~/.claude/harness/iron-law-log.json`
- `~/.claude/harness/laziness-log.json`
- `~/.claude/harness/learning-log.json`
- `~/.claude/harness/workflow-log.json`

输出格式：

```
┌─────────────────────────────────────────────────────────────┐
│  Chaos Harness 钩子状态                                      │
├─────────────────────────────────────────────────────────────┤
│  铁律违规记录: X 条                                          │
│  偷懒模式检测: Y 次                                          │
│  学习记录条目: Z 条                                          │
│  工作流追踪事件: W 次                                        │
│                                                             │
│  最近学习:                                                   │
│  - [时间] IL001: Version Directory Required                 │
│  - [时间] IL003: Completion Without Verification            │
└─────────────────────────────────────────────────────────────┘
```

### 查看学习日志

使用 Read 工具读取 `~/.claude/harness/learning-log.json`

输出格式：

```
┌─────────────────────────────────────────────────────────────┐
│  学习日志                                                    │
├─────────────────────────────────────────────────────────────┤
│  ID     │ 来源   │ 标题                          │ 时间     │
├─────────────────────────────────────────────────────────────┤
│  L001   │ IL001  │ Version Directory Required     │ 22:30    │
│  L002   │ IL003  │ Completion Without Verification│ 22:35    │
│  L003   │ LP002  │ Fix Without Root Cause        │ 22:40    │
└─────────────────────────────────────────────────────────────┘
```

### 清理日志

使用 Write 工具重置日志文件：

```bash
# 清理铁律日志
Write '[]' to ~/.claude/harness/iron-law-log.json

# 清理偷懒日志
Write '[]' to ~/.claude/harness/laziness-log.json

# 清理学习日志
Write '[]' to ~/.claude/harness/learning-log.json

# 清理工作流日志
Write '[]' to ~/.claude/harness/workflow-log.json
```

输出确认：

```
✅ 已清理所有日志文件
   - iron-law-log.json: 0 条
   - laziness-log.json: 0 条
   - learning-log.json: 0 条
   - workflow-log.json: 0 条
```

### 查看压缩前存档

使用 Read 工具读取 `~/.claude/harness/compact-archive.json`

输出最近的压缩存档：

```
┌─────────────────────────────────────────────────────────────┐
│  压缩存档 (最近3条)                                          │
├─────────────────────────────────────────────────────────────┤
│  ID: compact-123456                                         │
│  时间: 2026-04-03T10:30:00Z                                 │
│  学习条目: 5 条                                              │
│  违规记录: 2 条                                              │
│  工作流状态: W08_development                                 │
│                                                             │
│  摘要: 完成了扫描器模块开发，测试通过...                     │
└─────────────────────────────────────────────────────────────┘
```

## 钩子系统架构

```
hooks/
├── hooks.json              # Claude Code钩子配置
├── run-hook.cmd            # 跨平台polyglot wrapper
├── session-start           # SessionStart: 注入铁律上下文
├── iron-law-check          # PreToolUse: 铁律检查
├── laziness-detect         # PostToolUse: 偷懒检测
├── learning-update         # PostToolUse: 学习记录
├── workflow-track          # PreToolUse: 工作流追踪
├── stop                    # Stop: 完成声明分析
└── pre-compact             # PreCompact: 上下文保存
```

## 钩子触发时机

| Hook | 触发时机 | 功能 |
|------|---------|------|
| SessionStart | 会话开始/恢复 | 注入铁律上下文 |
| PreToolUse | 工具调用前 | 铁律检查(IL001/IL005) |
| PostToolUse | 工具调用后 | 偷懒检测/学习记录 |
| Stop | 回合结束 | 完成声明分析(IL003) |
| PreCompact | 对话压缩前 | 保存关键上下文 |

## 铁律与钩子映射

| 铁律 | 钩子 | 检查 |
|------|------|------|
| IL001 | iron-law-check | 版本目录验证 |
| IL002 | workflow-track | 扫描结果存在 |
| IL003 | stop | 完成验证证据 |
| IL004 | iron-law-check | 版本变更同意 |
| IL005 | iron-law-check | 高风险配置批准 |

## 偷懒模式与钩子映射

| 模式 | 钩子 | 检测 |
|------|------|------|
| LP001 | stop | 无验证完成声明 |
| LP002 | laziness-detect | 无根因修复 |
| LP003 | workflow-track | 超时检测 |
| LP004 | stop | 跳过测试尝试 |
| LP005 | iron-law-check | 擅自版本变更 |
| LP006 | iron-law-check | 自动高风险配置 |

## 数据文件位置

```
~/.claude/harness/
├── iron-law-log.json       # 铁律违规日志
├── laziness-log.json       # 偷懒模式日志
├── learning-log.json       # 学习记录日志
├── workflow-log.json       # 工作流追踪日志
├── workflow-state.yaml     # 当前工作流状态
├── compact-archive.json    # 压缩前存档
└── plugin-log.json         # 插件执行日志
```

## 使用示例

```
你: 查看钩子状态

Claude: ┌───────────────────────────────────────────────────────┐
        │  Chaos Harness 钩子状态                               │
        ├───────────────────────────────────────────────────────┤
        │  铁律违规记录: 5 条                                   │
        │  偷懒模式检测: 3 次                                   │
        │  学习记录条目: 8 条                                   │
        │  工作流追踪事件: 15 次                                │
        │                                                       │
        │  最近违规:                                            │
        │  - 22:30 IL001: 版本目录缺失                          │
        │  - 22:35 IL003: 无验证完成声明                        │
        └───────────────────────────────────────────────────────┘

你: 查看学习日志

Claude: [显示learning-log.json内容]

你: 清理日志

Claude: ✅ 已清理所有日志文件
        - iron-law-log.json: 0 条
        - laziness-log.json: 0 条
        - learning-log.json: 0 条
        - workflow-log.json: 0 条
```

## 管理命令

```
你: 查看钩子状态
你: 查看学习日志
你: 查看压缩存档
你: 清理日志
你: 查看违规详情
```