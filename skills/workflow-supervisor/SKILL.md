---
name: workflow-supervisor
description: 当用户请求创建工作流、管理工作流阶段、查询工作流状态时使用此skill。触发词：工作流、阶段、流程管理、项目规模
---

# 工作流监督器 (Workflow Supervisor)

## 执行规则

**加载此 skill 后，你必须执行以下步骤：**

### Step 1: 判断项目规模

使用 Glob 和 Grep 统计：
- 文件数量
- 代码行数

根据结果判定规模：

| 规模 | 文件数 | 代码行数 |
|------|--------|---------|
| Small | ≤5 | ≤100 |
| Medium | 5-20 | 100-500 |
| Large | ≥20 | ≥500 |

### Step 2: 显示必经阶段

根据规模输出必经阶段：

**Small:** W01, W03, W08, W09, W12
**Medium:** W01, W02, W03, W05, W08, W09, W10, W12
**Large:** 全部 12 阶段

### Step 3: 创建工作流状态文件

使用 Write 工具创建 `output/{version}/workflow-state.yaml`：

```yaml
# 工作流状态
project_scale: {scale}
current_stage: W01
stages:
  W01:
    status: pending
    required: true
  W02:
    status: pending
    required: {based on scale}
  # ...
```

### Step 4: 输出当前状态

```
┌─────────────────────────────────────────────────────────────┐
│  工作流状态                                                  │
├─────────────────────────────────────────────────────────────┤
│  项目规模: {scale}                                           │
│  当前阶段: {stage}                                           │
│  必经阶段: {required stages}                                 │
│  可跳过: {skippable stages}                                  │
└─────────────────────────────────────────────────────────────┘
```

## 何时使用

**必须激活的条件：**
- 用户说 "创建工作流"
- 用户说 "查看工作流状态"
- 用户提到阶段名称如 "需求阶段"、"开发阶段"
- 用户请求跳过某个阶段

## 12 阶段工作流

```dot
digraph workflow {
    rankdir=LR;
    
    W01 [label="W01\n需求设计", shape=box];
    W02 [label="W02\n需求评审", shape=box];
    W03 [label="W03\n架构设计", shape=box];
    W04 [label="W04\n架构评审", shape=box];
    W05 [label="W05\n技术选型", shape=box];
    W06 [label="W06\nAPI设计", shape=box];
    W07 [label="W07\nAgent分配", shape=box];
    W08 [label="W08\n开发实现", shape=box];
    W09 [label="W09\n代码审查", shape=box];
    W10 [label="W10\n测试验证", shape=box];
    W11 [label="W11\n文档完善", shape=box];
    W12 [label="W12\n发布部署", shape=box];
    
    W01 -> W02 -> W03 -> W04 -> W05 -> W06 -> W07 -> W08 -> W09 -> W10 -> W11 -> W12;
}
```

## 阶段定义

| 阶段 | 名称 | 输入 | 输出 | 角色 |
|------|------|------|------|------|
| W01 | 需求设计 | 项目描述 | 需求文档 | architect |
| W02 | 需求评审 | 需求文档 | 评审报告 | architect |
| W03 | 架构设计 | 需求文档 | 架构文档 | architect |
| W04 | 架构评审 | 架构文档 | 评审报告 | architect |
| W05 | 技术选型 | 架构文档 | 技术方案 | architect |
| W06 | API设计 | 技术方案 | API文档 | backend_dev |
| W07 | Agent分配 | 全部文档 | 分配方案 | supervisor |
| W08 | 开发实现 | 设计文档 | 代码 | backend/frontend |
| W09 | 代码审查 | 代码 | 审查报告 | architect |
| W10 | 测试验证 | 代码 | 测试报告 | tester |
| W11 | 文档完善 | 全部产出 | 文档 | backend_dev |
| W12 | 发布部署 | 全部产出 | 发布包 | backend_dev |

## 自适应流程

### 项目规模判定

| 规模 | 文件数 | 代码行数 | 说明 |
|------|--------|---------|------|
| Small | ≤5 | ≤100 | 单文件/小工具 |
| Medium | 5-20 | 100-500 | 标准功能模块 |
| Large | ≥20 | ≥500 | 多模块项目 |

### 规模升级条件

即使文件数/行数未达到阈值，以下情况**必须升级到 Large**：

- 有复杂架构（微服务、分布式）
- 有多个独立模块
- 涉及多个技术栈
- 需要多团队协作

### 必经阶段配置

| 规模 | 必经阶段 | 可跳过阶段 |
|------|---------|-----------|
| Small | W01, W03, W08, W09, W12 | W02, W04, W05, W06, W07, W10, W11 |
| Medium | W01, W02, W03, W05, W08, W09, W10, W12 | W04, W06, W07, W11 |
| Large | **全部 12 阶段** | 无 |

