/**
 * Workflow Engine Types
 *
 * M5: 工作流引擎类型定义
 * 支持自适应流程（小型/中型/大型项目）
 */

/**
 * 工作流阶段 (12阶段)
 */
export type WorkflowStage =
  | 'W01_requirements_design'      // 需求设计
  | 'W02_requirements_review'      // 需求评审
  | 'W03_architecture_design'      // 架构设计
  | 'W04_architecture_review'      // 架构评审
  | 'W05_detail_design'           // 详情文档
  | 'W06_api_design'              // 接口文档
  | 'W07_agent_allocation'        // Agent分配
  | 'W08_development'             // 开发执行
  | 'W09_code_review'             // 代码评审
  | 'W10_test_version'            // 提交测试版本
  | 'W11_automated_test'          // 自动化测试
  | 'W12_release';                // 发布

/**
 * 项目规模
 */
export type ProjectScale = 'small' | 'medium' | 'large';

/**
 * 阶段状态
 */
export type StageStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'skipped';

/**
 * Agent角色
 */
export type AgentRole =
  | 'architect'        // 架构师
  | 'backend_dev'      // 后端开发
  | 'frontend_dev'     // 前端开发
  | 'tester'           // 测试工程师
  | 'supervisor';      // 监工

/**
 * 偷懒模式ID
 */
export type LazinessPatternId =
  | 'LP001' // 声称完成但无验证证据
  | 'LP002' // 跳过根因分析直接修复
  | 'LP003' // 长时间无产出
  | 'LP004' // 试图跳过测试
  | 'LP005' // 擅自更改版本号
  | 'LP006'; // 自动处理高风险配置

/**
 * 工作流阶段定义
 */
export interface StageDefinition {
  id: WorkflowStage;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  canSkip: boolean;
  skipCondition?: string;
  requiredRoles: AgentRole[];
}

/**
 * Agent Team成员
 */
export interface AgentTeamMember {
  id: string;
  name: string;
  role: AgentRole;
  responsibilities: string[];
  skills: string[];
  status: 'idle' | 'working' | 'blocked' | 'completed';
  currentTask?: string;
}

/**
 * 偷懒模式检测
 */
export interface LazinessPattern {
  id: LazinessPatternId;
  description: string;
  detectionMethod: string;
  handlingMethod: string;
  severity: 'warning' | 'critical';
}

/**
 * 工作流状态
 */
export interface WorkflowState {
  currentStage: WorkflowStage;
  projectScale: ProjectScale;
  stages: Map<WorkflowStage, StageStatus>;
  agentTeam: AgentTeamMember[];
  skipLog: Array<{ stage: WorkflowStage; reason: string; timestamp: string }>;
  violations: Array<{ agent: string; pattern: LazinessPatternId; timestamp: string }>;
}

/**
 * 铁律定义
 */
export interface IronLaw {
  id: string;
  rule: string;
  reason: string;
  enforcement: string;
}

/**
 * 工作流配置
 */
export interface WorkflowConfig {
  projectScale: ProjectScale;
  enableSupervisor: boolean;
  customStages?: Partial<StageDefinition>[];
  ironLaws: IronLaw[];
}

/**
 * 工作流引擎
 */
export interface WorkflowEngine {
  state: WorkflowState;
  config: WorkflowConfig;
  transitionTo(nextStage: WorkflowStage): boolean;
  canTransition(nextStage: WorkflowStage): boolean;
  skipStage(stage: WorkflowStage, reason: string): boolean;
  getCurrentStage(): WorkflowStage;
  getStageStatus(stage: WorkflowStage): StageStatus;
}

/**
 * 阶段执行结果
 */
export interface StageResult {
  stage: WorkflowStage;
  success: boolean;
  outputs: string[];
  issues: string[];
  timestamp: string;
  durationMs: number;
}

/**
 * 项目变更（用于自适应流程调整）
 */
export interface ProjectChanges {
  filesAdded: number;
  filesModified: number;
  linesAdded: number;
  linesDeleted: number;
  complexityIncrease: boolean;
}

/**
 * 阶段转换事件
 */
export interface StageTransitionEvent {
  from: WorkflowStage;
  to: WorkflowStage;
  timestamp: string;
  reason: string;
  approvedBy?: string;
}

/**
 * 监工介入动作
 */
export interface SupervisorAction {
  agentId: string;
  pattern: LazinessPatternId;
  action: 'warn' | 'pause' | 'block' | 'pressure';
  message: string;
  timestamp: string;
}

/**
 * 工作流执行上下文
 */
