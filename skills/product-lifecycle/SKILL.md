---
name: product-lifecycle
description: "产品全生命周期管理。**从需求到发布的完整研发流程 Harness**。触发词：PRD、需求分析、原型设计、研发规划、产品迭代、发布流程、研发流程"
license: MIT
---

<STATE-WRITE-REQUIRED>
**阶段变更后必须写入状态：**
1. 使用 Edit 工具更新 `.chaos-harness/state.json` 的产品阶段状态
2. 使用 Edit 工具更新 `output/{version}/product-state.yaml`
3. 使用 Edit 工具追加到 `~/.claude/harness/workflow-log.json`

调用 `shared/state-helpers.md` 中的函数：
- Update-Stage-Status(stage, status)

不写入状态 = 违反 IL003（完成声明需要验证证据）
</STATE-WRITE-REQUIRED>

# 产品全生命周期管理 (Product Lifecycle)

## 执行规则

加载此 skill 后：

1. **检测当前阶段** — 读取 `output/{version}/product-state.yaml`，存在则恢复，不存在则从 P01 开始
2. **执行当前阶段** — 根据阶段编号执行对应流程（见 10 阶段定义）
3. **阶段完成后** — 执行自验证 → 写入阶段记忆 → 更新 product-state.yaml → 触发学习记录

## 10 阶段研发流程

P01 需求收集 → P02 需求分析 → P03 原型设计 → P04 技术方案 → P05 开发规划 → P06 前端开发 → P07 后端开发 → P08 集成测试 → P09 验收交付 → P10 迭代优化 → （回到 P01 下一迭代）

***

## P01: 需求收集

### 输入
- 用户访谈记录
- 市场调研数据
- 竞品分析报告
- 业务方需求描述

### 活动

1. **需求来源识别**
   - 用户反馈渠道：客服、问卷、访谈
   - 数据分析：埋点数据、用户行为
   - 业务目标：KPI、战略规划
   - 竞品动态：功能对比、差异化

2. **需求池构建**
   - 使用 Write 创建 `output/{version}/requirements/pool.md`
   - 分类：功能性、非功能性、优化类
   - 优先级：P0(必须) / P1(重要) / P2(一般) / P3(可选)

3. **干系人识别**
   - 产品负责人
   - 技术负责人
   - 设计师
   - 测试负责人

### 输出
- `output/{version}/requirements/pool.md` - 需求池
- `output/{version}/requirements/sources.md` - 需求来源分析
- `output/{version}/stakeholders.md` - 干系人列表

### 验证检查点
- [ ] 需求来源是否标注清晰？
- [ ] 每个需求是否有优先级？
- [ ] 干系人是否全部识别？
- [ ] 需求是否可追溯到来源？

### 记忆写入
```yaml
# output/{version}/memory/P01-memory.yaml
stage: P01
completed_at: {timestamp}
requirements_count: {count}
priority_distribution:
  P0: {count}
  P1: {count}
  P2: {count}
  P3: {count}
stakeholders: [list]
key_insights: [关键发现]
```

***

## P02: 需求分析

### 输入
- 需求池
- 需求来源分析
- 干系人列表

### 活动

1. **PRD 编写**
   - 使用模板 `templates/product-lifecycle/prd-template.md`
   - 包含：背景、目标、用户故事、功能清单、非功能需求
   - 写入 `output/{version}/docs/PRD.md`

2. **关键信息识别**
   - 核心功能点（MVP）
   - 业务规则
   - 数据实体
   - 用户角色权限

3. **优先级排序**
   - Kano 模型分类：基本型、期望型、兴奋型
   - 价值/成本矩阵
   - MVP 范围确定

4. **风险评估**
   - 技术风险
   - 业务风险
   - 资源风险

### 输出
- `output/{version}/docs/PRD.md` - 产品需求文档
- `output/{version}/requirements/mvp-scope.md` - MVP 范围定义
- `output/{version}/requirements/risk-assessment.md` - 风险评估报告

