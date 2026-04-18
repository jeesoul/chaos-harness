---
name: defense-in-depth
description: "4 层验证框架 — 入口验证、业务逻辑验证、环境守卫、调试仪表。触发词：深度防御、多层验证、defense"
license: MIT
version: "1.3.1"
---

# 多层验证系统（Defense-in-Depth）

## 核心理念

**单一验证不够，需要纵深防御。**

每层验证捕获不同类型的错误，层层叠加确保安全。

## 4 层验证框架

| 层 | 名称 | 职责 | 示例 |
|---|------|------|------|
| **Layer 1** | 入口验证 | 拒绝明显无效输入 | 空文件、错误格式 |
| **Layer 2** | 业务逻辑验证 | 确保数据对操作有意义 | 依赖检查、权限验证 |
| **Layer 3** | 环境守卫 | 防止特定上下文中的危险操作 | 生产环境删除、未提交修改 |
| **Layer 4** | 调试仪表 | 捕获法医证据 | 日志、堆栈跟踪、环境变量 |

## Layer 1: 入口验证

- 检查输入是否为空
- 验证文件格式是否正确
- 确认必需参数存在

```
if (!input) return { valid: false, reason: '输入为空' };
if (!expectedFormat(input)) return { valid: false, reason: '格式错误' };
```

## Layer 2: 业务逻辑验证

- 检查依赖关系是否满足
- 验证权限和访问控制
- 确认数据一致性

```
if (!dependenciesMet()) return { valid: false, reason: '依赖未满足' };
if (!hasPermission()) return { valid: false, reason: '权限不足' };
```

## Layer 3: 环境守卫

- 防止生产环境危险操作
- 检查未提交修改
- 验证环境配置

```
if (isProduction() && isDestructive()) return { valid: false, reason: '生产环境禁止' };
if (hasUncommittedChanges()) return { valid: false, reason: '有未提交修改' };
```

## Layer 4: 调试仪表

- 记录操作日志
- 捕获堆栈跟踪
- 保存环境变量

```
log('Operation started', { tool, input, timestamp });
try { ... } catch (e) { log('Error', { stack: e.stack, env: process.env }); }
```

## 与 Systematic Debugging 集成

Superpowers 的 4 阶段调试 + Defense-in-Depth 的 4 层验证 = 完整调试框架：

| 调试阶段 | 对应验证层 |
|---------|-----------|
| Phase 1: Root Cause Investigation | Layer 1-2 |
| Phase 2: Pattern Analysis | Layer 3 |
| Phase 3: Hypothesis and Testing | Layer 4 |
| Phase 4: Implementation | 全部层 |

## 使用场景

| 场景 | 使用层 |
|------|--------|
| 用户输入处理 | Layer 1 + 2 |
| API 调用 | Layer 1 + 2 + 3 |
| 文件修改 | Layer 1 + 2 + 3 + 4 |
| 配置变更 | Layer 1 + 2 + 3 |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `skills/systematic-debugging/SKILL.md` | 需要 4 阶段调试方法时 |
| `skills/iron-law-enforcer/SKILL.md` | 需要铁律约束检查时 |
