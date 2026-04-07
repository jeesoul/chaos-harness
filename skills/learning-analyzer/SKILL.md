---
name: learning-analyzer
description: 分析历史学习记录，发现失败模式，生成铁律优化建议。**自动触发**：当 learning-log.json 有 5+ 条记录时，或用户说"分析学习记录"、"优化铁律"、"自学习"。触发词：学习分析、模式发现、铁律优化、自学习、闭环
---

<STATE-WRITE-REQUIRED>
**分析完成后必须写入状态：**
1. 使用 Write 工具创建/追加 `output/{version}/analysis-report.md`
2. 使用 Edit 工具更新 `.claos-harness/state.json` 标记分析已完成
3. 如果有铁律优化建议，使用 Edit 工具更新 `.chaos-harness/iron-laws.yaml`

调用 `shared/state-helpers.md` 中的函数：
- Update-Effectiveness-Log(version, analysisResult)

不写入状态 = 违反 IL003（完成声明需要验证证据）
</STATE-WRITE-REQUIRED>

# 学习分析器 (Learning Analyzer)

<IMMEDIATE-ACTION>
加载此 skill 后，立即执行以下步骤。不要等待用户进一步指示。

**注意：此 skill 只加载一次，不要重复调用 Skill 工具。**
</IMMEDIATE-ACTION>

## 铁律

```
NO LEARNING WITHOUT ANALYSIS
NO ANALYSIS WITHOUT ACTION
```

学习记录必须被分析，分析结果必须转化为行动。

## 执行步骤

### Step 1: 读取学习日志

使用 Read 工具读取：
```
output/{version}/learning-log.json
```

如果不存在，检查全局路径：
```
.claude/harness/learning-log.json
```

### Step 2: 统计失败模式

分析日志，统计：

| 模式类型 | 统计方法 |
|----------|----------|
| 铁律违规频次 | 按 iron_law 字段分组计数 |
| 失败类型聚类 | 按 type 字段分组 |
| 上下文模式 | 提取 context 高频关键词 |

输出：
```markdown
## 失败模式统计

| 铁律 | 触发次数 | 占比 |
|------|---------|------|
| IL003 | 15 | 50% |
| IL001 | 8 | 27% |
| IL005 | 5 | 17% |
| IL002 | 2 | 6% |

## 高频失败上下文
1. "完成" 但无验证证据 (12次)
2. 文档放在错误位置 (8次)
3. 敏感配置未确认 (5次)
```

### Step 3: 发现重复模式

识别需要关注的模式：

**模式 A - 重复违规：**
同一铁律在短时间内触发 3+ 次

**模式 B - 新问题：**
之前未出现的失败类型

**模式 C - 系统性问题：**
所有失败都与同一上下文相关

### Step 4: 生成优化建议

根据分析结果，生成建议：

```markdown
## 优化建议

### 高优先级

1. **新增铁律 IL-C003**
   - 规则：NO COMPLETION WITHOUT TEST OUTPUT
   - 原因：IL003 违规 50% 都是"完成无验证"
   - 具体：完成声明必须附带测试命令输出

2. **强化 IL001 检查**
   - 当前：仅在文档生成时检查
   - 建议：在每次 Write/Edit 时自动检查路径

### 中优先级

3. **改进上下文提示**
   - 在 session-start hook 中增加版本目录提示
   - 减少"文档放错位置"错误

### 待观察

4. **敏感配置模式**
   - IL005 违规较少，当前策略有效
   - 继续观察
```

### Step 5: 用户确认

使用 AskUserQuestion 工具：

```
发现 15 条学习记录，分析完成。

主要问题：
1. IL003 违规占比 50% (完成无验证)
2. 建议新增铁律 IL-C003 强制测试输出

是否应用建议？
[ ] 应用全部建议
[ ] 仅应用高优先级
[ ] 查看详细分析后决定
[ ] 暂不应用
```

### Step 6: 应用优化

如果用户同意，执行：

**新增铁律：**
使用 Edit 工具更新 `.claude/harness/iron-laws.yaml`

**强化检查：**
更新 `hooks/iron-law-check` 脚本

**改进提示：**
更新 `hooks/session-start` 脚本