### 验证检查点
- [ ] PRD 是否完整？（背景、目标、功能、非功能）
- [ ] MVP 范围是否明确？
- [ ] 每个功能是否可测试？
- [ ] 风险是否有应对方案？
- [ ] 干系人是否确认？

### 铁律检查
| 铁律 | 检查项 |
|------|--------|
| IL-PRD001 | PRD 必须包含验收标准 |
| IL-PRD002 | 用户故事必须可追溯 |
| IL-PRD003 | 技术方案变更需要记录原因 |

### 记忆写入
```yaml
# output/{version}/memory/P02-memory.yaml
stage: P02
completed_at: {timestamp}
prd_version: {version}
mvp_features: [MVP 功能列表]
risk_count: {count}
stakeholder_approved: true/false
```

***

## P03: 原型设计

### 输入
- PRD 文档
- MVP 范围
- 用户角色定义
- 项目扫描结果（前端框架检测）

### 活动

1. **信息架构设计**
   - 导航结构
   - 页面层级
   - 内容分类

2. **交互流程设计**
   - 用户旅程地图
   - 核心流程图
   - 异常流程处理

3. **UI 生成（ui-generator）**
   - 加载 `ui-generator` skill（触发词：生成界面、UI生成、生成组件）
   - 检测前端框架：读取 `package.json` 中的 dependencies，识别 Vue3/React/Vue2
   - **IL002 前置检查**：必须有项目扫描结果（`.chaos-harness/scan-result.json`）才能生成
   - 从 PRD 的用户故事中推导页面清单（每个用户故事 → 至少一个页面组件）
   - 生成每个页面组件的可运行代码，必须符合检测到的前端框架规范
   - 生成结果必须通过 iron-law-check 铁律检查
   - 启动 dev server（`npm run dev` 或 `vite`），获取 localhost 端口
   - 通过 web-access CDP 打开 `http://localhost:{port}` 预览（CDP 前需 `check-deps.mjs` 通过）
   - **验证成功标准**：CDP 截图页面可见核心 UI 元素（文本、按钮、表单），无控制台报错
   - 如 dev server 不可用或项目无前端框架，回退到生成静态 HTML 原型
   - 写入生成日志到 `output/{version}/design/generated-ui-log.md`

4. **原型与规范（可选，无框架项目或需要补充时）**
   - 低保真原型（手绘/Axure）
   - 高保真原型（Figma/Sketch）
   - 设计规范（颜色、字体、组件）

5. **设计评审（强制 Multi-Agent）**

   **IL-TEAM001: 评审必须多 Agent，不得单 Agent 自检**

   设计产出物（信息架构 + 交互流程 + 生成的 UI 组件）完成后，必须启动 multi-agent 评审：

   - **product_manager**: 需求覆盖率、用户故事完整性、PRD 可追溯性
   - **user_advocate**: 用户体验、可访问性、交互合理性
   - **designer** 或 **architect**: 设计规范一致性、技术可行性

   **评审通过标准**：
   - 所有 Agent 评分 ≥ 7
   - 无高风险项
   - 用户确认接受

   **评审不通过** → 退回 Step 3（UI 生成）修改 → 重新评审

   **自动触发**：设计产出物生成后，auto-context 自动检测到并推荐启动 Agent Team，用户确认后执行。

### 输出
- `output/{version}/design/ia-diagram.md` - 信息架构图
- `output/{version}/design/user-flow.md` - 用户流程图
- `output/{version}/design/prototypes/` - 原型文件目录
  - `{page-name}/` - 每个页面的生成代码（Vue/React 组件）
  - `index.html` - 静态 HTML 原型（无框架项目回退）
- `output/{version}/design/design-system.md` - 设计规范（可选）
- `output/{version}/design/generated-ui-log.md` - UI 生成日志

