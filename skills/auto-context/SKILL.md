---
name: auto-context
description: 智能场景感知。**自动检测当前操作并推荐相关 Skills/铁律**。始终激活的后台助手
---

# 智能场景感知 (Auto Context)

## 自动触发规则

此 skill 在以下情况下**自动激活**，无需用户手动调用：

### 文件操作感知

| 操作 | 文件类型 | 自动推荐 |
|------|---------|---------|
| 写 PRD 文档 | `*PRD*.md`, `*需求*.md` | product-lifecycle |
| 写 Vue 组件 | `*.vue` | vue2/vue3 模板铁律 |
| 写 React 组件 | `*.jsx`, `*.tsx` | react 模板铁律 |
| 写 API 文档 | `*api*.md`, `swagger.*` | IL-TECH002 |
| 写数据库脚本 | `*.sql`, `*migration*` | IL-TECH003, IL-BE002 |
| 写测试文件 | `*.test.*, *.spec.*` | 测试覆盖率检查 |
| 写配置文件 | `.env`, `*config*` | IL005 |

### 上下文关联

```yaml
# 当检测到以下场景时的自动关联

场景: 写 Vue 文件
检测: package.json → vue version
关联:
  vue ^2.: → IL-VUE001, IL-VUE002
  vue ^3.: → IL-VUE001, IL-VUE003
推荐模板: templates/vue2/ 或 templates/vue3/

场景: 写 API 文档
检测: 输出路径包含 "api"
关联: IL-TECH002 (API 版本管理)
推荐: templates/product-lifecycle/api-design.md

场景: 数据库变更
检测: *.sql, migration 文件夹
关联:
  - IL-TECH003 (迁移脚本)
  - IL-BE002 (事务管理)
  - IL-BE003 (敏感数据加密)

场景: 测试覆盖率低
检测: coverage report < 80%
关联: IL-TEST001 (E2E 测试覆盖)
警告: "测试覆盖率低于 80%，建议增加测试"

场景: 版本目录缺失
检测: output/ 下无 vX.Y 目录
关联: IL001
推荐: version-locker skill
```

---

## 输出格式

### 推荐输出

```
<HARNESS_RECOMMEND>
📌 **自动推荐:** 检测到 Vue 3 项目，已加载 Vue3 模板铁律

**触发命令:** `/chaos-harness:vue3-template`
</HARNESS_RECOMMEND>
```

### 铁律激活

```
<HARNESS_IRON_LAW>
⚡ **铁律激活:** IL-VUE001
> Ref 需要 .value 赋值
</HARNESS_IRON_LAW>
```

### 警告输出

```
<HARNESS_WARNING>
⚠️ 测试覆盖率低于 80%: 当前 65%
**建议:** 增加测试用例以提高覆盖率
</HARNESS_WARNING>
```

---

## 场景检测逻辑

### 1. 文件路径分析

```bash
# 检测 Vue 组件
*.vue → 检查 package.json → 判断 Vue2/Vue3

# 检测 React 组件
*.jsx, *.tsx → 加载 React 铁律

# 检测 PRD 文档
*PRD*, *需求*, *requirement* → 推荐 product-lifecycle

# 检测 API 文档
*api*, *swagger*, *openapi* → 加载 IL-TECH002
```

### 2. 内容分析

```bash
# 检测数据库操作关键字
ALTER TABLE, DROP TABLE, migration → IL-TECH003

# 检测敏感配置
.env, secret, credential, password → IL005

# 检测测试相关
.test., .spec., describe, it → 测试覆盖率检查
```

### 3. 项目状态分析

```bash
# 检测版本锁定
output/ 存在但无 vX.Y/ → 推荐 version-locker

# 检测 Harness 状态
无 harness.yaml → 推荐 harness-generator

# 检测工作流状态
无 workflow-state.yaml → 推荐 workflow-supervisor
```

---

## 与其他 Skills 的联动

```
context-aware-trigger (Hook)
        ↓
    检测场景
        ↓
┌───────┴───────┐
↓               ↓
推荐 Skill   激活铁律
↓               ↓
用户确认    自动执行
↓               ↓
└───────┬───────┘
        ↓
    learning-update (记录)
```

---

## 自动触发场景清单

| 场景 | 触发条件 | 推荐内容 |
|------|---------|---------|
| 新项目首次运行 | 无 VERSION-LOCK | version-locker |
| 前端开发 | *.vue, *.jsx, *.tsx | 对应模板铁律 |
| 后端开发 | *.java, *.py, *.go | 对应模板铁律 |
| API 设计 | *api*.md | IL-TECH002 |
| 数据库设计 | *.sql, *migration* | IL-TECH003 |
| 测试编写 | *.test.*, *.spec.* | 覆盖率检查 |
| 文档输出 | output/*.md (无版本) | IL001 |
| 敏感配置 | .env, *secret* | IL005 |
| PRD 编写 | *PRD*, *需求* | product-lifecycle |
| 原型设计 | *prototype*, *design* | product-lifecycle P03 |

## 工作流阶段自动触发

以下阶段到达时，**自动加载对应 skill 并启动 Agent Team**：

| 工作流阶段 | 自动触发 | Agent Team 配置 |
|-----------|---------|----------------|
| W02 需求评审 | agent-team-orchestrator | product_manager + architect + user_advocate |
| W04 架构评审 | agent-team-orchestrator | architect + security_expert + senior_dev |
| W07 Agent分配 | agent-team-orchestrator | 自动拆分任务，分配开发 Agent |
| W08 开发实现 | agent-team-orchestrator | 并行开发 Agent + Supervisor 监控 |
| W09 代码审查 | agent-team-orchestrator | code_reviewer + security_reviewer + perf_reviewer |

**触发机制**：
```
workflow-supervisor 更新阶段状态
    ↓
auto-context 检测到阶段变化
    ↓
判断是否为 Agent Team 阶段 (W02/W04/W07/W08/W09)
    ↓
是 → 自动加载 agent-team-orchestrator
    ↓
agent-team-orchestrator 自动启动 Agent Team
```

---

## 配置自定义场景

用户可以在 `.claude/harness/auto-context.yaml` 中添加自定义触发规则：

```yaml
custom_triggers:
  - name: "GraphQL API"
    pattern: "*.graphql"
    recommend:
      skill: "api-design"
      iron_laws:
        - IL-TECH002
      message: "检测到 GraphQL schema，建议遵循 API 版本管理"

  - name: "Docker 配置"
    pattern: "Dockerfile*"
    recommend:
      iron_laws:
        - IL-RELEASE001
      message: "检测到 Dockerfile，确保有回滚方案"
```

---

## 日志记录

所有自动触发记录保存在 `~/.claude/harness/trigger-log.json`：

```json
[
  {
    "timestamp": "2026-04-06T19:45:00Z",
    "type": "skill_recommend",
    "target": "vue3-template",
    "message": "检测到 Vue 3 项目，已加载 Vue3 模板铁律",
    "file": "src/components/Button.vue"
  },
  {
    "timestamp": "2026-04-06T19:46:00Z",
    "type": "iron_law",
    "target": "IL-VUE001",
    "message": "Ref 需要 .value 赋值",
    "file": "src/components/Button.vue"
  }
]
```