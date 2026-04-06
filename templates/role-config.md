# Chaos Harness 用户角色配置

此文件用于自定义用户角色和阶段映射，使 Harness 适应不同团队结构。

## 默认角色定义

```yaml
# ~/.claude/harness/role-config.yaml

roles:
  # 产品角色
  product_manager:
    name: "产品经理"
    description: "负责需求收集、PRD 编写、迭代规划"
    stages:
      primary: [P01, P02, P10]    # 主导阶段
      secondary: [P03, P09]       # 参与阶段
    iron_laws:
      - IL-PRD001  # PRD 必须包含验收标准
      - IL-PRD002  # 用户故事必须可追溯
    templates:
      - prd-template
    skills:
      - product-lifecycle
      - learning-analyzer

  # 设计角色
  ux_designer:
    name: "UI/UX 设计师"
    description: "负责原型设计、交互流程、设计规范"
    stages:
      primary: [P03]
      secondary: [P02, P06]
    iron_laws:
      - IL-DESIGN001  # 设计稿需要评审
    templates:
      - design-system
    skills:
      - product-lifecycle

  # 技术角色
  architect:
    name: "架构师"
    description: "负责技术方案、架构设计、技术选型"
    stages:
      primary: [P04, P05]
      secondary: [P06, P07]
    iron_laws:
      - IL-TECH001  # 技术选型必须有对比分析
      - IL-TECH002  # API 变更需要版本管理
      - IL-TECH003  # 数据库变更需要迁移脚本
    templates:
      - architecture-template
    skills:
      - harness-generator
      - project-scanner

  tech_lead:
    name: "技术负责人"
    description: "负责技术决策、代码审查、团队协调"
    stages:
      primary: [P04, P05, P08]
      secondary: [P06, P07, P09]
    iron_laws:
      - IL-PLAN001  # 每个任务必须有负责人
      - IL-PLAN002  # 时间估算必须有依据
    skills:
      - workflow-supervisor
      - collaboration-reviewer

  # 开发角色
  frontend_dev:
    name: "前端开发"
    description: "负责前端组件开发、页面实现"
    stages:
      primary: [P06]
      secondary: [P08]
    iron_laws:
      - IL-FE001  # 组件必须有类型定义
      - IL-FE002  # 关键路径必须有测试
      - IL-FE003  # 接口调用必须有错误处理
    templates:
      - vue3
      - react
    skills:
      - auto-toolkit-installer

  backend_dev:
    name: "后端开发"
    description: "负责 API 开发、业务逻辑、数据库设计"
    stages:
      primary: [P07]
      secondary: [P06, P08]
    iron_laws:
      - IL-BE001  # API 必须有版本控制
      - IL-BE002  # 数据库操作必须有事务
      - IL-BE003  # 敏感数据必须加密
      - IL-BE004  # 所有 API 必须有鉴权
    templates:
      - java-spring
      - node-express
      - python-django
    skills:
      - auto-toolkit-installer

  full_stack_dev:
    name: "全栈开发"
    description: "负责前后端开发"
    stages:
      primary: [P06, P07]
      secondary: [P08]
    iron_laws:
      - IL-FE001
      - IL-BE001
    templates:
      - vue3
      - java-spring

  # 测试角色
  qa_engineer:
    name: "测试工程师"
    description: "负责测试策略、E2E 测试、性能测试"
    stages:
      primary: [P08]
      secondary: [P06, P07, P09]
    iron_laws:
      - IL-TEST001  # E2E 测试必须覆盖核心流程
      - IL-TEST002  # 性能测试必须有基准
      - IL-TEST003  # 安全漏洞必须修复
    skills:
      - auto-toolkit-installer
      - learning-analyzer

  # 运维角色
  devops_engineer:
    name: "运维工程师"
    description: "负责发布部署、监控告警、环境管理"
    stages:
      primary: [P09]
      secondary: [P08]
    iron_laws:
      - IL-RELEASE001  # 发布必须有回滚方案
      - IL-RELEASE002  # 发布必须有监控告警
      - IL-RELEASE003  # 发布后必须有验证
    skills:
      - workflow-supervisor

  # 管理角色
  project_manager:
    name: "项目经理"
    description: "负责进度管理、风险控制、资源协调"
    stages:
      primary: [P05, P08]
      secondary: [P01, P09, P10]
    iron_laws:
      - IL-PLAN003  # 关键路径必须有 buffer
    skills:
      - workflow-supervisor
      - project-state

  # 售前角色
  presale_engineer:
    name: "售前工程师"
    description: "负责售前方案、技术白皮书、POC 演示"
    stages:
      primary: [P01, P02, P03]
      secondary: [P04]
    iron_laws:
      - IL-PRESALE001  # 方案必须有竞品对比
      - IL-PRESALE002  # 技术白皮书必须包含案例
      - IL-PRESALE003  # 报价单需要审批
    custom_iron_laws:
      - id: IL-PRESALE001
        rule: "NO PROPOSAL WITHOUT COMPETITOR ANALYSIS"
        description: "售前方案必须包含竞品对比分析"
      - id: IL-PRESALE002
        rule: "NO WHITEPAPER WITHOUT CASE STUDY"
        description: "技术白皮书必须包含成功案例"
      - id: IL-PRESALE003
        rule: "NO QUOTE WITHOUT APPROVAL"
        description: "报价单需要技术负责人审批"
    templates:
      - proposal-template
      - whitepaper-template
      - poc-template
    skills:
      - product-lifecycle

  solution_architect:
    name: "解决方案架构师"
    description: "负责解决方案设计、技术方案输出"
    stages:
      primary: [P04, P05]
      secondary: [P01, P02]
    iron_laws:
      - IL-SOLUTION001  # 方案必须有成本估算
      - IL-SOLUTION002  # 技术选型需要对比
    skills:
      - harness-generator
      - project-scanner

  # 文档角色
  technical_writer:
    name: "技术文档工程师"
    description: "负责技术文档、API 文档、用户手册"
    stages:
      primary: [P11]  # 文档阶段
      secondary: [P04, P06, P07, P09]
    iron_laws:
      - IL-DOC001  # API 文档必须同步代码
      - IL-DOC002  # 用户手册必须有截图
      - IL-DOC003  # 变更日志必须记录 Breaking Changes
    custom_iron_laws:
      - id: IL-DOC001
        rule: "NO API DOC WITHOUT CODE SYNC"
        description: "API 文档必须与代码保持同步"
      - id: IL-DOC002
        rule: "NO USER MANUAL WITHOUT SCREENSHOTS"
        description: "用户手册必须包含操作截图"
      - id: IL-DOC003
        rule: "NO CHANGELOG WITHOUT BREAKING CHANGES"
        description: "变更日志必须标注 Breaking Changes"
    skills:
      - product-lifecycle
      - auto-toolkit-installer

  # 支持角色
  customer_success:
    name: "客户成功经理"
    description: "负责客户培训、使用指导、反馈收集"
    stages:
      primary: [P10]
      secondary: [P09, P11]
    iron_laws:
      - IL-CS001  # 培训材料必须更新
    skills:
      - learning-analyzer
      - project-state
```