### 验证检查点
- [ ] 核心流程是否覆盖所有用户角色？
- [ ] 异常流程是否有处理方案？
- [ ] 设计是否符合品牌规范？
- [ ] 原型是否可交互演示？
- [ ] 干系人是否签字确认？
- [ ] 生成的 UI 组件是否通过 CDP 预览验证？
- [ ] **Multi-Agent 设计评审是否通过？**（IL-TEAM001）

### 工具集成
- **ui-generator**：从需求直接生成可运行的前端界面（Step 3）
- **ui-ux-pro-max**：UI/UX 设计评审（Step 5）
- **web-access CDP**：浏览器原型预览（验证生成结果，Step 3 验证环节）

### 记忆写入
```yaml
# output/{version}/memory/P03-memory.yaml
stage: P03
completed_at: {timestamp}
screens_count: {count}
user_flows: [流程列表]
design_review_passed: true/false
revision_count: {count}
# ui-generator 新增字段
ui_generated: true/false
generated_framework: Vue3/React/Vue2/none
generated_components: [组件名称列表]
cdp_preview_passed: true/false
cdp_preview_url: http://localhost:{port}
# multi-agent 评审字段
design_review_agents: [agent角色列表]
design_review_score: 平均分
design_review_passed: true/false
design_review_risks: [风险项]
```

***

## P04: 技术方案

### 输入
- PRD 文档
- 原型设计
- 现有系统架构

### 活动

1. **架构设计**
   - 系统架构图
   - 数据架构
   - 部署架构
   - 技术选型理由

2. **API 设计**
   - 接口列表
   - 请求/响应格式
   - 错误码定义
   - 接口文档（OpenAPI）

3. **数据库设计**
   - ER 图
   - 表结构定义
   - 索引设计
   - 数据迁移方案

4. **技术评审（强制 Multi-Agent）**

   **IL-TEAM001: 评审必须多 Agent，不得单 Agent 自检**

   技术产出物（架构文档 + API 设计 + 数据库设计）完成后，必须启动 multi-agent 评审：

   - **architect**: 架构合理性、可扩展性、模块边界
   - **security_expert**: 安全风险、数据泄露、权限漏洞
   - **senior_dev**: 实现可行性、技术债务、性能隐患

   **评审通过标准**：
   - 所有 Agent 评分 ≥ 7
   - 无高风险项
   - 用户确认接受

   **评审不通过** → 退回对应步骤修改 → 重新评审

   **自动触发**：技术产出物生成后，auto-context 自动检测到并推荐启动 Agent Team，用户确认后执行。

5. **技术风险评估**
   - 性能瓶颈
   - 安全风险
   - 依赖风险

### 输出
- `output/{version}/tech/architecture.md` - 架构设计文档
- `output/{version}/tech/api-design.md` - API 设计文档
- `output/{version}/tech/database-design.md` - 数据库设计
- `output/{version}/tech/tech-review.md` - 技术评审报告

### 验证检查点
- [ ] 架构是否支持扩展？
- [ ] API 是否符合 RESTful 规范？
- [ ] 数据库设计是否满足第三范式？
- [ ] 是否有性能测试方案？
- [ ] 安全方案是否完整？
- [ ] **Multi-Agent 技术评审是否通过？**（IL-TEAM001）

### 铁律检查
| 铁律 | 检查项 |
|------|--------|
| IL-TECH001 | 技术选型必须有对比分析 |
| IL-TECH002 | API 变更需要版本管理 |
| IL-TECH003 | 数据库变更需要迁移脚本 |

### 记忆写入
```yaml
# output/{version}/memory/P04-memory.yaml
stage: P04
completed_at: {timestamp}
tech_stack:
  frontend: {tech}
  backend: {tech}
  database: {tech}
api_count: {count}
tech_review_passed: true/false
# multi-agent 评审字段
tech_review_agents: [agent角色列表]
tech_review_score: 平均分
tech_review_passed: true/false
tech_review_risks: [风险项]
```

***

## P05: 开发规划

