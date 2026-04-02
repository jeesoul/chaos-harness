#!/usr/bin/env node

/**
 * Chaos Harness MCP Server
 *
 * 启动 MCP Server 供 Claude Code 调用
 *
 * 使用方式:
 * 1. 全局安装: npm install -g chaos-harness
 * 2. Claude Code 配置:
 *    {
 *      "mcpServers": {
 *        "chaos-harness": {
 *          "command": "chaos-harness-mcp"
 *        }
 *      }
 *    }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  createFullMcpServer,
  getAllToolDefinitions,
  TEMPLATE_RESOURCES,
} from '../dist/core/mcp-server/index.js';

// 创建内部 server 实例
const internalServer = createFullMcpServer();

// 创建 MCP Server
const server = new Server(
  {
    name: 'chaos-harness',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = getAllToolDefinitions();
  return {
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await internalServer.callTool(name, args || {});
    return {
      content: result.content,
      isError: result.isError,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// 注册资源列表
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: TEMPLATE_RESOURCES.map(r => ({
      uri: r.uri,
      name: r.name,
      mimeType: r.mimeType,
    })),
  };
});

// 处理资源读取
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const resource = TEMPLATE_RESOURCES.find(r => r.uri === uri);
  if (!resource) {
    throw new Error(`Resource not found: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: resource.mimeType,
        text: resource.content,
      },
    ],
  };
});

// 启动服务
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Chaos Harness MCP Server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});