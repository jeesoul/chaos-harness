/**
 * Workflow Engine Entry Point
 *
 * M5: 工作流引擎入口整合
 * 提供统一的创建和执行接口
 */

import {
  WorkflowStage,
  ProjectScale,
  WorkflowConfig,
  WorkflowEngine,
  WorkflowState,
  WorkflowContext,
  StageResult,
  ProjectChanges,
  StageTransitionEvent,
  SupervisorAction,
  AgentTeamMember,
  LazinessPatternId,
  DEFAULT_IRON_LAWS,
  DEFAULT_ADAPTIVE_FLOW_RULES,
  DEFAULT_LAZINESS_PATTERNS
} from './types.js';

import {
  WorkflowStateMachine,
  createStateMachine,
  executeStage
} from './state-machine.js';

import {
  AgentTeamManager,
  createAgentTeamManager,
  createTeam
} from './agent-team.js';

import {
  Supervisor,
  createSupervisor,
  quickDetectLaziness,
  quickGeneratePressure
} from './supervisor.js';

import {
  determineProjectScale,
  initializeAdaptiveFlow,
  adaptWorkflow,
  getAdaptiveFlowRule,
  getMandatoryStages,
  validateSkipRequest,
  generateAdaptiveFlowRecommendation,
  formatAdaptiveRulesMarkdown
} from './adaptive-flow.js';

import {
  STAGE_ORDER,
  getStageDefinition,
  getStageIndex,
  getNextStage,
  canSkipStage,
  getRequiredRoles,
  validateStageTransition,
  formatStageMarkdown,
  getAllStagesMarkdown
} from './stages.js';

// Re-export all types and functions for convenience
export * from './types.js';
export * from './stages.js';
export * from './state-machine.js';
export * from './adaptive-flow.js';
export * from './agent-team.js';
export * from './supervisor.js';

/**
 * 工作流引擎完整实例
 */
export interface CompleteWorkflowEngine {
  stateMachine: WorkflowStateMachine;
  teamManager: AgentTeamManager;
  supervisor: Supervisor;
  context: WorkflowContext;
}

/**
 * 创建完整工作流引擎
 */
export function createWorkflow(
  config: Partial<WorkflowConfig> & {
    projectRoot?: string;
    version?: string;
    harnessPath?: string;
    fileCount?: number;
    lineCount?: number;
  }
): CompleteWorkflowEngine {
  // 自动确定项目规模（如果提供了文件数和行数）
  let projectScale: ProjectScale = config.projectScale || 'medium';

  if (config.fileCount !== undefined && config.lineCount !== undefined) {
    projectScale = determineProjectScale(config.fileCount, config.lineCount);
  }

  // 创建完整配置
  const fullConfig: WorkflowConfig = {
    projectScale,
    enableSupervisor: config.enableSupervisor ?? true,
    customStages: config.customStages,
    ironLaws: config.ironLaws || DEFAULT_IRON_LAWS
  };

  // 创建状态机
  const stateMachine = createStateMachine(fullConfig);

  // 初始化自适应流程状态
  const adaptiveStages = initializeAdaptiveFlow(projectScale);
  for (const [stage, status] of adaptiveStages) {
    if (status === 'skipped' && stage !== stateMachine.getCurrentStage()) {
      // 记录跳过的阶段
      const definition = getStageDefinition(stage);
      if (definition?.skipCondition) {
        stateMachine.skipStage(stage, definition.skipCondition);
      }
    }
  }

  // 创建Agent Team管理器
  const teamManager = createAgentTeamManager();
  teamManager.createTeam(projectScale);

  // 创建监工
  const supervisor = createSupervisor(
    DEFAULT_LAZINESS_PATTERNS,
    fullConfig.ironLaws
  );

  // 创建上下文
  const context: WorkflowContext = {
    projectRoot: config.projectRoot || process.cwd(),
    version: config.version || 'v0.1',
    harnessPath: config.harnessPath || '',
    scanResult: undefined,
    teamMembers: teamManager.members
  };

  return {
    stateMachine,
    teamManager,
    supervisor,
    context
  };
}

/**
 * 执行工作流阶段
 */
export async function executeWorkflowStage(
  engine: CompleteWorkflowEngine,
  stage: WorkflowStage,
  executor?: () => Promise<{ outputs: string[]; issues: string[] }>
): Promise<StageResult> {
  // 检查当前阶段
  const currentStage = engine.stateMachine.getCurrentStage();
  if (currentStage !== stage) {
    return {
      stage,
      success: false,
      outputs: [],
      issues: [`Cannot execute ${stage}: current stage is ${currentStage}`],
      timestamp: new Date().toISOString(),
      durationMs: 0
    };
  }

  // 分配Agent
  const assignedAgents = engine.teamManager.assignAgentsForStage(stage);

  // 如果没有executor，使用默认执行器
  const defaultExecutor = async () => {
    const definition = getStageDefinition(stage);
    return {
      outputs: definition?.outputs || [],
      issues: []
    };
  };

  // 执行阶段
  const result = await executeStage(
    engine.stateMachine,
    stage,
    executor || defaultExecutor
  );

  // 更新Agent状态
  for (const agent of assignedAgents) {
    if (result.success) {
      engine.teamManager.updateStatus(agent.id, 'completed');
    } else {
      engine.teamManager.updateStatus(agent.id, 'blocked');
    }
  }

  return result;
}