export interface WorkflowContext {
  projectRoot: string;
  version: string;
  harnessPath: string;
  scanResult?: unknown;
  teamMembers?: AgentTeamMember[];
}

/**
 * 自适应流程规则
 */
export interface AdaptiveFlowRule {
  scale: ProjectScale;
  definition: string;
  mandatoryStages: WorkflowStage[];
  mergeableStages: Array<[WorkflowStage, WorkflowStage]>;
  skippableStages: WorkflowStage[];
}

/**
 * 默认自适应流程规则
 */
export const DEFAULT_ADAPTIVE_FLOW_RULES: AdaptiveFlowRule[] = [
  {
    scale: 'small',
    definition: '文件≤5、代码≤100行',
    mandatoryStages: ['W08_development', 'W09_code_review', 'W10_test_version', 'W11_automated_test', 'W12_release'],
    mergeableStages: [['W01_requirements_design', 'W02_requirements_review'], ['W03_architecture_design', 'W04_architecture_review']],
    skippableStages: ['W07_agent_allocation']
  },
  {
    scale: 'medium',
    definition: '文件5-20、代码100-500行',
    mandatoryStages: ['W01_requirements_design', 'W03_architecture_design', 'W05_detail_design', 'W07_agent_allocation', 'W08_development', 'W09_code_review', 'W11_automated_test', 'W12_release'],
    mergeableStages: [['W02_requirements_review', 'W04_architecture_review']],
    skippableStages: ['W06_api_design']
  },
  {
    scale: 'large',
    definition: '文件≥20、代码≥500行',
    mandatoryStages: [
      'W01_requirements_design', 'W02_requirements_review', 'W03_architecture_design', 'W04_architecture_review',
      'W05_detail_design', 'W06_api_design', 'W07_agent_allocation', 'W08_development',
      'W09_code_review', 'W10_test_version', 'W11_automated_test', 'W12_release'
    ],
    mergeableStages: [],
    skippableStages: []
  }
];

/**
 * 默认铁律
 */
export const DEFAULT_IRON_LAWS: IronLaw[] = [
  {
    id: 'IL001',
    rule: 'NO WORKFLOW STEP SKIP WITHOUT EXPLICIT USER CONSENT',
    reason: 'Skipping steps leads to incomplete work and hidden issues',
    enforcement: 'Each skip must be logged with user approval'
  },
  {
    id: 'IL002',
    rule: 'NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE',
    reason: 'Stale verification is unreliable',
    enforcement: 'Run verification commands immediately before claiming completion'
  },
  {
    id: 'IL003',
    rule: 'NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST',
    reason: 'Fixing symptoms masks underlying problems',
    enforcement: 'Document root cause before proposing fix'
  },
  {
    id: 'IL004',
    rule: 'NO VERSION CHANGES WITHOUT USER CONFIRMATION',
    reason: 'Version changes affect documentation structure',
    enforcement: 'Prompt user before creating new version directory'
  },
  {
    id: 'IL005',
    rule: 'NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT EXPLICIT APPROVAL',
    reason: 'Private repos and credentials are sensitive',
    enforcement: 'List modifications and wait for approval'
  }
];

/**
 * 默认偷懒模式定义
 */
export const DEFAULT_LAZINESS_PATTERNS: LazinessPattern[] = [
  {
    id: 'LP001',
    description: '声称完成但无验证证据',
    detectionMethod: 'Agent说完成但未运行验证命令',
    handlingMethod: '阻止进入下一阶段',
    severity: 'critical'
  },
  {
    id: 'LP002',
    description: '跳过根因分析直接修复',
    detectionMethod: 'Agent提出修复未提及根因',
    handlingMethod: '暂停，要求调查',
    severity: 'critical'
  },
  {
    id: 'LP003',
    description: '长时间无产出',
    detectionMethod: '任务超预期时间50%',
    handlingMethod: '发送施压消息',
    severity: 'warning'
  },
  {
    id: 'LP004',
    description: '试图跳过测试',
    detectionMethod: 'Agent说完成但测试未通过',
    handlingMethod: '阻止提交',
    severity: 'critical'
  },
  {
    id: 'LP005',
    description: '擅自更改版本号',
    detectionMethod: '创建新版本目录未获同意',
    handlingMethod: '删除非法目录',
    severity: 'critical'
  },
  {
    id: 'LP006',
    description: '自动处理高风险配置',
    detectionMethod: '修改私服/认证未获确认',
    handlingMethod: '撤销修改',
    severity: 'critical'
  }
];