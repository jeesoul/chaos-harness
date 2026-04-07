# Chaos Harness 状态记录与关联检查报告

## 1. 状态文件清单

### 全局状态（~/.claude/harness/）

| 文件 | 用途 | 状态 | 问题 |
|------|------|------|------|
| `iron-law-log.json` | 铁律触发日志 | ✅ 存在 | - |
| `learning-log.json` | 学习记录日志 | ✅ 存在 | - |
| `laziness-log.json` | 偷懒模式日志 | ⚠️ 定义了但未使用 | 需要集成到 supervisor |
| `workflow-log.json` | 工作流追踪日志 | ⚠️ 定义了但未使用 | 需要集成到 workflow-supervisor |
| `plugin-log.json` | 插件日志 | ✅ 存在 | hooks/session-start 使用 |
| `trigger-log.json` | 触发日志 | ✅ 存在 | auto-context 使用 |

### 项目级状态（.chaos-harness/）

| 文件 | 用途 | 状态 | 问题 |
|------|------|------|------|
| `state.json` | 项目状态 | ✅ 统一 | - |
| `scan-result.json` | 扫描缓存 | ✅ 存在 | - |
| `decisions-log.json` | 决策记录 | ⚠️ 定义了但未使用 | 需要集成 |
| `harness.yaml` | Harness 配置 | ✅ 存在 | - |

### 版本级状态（output/{version}/）

| 文件 | 用途 | 状态 | 问题 |
|------|------|------|------|
| `effectiveness-log.md` | 效果追踪 | ⚠️ 定义了但未自动写入 | 需要阶段完成时写入 |
| `learning-log.json` | 学习记录 | ⚠️ 定义了但未自动写入 | 需要铁律触发时写入 |
| `review-log.md` | 评审日志 | ⚠️ 定义了但未自动写入 | 需要评审完成时写入 |

---

## 2. Skills 状态记录检查

| Skill | 状态记录 | 铁律检查 | 效果追踪 | 问题 |
|-------|---------|---------|---------|------|
| overview | ❌ 无 | ✅ 有 | ❌ 无 | 无状态记录 |
| project-scanner | ✅ scan-result.json | ❌ 无 | ❌ 无 | 缺少效果追踪 |
| version-locker | ✅ state.json | ✅ 有 | ❌ 无 | 缺少效果追踪 |
| harness-generator | ✅ harness.yaml | ✅ 有 | ❌ 无 | 缺少效果追踪 |
| workflow-supervisor | ✅ state.json | ✅ 有 | ⚠️ 定义未实现 | 需要自动写入 effectiveness-log |
| iron-law-enforcer | ✅ iron-law-log.json | ✅ 有 | ✅ 有 | - |
| agent-team-orchestrator | ⚠️ 未持久化 | ✅ 有 | ⚠️ 定义未实现 | 需要写入 effectiveness-log |
| collaboration-reviewer | ⚠️ 未持久化 | ✅ 有 | ❌ 无 | 需要写入 review-log |
| auto-context | ✅ trigger-log.json | ❌ 无 | ❌ 无 | - |
| project-state | ✅ state.json | ❌ 无 | ❌ 无 | - |
| learning-analyzer | ✅ learning-log.json | ✅ 有 | ❌ 无 | - |
| plugin-manager | ❌ 无 | ❌ 无 | ❌ 无 | 无状态记录 |
| hooks-manager | ❌ 无 | ❌ 无 | ❌ 无 | 只读取不写入 |
| auto-toolkit-installer | ⚠️ 镜像配置 | ❌ 无 | ❌ 无 | 缺少状态记录 |
| product-lifecycle | ✅ 各阶段输出 | ✅ 有 | ⚠️ 定义未实现 | 需要自动写入 effectiveness-log |
| java-checkstyle | ❌ 无 | ✅ 有 | ❌ 无 | 缺少状态记录 |

---

## 3. Skills 关联系统检查

### 当前关联定义

```
workflow-supervisor (阶段变化)
    ↓ 推荐（非自动）
agent-team-orchestrator (启动 Team)
    ↓
├── collaboration-reviewer (评审)
├── 技术栈模板 skill (开发)
└── iron-law-enforcer (违规记录)
    ↓
learning-analyzer (分析)
```

### 关联缺失问题

| 关联 | 状态 | 问题 |
|------|------|------|
| project-scanner → harness-generator | ⚠️ 手动 | 应该扫描后自动推荐生成 Harness |
| harness-generator → workflow-supervisor | ⚠️ 手动 | Harness 生成后应启动工作流 |
| version-locker → 所有输出 skill | ❌ 未定义 | 版本锁定后应自动传递版本信息 |
| iron-law-enforcer → learning-analyzer | ⚠️ 定义未实现 | 违规应自动触发学习分析 |
| collaboration-reviewer → workflow-supervisor | ⚠️ 定义未实现 | 评审完成应更新工作流状态 |
| auto-toolkit-installer → 测试相关 skill | ❌ 未定义 | 工具安装后应通知测试 skill |

---

## 4. 需要修复的问题

### 高优先级

1. **effectiveness-log 未自动写入**
   - workflow-supervisor 阶段完成时
   - agent-team-orchestrator Agent Team 执行后
   - collaboration-reviewer 评审完成后
   - product-lifecycle 阶段完成后

2. **workflow-log.json 未使用**
   - 需要在 workflow-supervisor 中实现写入

3. **laziness-log.json 未使用**
   - 需要在 agent-team-orchestrator supervisor 中实现写入

4. **状态更新链路断裂**
   - 评审完成 → 工作流状态更新（缺失）
   - 铁律触发 → 学习日志写入（缺失）
   - 阶段完成 → effectiveness-log 写入（缺失）

### 中优先级

1. **自动关联触发未实现**
   - project-scanner 完成后应自动推荐 harness-generator
   - iron-law-enforcer 触发后应自动调用 learning-analyzer

2. **版本信息传递断裂**
   - version-locker 创建版本后
   - 其他 skill 应自动使用版本信息

---

## 5. 修复计划

### Phase 1: 补全状态写入

1. 创建 shared/state-helpers.md 定义通用状态写入函数
2. 每个 skill 完成时调用对应的状态写入函数
3. 统一状态文件格式

### Phase 2: 建立关联触发

1. 定义 skill 间的触发协议
2. 实现"完成后自动推荐下一个 skill"
3. 建立事件总线机制

### Phase 3: 完善效果追踪

1. 所有阶段完成后写入 effectiveness-log
2. 所有违规触发后写入 learning-log
3. 所有 Agent Team 执行后写入监控报告