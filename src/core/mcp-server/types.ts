/**
 * MCP Server Types
 *
 * M6: MCP Server类型定义
 */

/**
 * MCP工具定义
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}

/**
 * MCP工具处理器
 */
export interface McpToolHandler {
  (args: Record<string, unknown>): Promise<McpToolResult>;
}

/**
 * MCP工具结果
 */
export interface McpToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * MCP资源定义
 */
export interface McpResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * MCP资源处理器
 */
export interface McpResourceHandler {
  (uri: string): Promise<McpResourceContent>;
}

/**
 * MCP资源内容
 */
export interface McpResourceContent {
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}

/**
 * MCP Server配置
 */
export interface McpServerConfig {
  name: string;
  version: string;
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
  };
}

/**
 * 注册的工具
 */
export interface RegisteredTool {
  definition: McpToolDefinition;
  handler: McpToolHandler;
}

/**
 * 注册的资源
 */
export interface RegisteredResource {
  definition: McpResourceDefinition;
  handler: McpResourceHandler;
}

/**
 * 扫描工具参数
 */
export interface ScanToolArgs {
  projectRoot: string;
  includeEnv?: boolean;
  includeDeps?: boolean;
}

/**
 * 版本检测工具参数
 */
export interface DetectVersionsArgs {
  outputPath: string;
}

/**
 * 创建版本工具参数
 */
export interface CreateVersionArgs {
  outputPath: string;
  version: string;
  description?: string;
}

/**
 * 锁定版本工具参数
 */
export interface LockVersionArgs {
  outputPath: string;
  version: string;
}

/**
 * 生成Harness工具参数
 */
export interface GenerateHarnessArgs {
  projectRoot: string;
  outputPath: string;
  version?: string;
  template?: string;
  projectName?: string;
}

/**
 * 验证Harness工具参数
 */
export interface ValidateHarnessArgs {
  harnessPath: string;
}

/**
 * 创建工作流工具参数
 */
export interface CreateWorkflowArgs {
  projectRoot: string;
  version?: string;
  fileCount?: number;
  lineCount?: number;
  enableSupervisor?: boolean;
}

/**
 * 检测偷懒工具参数
 */
export interface DetectLazinessArgs {
  agentId: string;
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
  };
}

/**
 * MCP Server状态
 */
export interface McpServerState {
  isRunning: boolean;
  toolsRegistered: number;
  resourcesRegistered: number;
  requestCount: number;
  errorCount: number;
}

/**
 * 默认MCP Server配置
 */
export const DEFAULT_MCP_CONFIG: McpServerConfig = {
  name: 'chaos-harness',
  version: '0.1.0',
  capabilities: {
    tools: true,
    resources: true
  }
};