### 铁律 IL001: 大型项目无例外

```
LARGE PROJECTS CANNOT SKIP ANY STAGE
```

大型项目所有阶段必经，不允许跳过请求。

## 状态机

### 阶段状态

```
pending → in_progress → completed
    ↓           ↓
  skipped    blocked
```

### 转换规则

| 从 | 到 | 条件 |
|---|-----|------|
| pending | in_progress | 前置阶段完成 |
| in_progress | completed | 阶段产出完成 + 验证通过 |
| pending | skipped | 用户批准 + 非必经阶段 |
| in_progress | blocked | 检测到阻塞问题 |

## 跳过请求处理

### 检查流程

```dot
digraph skip_check {
    rankdir=TB;
    
    request [label="跳过请求", shape=ellipse];
    check_scale [label="检查项目规模", shape=diamond];
    check_stage [label="检查是否必经", shape=diamond];
    check_reason [label="检查原因", shape=diamond];
    approve [label="批准跳过", shape=box];
    reject [label="拒绝跳过", shape=box];
    log [label="记录跳过日志", shape=box];
    done [label="完成", shape=ellipse];
    
    request -> check_scale;
    check_scale -> reject [label="Large项目"];
    check_scale -> check_stage [label="非Large"];
    check_stage -> reject [label="必经阶段"];
    check_stage -> check_reason [label="非必经"];
    check_reason -> approve [label="合理原因"];
    check_reason -> reject [label="不合理"];
    approve -> log;
    log -> done;
    reject -> done;
}
```

### 拒绝理由模板

**大型项目：**
```
🚫 跳过请求被拒绝

项目规模: Large
请求阶段: W02_requirements_review

铁律 IL001: 大型项目不能跳过任何阶段。

原因: 大型项目复杂度高，所有阶段都是必要的质量保障。
```

**必经阶段：**
```
🚫 跳过请求被拒绝

项目规模: Medium
请求阶段: W08_development

阶段类型: 必经阶段

原因: 此阶段是当前规模项目的必经阶段，不能跳过。
```

## 偷懒检测集成

### 检测时机

- 阶段超时（超过预期时间 150%）
- 声称完成但无产出
- 请求跳过必经阶段
- 长时间无进度更新

### 检测逻辑

```typescript
function detectWorkflowLaziness(state, context) {
  const patterns = [];

  // 检查阶段超时
  const currentStage = state.currentStage;
  const elapsed = Date.now() - state.stageStartTime;
  const expected = getStageExpectedTime(currentStage, state.scale);

  if (elapsed > expected * 1.5) {
    patterns.push({
      pattern: 'LP003',
      stage: currentStage,
      elapsed,
      expected
    });
  }

  // 检查产出缺失
  if (context.claimedCompletion && !context.hasOutput) {
    patterns.push({
      pattern: 'LP001',
      stage: currentStage
    });
  }

  return patterns;
}
```

## 工作流报告格式

```markdown
# 工作流状态报告

## 项目信息
- **规模**: Medium
- **当前阶段**: W08_development
- **开始时间**: 2026-04-02 22:00
- **已运行**: 2小时

## 阶段进度

| 阶段 | 状态 | 开始时间 | 完成时间 |
|------|------|---------|---------|
| W01 需求设计 | ✅ 完成 | 22:00 | 22:30 |
| W02 需求评审 | ⏭️ 跳过 | - | - |
| W03 架构设计 | ✅ 完成 | 22:30 | 23:00 |
| W04 架构评审 | ⏭️ 跳过 | - | - |
| W05 技术选型 | ✅ 完成 | 23:00 | 23:15 |
| W06 API设计 | ⏭️ 跳过 | - | - |
| W07 Agent分配 | ⏭️ 跳过 | - | - |
| W08 开发实现 | 🔄 进行中 | 23:15 | - |
| W09 代码审查 | ⏳ 待开始 | - | - |
| W10 测试验证 | ⏳ 待开始 | - | - |
| W11 文档完善 | ⏭️ 跳过 | - | - |
| W12 发布部署 | ⏳ 待开始 | - | - |

## 跳过日志
| 阶段 | 原因 | 批准时间 |
|------|------|---------|
| W02 | 小型评审无需独立阶段 | 22:25 |
| W04 | 架构已在W03中评审 | 23:00 |

## 违规记录
无

## 建议
1. W08 阶段已运行 45 分钟，请确保进度正常
2. 完成后记得运行测试验证
```

## 铁律检查

| 铁律 | 检查项 |
|------|--------|
| IL001 | 大型项目不允许跳过任何阶段 |
| IL003 | 阶段完成需要验证证据 |
| IL004 | 更改工作流配置需要用户同意 |