---

## 自定义角色

### 添加新角色

```yaml
roles:
  # 自定义：AI 工程师
  ai_engineer:
    name: "AI 工程师"
    description: "负责 AI 模型开发、训练、部署"
    stages:
      primary: [P04, P07]
      secondary: [P08]
    iron_laws:
      - IL-AI001  # 模型必须有版本管理
      - IL-AI002  # 训练数据必须有质量检查
    custom_iron_laws:
      - id: IL-AI001
        rule: "NO MODEL WITHOUT VERSION TAG"
        description: "模型文件必须打 tag"
      - id: IL-AI002
        rule: "NO TRAINING WITHOUT DATA VALIDATION"
        description: "训练前必须验证数据质量"

  # 自定义：安全工程师
  security_engineer:
    name: "安全工程师"
    description: "负责安全审计、漏洞修复、合规检查"
    stages:
      primary: [P08]
      secondary: [P04, P09]
    iron_laws:
      - IL-SEC001  # 安全漏洞必须修复
      - IL-SEC002  # 敏感数据必须加密
```

---

## 阶段权限配置

```yaml
stage_permissions:
  # P02 需求分析
  P02:
    can_edit: [product_manager, tech_lead]
    can_view: [all]
    approval_required: true
    approvers: [product_manager, architect]

  # P04 技术方案
  P04:
    can_edit: [architect, tech_lead]
    can_view: [all]
    approval_required: true
    approvers: [architect, tech_lead]

  # P09 发布部署
  P09:
    can_edit: [devops_engineer, tech_lead]
    can_view: [all]
    approval_required: true
    approvers: [tech_lead, project_manager]
    auto_notify: [product_manager, qa_engineer]
```

