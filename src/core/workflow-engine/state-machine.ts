/**
 * Workflow State Machine
 *
 * M5: 工作流状态机实现
 * 支持阶段转换、跳过检查、状态管理
 */

import {
  WorkflowStage,
  StageStatus,
  WorkflowState,
  WorkflowConfig,
  WorkflowEngine,
  StageResult,
  StageTransitionEvent,
  IronLaw,
  DEFAULT_IRON_LAWS
} from './types.js';
import {
  STAGE_ORDER,
  getNextStage,
  getStageIndex,
  validateStageTransition,
  canSkipStage
} from './stages.js';

/**
 * 工作流状态机实现
 */
export class WorkflowStateMachine implements WorkflowEngine {
  state: WorkflowState;
  config: WorkflowConfig;
  transitionLog: StageTransitionEvent[] = [];

  constructor(config: WorkflowConfig) {
    this.config = config;
    this.state = this.initializeState();
  }

  /**
   * 初始化工作流状态
   */
  private initializeState(): WorkflowState {
    const stages = new Map<WorkflowStage, StageStatus>();

    // 初始化所有阶段为pending
    for (const stage of STAGE_ORDER) {
      stages.set(stage, 'pending');
    }

    // 设置第一个阶段为in_progress
    stages.set('W01_requirements_design', 'in_progress');

    return {
      currentStage: 'W01_requirements_design',
      projectScale: this.config.projectScale,
      stages,
      agentTeam: [],
      skipLog: [],
      violations: []
    };
  }

  /**
   * 获取当前阶段
   */
  getCurrentStage(): WorkflowStage {
    return this.state.currentStage;
  }

  /**
   * 获取阶段状态
   */
  getStageStatus(stage: WorkflowStage): StageStatus {
    return this.state.stages.get(stage) || 'pending';
  }

  /**
   * 检查是否可以转换到下一阶段
   */
  canTransition(nextStage: WorkflowStage): boolean {
    const validation = validateStageTransition(
      this.state.currentStage,
      nextStage,
      this.state.stages
    );
    return validation.valid;
  }

  /**
   * 转换到下一阶段
   */
  transitionTo(nextStage: WorkflowStage): boolean {
    // 验证转换合法性
    const validation = validateStageTransition(
      this.state.currentStage,
      nextStage,
      this.state.stages
    );

    if (!validation.valid) {
      this.logViolation('workflow-engine', 'LP001', `Invalid transition attempt: ${validation.reason}`);
      return false;
    }

    // 完成当前阶段
    this.state.stages.set(this.state.currentStage, 'completed');

    // 设置新阶段为in_progress
    this.state.stages.set(nextStage, 'in_progress');

    // 记录转换事件
    const transitionEvent: StageTransitionEvent = {
      from: this.state.currentStage,
      to: nextStage,
      timestamp: new Date().toISOString(),
      reason: 'Normal progression'
    };
    this.transitionLog.push(transitionEvent);

    // 更新当前阶段
    this.state.currentStage = nextStage;

    return true;
  }

  /**
   * 跳过阶段（需要明确原因）
   */
  skipStage(stage: WorkflowStage, reason: string): boolean {
    // 检查是否可以跳过
    const skipCheck = canSkipStage(stage, this.state.projectScale, reason);

    if (!skipCheck.canSkip) {
      const ironLaw = this.config.ironLaws.find(il => il.id === skipCheck.ironLawRef) ||
        DEFAULT_IRON_LAWS.find(il => il.id === skipCheck.ironLawRef);

      this.logViolation(
        'workflow-engine',
        'LP001',
        `Skip attempt blocked: ${ironLaw?.rule || 'Unknown rule'}`
      );
      return false;
    }

    // 记录跳过
    this.state.stages.set(stage, 'skipped');
    this.state.skipLog.push({
      stage,
      reason,
      timestamp: new Date().toISOString()
    });

    // 如果跳过的是当前阶段，前进到下一阶段
    if (stage === this.state.currentStage) {
      const next = getNextStage(stage);
      if (next) {
        this.state.currentStage = next;
        this.state.stages.set(next, 'in_progress');
      }
    }

    return true;
  }

  /**
   * 设置阶段为阻塞状态
   */
  blockStage(stage: WorkflowStage, reason: string): void {
    this.state.stages.set(stage, 'blocked');

    // 如果阻塞当前阶段，记录阻塞原因
    if (stage === this.state.currentStage) {
      this.logViolation('workflow-engine', 'LP003', `Stage blocked: ${reason}`);
    }
  }

  /**
   * 解除阶段阻塞
   */
  unblockStage(stage: WorkflowStage): boolean {
    const currentStatus = this.state.stages.get(stage);

    if (currentStatus !== 'blocked') {
      return false;
    }

    this.state.stages.set(stage, 'in_progress');
    return true;
  }