/**
 * 获取工作流状态
 */
export function getWorkflowStatus(engine: CompleteWorkflowEngine): {
  state: WorkflowState;
  progress: {
    completed: number;
    skipped: number;
    pending: number;
    blocked: number;
    inProgress: number;
    total: number;
  };
  teamStatus: {
    total: number;
    idle: number;
    working: number;
    blocked: number;
  };
  violations: number;
} {
  const state = engine.stateMachine.state;
  const progress = engine.stateMachine.getProgressSummary();
  const teamSummary = engine.teamManager.getTeamStatusSummary();
  const violations = engine.supervisor.actions.length;

  return {
    state,
    progress,
    teamStatus: {
      total: teamSummary.total,
      idle: teamSummary.idle,
      working: teamSummary.working,
      blocked: teamSummary.blocked
    },
    violations
  };
}

/**
 * 自适应调整工作流
 */
export function adaptWorkflowEngine(
  engine: CompleteWorkflowEngine,
  changes: ProjectChanges
): {
  scaleChanged: boolean;
  newScale?: ProjectScale;
  stageChanges: Array<{ stage: WorkflowStage; action: string; reason: string }>;
} {
  const currentScale = engine.stateMachine.state.projectScale;

  // 计算变更影响
  const adaptation = adaptWorkflow(engine.stateMachine.state, changes);

  if (adaptation.scaleChanged && adaptation.newScale) {
    // 更新状态机的规模
    engine.stateMachine.state.projectScale = adaptation.newScale;

    // 更新团队配置
    engine.teamManager.createTeam(adaptation.newScale);
  }

  // 应用阶段变更
  const stageChanges: Array<{ stage: WorkflowStage; action: string; reason: string }> = [];

  for (const change of adaptation.stageChanges) {
    if (change.newStatus === 'pending') {
      // 重新激活之前跳过的阶段
      engine.stateMachine.state.stages.set(change.stage, 'pending');
      stageChanges.push({
        stage: change.stage,
        action: 'reactivated',
        reason: change.reason
      });
    } else if (change.newStatus === 'skipped') {
      // 跳过新可跳过的阶段
      engine.stateMachine.skipStage(change.stage, change.reason);
      stageChanges.push({
        stage: change.stage,
        action: 'skipped',
        reason: change.reason
      });
    }
  }

  return {
    scaleChanged: adaptation.scaleChanged,
    newScale: adaptation.newScale,
    stageChanges
  };
}

/**
 * 监工检测偷懒
 */
export function supervisorDetect(
  engine: CompleteWorkflowEngine,
  agentId: string,
  context: {
    claimedCompletion?: boolean;
    ranVerification?: boolean;
    proposedFix?: boolean;
    mentionedRootCause?: boolean;
    timeElapsed?: number;
    expectedTime?: number;
    testsPassed?: boolean;
    createdVersionDir?: boolean;
    modifiedHighRiskConfig?: boolean;
    userApprovedVersion?: boolean;
    userApprovedConfig?: boolean;
  }
): {
  patterns: LazinessPatternId[];
  actions: SupervisorAction[];
} {
  const patterns = engine.supervisor.detectLaziness(agentId, context);
  const actions: SupervisorAction[] = [];

  for (const pattern of patterns) {
    const action = engine.supervisor.intervene(agentId, pattern);
    actions.push(action);

    // 记录违规到工作流状态
    engine.supervisor.logViolation(agentId, pattern, engine.stateMachine.state);
  }

  return { patterns, actions };
}

/**
 * 生成工作流Markdown报告
 */
export function generateWorkflowMarkdown(engine: CompleteWorkflowEngine): string {
  const lines: string[] = [
    '# Workflow Engine Report',
    '',
    '## Workflow State',
    '',
    engine.stateMachine.formatStateMarkdown(),
    '',
    '## Agent Team',
    '',
    engine.teamManager.formatTeamMarkdown(),
    '',
    '## Supervisor Actions',
    '',
    engine.supervisor.formatViolationReport(),
    '',
    '## Adaptive Flow Rules',
    '',
    formatAdaptiveRulesMarkdown(),
    '',
    '## Iron Laws',
    ''
  ];

  for (const ironLaw of engine.stateMachine.config.ironLaws) {
    lines.push(`- **${ironLaw.id}:** ${ironLaw.rule}`);
    lines.push(`  - Reason: ${ironLaw.reason}`);
    lines.push(`  - Enforcement: ${ironLaw.enforcement}`);
  }

  return lines.join('\n');
}