### Step 7: 记录分析结果

使用 Write 工具创建：
```
output/{version}/learning-analysis-{timestamp}.md
```

内容包括：
- 分析时间
- 学习记录数量
- 发现的模式
- 生成的建议
- 用户决定
- 应用结果

## 分析周期

| 学习记录数 | 分析建议 |
|-----------|---------|
| < 5 | 继续积累 |
| 5-20 | 基础分析 |
| 20-50 | 深度分析 |
| 50+ | 专家模式 |

## 自学习闭环

```
┌─────────────────────────────────────────────────────────────┐
│                        自学习闭环                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  铁律检查 → Log-Learning-Entry → learning-log.json          │
│      ↑                                           │         │
│      │                                           ↓         │
│  应用优化 ← 用户确认 ← 发现模式 ← learning-analyzer         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 与其他 Skill 的协作

| Skill | 提供数据 | 接收建议 |
|-------|---------|---------|
| iron-law-enforcer | 铁律违规记录 | 新增铁律 |
| workflow-supervisor | 效果数据 | 流程优化 |
| harness-generator | 扫描结果 | 模板优化 |
| hooks-manager | 日志数据 | Hook 改进 |

## 输出文件

```
output/{version}/
├── learning-log.json          # 学习记录（输入）
├── learning-analysis-{ts}.md  # 分析报告（输出）
└── effectiveness-log.md       # 效果追踪（输入）
```

## 快捷命令

```
你: 分析学习记录
你: 发现了什么模式
你: 优化铁律
你: 自学习分析
你: 闭环检查
```

## 铁律检查

- **IL-AUTO-001**: 学习记录超过 20 条必须触发分析
- **IL-AUTO-002**: 分析结果必须有明确的行动建议
- **IL-AUTO-003**: 高优先级建议必须在下一 Session 前处理

## 自动触发机制

### Session 启动检测

session-start hook 会检测 learning-log.json 数量：

```
IF learning-log 记录数 >= 5 THEN
    OUTPUT: <CHAOS_HARNESS_LEARNING_TRIGGER>
    MESSAGE: "检测到学习记录 N 条，建议运行 learning-analyzer"
END IF
```

### 自动分析触发条件

| 条件 | 自动动作 |
|------|---------|
| learning-log ≥ 5 条 | session-start 提示用户 |
| learning-log ≥ 20 条 | **强制提示** + IL-AUTO-001 触发 |
| 用户说"自适应 Harness" | 自动先检查 analysis-report |
| 用户说"优化铁律" | 立即执行分析 |

### 自动应用规则

**高优先级建议自动应用：**

```
IF 建议优先级 = 高 AND 用户未明确拒绝 THEN
    AUTO_APPLY:
    1. 新增铁律 → .chaos-harness/iron-laws.yaml
    2. 强化检查 → hooks/iron-law-check
    3. 记录应用 → output/{version}/applied-optimizations.json
END IF
```

**中优先级建议需确认：**

```
IF 建议优先级 = 中 THEN
    ASK_USER: "是否应用此建议？"
    IF 用户确认 THEN AUTO_APPLY END IF
END IF
```

## 自学习闭环（完整流程）

```
┌─────────────────────────────────────────────────────────────┐
│                   自学习闭环（自动执行）                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Session 启动 → session-start hook → 检测 learning-log 数量 │
│       │                                                     │
│       ↓ ≥ 5 条                                              │
│                                                             │
│  提示用户 → 用户调用 learning-analyzer                       │
│       │                                                     │
│       ↓                                                     │
│                                                             │
│  分析学习记录 → 发现模式 → 生成建议                          │
│       │                                                     │
│       ├──────────────────────────────────┐                  │
│       │                                  │                  │
│       ↓ 高优先级                         ↓ 中优先级         │
│                                                             │
│  自动应用优化                   用户确认后应用               │
│       │                                  │                  │
│       ↓                                  ↓                  │
│                                                             │
│  harness-generator --adaptive ←─── 读取 analysis-report     │
│       │                                                     │
│       ↓                                                     │
│                                                             │
│  自适应生成 Harness → 应用优化铁律 → 下次 Session 生效       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Learning is the only sustainable competitive advantage.*