---

## 通知配置

```yaml
notifications:
  # 阶段完成通知
  stage_complete:
    P02:  # PRD 完成后
      notify: [architect, ux_designer]
      message: "PRD 已完成，请进入技术方案和原型设计阶段"
    P04:  # 技术方案完成后
      notify: [frontend_dev, backend_dev]
      message: "技术方案已确定，可以开始开发"
    P08:  # 测试完成后
      notify: [product_manager, devops_engineer]
      message: "测试通过，准备发布"

  # 铁律触发通知
  iron_law_triggered:
    severity: critical:
      notify: [tech_lead, project_manager]
    severity: warning:
      notify: [current_role]
```

---

## 工作流自动化

```yaml
automation:
  # 阶段自动流转
  auto_transition:
    P01_to_P02:
      condition: "requirements_pool_approved"
      auto_start: true
      
    P02_to_P03:
      condition: "prd_approved"
      auto_notify: [ux_designer]

  # 自动任务分配
  auto_assign:
    P06:  # 前端开发
      based_on: "skill_match"
      candidates: [frontend_dev, full_stack_dev]
      
    P07:  # 后端开发
      based_on: "skill_match"
      candidates: [backend_dev, full_stack_dev]
```

---

## 使用方式

### 1. 设置当前角色

```bash
你: 设置我的角色为产品经理
Claude: [更新 role-config.yaml] 当前角色：产品经理
        可用阶段：P01, P02, P03, P10
        激活铁律：IL-PRD001, IL-PRD002
```

### 2. 查看角色权限

```bash
你: 我有哪些权限？
Claude: 当前角色：产品经理
        
        主导阶段：
        - P01 需求收集
        - P02 需求分析
        - P10 迭代优化
        
        参与阶段：
        - P03 原型设计
        - P09 验收交付
        
        铁律：
        - IL-PRD001: PRD 必须包含验收标准
        - IL-PRD002: 用户故事必须可追溯
```

### 3. 多角色协作

```bash
你: 进入 P04 技术方案阶段
Claude: 当前角色（产品经理）不是 P04 主导角色
        
        建议通知：架构师、技术负责人
        
        是否继续以观察者身份参与？
```

---

## 团队配置模板

### 小团队（1-3人）

```yaml
team:
  size: small
  roles:
    - full_stack_dev    # 全栈开发
    - product_manager   # 产品经理（兼职）
  stage_simplification:
    skip: [P02, P04, P06, P07]  # 合并简化
```

### 中型团队（3-10人）

```yaml
team:
  size: medium
  roles:
    - product_manager
    - frontend_dev
    - backend_dev
    - qa_engineer
  stage_full: true
```

### 大型团队（10+人）

```yaml
team:
  size: large
  roles:
    - product_manager
    - ux_designer
    - architect
    - tech_lead
    - frontend_dev
    - backend_dev
    - qa_engineer
    - devops_engineer
    - project_manager
  stage_full: true
  approval_workflow: true
```