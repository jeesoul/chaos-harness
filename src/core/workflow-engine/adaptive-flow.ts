/**
 * Adaptive Flow System
 *
 * M5: 自适应流程
 * 根据项目规模自动调整工作流阶段
 */

import {
  WorkflowStage,
  ProjectScale,
  StageStatus,
  WorkflowState,
  WorkflowConfig,
  ProjectChanges,
  AdaptiveFlowRule,
  DEFAULT_ADAPTIVE_FLOW_RULES,
  DEFAULT_IRON_LAWS
} from './types.js';
import {
  STAGE_ORDER,
  getStageIndex,
  getStageDefinition
} from './stages.js';

/**
 * 判断项目规模
 */
export function determineProjectScale(
  fileCount: number,
  lineCount: number,
  complexityIndicators?: {
    hasMultipleModules?: boolean;
    hasExternalDependencies?: boolean;
    hasComplexArchitecture?: boolean;
  }
): ProjectScale {
  // 基础判断：文件数和代码行数
  if (fileCount <= 5 && lineCount <= 100) {
    return 'small';
  }

  if (fileCount >= 20 || lineCount >= 500) {
    return 'large';
  }

  // 中型项目默认
  if (fileCount > 5 && fileCount < 20 && lineCount > 100 && lineCount < 500) {
    // 检查复杂度指标
    if (complexityIndicators) {
      if (complexityIndicators.hasMultipleModules ||
        complexityIndicators.hasComplexArchitecture) {
        return 'large';
      }
    }
    return 'medium';
  }

  // 边界情况：倾向于保守（更严格的流程）
  if (fileCount >= 15 || lineCount >= 400) {
    return 'large';
  }

  return 'medium';
}

/**
 * 获取自适应流程规则
 */
export function getAdaptiveFlowRule(scale: ProjectScale): AdaptiveFlowRule {
  const rule = DEFAULT_ADAPTIVE_FLOW_RULES.find(r => r.scale === scale);
  if (!rule) {
    // 默认返回中型规则
    return DEFAULT_ADAPTIVE_FLOW_RULES.find(r => r.scale === 'medium')!;
  }
  return rule;
}

/**
 * 初始化自适应工作流状态
 */
export function initializeAdaptiveFlow(
  scale: ProjectScale,
  options?: {
    skipReviewStages?: boolean;
    skipAgentAllocation?: boolean;
    skipApiDesign?: boolean;
  }
): Map<WorkflowStage, StageStatus> {
  const stages = new Map<WorkflowStage, StageStatus>();
  const rule = getAdaptiveFlowRule(scale);

  // 初始化所有阶段
  for (const stage of STAGE_ORDER) {
    stages.set(stage, 'pending');
  }

  // 设置合并阶段（将评审合并到设计）
  for (const [designStage, reviewStage] of rule.mergeableStages) {
    if (options?.skipReviewStages || scale === 'small') {
      stages.set(reviewStage, 'skipped');
    }
  }

  // 设置可跳过阶段
  for (const skipStage of rule.skippableStages) {
    const skipCondition = getSkipCondition(skipStage, scale, options);
    if (skipCondition.shouldSkip) {
      stages.set(skipStage, 'skipped');
    }
  }

  // 找到第一个非跳过的必经阶段作为起始点
  const mandatoryStages = rule.mandatoryStages;
  const firstStage = mandatoryStages.find(stage =>
    stages.get(stage) !== 'skipped'
  ) || STAGE_ORDER[0];

  stages.set(firstStage, 'in_progress');

  return stages;
}

/**
 * 获取跳过条件
 */
