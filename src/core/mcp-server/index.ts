/**
 * MCP Server Entry Point
 *
 * M6: MCP Server入口整合
 */

// 类型导出
export type {
  McpToolDefinition,
  McpToolHandler,
  McpToolResult,
  McpResourceDefinition,
  McpResourceHandler,
  McpResourceContent,
  McpServerConfig,
  RegisteredTool,
  RegisteredResource,
  McpServerState
} from './types.js';

// 服务器导出
export {
  ChaosMcpServer,
  createMcpServer,
  successResult,
  errorResult,
  jsonResult,
  markdownResult,
  textResourceContent
} from './server.js';

// 工具导出
export { scannerTools } from './tools/scanner.js';
export { versionTools } from './tools/version.js';
export { harnessTools } from './tools/harness.js';
export { workflowTools } from './tools/workflow.js';

// 资源导出
export {
  TEMPLATE_RESOURCES,
  getTemplateResources
} from './resources/templates.js';

// 默认配置
import { DEFAULT_MCP_CONFIG } from './types.js';
import { createMcpServer, ChaosMcpServer } from './server.js';
import { scannerTools } from './tools/scanner.js';
import { versionTools } from './tools/version.js';
import { harnessTools } from './tools/harness.js';
import { workflowTools } from './tools/workflow.js';
import { TEMPLATE_RESOURCES } from './resources/templates.js';

/**
 * 创建完整的MCP Server
 */
export function createFullMcpServer(config?: {
  name?: string;
  version?: string;
  enableScannerTools?: boolean;
  enableVersionTools?: boolean;
  enableHarnessTools?: boolean;
  enableWorkflowTools?: boolean;
  enableTemplateResources?: boolean;
}): ChaosMcpServer {
  const server = createMcpServer({
    name: config?.name || DEFAULT_MCP_CONFIG.name,
    version: config?.version || DEFAULT_MCP_CONFIG.version
  });

  // 注册工具
  if (config?.enableScannerTools !== false) {
    server.registerTools(scannerTools);
  }

  if (config?.enableVersionTools !== false) {
    server.registerTools(versionTools);
  }

  if (config?.enableHarnessTools !== false) {
    server.registerTools(harnessTools);
  }

  if (config?.enableWorkflowTools !== false) {
    server.registerTools(workflowTools);
  }

  // 注册资源
  if (config?.enableTemplateResources !== false) {
    server.registerResources(TEMPLATE_RESOURCES);
  }

  return server;
}

/**
 * 获取所有工具定义
 */
export function getAllToolDefinitions() {
  return [
    ...scannerTools.map(t => t.definition),
    ...versionTools.map(t => t.definition),
    ...harnessTools.map(t => t.definition),
    ...workflowTools.map(t => t.definition)
  ];
}

/**
 * 获取工具总数
 */
export function getToolCount(): {
  scanner: number;
  version: number;
  harness: number;
  workflow: number;
  total: number;
} {
  return {
    scanner: scannerTools.length,
    version: versionTools.length,
    harness: harnessTools.length,
    workflow: workflowTools.length,
    total: scannerTools.length + versionTools.length + harnessTools.length + workflowTools.length
  };
}

/**
 * 打印服务器信息
 */
export function printServerInfo(): string {
  const count = getToolCount();
  const lines: string[] = [
    '# Chaos Harness MCP Server',
    '',
    `**Name:** ${DEFAULT_MCP_CONFIG.name}`,
    `**Version:** ${DEFAULT_MCP_CONFIG.version}`,
    '',
    '## Tools',
    '',
    `| Category | Count |`,
    `|----------|-------|`,
    `| Scanner | ${count.scanner} |`,
    `| Version | ${count.version} |`,
    `| Harness | ${count.harness} |`,
    `| Workflow | ${count.workflow} |`,
    `| **Total** | **${count.total}** |`,
    '',
    '## Resources',
    '',
    `| Resource | Description |`,
    `|----------|-------------|`,
    ...TEMPLATE_RESOURCES.map(r => `| ${r.definition.name} | ${r.definition.description} |`)
  ];

  return lines.join('\n');
}