/**
 * 验证阶段跳过请求
 */
export function requestSkipStage(
  engine: CompleteWorkflowEngine,
  stage: WorkflowStage,
  reason: string
): {
  allowed: boolean;
  ironLawRef?: string;
  warning?: string;
  skipLog?: { stage: WorkflowStage; reason: string; timestamp: string };
} {
  const scale = engine.stateMachine.state.projectScale;

  // 使用自适应规则验证
  const validation = validateSkipRequest(stage, scale, reason);

  if (!validation.allowed) {
    return validation;
  }

  // 执行跳过
  const success = engine.stateMachine.skipStage(stage, reason);

  if (success) {
    const skipLog = engine.stateMachine.state.skipLog.find(s => s.stage === stage);
    return {
      allowed: true,
      warning: validation.warning,
      skipLog
    };
  }

  return {
    allowed: false,
    ironLawRef: 'IL001',
    warning: 'Skip failed - check stage status'
  };
}

/**
 * 获取下一个待执行阶段
 */
export function getNextPendingStage(engine: CompleteWorkflowEngine): WorkflowStage | null {
  const currentStage = engine.stateMachine.getCurrentStage();
  const currentStatus = engine.stateMachine.getStageStatus(currentStage);

  // 如果当前阶段已完成或跳过，找下一个
  if (currentStatus === 'completed' || currentStatus === 'skipped') {
    return getNextStage(currentStage);
  }

  // 否则继续当前阶段
  return currentStage;
}

/**
 * 重置工作流
 */
export function resetWorkflow(engine: CompleteWorkflowEngine): void {
  engine.stateMachine.reset();
  engine.teamManager.createTeam(engine.stateMachine.config.projectScale);
  engine.supervisor.actions = [];
}

/**
 * 工作流执行器类（面向对象接口）
 */
export class WorkflowExecutor {
  private engine: CompleteWorkflowEngine;

  constructor(config: Partial<WorkflowConfig> & {
    projectRoot?: string;
    version?: string;
    harnessPath?: string;
    fileCount?: number;
    lineCount?: number;
  }) {
    this.engine = createWorkflow(config);
  }

  getCurrentStage(): WorkflowStage {
    return this.engine.stateMachine.getCurrentStage();
  }

  getProgress(): {
    completed: number;
    skipped: number;
    pending: number;
    blocked: number;
    inProgress: number;
    total: number;
  } {
    return this.engine.stateMachine.getProgressSummary();
  }

  async executeStage(
    stage: WorkflowStage,
    executor?: () => Promise<{ outputs: string[]; issues: string[] }>
  ): Promise<StageResult> {
    return executeWorkflowStage(this.engine, stage, executor);
  }

  requestSkip(stage: WorkflowStage, reason: string): {
    allowed: boolean;
    ironLawRef?: string;
    warning?: string;
  } {
    return requestSkipStage(this.engine, stage, reason);
  }

  detectLaziness(agentId: string, context: {
    claimedCompletion?: boolean;
    ranVerification?: boolean;
    proposedFix?: boolean;
    mentionedRootCause?: boolean;
    timeElapsed?: number;
    expectedTime?: number;
    testsPassed?: boolean;
    createdVersionDir?: boolean;
    modifiedHighRiskConfig?: boolean;
    userApprovedVersion?: boolean;
    userApprovedConfig?: boolean;
  }): {
    patterns: LazinessPatternId[];
    actions: SupervisorAction[];
  } {
    return supervisorDetect(this.engine, agentId, context);
  }

  adapt(changes: ProjectChanges): {
    scaleChanged: boolean;
    newScale?: ProjectScale;
    stageChanges: Array<{ stage: WorkflowStage; action: string; reason: string }>;
  } {
    return adaptWorkflowEngine(this.engine, changes);
  }

  getStatus(): ReturnType<typeof getWorkflowStatus> {
    return getWorkflowStatus(this.engine);
  }

  generateReport(): string {
    return generateWorkflowMarkdown(this.engine);
  }

  reset(): void {
    resetWorkflow(this.engine);
  }

  isComplete(): boolean {
    return this.engine.stateMachine.isComplete();
  }

  getEngine(): CompleteWorkflowEngine {
    return this.engine;
  }
}

/**
 * 创建工作流执行器
 */
export function createWorkflowExecutor(
  config: Partial<WorkflowConfig> & {
    projectRoot?: string;
    version?: string;
    harnessPath?: string;
    fileCount?: number;
    lineCount?: number;
  }
): WorkflowExecutor {
  return new WorkflowExecutor(config);
}