function getSkipCondition(
  stage: WorkflowStage,
  scale: ProjectScale,
  options?: {
    skipReviewStages?: boolean;
    skipAgentAllocation?: boolean;
    skipApiDesign?: boolean;
  }
): { shouldSkip: boolean; reason?: string } {
  const definition = getStageDefinition(stage);

  if (!definition || !definition.canSkip) {
    return { shouldSkip: false };
  }

  // 检查用户选项
  if (stage === 'W02_requirements_review' || stage === 'W04_architecture_review') {
    if (options?.skipReviewStages || scale === 'small') {
      return { shouldSkip: true, reason: 'Review stage merged with design for small project' };
    }
  }

  if (stage === 'W07_agent_allocation') {
    if (options?.skipAgentAllocation || scale === 'small') {
      return { shouldSkip: true, reason: 'Single developer for small project' };
    }
  }

  if (stage === 'W06_api_design') {
    if (options?.skipApiDesign || scale === 'medium') {
      return { shouldSkip: true, reason: 'No external API for medium project' };
    }
  }

  return { shouldSkip: false };
}

/**
 * 动态调整流程（根据项目变更）
 */
export function adaptWorkflow(
  currentState: WorkflowState,
  changes: ProjectChanges
): {
  scaleChanged: boolean;
  newScale?: ProjectScale;
  stageChanges: Array<{ stage: WorkflowStage; oldStatus: StageStatus; newStatus: StageStatus; reason: string }>;
} {
  const oldScale = currentState.projectScale;

  // 计算变更后的规模
  const totalFiles = changes.filesAdded + changes.filesModified;
  const totalLines = changes.linesAdded;

  // 复杂度增加可能导致规模升级
  const newScale = determineProjectScale(totalFiles, totalLines, {
    hasComplexArchitecture: changes.complexityIncrease
  });

  const scaleChanged = oldScale !== newScale;
  const stageChanges: Array<{ stage: WorkflowStage; oldStatus: StageStatus; newStatus: StageStatus; reason: string }> = [];

  // 如果规模升级，需要重新评估跳过的阶段
  if (scaleChanged && newScale === 'large') {
    // 大型项目不能跳过任何阶段
    for (const stage of STAGE_ORDER) {
      const currentStatus = currentState.stages.get(stage);
      if (currentStatus === 'skipped') {
        stageChanges.push({
          stage,
          oldStatus: 'skipped',
          newStatus: 'pending',
          reason: 'Project scale upgraded to large - all stages required'
        });
      }
    }
  }

  // 如果规模降级（罕见），可以跳过更多阶段
  if (scaleChanged && newScale === 'small') {
    const newRule = getAdaptiveFlowRule('small');
    for (const skipStage of newRule.skippableStages) {
      const currentStatus = currentState.stages.get(skipStage);
      if (currentStatus === 'pending') {
        stageChanges.push({
          stage: skipStage,
          oldStatus: 'pending',
          newStatus: 'skipped',
          reason: 'Project scale downgraded to small - stage no longer required'
        });
      }
    }
  }

  return {
    scaleChanged,
    newScale: scaleChanged ? newScale : undefined,
    stageChanges
  };
}

/**
 * 获取当前规模下的必经阶段
 */
export function getMandatoryStages(scale: ProjectScale): WorkflowStage[] {
  const rule = getAdaptiveFlowRule(scale);
  return rule.mandatoryStages;
}

/**
 * 获取当前规模下的可跳过阶段
 */
export function getSkippableStages(scale: ProjectScale): WorkflowStage[] {
  const rule = getAdaptiveFlowRule(scale);
  return rule.skippableStages;
}

/**
 * 获取当前规模下的合并阶段
 */
export function getMergeableStages(scale: ProjectScale): Array<[WorkflowStage, WorkflowStage]> {
  const rule = getAdaptiveFlowRule(scale);
  return rule.mergeableStages;
}

/**
 * 验证跳过请求（自适应规则）
 */
