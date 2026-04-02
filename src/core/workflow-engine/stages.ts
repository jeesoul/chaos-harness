/**
 * Workflow Stages Definitions
 *
 * M5: 12阶段完整定义
 * 每个阶段包含输入/输出、可跳过条件、所需角色
 */

import {
  WorkflowStage,
  StageDefinition,
  AgentRole,
  DEFAULT_IRON_LAWS
} from './types.js';

/**
 * 阶段顺序数组
 */
export const STAGE_ORDER: WorkflowStage[] = [
  'W01_requirements_design',
  'W02_requirements_review',
  'W03_architecture_design',
  'W04_architecture_review',
  'W05_detail_design',
  'W06_api_design',
  'W07_agent_allocation',
  'W08_development',
  'W09_code_review',
  'W10_test_version',
  'W11_automated_test',
  'W12_release'
];

/**
 * 获取阶段索引
 */
export function getStageIndex(stage: WorkflowStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * 获取下一个阶段
 */
export function getNextStage(currentStage: WorkflowStage): WorkflowStage | null {
  const currentIndex = getStageIndex(currentStage);
  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1];
}

/**
 * 获取上一个阶段
 */
export function getPreviousStage(currentStage: WorkflowStage): WorkflowStage | null {
  const currentIndex = getStageIndex(currentStage);
  if (currentIndex <= 0) {
    return null;
  }
  return STAGE_ORDER[currentIndex - 1];
}

/**
 * 12阶段完整定义
 */
export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    id: 'W01_requirements_design',
    name: '需求设计',
    description: '收集和分析项目需求，设计功能规格',
    inputs: ['用户需求描述', '项目背景信息'],
    outputs: ['需求文档 (requirements.md)', '功能清单'],
    canSkip: false,
    requiredRoles: ['architect']
  },
  {
    id: 'W02_requirements_review',
    name: '需求评审',
    description: '评审需求文档，确认需求和范围',
    inputs: ['需求文档', '功能清单'],
    outputs: ['评审报告', '修订后的需求文档'],
    canSkip: true,
    skipCondition: '小型项目可合并到W01',
    requiredRoles: ['architect', 'supervisor']
  },
  {
    id: 'W03_architecture_design',
    name: '架构设计',
    description: '设计系统架构、技术选型、模块划分',
    inputs: ['需求文档', '评审报告'],
    outputs: ['架构文档 (architecture.md)', '技术选型方案', '模块划分图'],
    canSkip: false,
    requiredRoles: ['architect']
  },
  {
    id: 'W04_architecture_review',
    name: '架构评审',
    description: '评审架构设计，确认技术方案可行性',
    inputs: ['架构文档', '技术选型方案'],
    outputs: ['架构评审报告', '修订后的架构文档'],
    canSkip: true,
    skipCondition: '小型项目可合并到W03',
    requiredRoles: ['architect', 'supervisor']
  },
  {
    id: 'W05_detail_design',
    name: '详情文档',
    description: '编写详细设计文档，包括数据结构、算法逻辑',
    inputs: ['架构文档', '模块划分'],
    outputs: ['详细设计文档 (detail-design.md)', '数据结构定义'],
    canSkip: false,
    requiredRoles: ['architect', 'backend_dev', 'frontend_dev']
  },
  {
    id: 'W06_api_design',
    name: '接口文档',
    description: '设计API接口，编写接口文档',
    inputs: ['详细设计文档', '数据结构定义'],
    outputs: ['接口文档 (api-doc.md)', '接口契约'],
    canSkip: true,
    skipCondition: '中型项目无外部接口可跳过',
    requiredRoles: ['backend_dev', 'frontend_dev']
  },
  {
    id: 'W07_agent_allocation',
    name: 'Agent分配',
    description: '根据任务分配Agent角色和任务',
    inputs: ['详细设计文档', '接口文档'],
    outputs: ['Agent分配方案', '任务分配表'],
    canSkip: true,
    skipCondition: '小型项目单人开发可跳过',
    requiredRoles: ['supervisor']
  },
  {
    id: 'W08_development',
    name: '开发执行',
    description: '按设计文档执行开发，编写代码',
    inputs: ['详细设计文档', '接口文档', 'Agent分配方案'],
    outputs: ['源代码', '单元测试'],
    canSkip: false,
    requiredRoles: ['backend_dev', 'frontend_dev']
  },
  {
    id: 'W09_code_review',
    name: '代码评审',
    description: '评审代码质量、规范遵循、设计一致性',
    inputs: ['源代码', '单元测试'],
    outputs: ['代码评审报告', '修订后的代码'],
    canSkip: false,
    requiredRoles: ['architect', 'supervisor']
  },
  {
    id: 'W10_test_version',
    name: '提交测试版本',
    description: '构建测试版本，提交测试环境',
    inputs: ['评审后的代码', '单元测试'],
    outputs: ['测试版本包', '版本发布说明'],
    canSkip: false,
    requiredRoles: ['tester']
  },
  {
    id: 'W11_automated_test',
    name: '自动化测试',
    description: '执行自动化测试，验证功能和性能',
    inputs: ['测试版本包', '测试用例'],
    outputs: ['测试报告', 'Bug列表'],
    canSkip: false,
    requiredRoles: ['tester']
  },
  {
    id: 'W12_release',
    name: '发布',
    description: '发布正式版本，更新版本记录',
    inputs: ['测试报告', 'Bug修复确认'],
    outputs: ['正式版本', 'VERSION-LOG.md更新', '发布文档'],
    canSkip: false,
    requiredRoles: ['supervisor']
  }
];

