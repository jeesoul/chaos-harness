/**
 * Workflow MCP Tools
 *
 * M6: 工作流MCP工具实现
 */

import {
  McpToolDefinition,
  McpToolHandler
} from '../types.js';
import {
  createWorkflowExecutor,
  quickDetectLaziness,
  quickGeneratePressure,
  determineProjectScale,
  STAGE_ORDER,
  getStageDefinition,
  DEFAULT_IRON_LAWS,
  DEFAULT_LAZINESS_PATTERNS
} from '../../workflow-engine/index.js';
import { successResult, errorResult, jsonResult } from '../server.js';

// 存储工作流实例
const workflowInstances = new Map<string, ReturnType<typeof createWorkflowExecutor>>();

/**
 * 创建工作流工具定义
 */
export const createWorkflowToolDefinition: McpToolDefinition = {
  name: 'chaos_create_workflow',
  description: '创建工作流执行器，根据项目规模自动配置阶段和Agent团队。支持小型/中型/大型项目自适应。',
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: '工作流唯一标识符（可选，自动生成）'
      },
      projectRoot: {
        type: 'string',
        description: '项目根目录的绝对路径'
      },
      version: {
        type: 'string',
        description: '版本号（可选）'
      },
      fileCount: {
        type: 'number',
        description: '项目文件数量（用于规模判断）'
      },
      lineCount: {
        type: 'number',
        description: '项目代码行数（用于规模判断）'
      },
      enableSupervisor: {
        type: 'boolean',
        description: '是否启用监工机制',
        default: true
      }
    },
    required: ['projectRoot']
  }
};

/**
 * 创建工作流工具处理器
 */
export const createWorkflowToolHandler: McpToolHandler = async (args) => {
  const {
    workflowId = `workflow-${Date.now()}`,
    projectRoot,
    version = 'v0.1',
    fileCount = 10,
    lineCount = 300,
    enableSupervisor = true
  } = args;

  if (!projectRoot || typeof projectRoot !== 'string') {
    return errorResult('projectRoot is required and must be a string');
  }

  try {
    const scale = determineProjectScale(
      fileCount as number,
      lineCount as number
    );

    const executor = createWorkflowExecutor({
      projectRoot: projectRoot as string,
      version: version as string,
      fileCount: fileCount as number,
      lineCount: lineCount as number,
      enableSupervisor: enableSupervisor as boolean,
      projectScale: scale
    });

    workflowInstances.set(workflowId as string, executor);

    return jsonResult({
      success: true,
      workflowId,
      scale,
      currentStage: executor.getCurrentStage(),
      progress: executor.getProgress()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Workflow creation failed: ${message}`);
  }
};

/**
 * 获取工作流状态工具定义
 */
export const getWorkflowStatusToolDefinition: McpToolDefinition = {
  name: 'chaos_get_workflow_status',
  description: '获取工作流的当前状态，包括当前阶段、进度、团队状态等。',
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: '工作流ID'
      }
    },
    required: ['workflowId']
  }
};

/**
 * 获取工作流状态工具处理器
 */
export const getWorkflowStatusToolHandler: McpToolHandler = async (args) => {
  const { workflowId } = args;

  if (!workflowId || typeof workflowId !== 'string') {
    return errorResult('workflowId is required and must be a string');
  }

  const executor = workflowInstances.get(workflowId as string);
  if (!executor) {
    return errorResult(`Workflow '${workflowId}' not found`);
  }

  try {
    const status = executor.getStatus();

    return jsonResult({
      success: true,
      workflowId,
      currentStage: status.state.currentStage,
      projectScale: status.state.projectScale,
      progress: status.progress,
      teamStatus: status.teamStatus,
      violations: status.violations,
      isComplete: executor.isComplete()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Failed to get workflow status: ${message}`);
  }
};

/**
 * 检测偷懒模式工具定义
 */
export const detectLazinessToolDefinition: McpToolDefinition = {
  name: 'chaos_detect_laziness',
  description: '检测Agent是否表现出偷懒模式，如声称完成但无验证、跳过根因分析等。返回检测到的模式和施压消息。',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'Agent ID'
      },
      claimedCompletion: {
        type: 'boolean',
        description: '声称完成'
      },
      ranVerification: {
        type: 'boolean',
        description: '运行验证'
      },
      proposedFix: {
        type: 'boolean',
        description: '提出修复'
      },
      mentionedRootCause: {
        type: 'boolean',
        description: '提及根因'
      },
      timeElapsed: {
        type: 'number',
        description: '已用时间'
      },
      expectedTime: {
        type: 'number',
        description: '预期时间'
      },
      testsPassed: {
        type: 'boolean',
        description: '测试通过'
      },
      createdVersionDir: {
        type: 'boolean',
        description: '创建版本目录'
      },
      modifiedHighRiskConfig: {
        type: 'boolean',
        description: '修改高风险配置'
      },
      userApprovedVersion: {
        type: 'boolean',
        description: '用户批准版本'
      },
      userApprovedConfig: {
        type: 'boolean',
        description: '用户批准配置'
      }
    },
    required: ['agentId']
  }
};

