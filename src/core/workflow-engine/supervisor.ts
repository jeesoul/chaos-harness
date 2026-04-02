/**
 * Supervisor Mechanism
 *
 * M5: 监工机制
 * 偷懒检测、介入处理、施压消息生成
 */

import {
  LazinessPatternId,
  LazinessPattern,
  AgentTeamMember,
  SupervisorAction,
  WorkflowState,
  DEFAULT_LAZINESS_PATTERNS,
  DEFAULT_IRON_LAWS,
  IronLaw
} from './types.js';

/**
 * 施压消息模板
 */
const PRESSURE_MESSAGES = {
  LP001: [
    '🚨 **铁律违规:** 声称完成需要验证证据！请立即运行验证命令。',
    '⚠️ 你说完成了，但我没看到证据。运行测试，截图结果。',
    '❌ **IL002触发:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE'
  ],
  LP002: [
    '🔍 **根因分析缺失:** 修复前必须调查根因！暂停，说明问题来源。',
    '⚠️ 你跳过了根因分析。告诉我WHY，然后HOW。',
    '❌ **IL003触发:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST'
  ],
  LP003: [
    '⏰ **时间警告:** 任务已超预期时间50%。进度更新？',
    '⚠️ 你沉默太久了。 blockers？进展？需要帮助？',
    '🔄 我在等待。要么更新进度，要么请求协助。'
  ],
  LP004: [
    '🧪 **测试跳过:** 测试必须通过才能提交！运行测试。',
    '⚠️ 你想跳过测试？测试是安全的保障。不通过 = 不提交。',
    '❌ **IL003触发:** Tests must pass. Skipping tests violates quality standards.'
  ],
  LP005: [
    '📦 **版本违规:** 擅自创建版本目录！删除并请求确认。',
    '⚠️ 你创建了新版本目录但没问过用户。这是违规。',
    '❌ **IL004触发:** NO VERSION CHANGES WITHOUT USER CONFIRMATION'
  ],
  LP006: [
    '🔒 **高风险修改:** 私服/认证修改需要确认！撤销并请求批准。',
    '⚠️ 你修改了敏感配置。列出修改，等待批准。',
    '❌ **IL005触发:** NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT EXPLICIT APPROVAL'
  ]
};

/**
 * 监工实例
 */
export class Supervisor {
  patterns: LazinessPattern[];
  actions: SupervisorAction[] = [];
  ironLaws: IronLaw[];

  constructor(
    patterns?: LazinessPattern[],
    ironLaws?: IronLaw[]
  ) {
    this.patterns = patterns || DEFAULT_LAZINESS_PATTERNS;
    this.ironLaws = ironLaws || DEFAULT_IRON_LAWS;
  }

  /**
   * 检测偷懒模式
   */
  detectLaziness(
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
  ): LazinessPatternId[] {
    const detectedPatterns: LazinessPatternId[] = [];

    // LP001: 声称完成但无验证证据
    if (context.claimedCompletion && !context.ranVerification) {
      detectedPatterns.push('LP001');
    }

    // LP002: 跳过根因分析直接修复
    if (context.proposedFix && !context.mentionedRootCause) {
      detectedPatterns.push('LP002');
    }

    // LP003: 长时间无产出
    if (context.timeElapsed && context.expectedTime) {
      if (context.timeElapsed > context.expectedTime * 1.5) {
        detectedPatterns.push('LP003');
      }
    }

    // LP004: 试图跳过测试
    if (context.claimedCompletion && context.testsPassed === false) {
      detectedPatterns.push('LP004');
    }

    // LP005: 擅自更改版本号
    if (context.createdVersionDir && !context.userApprovedVersion) {
      detectedPatterns.push('LP005');
    }

    // LP006: 自动处理高风险配置
    if (context.modifiedHighRiskConfig && !context.userApprovedConfig) {
      detectedPatterns.push('LP006');
    }

    return detectedPatterns;
  }

  /**
   * 介入处理
   */
  intervene(
    agentId: string,
    patternId: LazinessPatternId
  ): SupervisorAction {
    const pattern = this.patterns.find(p => p.id === patternId);
    const severity = pattern?.severity || 'warning';

    // 确定动作类型
    let actionType: 'warn' | 'pause' | 'block' | 'pressure';
    switch (severity) {
      case 'critical':
        actionType = 'block';
        break;
      case 'warning':
        if (patternId === 'LP003') {
          actionType = 'pressure';
        } else {
          actionType = 'warn';
        }
        break;
      default:
        actionType = 'warn';
    }

    // 生成消息
    const message = this.generateInterventionMessage(patternId, actionType);

    // 记录动作
    const action: SupervisorAction = {
      agentId,
      pattern: patternId,
      action: actionType,
      message,
      timestamp: new Date().toISOString()
    };

    this.actions.push(action);

    return action;
  }

