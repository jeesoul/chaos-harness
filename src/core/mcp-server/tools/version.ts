/**
 * Version Manager MCP Tools
 *
 * M6: 版本管理MCP工具实现
 */

import {
  McpToolDefinition,
  McpToolHandler
} from '../types.js';
import {
  VersionManager,
  detectVersions,
  parseVersion,
  validateVersion
} from '../../version-manager/index.js';
import { successResult, errorResult, jsonResult } from '../server.js';

/**
 * 检测版本工具定义
 */
export const detectVersionsToolDefinition: McpToolDefinition = {
  name: 'chaos_detect_versions',
  description: '检测输出目录中已有的版本号，返回版本列表和元数据。',
  inputSchema: {
    type: 'object',
    properties: {
      outputPath: {
        type: 'string',
        description: '输出目录的绝对路径'
      }
    },
    required: ['outputPath']
  }
};

/**
 * 检测版本工具处理器
 */
export const detectVersionsToolHandler: McpToolHandler = async (args) => {
  const { outputPath } = args;

  if (!outputPath || typeof outputPath !== 'string') {
    return errorResult('outputPath is required and must be a string');
  }

  try {
    const result = await detectVersions(outputPath as string);

    return jsonResult({
      success: true,
      versions: result.versions.map(v => ({
        version: v.version.full,
        path: v.path
      })),
      hasVersions: result.hasVersions,
      totalCount: result.versions.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Version detection failed: ${message}`);
  }
};

/**
 * 创建版本工具定义
 */
export const createVersionToolDefinition: McpToolDefinition = {
  name: 'chaos_create_version',
  description: '在输出目录中创建新版本目录，版本号格式为vX.Y（如v0.1、v1.0）。',
  inputSchema: {
    type: 'object',
    properties: {
      outputPath: {
        type: 'string',
        description: '输出目录的绝对路径'
      },
      version: {
        type: 'string',
        description: '版本号，格式vX.Y（如v0.1、v1.0）'
      }
    },
    required: ['outputPath', 'version']
  }
};

/**
 * 创建版本工具处理器
 */
export const createVersionToolHandler: McpToolHandler = async (args) => {
  const { outputPath, version } = args;

  if (!outputPath || typeof outputPath !== 'string') {
    return errorResult('outputPath is required and must be a string');
  }

  if (!version || typeof version !== 'string') {
    return errorResult('version is required and must be a string');
  }

  // 验证版本号格式
  const validation = validateVersion(version as string);
  if (!validation.valid) {
    return errorResult(`Invalid version format: ${validation.error}`);
  }

  try {
    const manager = new VersionManager(outputPath as string);
    await manager.initialize({
      autoCreate: true,
      specifiedVersion: version as string
    });

    return jsonResult({
      success: true,
      version: version,
      path: `${outputPath}/${version}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Version creation failed: ${message}`);
  }
};

/**
 * 锁定版本工具定义
 */
export const lockVersionToolDefinition: McpToolDefinition = {
  name: 'chaos_lock_version',
  description: '锁定当前会话的版本号，锁定后在该会话期间不可更改。用于确保文档生成的一致性。',
  inputSchema: {
    type: 'object',
    properties: {
      outputPath: {
        type: 'string',
        description: '输出目录的绝对路径'
      },
      version: {
        type: 'string',
        description: '要锁定的版本号'
      }
    },
    required: ['outputPath', 'version']
  }
};

/**
 * 锁定版本工具处理器
 */
export const lockVersionToolHandler: McpToolHandler = async (args) => {
  const { outputPath, version } = args;

  if (!outputPath || typeof outputPath !== 'string') {
    return errorResult('outputPath is required and must be a string');
  }

  if (!version || typeof version !== 'string') {
    return errorResult('version is required and must be a string');
  }

  try {
    const manager = new VersionManager(outputPath as string);
    await manager.initialize({
      specifiedVersion: version as string
    });

    return jsonResult({
      success: true,
      lockedVersion: version,
      isLocked: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Version lock failed: ${message}`);
  }
};

/**
 * 验证版本工具定义
 */
export const validateVersionToolDefinition: McpToolDefinition = {
  name: 'chaos_validate_version',
  description: '验证版本号格式是否正确（vX.Y格式）。',
  inputSchema: {
    type: 'object',
    properties: {
      version: {
        type: 'string',
        description: '要验证的版本号'
      }
    },
    required: ['version']
  }
};

/**
 * 验证版本工具处理器
 */
export const validateVersionToolHandler: McpToolHandler = async (args) => {
  const { version } = args;

  if (!version || typeof version !== 'string') {
    return errorResult('version is required and must be a string');
  }

  try {
    const result = validateVersion(version as string);
    const parsed = parseVersion(version as string);

    return jsonResult({
      success: true,
      valid: result.valid,
      error: result.error,
      parsed: parsed ? {
        major: parsed.major,
        minor: parsed.minor,
        full: parsed.full
      } : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Version validation failed: ${message}`);
  }
};

/**
 * 所有版本管理工具
 */
export const versionTools = [
  { definition: detectVersionsToolDefinition, handler: detectVersionsToolHandler },
  { definition: createVersionToolDefinition, handler: createVersionToolHandler },
  { definition: lockVersionToolDefinition, handler: lockVersionToolHandler },
  { definition: validateVersionToolDefinition, handler: validateVersionToolHandler }
];