/**
 * 检测偷懒模式工具处理器
 */
export const detectLazinessToolHandler: McpToolHandler = async (args) => {
  const { agentId } = args;

  if (!agentId || typeof agentId !== 'string') {
    return errorResult('agentId is required and must be a string');
  }

  try {
    const context = {
      claimedCompletion: args.claimedCompletion as boolean | undefined,
      ranVerification: args.ranVerification as boolean | undefined,
      proposedFix: args.proposedFix as boolean | undefined,
      mentionedRootCause: args.mentionedRootCause as boolean | undefined,
      timeElapsed: args.timeElapsed as number | undefined,
      expectedTime: args.expectedTime as number | undefined,
      testsPassed: args.testsPassed as boolean | undefined,
      createdVersionDir: args.createdVersionDir as boolean | undefined,
      modifiedHighRiskConfig: args.modifiedHighRiskConfig as boolean | undefined,
      userApprovedVersion: args.userApprovedVersion as boolean | undefined,
      userApprovedConfig: args.userApprovedConfig as boolean | undefined
    };

    const patterns = quickDetectLaziness(agentId as string, context);
    const messages = patterns.map(p => quickGeneratePressure(p));

    return jsonResult({
      success: true,
      agentId,
      patternsDetected: patterns.length,
      patterns: patterns.map(p => ({
        id: p,
        description: DEFAULT_LAZINESS_PATTERNS.find(lp => lp.id === p)?.description
      })),
      pressureMessages: messages
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Laziness detection failed: ${message}`);
  }
};

/**
 * 获取工作流阶段定义工具定义
 */
export const getStageDefinitionToolDefinition: McpToolDefinition = {
  name: 'chaos_get_stage_definition',
  description: '获取工作流阶段的详细定义，包括输入、输出、所需角色等。',
  inputSchema: {
    type: 'object',
    properties: {
      stage: {
        type: 'string',
        description: '阶段ID（如W01_requirements_design）',
        enum: STAGE_ORDER
      }
    },
    required: ['stage']
  }
};

/**
 * 获取工作流阶段定义工具处理器
 */
export const getStageDefinitionToolHandler: McpToolHandler = async (args) => {
  const { stage } = args;

  if (!stage || typeof stage !== 'string') {
    return errorResult('stage is required and must be a string');
  }

  try {
    const definition = getStageDefinition(stage as typeof STAGE_ORDER[number]);

    if (!definition) {
      return errorResult(`Stage '${stage}' not found`);
    }

    return jsonResult({
      success: true,
      stage: definition.id,
      name: definition.name,
      description: definition.description,
      inputs: definition.inputs,
      outputs: definition.outputs,
      canSkip: definition.canSkip,
      skipCondition: definition.skipCondition,
      requiredRoles: definition.requiredRoles
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Failed to get stage definition: ${message}`);
  }
};

/**
 * 列出所有阶段工具定义
 */
export const listStagesToolDefinition: McpToolDefinition = {
  name: 'chaos_list_stages',
  description: '列出所有12个工作流阶段。',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

/**
 * 列出所有阶段工具处理器
 */
export const listStagesToolHandler: McpToolHandler = async () => {
  try {
    const stages = STAGE_ORDER.map(stage => {
      const def = getStageDefinition(stage);
      return {
        id: stage,
        name: def?.name,
        canSkip: def?.canSkip
      };
    });

    return jsonResult({
      success: true,
      stages,
      total: stages.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Failed to list stages: ${message}`);
  }
};

/**
 * 获取铁律列表工具定义
 */
export const listIronLawsToolDefinition: McpToolDefinition = {
  name: 'chaos_list_iron_laws',
  description: '列出所有铁律规则。',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

/**
 * 获取铁律列表工具处理器
 */
export const listIronLawsToolHandler: McpToolHandler = async () => {
  try {
    return jsonResult({
      success: true,
      ironLaws: DEFAULT_IRON_LAWS.map(il => ({
        id: il.id,
        rule: il.rule,
        reason: il.reason,
        enforcement: il.enforcement
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Failed to list iron laws: ${message}`);
  }
};

/**
 * 所有工作流工具
 */
export const workflowTools = [
  { definition: createWorkflowToolDefinition, handler: createWorkflowToolHandler },
  { definition: getWorkflowStatusToolDefinition, handler: getWorkflowStatusToolHandler },
  { definition: detectLazinessToolDefinition, handler: detectLazinessToolHandler },
  { definition: getStageDefinitionToolDefinition, handler: getStageDefinitionToolHandler },
  { definition: listStagesToolDefinition, handler: listStagesToolHandler },
  { definition: listIronLawsToolDefinition, handler: listIronLawsToolHandler }
];