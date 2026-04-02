/**
 * MCP Server Implementation
 *
 * M6: MCP Server核心实现
 */

import {
  McpServerConfig,
  McpToolDefinition,
  McpToolHandler,
  McpToolResult,
  McpResourceDefinition,
  McpResourceHandler,
  McpResourceContent,
  RegisteredTool,
  RegisteredResource,
  McpServerState,
  DEFAULT_MCP_CONFIG
} from './types.js';

/**
 * Chaos Harness MCP Server
 */
export class ChaosMcpServer {
  private config: McpServerConfig;
  private tools: Map<string, RegisteredTool> = new Map();
  private resources: Map<string, RegisteredResource> = new Map();
  private state: McpServerState = {
    isRunning: false,
    toolsRegistered: 0,
    resourcesRegistered: 0,
    requestCount: 0,
    errorCount: 0
  };

  constructor(config?: Partial<McpServerConfig>) {
    this.config = { ...DEFAULT_MCP_CONFIG, ...config };
  }

  /**
   * 注册工具
   */
  registerTool(definition: McpToolDefinition, handler: McpToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
    this.state.toolsRegistered = this.tools.size;
  }

  /**
   * 批量注册工具
   */
  registerTools(tools: Array<{ definition: McpToolDefinition; handler: McpToolHandler }>): void {
    for (const { definition, handler } of tools) {
      this.registerTool(definition, handler);
    }
  }

  /**
   * 注册资源
   */
  registerResource(definition: McpResourceDefinition, handler: McpResourceHandler): void {
    this.resources.set(definition.uri, { definition, handler });
    this.state.resourcesRegistered = this.resources.size;
  }

  /**
   * 批量注册资源
   */
  registerResources(resources: Array<{ definition: McpResourceDefinition; handler: McpResourceHandler }>): void {
    for (const { definition, handler } of resources) {
      this.registerResource(definition, handler);
    }
  }

  /**
   * 获取工具列表
   */
  getToolList(): McpToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * 获取资源列表
   */
  getResourceList(): McpResourceDefinition[] {
    return Array.from(this.resources.values()).map(r => r.definition);
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
    this.state.requestCount++;

    const tool = this.tools.get(name);
    if (!tool) {
      this.state.errorCount++;
      return {
        content: [{ type: 'text', text: `Error: Tool '${name}' not found` }],
        isError: true
      };
    }

    try {
      const result = await tool.handler(args);
      return result;
    } catch (error) {
      this.state.errorCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error executing tool '${name}': ${errorMessage}` }],
        isError: true
      };
    }
  }

  /**
   * 读取资源
   */
  async readResource(uri: string): Promise<McpResourceContent> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource '${uri}' not found`);
    }

    return resource.handler(uri);
  }

  /**
   * 获取服务器状态
   */
  getState(): McpServerState {
    return { ...this.state };
  }

  /**
   * 获取服务器信息
   */
  getServerInfo(): { name: string; version: string; capabilities: McpServerConfig['capabilities'] } {
    return {
      name: this.config.name,
      version: this.config.version,
      capabilities: this.config.capabilities
    };
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    this.state.isRunning = true;
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    this.state.isRunning = false;
  }

  /**
   * 重置服务器状态
   */
  reset(): void {
    this.state = {
      isRunning: false,
      toolsRegistered: this.tools.size,
      resourcesRegistered: this.resources.size,
      requestCount: 0,
      errorCount: 0
    };
  }

  /**
   * 格式化工具列表为Markdown
   */
  formatToolsMarkdown(): string {
    const lines: string[] = [
      '# Chaos Harness MCP Tools',
      '',
      `**Server:** ${this.config.name} v${this.config.version}`,
      '',
      `**Tools:** ${this.tools.size}`,
      ''
    ];

    for (const [name, tool] of this.tools) {
      lines.push(`## ${name}`);
      lines.push('');
      lines.push(tool.definition.description);
      lines.push('');
      lines.push('**Parameters:**');
      lines.push('');

      const props = tool.definition.inputSchema.properties;
      for (const [propName, propDef] of Object.entries(props)) {
        const required = tool.definition.inputSchema.required?.includes(propName);
        lines.push(`- \`${propName}\` (${propDef.type})${required ? ' *required*' : ''}: ${propDef.description}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 格式化资源列表为Markdown
   */
  formatResourcesMarkdown(): string {
    const lines: string[] = [
      '# Chaos Harness MCP Resources',
      '',
      `**Resources:** ${this.resources.size}`,
      ''
    ];

    for (const [uri, resource] of this.resources) {
      lines.push(`- **${resource.definition.name}**`);
      lines.push(`  - URI: \`${uri}\``);
      lines.push(`  - Type: ${resource.definition.mimeType}`);
      lines.push(`  - ${resource.definition.description}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * 创建MCP Server
 */
export function createMcpServer(config?: Partial<McpServerConfig>): ChaosMcpServer {
  return new ChaosMcpServer(config);
}

/**
 * 辅助函数：创建成功结果
 */
export function successResult(text: string): McpToolResult {
  return {
    content: [{ type: 'text', text }]
  };
}

/**
 * 辅助函数：创建错误结果
 */
export function errorResult(message: string): McpToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true
  };
}

/**
 * 辅助函数：创建JSON结果
 */
export function jsonResult(data: unknown): McpToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
  };
}

/**
 * 辅助函数：创建Markdown结果
 */
export function markdownResult(markdown: string): McpToolResult {
  return {
    content: [{ type: 'text', text: markdown }]
  };
}

/**
 * 辅助函数：创建资源内容
 */
export function textResourceContent(uri: string, mimeType: string, text: string): McpResourceContent {
  return {
    contents: [{ uri, mimeType, text }]
  };
}