### 输入
- 技术方案
- MVP 范围
- 团队资源

### 活动

1. **任务分解**
   - 前端任务列表
   - 后端任务列表
   - 依赖关系图

2. **里程碑规划**
   - 阶段划分
   - 时间估算
   - 关键路径

3. **资源分配**
   - 人员分配
   - 环境准备
   - 工具配置

4. **风险预案**
   - 风险清单
   - 应对措施
   - 回滚方案

### 输出
- `output/{version}/plan/task-breakdown.md` - 任务分解
- `output/{version}/plan/milestones.md` - 里程碑计划
- `output/{version}/plan/resource-allocation.md` - 资源分配
- `output/{version}/plan/risk-plan.md` - 风险预案

### 验证检查点
- [ ] 任务是否可独立交付？
- [ ] 依赖关系是否明确？
- [ ] 时间估算是否合理？
- [ ] 资源是否充足？
- [ ] 是否有 buffer 时间？

### 铁律检查
| 铁律 | 检查项 |
|------|--------|
| IL-PLAN001 | 每个任务必须有负责人 |
| IL-PLAN002 | 时间估算必须有依据 |
| IL-PLAN003 | 关键路径必须有 buffer |

### 记忆写入
```yaml
# output/{version}/memory/P05-memory.yaml
stage: P05
completed_at: {timestamp}
total_tasks: {count}
frontend_tasks: {count}
backend_tasks: {count}
milestones: [里程碑列表]
estimated_duration: {days}
```

***

## P06: 前端开发

### 输入
- 原型设计
- API 文档
- 任务分解

### 活动

1. **环境搭建**
   - 项目初始化
   - 依赖安装
   - 开发服务器配置

2. **组件开发**
   - 基础组件
   - 业务组件
   - 页面组件

3. **接口联调**
   - Mock 数据
   - 接口对接
   - 错误处理

4. **样式实现**
   - 响应式布局
   - 主题配置
   - 动画效果

5. **单元测试**
   - 组件测试
   - 工具函数测试
   - 覆盖率报告

### 输出
- `src/` - 源代码目录
- `output/{version}/dev/frontend-log.md` - 开发日志
- `output/{version}/test/frontend-coverage.md` - 测试覆盖率

### 验证检查点
- [ ] 组件是否可复用？
- [ ] 是否有代码审查？
- [ ] 单元测试覆盖率 ≥ 80%？
- [ ] 是否有性能优化？
- [ ] 是否有错误边界？

### 铁律检查
| 铁律 | 检查项 |
|------|--------|
| IL-FE001 | 组件必须有 PropTypes/TypeScript 类型 |
| IL-FE002 | 关键路径必须有测试 |
| IL-FE003 | 接口调用必须有错误处理 |

### 自动化验证
```bash
# 运行前端检查
npm run lint
npm run test
npm run build
```

### 记忆写入
```yaml
# output/{version}/memory/P06-memory.yaml
stage: P06
completed_at: {timestamp}
components_count: {count}
pages_count: {count}
test_coverage: {percentage}
bundle_size: {size}
```

***

## P07: 后端开发

### 输入
- API 设计文档
- 数据库设计
- 任务分解

### 活动

1. **数据库实现**
   - 表创建
   - 索引创建
   - 迁移脚本

2. **API 实现**
   - Controller 层
   - Service 层
   - Repository 层

3. **业务逻辑**
   - 核心业务
   - 数据验证
   - 异常处理

4. **单元测试**
   - Service 测试
   - Repository 测试
   - 集成测试

5. **接口文档**
   - Swagger/OpenAPI
   - 示例请求
   - 错误码说明

### 技术栈默认规范（强制）

**技术方案为 SpringBoot 时，必须执行以下默认规范：**

| 场景 | 默认技术 | 说明 |
|------|----------|------|
| 全新项目用户未指定 | **MyBatis-Plus** | 必须使用，无例外 |
| SQL 实现 | **mapper.xml** | 禁止代码写 SQL |
| 分页查询 | **mapper.xml** | 必须在 XML 中实现 |

