---
name: learning-analyzer
description: "分析历史学习记录，发现失败模式，生成铁律优化建议。触发词：学习分析、模式发现、铁律优化、自学习、闭环"
license: MIT
version: "1.3.0"
---

# 学习分析哲学

## 核心思维

**学习记录不是数据坟墓，而是行为模式的镜子。**

没有分析的学习 = 数据堆积，没有行动的分析 = 纸上谈兵。

## 自动分析

**session-start hook 已内置自动分析** — 当学习记录 ≥ 5 条或铁律触发 ≥ 3 次时，自动运行分析脚本，不需要手动触发。

手动触发命令：
```bash
node scripts/learning-analyzer.mjs
```

## 分析内容

分析脚本自动读取以下日志并生成报告：

| 数据源 | 分析内容 |
|--------|---------|
| `iron-law-log.json` | 铁律触发统计、高频违规上下文 |
| `laziness-log.json` | 偷懒模式检测统计 |
| `learning-log.json` | 操作类型分布、文件类型分布 |

## 输出

分析报告自动写入两个位置：
- 全局：`~/.claude/harness/analysis-report.md`
- 项目版本目录：`output/{version}/analysis-report.md`（如果 state.json 中有 current_version）

## 报告格式

```markdown
# 自学习分析报告

生成时间: ...

## 数据概览
- 铁律触发记录: N 条
- 偷懒检测记录: N 条
- 学习操作记录: N 条

## 铁律触发统计
- IL003: 15 次 — 典型上下文: 完成声明无验证

## 偷懒模式统计
- LP001: 5 次

## 操作类型分布
- Write: 50 次

## 文件类型分布
- java-code: 30 次

## 优化建议
🔴 [high] iron_law_reinforce: 强化 Hook 拦截规则
   铁律: IL003 (违规 15 次)
```

## 优化建议优先级

| 优先级 | 条件 | 动作 |
|--------|------|------|
| high | 同一铁律触发 3+ 次 | 强化 Hook 拦截规则 |
| medium | 偷懒模式检测 2+ 次 | 新增检测规则 |
| low | 特定文件类型操作 10+ 次 | 积累项目经验 |

## 闭环

```
行为 → learning-log.json / iron-law-log.json → 自动分析 → analysis-report.md → harness-generator --adaptive → 新行为
```

## 与 harness-generator 联动

`harness-generator --adaptive` 模式自动读取 `analysis-report.md`，根据优化建议调整铁律配置。

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `~/.claude/harness/learning-log.json` | 需要读取学习记录进行分析时 |
| `~/.claude/harness/laziness-log.json` | 需要读取偷懒检测记录时 |
| `~/.claude/harness/iron-law-log.json` | 需要读取铁律触发记录时 |
| `~/.claude/harness/analysis-report.md` | 需要查看最近的分析报告时 |
| `scripts/learning-analyzer.mjs` | 需要手动触发分析时 |
| `skills/plugin-manager/SKILL.md` | 需要应用铁律优化建议时 |
