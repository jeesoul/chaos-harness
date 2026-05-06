# /chaos-harness:task-contract

任务契约管理 — 在写代码前声明意图和验收标准，事后自动验证。

## 用途

- 在开始写代码前声明任务意图（做什么、影响哪些文件、完成标准）
- 每次写文件后自动验证验收标准
- 会话结束后统计契约完成率，写入学习日志

## 子命令

```
/chaos-harness:task-contract declare   # 声明新契约
/chaos-harness:task-contract status    # 查看当前契约状态
/chaos-harness:task-contract complete  # 标记契约完成
/chaos-harness:task-contract clear     # 清除当前契约
```

## 验收标准格式

| 格式 | 说明 |
|------|------|
| `file-exists:<path>` | 检查文件是否存在 |
| `no-new-fixme` | 新增文件中无 FIXME/TODO(critical) |
| `custom:<description>` | 人工确认项 |

## 使用示例

```bash
# 声明契约
node scripts/task-contract.mjs declare \
  --desc "实现用户登录功能" \
  --scope "src/auth/LoginService.java" \
  --criteria "file-exists:src/auth/LoginService.java,no-new-fixme"

# 查看状态
node scripts/task-contract.mjs status

# 完成
node scripts/task-contract.mjs complete
```

## 自动化行为

- **PreToolUse**：无 active 契约时 exit 1 阻断写文件操作
- **PostToolUse**：自动验证 success_criteria，更新契约状态
- **Stop**：active 契约超过 2 小时自动标记 expired
- **学习系统**：每次会话结束自动分析契约完成率

## 与 Gate 系统的关系

Task Contract 是 Gate 系统的事前补充：

```
声明契约（事前）→ AI 执行 → Gate 验证（事后）→ 学习系统记录
```

Gate 验证代码质量（测试/覆盖率/安全），Task Contract 验证任务意图（做了什么、是否符合声明）。

## 相关命令

- `/gate-manager status` — 查看 Gate 状态
- `/chaos-harness:overview` — 系统概览