**⚠️ 执行 P07 前必须加载 `java-checkstyle` skill！**

### 输出
- `src/` - 源代码目录
- `src/main/resources/mapper/` - Mapper XML 目录（强制）
- `output/{version}/dev/backend-log.md` - 开发日志
- `output/{version}/test/backend-coverage.md` - 测试覆盖率
- `output/{version}/docs/api-docs.md` - API 文档

### 验证检查点
- [ ] API 是否符合设计？
- [ ] 是否有参数校验？
- [ ] 是否有事务管理？
- [ ] 单元测试覆盖率 ≥ 80%？
- [ ] 是否有性能测试？
- [ ] **所有 public 方法有 Javadoc？**
- [ ] **SQL 全在 mapper.xml？**
- [ ] **分页查询在 mapper.xml？**
- [ ] **Controller 返回固定 VO（禁止 Map）？**

### 铁律检查
| 铁律 | 检查项 |
|------|--------|
| IL-BE001 | API 必须有版本控制 |
| IL-BE002 | 数据库操作必须有事务 |
| IL-BE003 | 敏感数据必须加密 |
| IL-BE004 | 所有 API 必须有鉴权 |
| **IL-JAVA001** | **代码风格规范（checkstyle）** |
| **IL-JAVA002** | **Controller 返回固定 VO** |
| **IL-JAVA003** | **SQL 必须在 mapper.xml** |
| **IL-JAVA004** | **禁止 e.printStackTrace() 等** |

### 自动化验证
```bash
# 运行后端检查
./mvnw test
./mvnw verify

# 检查 mapper.xml 是否存在（分页必须有）
ls src/main/resources/mapper/*.xml
```

### 记忆写入
```yaml
# output/{version}/memory/P07-memory.yaml
stage: P07
completed_at: {timestamp}
api_count: {count}
entities_count: {count}
test_coverage: {percentage}
db_migrations: [migration list]
```

***

## P08: 集成测试

### 输入
- 前端代码
- 后端代码
- 测试用例
- PRD 用户故事（用于推导 E2E 场景）

### 活动

1. **E2E 测试（混合模式：webapp-testing + web-access）**

   **webapp-testing（Playwright）**：执行结构化、可重复的自动化测试用例
   - 用户场景测试（登录 → 操作 → 验证结果）
   - 关键路径测试（核心业务流程）
   - 异常流程测试（错误输入、网络异常）
   - 适合：稳定场景、回归测试、CI/CD 集成

   **web-access（CDP）**：灵活验证、需要登录态/交互的场景
   - 需要登录态的操作（后台管理、个人中心）
   - 截图验证（页面渲染正确性）
   - 动态内容验证（懒加载、实时数据）
   - 适合：一次性验证、复杂交互、视觉检查

   **组合策略**：
   - 核心流程用 Playwright 写自动化用例（持久化）
   - 临时验证用 CDP 快速检查（无需写代码）
   - 视觉回归用 CDP 截图对比（visual-regression skill）

2. **接口测试**
   - 接口响应验证（状态码、响应体结构）
   - 边界值测试（空值、超长、特殊字符）
   - 并发测试（同时请求、竞态条件）

3. **性能测试**
   - 负载测试（正常并发）
   - 压力测试（极限并发）
   - 性能基准（响应时间基线）

4. **安全测试**
   - 漏洞扫描（XSS、CSRF、SQL 注入）
   - 权限测试（越权访问、角色权限）
   - 敏感数据验证（密码加密、Token 安全）

5. **兼容性测试**
   - 浏览器兼容（Chrome/Firefox/Safari）
   - 设备兼容（Desktop/Tablet/Mobile）
   - 系统兼容（Windows/macOS/Linux）

6. **可视化回归测试（可选，新增）**
   - 基准截图建立（核心页面多分辨率）
   - 当前 vs 基准像素对比
   - 差异区域标注和确认
   - 使用 visual-regression skill + web-access CDP

