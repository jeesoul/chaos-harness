# Chaos Harness

<p align="center">
  <img src="https://img.shields.io/badge/version-1.4.0-blue.svg">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
  <img src="https://img.shields.io/badge/tests-14%2F14%20passing-brightgreen.svg">
  <img src="https://img.shields.io/badge/integrations-Superpowers%20%7C%20OpenSpec%20%7C%20Everything-orange.svg">
</p>

<p align="center"><strong>AI 开发流程操作系统</strong></p>
<p align="center"><em>Your AI dev team, finally has an operating system.</em></p>
<p align="center"><em>Chaos demands order. Harness provides it.</em></p>

---

## 一句话定位

> 整合最优秀的 AI 开发框架，让 AI 从"不可控的天才"变成"可验证的工程"。

## 核心定位

Chaos Harness v1.4.0 不是又一个 AI 约束框架，是**让所有 AI 开发框架能一起工作的操作系统**。

- **Superpowers** 负责自动拆任务、子代理调度
- **OpenSpec** 负责变更提案、规范驱动
- **Everything** 负责最佳实践配置、Agent 库
- **chaos-harness** 负责真验证、硬拦截、失败恢复

## 架构

```
L1 编排层: orchestrator + overdrive + workflow-supervisor
    ↓
L2 规划层: product-lifecycle + product-manager + prd-validator
    ↓
L3 能力层: ui-generator + test-assistant + web-access + java-checkstyle
    ↓
L4 验证层: gate-system + iron-law-enforcer + recovery + validator
```

## 核心能力

### Gate 状态机（6 阶段强制流程）

```
G0 问题定义 → G1 方案设计 → G2 任务拆分 → G3 实现 → G4 测试 → G5 发布
```

每个 Gate 有明确产出、必要字段、checksum 锁定。**不能跳过，不能回退，不能篡改。**

### 真验证（不是关键词匹配）

| 验证器 | 做什么 |
|--------|--------|
| artifact | 产出文件存在且有内容 |
| content | 必要字段完整性 |
| checksum | SHA-256 文件未被篡改 |
| code | lint + type check 通过 |
| test | 测试真的跑过且通过 |

### 硬拦截（不是打印警告）

Gate 未通过时，PreToolUse Hook **直接 exit 1 阻断**，不是打印一段话提醒。

### 失败恢复

检测失败类型 → 判断恢复策略 → 自动回退/重试/超频拆分 → 生成恢复计划。

## 安装

```bash
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
git checkout v1.4.0
```

## 与 v1.3.0 的对比

| 维度 | v1.3.0 | v1.4.0 |
|------|--------|--------|
| 定位 | AI 约束框架 | AI 开发流程操作系统 |
| 核心 | 23 个 Skill（prompt） | Gate 状态机 + 真验证 |
| 拦截 | 关键词打印警告 | exit 1 硬拦截 |
| 测试 | 0 个 | 14 个全部通过 |
| 集成 | 无 | Superpowers + OpenSpec + Everything |
| 代码 | 18 个 mjs | 18 个 mjs（核心 9 个全新重写） |
| CI | 无 | GitHub Actions |

## 许可证

MIT
