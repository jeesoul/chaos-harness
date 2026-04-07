# Chaos Harness 项目记忆

## 项目定位

**确定性 AI Agent 约束框架** — "Chaos demands order. Harness provides it."

## 项目本质

**这是一个 Claude Code 插件，核心是 Skills，不是代码应用。**

## 核心组成

```
chaos-harness/
├── skills/             # 核心：11个 SKILL.md 文件
├── hooks/              # 核心：Hook 脚本 + hooks.json
├── templates/          # 模板：9个 harness.yaml
├── commands/           # 命令入口
├── scripts/            # 工具脚本（安装、检测）
└── tests/              # 测试文件
```

## 代码的定位

| 模块 | 是否必须 | 说明 |
|------|----------|------|
| `skills/*/SKILL.md` | ✅ **核心** | 告诉 Claude 怎么做 |
| `hooks/*.sh` | ✅ **核心** | 自动执行检查 |
| `templates/*.yaml` | ✅ **必须** | 提供 Harness 模板 |
| `src/core/mcp-server/` | ⚠️ 可选 | 支持远程调用 |
| `src/core/scanner/` | ⚠️ 边缘 | MCP Server 可调用 |
| `src/core/version-manager/` | ⚠️ 边缘 | MCP Server 可调用 |
| `src/core/harness-generator/` | ⚠️ 边缘 | MCP Server 可调用 |
| `src/core/workflow-engine/` | ⚠️ 边缘 | MCP Server 可调用 |

---

## 铁律体系（完整）

### 核心铁律（IL001-IL005）

| ID | 铁律 |
|----|------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK |
| IL002 | NO HARNESS WITHOUT SCAN RESULTS |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION |
| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT |
| IL005 | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL |

### Agent Team 铁律（IL-TEAM001-005）

| ID | 铁律 | 说明 |
|----|------|------|
| IL-TEAM001 | REVIEW REQUIRES MULTIPLE AGENTS | 评审必须多 Agent 并行 |
| IL-TEAM002 | DEVELOPMENT REQUIRES PARALLEL AGENTS | 开发必须并行 Agent |
| IL-TEAM003 | MONITORING MUST BE CONTINUOUS | 监督必须持续进行 |
| IL-TEAM004 | RESULTS REQUIRE USER CONFIRMATION | 结果必须用户确认 |
| IL-TEAM005 | NO SINGLE-THREAD DEGRADATION | 禁止单线程退化（核心） |

### Java 铁律（IL-JAVA001-004）

| ID | 铁律 | 说明 |
|----|------|------|
| IL-JAVA001 | NO CODE WITHOUT CHECKSTYLE | 代码风格规范 |
| IL-JAVA002 | NO CONTROLLER WITHOUT VO | Controller 返回固定实体 |
| IL-JAVA003 | NO SQL IN JAVA CODE | SQL 必须在 mapper.xml |
| IL-JAVA004 | NO BAD PRACTICES | 禁止 e.printStackTrace() 等 |

### 前端铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL-VUE001 | Props 只读 | 禁止修改 props |
| IL-VUE002 | Vuex mutations | 状态变更必须通过 mutation |
| IL-VUE003 | Ref.value | 响应式访问必须 .value |
| IL-REACT001 | State 不可变 | 禁止直接修改 state |
| IL-REACT002 | Effect 清理 | 必须清理副作用 |
| IL-REACT003 | Key prop | 列表必须使用唯一 key |

### 产品铁律（22 条）

- **PRD**: IL-PRD001-002（验收标准、可追溯）
- **技术**: IL-TECH001-003（选型对比、API 版本、数据库迁移）
- **计划**: IL-PLAN001-003（负责人、估算依据、buffer）
- **前端**: IL-FE001-003（类型定义、关键测试、错误处理）
- **后端**: IL-BE001-004（API 版本、事务、加密、鉴权）
- **测试**: IL-TEST001-003（E2E 覆盖、性能基准、漏洞修复）
- **发布**: IL-RELEASE001-003（回滚方案、监控告警、发布验证）

### 角色铁律

| 角色 | 铁律 |
|------|------|
| 售前工程师 | IL-PRESALE001-003（竞品对比、案例、审批） |
| 解决方案架构师 | IL-SOLUTION001-002（成本估算、技术对比） |
| 技术文档工程师 | IL-DOC001-003（代码同步、截图、Breaking Changes） |
| 客户成功经理 | IL-CS001（培训材料更新） |

---

## 用户角色支持

| 角色 | 主导阶段 | 核心铁律 |
|------|----------|----------|
| 产品经理 | P01/P02/P10 | IL-PRD001-002 |
| 售前工程师 | P01/P02/P03 | IL-PRESALE001-003 |
| 解决方案架构师 | P04/P05 | IL-SOLUTION001-002 |
| 技术文档工程师 | P11 | IL-DOC001-003 |
| 测试工程师 | P08 | IL-TEST001-003 |
| 运维工程师 | P09 | IL-RELEASE001-003 |

---

## 当前状态

- **版本**：v1.1.0
- **测试**：36个测试文件，623个测试用例 ✅
- **构建**：TypeScript 编译成功 ✅
- **安装**：命令可正常调起 ✅
- **跨平台**：Windows/Linux/macOS ✅

---

## 版本历史

| 版本 | 主要内容 |
|------|----------|
| v1.1.0 | Java SpringBoot 铁律、角色支持、跨平台修复 |
| v1.0.0 | 核心框架：Skills + Hooks + Templates |

---

## 规划中（v1.2.0+）

| 版本 | 计划内容 |
|------|----------|
| v1.2.0 | IRON-LAWS.md 范式、铁律参数精确化 |
| v1.3.0 | DESIGN.md 集成、三步使用简化 |
| v1.4.0 | 多 Agent 兼容、大厂代码基因提取 |
| v2.0.0 | 可视化编辑器、云同步 |

---

## 设计原则

1. **Skills 是核心** — 所有功能通过 SKILL.md 定义
2. **Hooks 是执行者** — 自动检查和约束
3. **代码是可选的** — 只在需要 MCP Server 时才需要
4. **保持轻量化** — 不做过度封装

---

## 参考

- superpowers (obra): https://github.com/obra/superpowers
- awesome-design-md: https://github.com/VoltAgent/awesome-design-md
- 阿里 Java 规范: https://github.com/alibaba/p3c
- GitHub: https://github.com/jeesoul/chaos-harness