  /**
   * 生成介入消息
   */
  private generateInterventionMessage(
    patternId: LazinessPatternId,
    actionType: 'warn' | 'pause' | 'block' | 'pressure'
  ): string {
    const messages = PRESSURE_MESSAGES[patternId] || ['⚠️ 检测到异常行为'];
    const randomIndex = Math.floor(Math.random() * messages.length);

    let prefix = '';
    switch (actionType) {
      case 'block': prefix = '**🚫 BLOCKED:** '; break;
      case 'pause': prefix = '**⏸️ PAUSED:** '; break;
      case 'pressure': prefix = '**⏰ PRESSURE:** '; break;
      case 'warn': prefix = '**⚠️ WARNING:** '; break;
    }

    return prefix + messages[randomIndex];
  }

  /**
   * 生成施压消息
   */
  generatePressureMessage(agentId: string): string {
    // 检查最近的动作
    const recentActions = this.actions
      .filter(a => a.agentId === agentId)
      .slice(-3);

    if (recentActions.length > 0) {
      const lastAction = recentActions[recentActions.length - 1];
      return lastAction.message;
    }

    // 默认施压消息
    const defaultMessage = '⏰ **进度检查:** 你正在进行什么任务？遇到什么问题？需要什么帮助？';
    return defaultMessage;
  }

  /**
   * 记录违规
   */
  logViolation(
    agentId: string,
    patternId: LazinessPatternId,
    workflowState: WorkflowState
  ): void {
    workflowState.violations.push({
      agent: agentId,
      pattern: patternId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 批量检测偷懒模式
   */
  detectBatch(
    agents: AgentTeamMember[],
    contexts: Map<string, {
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
    }>
  ): Array<{ agentId: string; patterns: LazinessPatternId[] }> {
    const results: Array<{ agentId: string; patterns: LazinessPatternId[] }> = [];

    for (const agent of agents) {
      const context = contexts.get(agent.id);
      if (context) {
        const patterns = this.detectLaziness(agent.id, context);
        if (patterns.length > 0) {
          results.push({ agentId: agent.id, patterns });
        }
      }
    }

    return results;
  }

  /**
   * 获取违规历史
   */
  getViolationHistory(agentId?: string): SupervisorAction[] {
    if (agentId) {
      return this.actions.filter(a => a.agentId === agentId);
    }
    return [...this.actions];
  }

  /**
   * 获取铁律引用
   */
  getIronLawRef(patternId: LazinessPatternId): string {
    const mapping: Partial<Record<LazinessPatternId, string>> = {
      LP001: 'IL002',
      LP002: 'IL003',
      LP004: 'IL003',
      LP005: 'IL004',
      LP006: 'IL005'
    };

    return mapping[patternId] || 'IL001';
  }

  /**
   * 获取铁律内容
   */
  getIronLaw(ironLawId: string): IronLaw | undefined {
    return this.ironLaws.find(il => il.id === ironLawId);
  }

  /**
   * 格式化违规报告
   */
  formatViolationReport(): string {
    if (this.actions.length === 0) {
      return '# Supervisor Report\n\nNo violations detected. ✅';
    }

    const lines: string[] = [
      '# Supervisor Violation Report',
      '',
      `**Total Violations:** ${this.actions.length}`,
      '',
      '## Recent Actions',
      ''
    ];

    // 最近10条
    const recent = this.actions.slice(-10);
    for (const action of recent) {
      const severityIcon = action.action === 'block' ? '🚫' : action.action === 'pause' ? '⏸️' : '⚠️';
      lines.push(`- ${severityIcon} **${action.agentId}** (${action.pattern})`);
      lines.push(`  - Action: ${action.action}`);
      lines.push(`  - Time: ${action.timestamp}`);
      lines.push(`  - Message: ${action.message.substring(0, 100)}...`);
    }

    // 统计
    lines.push('');
    lines.push('## Statistics');
    lines.push('');

    const patternCounts = new Map<LazinessPatternId, number>();
    for (const action of this.actions) {
      const count = patternCounts.get(action.pattern) || 0;
      patternCounts.set(action.pattern, count + 1);
    }

    for (const [pattern, count] of patternCounts) {
      const patternDef = this.patterns.find(p => p.id === pattern);
      lines.push(`- **${pattern}:** ${count} (${patternDef?.description || 'Unknown'})`);
    }

    return lines.join('\n');
  }
}

/**
 * 创建监工实例
 */
export function createSupervisor(
  patterns?: LazinessPattern[],
  ironLaws?: IronLaw[]
): Supervisor {
  return new Supervisor(patterns, ironLaws);
}

/**
 * 快速检测偷懒（不创建实例）
 */
export function quickDetectLaziness(
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
): LazinessPatternId[] {
  const supervisor = new Supervisor();
  return supervisor.detectLaziness(agentId, context);
}

/**
 * 快速生成施压消息
 */
export function quickGeneratePressure(
  patternId: LazinessPatternId
): string {
  const messages = PRESSURE_MESSAGES[patternId] || ['⚠️ 检测到异常行为'];
  return messages[Math.floor(Math.random() * messages.length)];
}