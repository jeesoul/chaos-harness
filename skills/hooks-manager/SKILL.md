---
name: hooks-manager
description: "管理和查看 Chaos Harness 钩子状态。触发词：钩子、hooks、自纠正、自学习"
license: MIT
version: "1.3.0"
---

# Hooks Manager

## 核心思维

**钩子不是装饰，而是铁律的物理执行者。**

铁律是规则，钩子是规则变成代码的地方。没有钩子，铁律只是文本。

## 钩子清单

| Hook | 触发时机 | 功能 |
|------|---------|------|
| session-start | 会话开始 | 铁律注入 + 状态恢复 + **自动学习分析** |
| iron-law-check | PreToolUse (Write/Edit) | IL001 版本目录 + IL005 敏感配置检查 |
| learning-update | PostToolUse (Write/Edit) | 记录操作上下文到学习日志 |
| project-pattern-writer | PostToolUse (Write/Edit) | 自动积累项目经验 |
| workflow-track | PostToolUse (Write/Edit) | 追踪工作流事件 |
| stop | 回合结束 | 保存会话状态 |
| laziness-detect | 回合结束 | 绕过话术识别 |
| pre-compact | 对话压缩前 | 保存关键上下文快照 |
| overdrive | PreToolUse (全局) | 超频模式检测 + 最高效率指令注入 |

## 数据文件

| 文件 | 用途 |
|------|------|
| `~/.claude/harness/iron-law-log.json` | 铁律违规记录 |
| `~/.claude/harness/laziness-log.json` | 偷懒模式检测 |
| `~/.claude/harness/learning-log.json` | 学习记录（操作类型、文件路径、上下文） |
| `~/.claude/harness/workflow-log.json` | 工作流事件 |
| `~/.claude/harness/analysis-report.md` | 自动生成的学习分析报告 |
| `~/.claude/harness/analysis-suggestions.json` | 机器可读优化建议 |
| `~/.claude/harness/adaptive-report.md` | 自适应优化报告 |
| `~/.claude/harness/iron-laws.yaml` | 自适应强化后的铁律配置 |
| `~/.claude/harness/last-compact.json` | 压缩前状态快照 |

## 自学习闭环

数据在钩子之间自动流动：

```
Write/Edit → iron-law-check (拦截) → iron-law-log.json
          → learning-update (记录) → learning-log.json
          → project-pattern-writer (积累) → references/project-patterns/

Stop → laziness-detect → laziness-log.json

SessionStart → 自动分析(learning-log ≥ 5 或 iron-law ≥ 3) → analysis-report.md
                                                    ↓
                              analysis-suggestions.json (机器可读)
                                                    ↓
                              adaptive-harness.mjs → iron-laws.yaml (自动强化)
                                                    ↓
                              adaptive-report.md (优化报告)
```

**自动触发条件**：
- learning-log ≥ 5 条 → 自动运行 learning-analyzer
- iron-law-log ≥ 3 条 → 自动运行 learning-analyzer
- analysis-suggestions.json 有建议 → 自动运行 adaptive-harness
- 分析报告和优化报告自动写入全局和项目版本目录

## 铁律与钩子映射

| 铁律 | 钩子 | 检查内容 |
|------|------|---------|
| IL001 | iron-law-check | 文档输出到 output/ 必须有版本号 |
| IL005 | iron-law-check | 敏感文件修改警告 |
| IL003 | laziness-detect | 完成声明必须有验证证据 |

## 快捷命令

| 你说 | 动作 |
|------|------|
| "查看钩子状态" | 列出所有钩子和日志统计 |
| "查看学习报告" | 读取 analysis-report.md |
| "查看学习日志" | 读取 learning-log.json |
| "查看铁律日志" | 读取 iron-law-log.json |
| "手动分析" | 运行 learning-analyzer.mjs |
| "清理日志" | 重置所有日志文件 |

## 内置 Skill 与 Hook 映射

| Skill | Hook 触发 | 说明 |
|-------|-----------|------|
| web-access (CDP 操作) | learning-update | CDP 操作的 curl 命令上下文被记录 |
| web-access (站点经验) | project-pattern-writer | 新发现的站点模式自动积累 |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `~/.claude/harness/iron-law-log.json` | 查看铁律触发历史时 |
| `~/.claude/harness/laziness-log.json` | 查看偷懒检测历史时 |
| `~/.claude/harness/learning-log.json` | 查看学习记录时 |
| `~/.claude/harness/analysis-report.md` | 查看最近的学习分析报告时 |
| `~/.claude/harness/workflow-log.json` | 查看工作流事件时 |
| `~/.claude/harness/last-compact.json` | 查看压缩前状态快照时 |
| `scripts/learning-analyzer.mjs` | 需要手动触发分析时 |