### 输出
- `output/{version}/test/e2e-report.md` - E2E 测试报告
- `output/{version}/test/api-test-report.md` - 接口测试报告
- `output/{version}/test/performance-report.md` - 性能测试报告
- `output/{version}/test/security-report.md` - 安全测试报告
- `output/{version}/test/visual-regression-report.md` - 可视化回归报告（可选）

### 验证检查点
- [ ] E2E 测试是否通过？（Playwright + CDP 混合验证）
- [ ] 接口测试覆盖率 ≥ 90%？
- [ ] 性能是否满足 SLA？
- [ ] 安全漏洞是否修复？
- [ ] 是否有回归测试？
- [ ] **核心页面是否通过视觉回归检查？**（可选）

### 铁律检查
| 铁律 | 检查项 |
|------|--------|
| IL-TEST001 | E2E 测试必须覆盖核心流程 |
| IL-TEST002 | 性能测试必须有基准 |
| IL-TEST003 | 安全漏洞必须修复 |

### 工具集成
- **webapp-testing**：Playwright 结构化自动化测试（持久化用例）
- **web-access CDP**：灵活浏览器操作、登录态验证、截图对比（临时验证）
- **visual-regression**：可视化回归测试（截图对比）
- **test-assistant**：测试用例生成、覆盖率检查、回归报告对比

### 记忆写入
```yaml
# output/{version}/memory/P08-memory.yaml
stage: P08
completed_at: {timestamp}
e2e_cases: {count}
e2e_passed: {count}
api_tests: {count}
api_passed: {count}
performance_score: {score}
security_issues: {count}
# 可视化回归字段（新增）
visual_regression_passed: true/false
visual_baseline_pages: [页面列表]
visual_diff_pages: [差异页面列表]
```

***

## P09: 验收交付

### 输入
- 测试报告
- 用户手册
- 发布清单

### 活动

1. **UAT 验收**
   - 产品验收
   - 设计验收
   - 业务验收

2. **文档完善**
   - 用户手册
   - 运维手册
   - API 文档

3. **发布准备**
   - 发布清单
   - 回滚方案
   - 监控配置

4. **上线部署**
   - 灰度发布
   - 全量发布
   - 发布验证

5. **发布复盘**
   - 发布记录
   - 问题回顾
   - 经验总结

### 输出
- `output/{version}/release/checklist.md` - 发布清单
- `output/{version}/release/rollback-plan.md` - 回滚方案
- `output/{version}/docs/user-manual.md` - 用户手册
- `output/{version}/docs/ops-manual.md` - 运维手册
- `output/{version}/release/release-note.md` - 发布说明

### 验证检查点
- [ ] UAT 是否通过？
- [ ] 文档是否完整？
- [ ] 回滚方案是否验证？
- [ ] 监控告警是否配置？
- [ ] 发布是否成功？

### 铁律检查
| 铁律 | 检查项 |
|------|--------|
| IL-RELEASE001 | 发布必须有回滚方案 |
| IL-RELEASE002 | 发布必须有监控告警 |
| IL-RELEASE003 | 发布后必须有验证 |

### 记忆写入
```yaml
# output/{version}/memory/P09-memory.yaml
stage: P09
completed_at: {timestamp}
uat_passed: true/false
release_time: {timestamp}
rollback_tested: true/false
monitoring_configured: true/false
issues_found: [list]
```

***

## P10: 迭代优化

### 输入
- 发布数据
- 用户反馈
- 监控数据

### 活动

1. **数据分析**
   - 用户行为分析
   - 功能使用率
   - 转化漏斗

2. **用户反馈收集**
   - 用户评价
   - 客服反馈
   - 社交媒体

3. **问题复盘**
   - 线上问题
   - 性能问题
   - 用户体验问题

4. **迭代规划**
   - 优化项收集
   - 优先级排序
   - 下版本规划

