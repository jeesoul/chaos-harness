---
name: task-contract
description: 任务契约管理 — 在写代码前声明意图和验收标准，事后自动验证
---

# Task Contract — 任务契约

## 什么是任务契约

在开始写代码前，AI 必须声明：
1. **要做什么**（任务描述）
2. **影响哪些文件**（scope）
3. **基于什么假设**（assumptions）
4. **完成标准是什么**（success_criteria）

契约写入 `.chaos-harness/task-contract.json`，每次写文件后自动验证。

这是 chaos-harness 对 karpathy-skills 的原创升级：不是软提示，是进程级机制。

---

## 子命令

### declare — 声明新契约

```
/chaos-harness:task-contract declare
```

引导 AI 填写：
- 任务描述（必填）
- 影响文件范围（建议填写）
- 假设前提（可选）
- 验收标准（建议填写）

**验收标准格式：**
- `file-exists:<path>` — 检查文件是否存在
- `no-new-fixme` — 新增文件中无 FIXME/TODO(critical) 标记
- `custom:<description>` — 人工确认项

**示例：**
```bash
node scripts/task-contract.mjs declare \
  --desc "实现用户登录功能" \
  --scope "src/auth/LoginService.java,src/auth/LoginController.java" \
  --assume "数据库已连接,JWT 密钥已配置" \
  --criteria "file-exists:src/auth/LoginService.java,no-new-fixme"
```

### status — 查看契约状态

```
/chaos-harness:task-contract status
```

显示当前契约的验收标准验证结果：
- ✅ 已通过
- ❌ 未通过
- ⏳ 尚未验证
- ❓ 待人工确认

### complete — 标记完成

```
/chaos-harness:task-contract complete
```

手动标记契约完成，写入学习日志。

### clear — 清除契约

```
/chaos-harness:task-contract clear
```

放弃当前契约（标记为 expired）。

---

## 工作流程

```
1. 开始任务前
   /chaos-harness:task-contract declare
   → 声明意图和验收标准

2. 写代码
   → PreToolUse: 检查是否有 active 契约（无则阻断）
   → PostToolUse: 自动验证 success_criteria

3. 查看结果
   /chaos-harness:task-contract status

4. 完成
   /chaos-harness:task-contract complete
```

---

## 自动化行为

- **PreToolUse（Write/Edit）**：无 active 契约时 exit 1 阻断，提示先声明
- **PostToolUse（Write/Edit）**：自动验证 success_criteria，更新契约状态
- **Stop（会话结束）**：active 契约超过 2 小时自动标记 expired
- **学习系统**：每次会话结束自动分析契约完成率和声明准确率

---

## 执行规则

当用户调用 `/chaos-harness:task-contract declare` 时：

1. 询问用户：这个任务要做什么？
2. 询问用户：会影响哪些文件？（可以是模式，如 `src/auth/*.java`）
3. 询问用户：有什么假设前提？（可跳过）
4. 询问用户：验收标准是什么？（建议至少一条 `file-exists` 或 `no-new-fixme`）
5. 运行：`node scripts/task-contract.mjs declare --desc "..." --scope "..." --criteria "..."`
6. 显示契约 ID 和验收标准列表

当用户调用 `/chaos-harness:task-contract status` 时：
- 运行：`node scripts/task-contract.mjs status`
- 解读输出，说明哪些标准已通过、哪些未通过、哪些需要人工确认

当用户调用 `/chaos-harness:task-contract complete` 时：
- 运行：`node scripts/task-contract.mjs complete`

当用户调用 `/chaos-harness:task-contract clear` 时：
- 运行：`node scripts/task-contract.mjs clear`
