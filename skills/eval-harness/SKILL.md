---
name: eval-harness
description: "评测驱动开发框架 — pass@k 指标、能力/回归评测、三种评分器。触发词：评测、pass@k、回归、能力、评分器、eval"
license: MIT
version: "1.3.1"
---

# 评测驱动开发（Eval Harness）

## 核心理念

**评测不是事后验证，而是开发指南。**

每次功能开发前先定义评测标准，开发过程中持续执行评测，用数据驱动质量改进。

## pass@k 指标

| 指标 | 定义 | 用途 | 目标 |
|------|------|------|------|
| **pass@1** | 第一次尝试成功率 | 衡量初始质量 | > 70% |
| **pass@3** | 3 次尝试内至少一次成功 | 衡量可修复性 | > 90% |
| **pass^3** | 连续 3 次都成功 | 衡量可靠性 | 100%（关键路径） |

## 评测类型

### 能力评测（Capability Eval）

测试新功能是否满足需求：

```markdown
[CAPABILITY EVAL: add-authentication]
任务：实现用户注册、登录、会话管理
成功标准：
  - [ ] 用户可以用邮箱/密码注册
  - [ ] 用户可以用有效凭证登录
  - [ ] 无效凭证被拒绝并显示适当错误
  - [ ] 会话在页面重新加载后持续
  - [ ] 登出清除会话
预期输出：完整的认证模块，测试通过率 > 90%
```

### 回归评测（Regression Eval）

确保新改动不破坏现有功能：

```markdown
[REGRESSION EVAL: add-authentication]
基准：SHA abc123
测试：
  - existing-login-flow: PASS/FAIL
  - existing-session-mgmt: PASS/FAIL
  - existing-logout-flow: PASS/FAIL
结果：3/3 通过（之前为 3/3）
```

## 三种评分器

| 评分器 | 类型 | 示例 |
|--------|------|------|
| **代码评分器** | 确定性检查 | shell 命令检查函数存在 |
| **模型评分器** | 开放式评估 | Claude 评估代码质量（1-5 分） |
| **人工评分器** | 手动审查 | 标记为 `[HUMAN REVIEW REQUIRED]` |

## 命令

| 命令 | 描述 |
|------|------|
| `/eval-harness status` | 显示评测状态 |
| `/eval-harness list [type]` | 列出评测 |
| `/eval-harness report <eval-id>` | 生成评测报告 |
| `/eval-harness export [output-file]` | 导出评测 |
| `/eval-harness import <input-file>` | 导入评测 |

## 数据存储

```
evals/
├── capability/          # 能力评测定义
├── regression/          # 回归评测定义
└── results/
    ├── registry.json    # 评测主注册表
    └── eval-log.jsonl   # 评测执行日志
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `evals/results/registry.json` | 需要读取评测数据时 |
| `scripts/eval-utils.mjs` | 需要操作评测数据时 |
| `scripts/eval-collector.mjs` | 查看 Hook 采集逻辑时 |
| `evals/capability/` | 需要查看能力评测定义时 |
| `evals/regression/` | 需要查看回归评测定义时 |