5. **知识沉淀**
   - 技术沉淀
   - 业务沉淀
   - 流程优化

### 输出
- `output/{version}/iteration/data-analysis.md` - 数据分析报告
- `output/{version}/iteration/user-feedback.md` - 用户反馈汇总
- `output/{version}/iteration/retrospective.md` - 复盘报告
- `output/{version}/iteration/next-version-plan.md` - 下版本规划

### 验证检查点
- [ ] 数据分析是否完整？
- [ ] 用户反馈是否收集？
- [ ] 问题是否有改进方案？
- [ ] 是否有下版本规划？
- [ ] 知识是否沉淀？

### 自学习触发
```yaml
# 触发 learning-analyzer
patterns:
  - 迭代中发现的问题
  - 用户反馈的高频问题
  - 开发过程中的瓶颈
```

### 记忆写入
```yaml
# output/{version}/memory/P10-memory.yaml
stage: P10
completed_at: {timestamp}
data_insights: [关键洞察]
user_feedback_count: {count}
issues_fixed: {count}
next_version_features: [list]
lessons_learned: [经验教训]
```

***

## 状态管理

### product-state.yaml

```yaml
# output/{version}/product-state.yaml
version: {version}
product_name: {name}
current_stage: P01
stages:
  P01:
    status: completed
    completed_at: {timestamp}
    outputs: [file list]
  P02:
    status: in_progress
    started_at: {timestamp}
  P03:
    status: pending
  # ...
overall_progress: 10%
estimated_completion: {date}
```

### 阶段状态机

```
pending → in_progress → completed
    ↓           ↓
  blocked    needs_revision
```

***

## 自学习机制

### 学习记录

每个阶段完成后，使用 `shared/helpers.md#Log-Learning-Entry` 写入：

```json
{
  "stage": "P06",
  "timestamp": "2026-04-06T19:30:00Z",
  "duration_minutes": 120,
  "blockers": ["API 接口变更"],
  "solutions": ["与后端同步接口文档"],
  "insights": ["接口 Mock 数据要提前准备"],
  "iron_law_triggered": ["IL-FE003"]
}
```

### 学习分析

使用 `learning-analyzer` 分析：
- 各阶段耗时分布
- 高频阻塞原因
- 铁律触发模式
- 改进建议

### 规则优化

基于学习数据优化：
- 阶段检查点调整
- 铁律规则补充
- 模板更新
- 工具推荐

***

## 铁律汇总

| ID | 铁律 | 阶段 |
|----|------|------|
| IL-PRD001 | PRD 必须包含验收标准 | P02 |
| IL-PRD002 | 用户故事必须可追溯 | P02 |
| IL-PRD003 | 技术方案变更需要记录原因 | P02 |
| IL-TECH001 | 技术选型必须有对比分析 | P04 |
| IL-TECH002 | API 变更需要版本管理 | P04 |
| IL-TECH003 | 数据库变更需要迁移脚本 | P04 |
| IL-PLAN001 | 每个任务必须有负责人 | P05 |
| IL-PLAN002 | 时间估算必须有依据 | P05 |
| IL-PLAN003 | 关键路径必须有 buffer | P05 |
| IL-FE001 | 组件必须有类型定义 | P06 |
| IL-FE002 | 关键路径必须有测试 | P06 |
| IL-FE003 | 接口调用必须有错误处理 | P06 |
| IL-BE001 | API 必须有版本控制 | P07 |
| IL-BE002 | 数据库操作必须有事务 | P07 |
| IL-BE003 | 敏感数据必须加密 | P07 |
| IL-BE004 | 所有 API 必须有鉴权 | P07 |
| IL-TEST001 | E2E 测试必须覆盖核心流程 | P08 |
| IL-TEST002 | 性能测试必须有基准 | P08 |
| IL-TEST003 | 安全漏洞必须修复 | P08 |
| IL-RELEASE001 | 发布必须有回滚方案 | P09 |
| IL-RELEASE002 | 发布必须有监控告警 | P09 |
| IL-RELEASE003 | 发布后必须有验证 | P09 |