  /**
   * 记录违规
   */
  private logViolation(agent: string, pattern: 'LP001' | 'LP002' | 'LP003' | 'LP004' | 'LP005' | 'LP006', details: string): void {
    this.state.violations.push({
      agent,
      pattern,
      timestamp: new Date().toISOString()
    });

    // 触发监工（如果启用）
    if (this.config.enableSupervisor) {
      // 监工处理由supervisor模块负责
    }
  }

  /**
   * 获取工作流进度摘要
   */
  getProgressSummary(): {
    completed: number;
    skipped: number;
    pending: number;
    blocked: number;
    inProgress: number;
    total: number;
  } {
    let completed = 0;
    let skipped = 0;
    let pending = 0;
    let blocked = 0;
    let inProgress = 0;

    for (const stage of STAGE_ORDER) {
      const status = this.state.stages.get(stage);
      switch (status) {
        case 'completed': completed++; break;
        case 'skipped': skipped++; break;
        case 'pending': pending++; break;
        case 'blocked': blocked++; break;
        case 'in_progress': inProgress++; break;
      }
    }

    return {
      completed,
      skipped,
      pending,
      blocked,
      inProgress,
      total: STAGE_ORDER.length
    };
  }

  /**
   * 检查工作流是否完成
   */
  isComplete(): boolean {
    const lastStage = this.state.stages.get('W12_release');
    return lastStage === 'completed' || lastStage === 'skipped';
  }

  /**
   * 获取阶段转换历史
   */
  getTransitionHistory(): StageTransitionEvent[] {
    return [...this.transitionLog];
  }

  /**
   * 重置工作流状态
   */
  reset(): void {
    this.state = this.initializeState();
    this.transitionLog = [];
  }

  /**
   * 格式化状态为Markdown
   */
  formatStateMarkdown(): string {
    const lines: string[] = [
      '# Workflow State',
      '',
      `**当前阶段:** ${this.state.currentStage}`,
      `**项目规模:** ${this.state.projectScale}`,
      '',
      '## 阶段状态',
      ''
    ];

    for (const stage of STAGE_ORDER) {
      const status = this.state.stages.get(stage) || 'pending';
      const statusIcon = this.getStatusIcon(status);
      lines.push(`- ${statusIcon} ${stage}: ${status}`);
    }

    const progress = this.getProgressSummary();
    lines.push('');
    lines.push('## 进度摘要');
    lines.push('');
    lines.push(`- 完成: ${progress.completed}/${progress.total}`);
    lines.push(`- 跳过: ${progress.skipped}`);
    lines.push(`- 进行中: ${progress.inProgress}`);
    lines.push(`- 待开始: ${progress.pending}`);
    lines.push(`- 阻塞: ${progress.blocked}`);

    if (this.state.skipLog.length > 0) {
      lines.push('');
      lines.push('## 跳过记录');
      lines.push('');
      for (const skip of this.state.skipLog) {
        lines.push(`- ${skip.stage}: ${skip.reason} (${skip.timestamp})`);
      }
    }

    if (this.state.violations.length > 0) {
      lines.push('');
      lines.push('## 违规记录');
      lines.push('');
      for (const violation of this.state.violations) {
        lines.push(`- ${violation.agent}: ${violation.pattern} (${violation.timestamp})`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: StageStatus): string {
    switch (status) {
      case 'completed': return '✅';
      case 'skipped': return '⏭️';
      case 'in_progress': return '🔄';
      case 'blocked': return '🚫';
      case 'pending': return '⏳';
      default: return '❓';
    }
  }
}

/**
 * 创建工作流状态机
 */
export function createStateMachine(config: WorkflowConfig): WorkflowStateMachine {
  return new WorkflowStateMachine(config);
}

/**
 * 执行阶段（返回结果）
 */
export async function executeStage(
  engine: WorkflowEngine,
  stage: WorkflowStage,
  executor: () => Promise<{ outputs: string[]; issues: string[] }>
): Promise<StageResult> {
  const startTime = Date.now();

  // 检查是否可以执行
  if (engine.getCurrentStage() !== stage) {
    return {
      stage,
      success: false,
      outputs: [],
      issues: [`Cannot execute ${stage}: current stage is ${engine.getCurrentStage()}`],
      timestamp: new Date().toISOString(),
      durationMs: 0
    };
  }

  try {
    const result = await executor();
    const durationMs = Date.now() - startTime;

    // 如果成功，转换到下一阶段
    if (result.issues.length === 0) {
      const nextStage = getNextStage(stage);
      if (nextStage) {
        engine.transitionTo(nextStage);
      }
    }

    return {
      stage,
      success: result.issues.length === 0,
      outputs: result.outputs,
      issues: result.issues,
      timestamp: new Date().toISOString(),
      durationMs
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      stage,
      success: false,
      outputs: [],
      issues: [errorMessage],
      timestamp: new Date().toISOString(),
      durationMs
    };
  }
}