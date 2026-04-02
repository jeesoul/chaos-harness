/**
 * Harness Generator MCP Tools
 *
 * M6: Harness生成MCP工具实现
 */

import {
  McpToolDefinition,
  McpToolHandler
} from '../types.js';
import { scan } from '../../scanner/index.js';
import {
  generateHarness,
  validateHarness,
  listTemplates,
  findBestTemplate
} from '../../harness-generator/index.js';
import { successResult, errorResult, jsonResult } from '../server.js';

/**
 * 生成Harness工具定义
 */
export const generateHarnessToolDefinition: McpToolDefinition = {
  name: 'chaos_generate_harness',
  description: '根据项目扫描结果生成智能Harness配置。Harness包含铁律、防绕过规则、动态配置等。',
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: '项目根目录的绝对路径'
      },
      outputPath: {
        type: 'string',
        description: 'Harness输出目录的绝对路径'
      },
      templateOverride: {
        type: 'string',
        description: '模板名称（可选，自动检测最匹配的模板）',
        enum: ['java-spring', 'java-spring-legacy', 'node-express', 'python-django', 'generic']
      }
    },
    required: ['projectRoot', 'outputPath']
  }
};

/**
 * 生成Harness工具处理器
 */
export const generateHarnessToolHandler: McpToolHandler = async (args) => {
  const { projectRoot, outputPath, templateOverride } = args;

  if (!projectRoot || typeof projectRoot !== 'string') {
    return errorResult('projectRoot is required and must be a string');
  }

  if (!outputPath || typeof outputPath !== 'string') {
    return errorResult('outputPath is required and must be a string');
  }

  try {
    // First scan the project
    const scanResult = await scan({ projectRoot: projectRoot as string });

    // Generate harness
    const harness = await generateHarness({
      scanResult,
      outputPath: outputPath as string,
      templateOverride: templateOverride as string | undefined
    });

    return jsonResult({
      success: true,
      outputPath,
      template: templateOverride || 'auto-detected',
      name: harness.identity?.name,
      ironLawsCount: harness.ironLaws?.length || 0,
      antiBypassCount: harness.antiBypass?.length || 0,
      redFlagsCount: harness.selfCheck?.redFlags?.length || 0
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Harness generation failed: ${message}`);
  }
};

/**
 * 验证Harness工具定义
 */
export const validateHarnessToolDefinition: McpToolDefinition = {
  name: 'chaos_validate_harness',
  description: '验证Harness配置文件的完整性和正确性，检查必填字段、格式规范等。',
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: '项目根目录的绝对路径'
      },
      outputPath: {
        type: 'string',
        description: '临时输出目录'
      }
    },
    required: ['projectRoot', 'outputPath']
  }
};

/**
 * 验证Harness工具处理器
 */
export const validateHarnessToolHandler: McpToolHandler = async (args) => {
  const { projectRoot, outputPath } = args;

  if (!projectRoot || typeof projectRoot !== 'string') {
    return errorResult('projectRoot is required and must be a string');
  }

  if (!outputPath || typeof outputPath !== 'string') {
    return errorResult('outputPath is required and must be a string');
  }

  try {
    const scanResult = await scan({ projectRoot: projectRoot as string });
    const harness = await generateHarness({ scanResult, outputPath: outputPath as string });
    const result = validateHarness(harness);

    return jsonResult({
      success: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      ironLawsCount: harness.ironLaws?.length || 0
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Harness validation failed: ${message}`);
  }
};

/**
 * 列出模板工具定义
 */
export const listTemplatesToolDefinition: McpToolDefinition = {
  name: 'chaos_list_templates',
  description: '列出所有可用的Harness模板名称。',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

/**
 * 列出模板工具处理器
 */
export const listTemplatesToolHandler: McpToolHandler = async () => {
  try {
    const templates = await listTemplates();

    // listTemplates returns string[]
    const templateList = Array.isArray(templates) ? templates : [];

    return jsonResult({
      success: true,
      templates: templateList.map(name => ({
        name,
        description: `Template for ${name} projects`
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Template listing failed: ${message}`);
  }
};

/**
 * 查找最佳模板工具定义
 */
export const findBestTemplateToolDefinition: McpToolDefinition = {
  name: 'chaos_find_best_template',
  description: '根据项目扫描结果找到最匹配的Harness模板。',
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: '项目根目录的绝对路径'
      }
    },
    required: ['projectRoot']
  }
};

/**
 * 查找最佳模板工具处理器
 */
export const findBestTemplateToolHandler: McpToolHandler = async (args) => {
  const { projectRoot } = args;

  if (!projectRoot || typeof projectRoot !== 'string') {
    return errorResult('projectRoot is required and must be a string');
  }

  try {
    const scanResult = await scan({ projectRoot: projectRoot as string });
    const templateName = await findBestTemplate(scanResult);

    return jsonResult({
      success: true,
      template: templateName,
      projectType: scanResult.projectType
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Template finding failed: ${message}`);
  }
};

/**
 * 检测绕过尝试工具定义
 */
export const detectBypassToolDefinition: McpToolDefinition = {
  name: 'chaos_detect_bypass',
  description: '检测文本中是否存在绕过Harness规则的尝试。',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '要检测的文本'
      }
    },
    required: ['text']
  }
};

/**
 * 检测绕过尝试工具处理器
 */
export const detectBypassToolHandler: McpToolHandler = async (args) => {
  const { text } = args;

  if (!text || typeof text !== 'string') {
    return errorResult('text is required and must be a string');
  }

  try {
    const { detectBypassAttempt } = await import('../../harness-generator/anti-bypass.js');
    const result = detectBypassAttempt(text as string);

    return jsonResult({
      success: true,
      detected: result.detected,
      matchedRule: result.matchedRule ? {
        id: result.matchedRule.id,
        excuse: result.matchedRule.excuse,
        rebuttal: result.matchedRule.rebuttal
      } : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Bypass detection failed: ${message}`);
  }
};

/**
 * 所有Harness工具
 */
export const harnessTools = [
  { definition: generateHarnessToolDefinition, handler: generateHarnessToolHandler },
  { definition: validateHarnessToolDefinition, handler: validateHarnessToolHandler },
  { definition: listTemplatesToolDefinition, handler: listTemplatesToolHandler },
  { definition: findBestTemplateToolDefinition, handler: findBestTemplateToolHandler },
  { definition: detectBypassToolDefinition, handler: detectBypassToolHandler }
];