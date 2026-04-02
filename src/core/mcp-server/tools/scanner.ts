/**
 * Scanner MCP Tools
 *
 * M6: 扫描器MCP工具实现
 */

import {
  McpToolDefinition,
  McpToolHandler
} from '../types.js';
import { scan } from '../../scanner/index.js';
import { generateScanReport } from '../../scanner/report-generator.js';
import { successResult, errorResult, jsonResult } from '../server.js';

/**
 * 扫描项目工具定义
 */
export const scanToolDefinition: McpToolDefinition = {
  name: 'chaos_scan',
  description: '扫描项目目录，检测项目类型、技术栈、依赖和环境配置。返回完整的项目扫描结果。',
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
 * 扫描项目工具处理器
 */
export const scanToolHandler: McpToolHandler = async (args) => {
  const { projectRoot } = args;

  if (!projectRoot || typeof projectRoot !== 'string') {
    return errorResult('projectRoot is required and must be a string');
  }

  try {
    const result = await scan({ projectRoot: projectRoot as string });

    return jsonResult({
      success: true,
      projectType: result.projectType,
      language: result.language,
      buildTool: result.buildTool,
      architecture: result.architecture,
      localEnv: result.localEnv,
      dependencySources: result.dependencySources,
      codeStyle: result.codeStyle,
      testCoverage: result.testCoverage
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Scan failed: ${message}`);
  }
};

/**
 * 生成扫描报告工具定义
 */
export const scanReportToolDefinition: McpToolDefinition = {
  name: 'chaos_scan_report',
  description: '根据扫描结果生成Markdown格式的扫描报告，包含项目概述、技术栈、依赖分析等。',
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: '项目根目录的绝对路径'
      },
      version: {
        type: 'string',
        description: '版本号（可选，默认v0.1）'
      }
    },
    required: ['projectRoot']
  }
};

/**
 * 生成扫描报告工具处理器
 */
export const scanReportToolHandler: McpToolHandler = async (args) => {
  const { projectRoot, version = 'v0.1' } = args;

  if (!projectRoot || typeof projectRoot !== 'string') {
    return errorResult('projectRoot is required and must be a string');
  }

  try {
    const result = await scan({ projectRoot: projectRoot as string });
    const report = generateScanReport(result, version as string);

    return successResult(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Report generation failed: ${message}`);
  }
};

/**
 * 所有扫描器工具
 */
export const scannerTools = [
  { definition: scanToolDefinition, handler: scanToolHandler },
  { definition: scanReportToolDefinition, handler: scanReportToolHandler }
];