export function validateSkipRequest(
  stage: WorkflowStage,
  scale: ProjectScale,
  reason: string
): {
  allowed: boolean;
  ironLawRef?: string;
  warning?: string;
} {
  const rule = getAdaptiveFlowRule(scale);

  // 大型项目禁止跳过
  if (scale === 'large') {
    return {
      allowed: false,
      ironLawRef: 'IL001',
      warning: 'Large projects require all stages - no skipping allowed'
    };
  }

  // 检查是否在可跳过列表中
  if (!rule.skippableStages.includes(stage)) {
    // 检查是否在必经阶段中
    if (rule.mandatoryStages.includes(stage)) {
      return {
        allowed: false,
        ironLawRef: 'IL001',
        warning: `${stage} is mandatory for ${scale} projects`
      };
    }

    // 合并阶段需要特殊处理
    const isReviewStage = stage === 'W02_requirements_review' || stage === 'W04_architecture_review';
    const canMerge = rule.mergeableStages.some(([d, r]) => r === stage);

    if (isReviewStage && canMerge) {
      return {
        allowed: true,
        warning: `Review stage ${stage} can be merged with design stage for ${scale} projects`
      };
    }

    return {
      allowed: false,
      ironLawRef: 'IL001',
      warning: `${stage} is not skippable for ${scale} projects`
    };
  }

  return {
    allowed: true,
    warning: `Skipping ${stage} is allowed for ${scale} projects`
  };
}

/**
 * 生成自适应流程建议
 */
export function generateAdaptiveFlowRecommendation(
  fileCount: number,
  lineCount: number,
  complexityIndicators?: {
    hasMultipleModules?: boolean;
    hasExternalDependencies?: boolean;
    hasComplexArchitecture?: boolean;
  }
): {
  scale: ProjectScale;
  rule: AdaptiveFlowRule;
  recommendation: string;
  warnings: string[];
} {
  const scale = determineProjectScale(fileCount, lineCount, complexityIndicators);
  const rule = getAdaptiveFlowRule(scale);

  const warnings: string[] = [];
  const recommendationLines: string[] = [
    `# Adaptive Flow Recommendation`,
    '',
    `**Project Scale:** ${scale} (${rule.definition})`,
    '',
    `## Mandatory Stages (${rule.mandatoryStages.length})`,
    ...rule.mandatoryStages.map(s => `- ${s}`),
    '',
    `## Skippable Stages (${rule.skippableStages.length})`,
    ...rule.skippableStages.map(s => `- ${s}: ${getStageDefinition(s)?.skipCondition || 'Optional'}`),
    '',
    `## Mergeable Stages (${rule.mergeableStages.length})`,
    ...rule.mergeableStages.map(([d, r]) => `- ${d} + ${r}: Can be combined into single step`)
  ];

  // 添加警告
  if (scale === 'large') {
    warnings.push('⚠️ Large projects require full 12-stage workflow - no shortcuts');
  }

  if (complexityIndicators?.hasComplexArchitecture && scale !== 'large') {
    warnings.push('⚠️ Complex architecture detected - consider upgrading to large project flow');
  }

  return {
    scale,
    rule,
    recommendation: recommendationLines.join('\n'),
    warnings
  };
}

/**
 * 格式化自适应规则为Markdown
 */
export function formatAdaptiveRulesMarkdown(): string {
  const lines: string[] = [
    '# Adaptive Flow Rules',
    '',
    'Projects are classified by scale, which determines workflow stages.',
    '',
    '## Scale Definitions',
    '',
    '| Scale | Files | Lines | Description |',
    '|-------|-------|-------|-------------|',
    '| small | ≤5 | ≤100 | Single feature, minimal complexity |',
    '| medium | 5-20 | 100-500 | Multiple features, moderate complexity |',
    '| large | ≥20 | ≥500 | Full system, high complexity |',
    '',
    '## Stage Requirements by Scale',
    ''
  ];

  for (const rule of DEFAULT_ADAPTIVE_FLOW_RULES) {
    lines.push(`### ${rule.scale.toUpperCase()} Projects`);
    lines.push('');
    lines.push(`**Definition:** ${rule.definition}`);
    lines.push('');
    lines.push(`**Mandatory Stages:** ${rule.mandatoryStages.length}`);
    lines.push(...rule.mandatoryStages.map(s => `- ${s}`));
    lines.push('');
    lines.push(`**Skippable Stages:** ${rule.skippableStages.length}`);
    lines.push(...rule.skippableStages.map(s => `- ${s}`));
    lines.push('');
    lines.push(`**Mergeable Stages:** ${rule.mergeableStages.length}`);
    lines.push(...rule.mergeableStages.map(([d, r]) => `- Combine ${d} with ${r}`));
    lines.push('');
  }

  return lines.join('\n');
}