***

## 工具集成

| 阶段 | 工具 | 用途 |
|------|------|------|
| P03 | ui-ux-pro-max | UI/UX 设计评审 |
| P06 | webapp-testing | 前端自动化测试 |
| P07 | superpowers:systematic-debugging | 后端调试 |
| P08 | webapp-testing + superpowers-chrome | E2E 测试 + 性能分析 |
| P10 | learning-analyzer | 迭代分析 |

***

## 输出目录结构

| 目录 | 内容 |
|------|------|
| `requirements/` | pool.md, sources.md, mvp-scope.md, risk-assessment.md |
| `docs/` | PRD.md, api-docs.md, user-manual.md, ops-manual.md |
| `design/` | ia-diagram.md, user-flow.md, prototypes/, design-system.md |
| `tech/` | architecture.md, api-design.md, database-design.md, tech-review.md |
| `plan/` | task-breakdown.md, milestones.md, resource-allocation.md, risk-plan.md |
| `dev/` | frontend-log.md, backend-log.md |
| `test/` | frontend-coverage.md, backend-coverage.md, e2e-report.md, api-test-report.md, performance-report.md, security-report.md |
| `release/` | checklist.md, rollback-plan.md, release-note.md |
| `iteration/` | data-analysis.md, user-feedback.md, retrospective.md, next-version-plan.md |
| `memory/` | P01-memory.yaml, P02-memory.yaml, ... |
| 根目录 | product-state.yaml, VERSION-LOCK, learning-log.json |

***

## 自适应规则

### 项目规模自适应

| 规模 | 阶段裁剪 | 文档要求 |
|------|---------|---------|
| Small | P01, P02, P06, P08, P09 | 精简 PRD |
| Medium | P01-P09 | 完整文档 |
| Large | P01-P10 | 完整文档 + 详细设计 |

### 团队角色自适应

| 角色 | 主导阶段 |
|------|---------|
| 产品经理 | P01, P02, P10 |
| 设计师 | P03 |
| 架构师 | P04, P05 |
| 前端开发 | P06 |
| 后端开发 | P07 |
| 测试工程师 | P08 |
| 运维工程师 | P09 |

### 技术栈自适应

根据项目扫描结果自动选择：
- 前端框架模板
- 后端框架模板
- 测试框架配置
- 部署方案

***

## 效果追踪

使用 `shared/helpers.md#Update-Effectiveness-Log` 写入：

```markdown
# output/{version}/effectiveness-log.md

## 阶段效果统计

| 阶段 | 耗时 | 阻塞次数 | 铁律触发 | 评分 |
|------|------|---------|---------|------|
| P01 | 2h | 0 | 0 | ⭐⭐⭐⭐⭐ |
| P02 | 4h | 1 | 2 | ⭐⭐⭐⭐ |
| P03 | 8h | 2 | 1 | ⭐⭐⭐ |
| ... | ... | ... | ... | ... |

## 改进建议

1. P03 阶段阻塞较多，建议提前准备原型工具
2. IL-FE003 触发频繁，建议增加接口 Mock 流程
```

***

**自学习闭环：**
```
P01-P10执行 → 阶段记忆 → learning-log.json
                ↓                    ↓
         效果追踪 ← learning-analyzer ←
                ↓
         规则优化 → 下次迭代
```

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `shared/state-helpers.md` | 需要状态管理函数（update_stage_status, log_learning_entry, update_effectiveness_log）时 |
| `output/{version}/product-state.yaml` | 读取当前产品阶段状态时 |
| `output/{version}/memory/{stage}-memory.yaml` | 读取历史阶段记忆时 |
| `~/.claude/harness/learning-log.json` | 读取学习记录进行自学习分析时 |
| `templates/product-lifecycle/` | 读取 PRD 等模板文件时 |