/**
 * 获取阶段定义
 */
export function getStageDefinition(stage: WorkflowStage): StageDefinition | undefined {
  return STAGE_DEFINITIONS.find(def => def.id === stage);
}

/**
 * 检查阶段是否可跳过
 */
export function canSkipStage(
  stage: WorkflowStage,
  projectScale: 'small' | 'medium' | 'large',
  reason: string
): { canSkip: boolean; ironLawRef?: string } {
  const definition = getStageDefinition(stage);

  if (!definition) {
    return { canSkip: false };
  }

  // 大型项目不可跳过任何阶段
  if (projectScale === 'large') {
    return {
      canSkip: false,
      ironLawRef: 'IL001'
    };
  }

  // 必须阶段不可跳过
  if (!definition.canSkip) {
    return {
      canSkip: false,
      ironLawRef: 'IL001'
    };
  }

  // 检查跳过条件是否符合
  if (definition.skipCondition) {
    const validSkipReasons = definition.skipCondition.split(',').map(s => s.trim().toLowerCase());
    const reasonLower = reason.toLowerCase();

    // 检查是否满足任一跳过条件
    const matchesCondition = validSkipReasons.some(condition =>
      reasonLower.includes(condition) || condition.includes(reasonLower)
    );

    if (!matchesCondition) {
      return {
        canSkip: false,
        ironLawRef: 'IL001'
      };
    }
  }

  return { canSkip: true };
}

/**
 * 获取阶段所需角色
 */
export function getRequiredRoles(stage: WorkflowStage): AgentRole[] {
  const definition = getStageDefinition(stage);
  return definition?.requiredRoles || [];
}

/**
 * 获取阶段输入要求
 */
export function getStageInputs(stage: WorkflowStage): string[] {
  const definition = getStageDefinition(stage);
  return definition?.inputs || [];
}

/**
 * 获取阶段输出要求
 */
export function getStageOutputs(stage: WorkflowStage): string[] {
  const definition = getStageDefinition(stage);
  return definition?.outputs || [];
}

/**
 * 验证阶段转换合法性
 */
export function validateStageTransition(
  from: WorkflowStage,
  to: WorkflowStage,
  currentStatus: Map<WorkflowStage, 'pending' | 'in_progress' | 'blocked' | 'completed' | 'skipped'>
): { valid: boolean; reason?: string } {
  const fromIndex = getStageIndex(from);
  const toIndex = getStageIndex(to);

  // 验证阶段存在
  if (fromIndex === -1 || toIndex === -1) {
    return { valid: false, reason: 'Invalid stage ID' };
  }

  // 只能前进或停留在当前阶段
  if (toIndex < fromIndex) {
    return { valid: false, reason: 'Cannot go backwards in workflow' };
  }

  // 跳跃超过一个阶段需要检查中间阶段状态
  if (toIndex > fromIndex + 1) {
    for (let i = fromIndex + 1; i < toIndex; i++) {
      const intermediateStage = STAGE_ORDER[i];
      const intermediateStatus = currentStatus.get(intermediateStage);

      if (intermediateStatus !== 'completed' && intermediateStatus !== 'skipped') {
        return {
          valid: false,
          reason: `Intermediate stage ${intermediateStage} must be completed or skipped first`
        };
      }
    }
  }

  // 当前阶段必须已完成或跳过才能前进
  const fromStatus = currentStatus.get(from);
  if (toIndex > fromIndex && fromStatus !== 'completed' && fromStatus !== 'skipped') {
    return {
      valid: false,
      reason: `Current stage ${from} must be completed or skipped before proceeding`
    };
  }

  return { valid: true };
}

/**
 * 格式化阶段信息为Markdown
 */
export function formatStageMarkdown(stage: WorkflowStage): string {
  const definition = getStageDefinition(stage);
  if (!definition) {
    return `Unknown stage: ${stage}`;
  }

  const lines: string[] = [
    `## ${definition.name} (${stage})`,
    '',
    `**描述:** ${definition.description}`,
    '',
    '**输入:**',
    ...definition.inputs.map(input => `- ${input}`),
    '',
    '**输出:**',
    ...definition.outputs.map(output => `- ${output}`),
    '',
    `**可跳过:** ${definition.canSkip ? '是' : '否'}`,
    definition.skipCondition ? `  - 条件: ${definition.skipCondition}` : '',
    '',
    '**所需角色:**',
    ...definition.requiredRoles.map(role => `- ${role}`)
  ];

  return lines.filter(line => line !== '').join('\n');
}

/**
 * 获取所有阶段的Markdown摘要
 */
export function getAllStagesMarkdown(): string {
  const lines: string[] = [
    '# Workflow Stages Overview',
    '',
    '## 铁律',
    '',
    ...DEFAULT_IRON_LAWS.map(il => `- **${il.id}:** ${il.rule}`),
    '',
    '## 阶段列表',
    ''
  ];

  for (const stage of STAGE_ORDER) {
    const definition = getStageDefinition(stage)!;
    lines.push(`### ${definition.name} (${stage})`);
    lines.push(`- 描述: ${definition.description}`);
    lines.push(`- 可跳过: ${definition.canSkip ? '是' : '否'}`);
    lines.push(`- 角色: ${definition.requiredRoles.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}