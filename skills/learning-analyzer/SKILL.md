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

## 分析流程

### 1. 读取学习日志

路径：`~/.claude/harness/learning-log.json`

### 2. 统计失败模式

按铁律 ID 分组计数，提取高频失败上下文。输出格式：

```markdown
## 失败模式统计
| 铁律 | 触发次数 | 占比 |
|------|---------|------|
| IL003 | 15 | 50% |

## 高频失败上下文
1. "完成" 但无验证证据 (12次)
```

### 3. 识别模式

| 模式 | 判定 |
|------|------|
| 重复违规 | 同一铁律触发 3+ 次 |
| 新问题 | 之前未出现的失败类型 |
| 系统性问题 | 所有失败与同一上下文相关 |

### 4. 生成优化建议

按优先级分类：
- **高**：同一铁律频繁违规 → 需要强化或新增铁律
- **中**：提示不足 → 改进 Hook 提示
- **待观察**：低频问题 → 继续收集数据

### 5. 用户确认 → 应用

高优先级建议默认自动应用（用户未拒绝时），中优先级需确认。

## 自动触发

session-start hook 已内置检测：learning-log 达到 5+ 条时自动提示。

| 记录数 | 行为 |
|--------|------|
| < 5 | 继续积累 |
| 5-20 | 基础分析 |
| 20+ | 深度分析 |

## 闭环

```
行为 → learning-log.json → 分析 → 建议 → 应用 → 新行为
```

应用后清空已分析的记录，开始新一轮积累。

## 状态记录

分析完成后，追加记录：

```bash
echo '{"type":"learning_analysis","records_analyzed":15,"patterns_found":3,"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' | \
  jq -s '.' >> ~/.claude/harness/learning-log.json 2>/dev/null || true
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `~/.claude/harness/learning-log.json` | 需要读取学习记录进行分析时 |
| `~/.claude/harness/laziness-log.json` | 需要读取偷懒检测记录时 |
| `~/.claude/harness/iron-law-log.json` | 需要读取铁律触发记录时 |
| `skills/plugin-manager/SKILL.md` | 需要应用铁律优化建议时 |
