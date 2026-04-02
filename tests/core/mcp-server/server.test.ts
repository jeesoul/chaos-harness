import { describe, it, expect, beforeEach } from 'vitest';
import {
  ChaosMcpServer,
  createMcpServer,
  successResult,
  errorResult,
  jsonResult,
  markdownResult,
  textResourceContent
} from '../../../src/core/mcp-server/server.js';
import { DEFAULT_MCP_CONFIG } from '../../../src/core/mcp-server/types.js';

describe('MCP Server', () => {
  let server: ChaosMcpServer;

  beforeEach(() => {
    server = createMcpServer();
  });

  describe('initialization', () => {
    it('should create server with default config', () => {
      const info = server.getServerInfo();
      expect(info.name).toBe(DEFAULT_MCP_CONFIG.name);
      expect(info.version).toBe(DEFAULT_MCP_CONFIG.version);
    });

    it('should create server with custom config', () => {
      const customServer = createMcpServer({
        name: 'custom-server',
        version: '2.0.0'
      });

      const info = customServer.getServerInfo();
      expect(info.name).toBe('custom-server');
      expect(info.version).toBe('2.0.0');
    });

    it('should initialize with zero tools and resources', () => {
      const state = server.getState();
      expect(state.toolsRegistered).toBe(0);
      expect(state.resourcesRegistered).toBe(0);
      expect(state.isRunning).toBe(false);
    });
  });

  describe('tool registration', () => {
    it('should register a single tool', () => {
      server.registerTool(
        {
          name: 'test_tool',
          description: 'Test tool',
          inputSchema: {
            type: 'object',
            properties: {
              input: { type: 'string', description: 'Input' }
            }
          }
        },
        async () => successResult('ok')
      );

      const state = server.getState();
      expect(state.toolsRegistered).toBe(1);
    });

    it('should register multiple tools', () => {
      server.registerTools([
        {
          definition: { name: 'tool1', description: 'Tool 1', inputSchema: { type: 'object', properties: {} } },
          handler: async () => successResult('ok')
        },
        {
          definition: { name: 'tool2', description: 'Tool 2', inputSchema: { type: 'object', properties: {} } },
          handler: async () => successResult('ok')
        }
      ]);

      const state = server.getState();
      expect(state.toolsRegistered).toBe(2);
    });

    it('should list registered tools', () => {
      server.registerTool(
        { name: 'test_tool', description: 'Test tool', inputSchema: { type: 'object', properties: {} } },
        async () => successResult('ok')
      );

      const tools = server.getToolList();
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe('test_tool');
    });
  });

  describe('resource registration', () => {
    it('should register a single resource', () => {
      server.registerResource(
        {
          uri: 'test://resource',
          name: 'Test Resource',
          description: 'A test resource',
          mimeType: 'text/plain'
        },
        async () => textResourceContent('test://resource', 'text/plain', 'content')
      );

      const state = server.getState();
      expect(state.resourcesRegistered).toBe(1);
    });

    it('should list registered resources', () => {
      server.registerResource(
        { uri: 'test://resource', name: 'Test', description: 'Test', mimeType: 'text/plain' },
        async () => textResourceContent('test://resource', 'text/plain', 'content')
      );

      const resources = server.getResourceList();
      expect(resources.length).toBe(1);
      expect(resources[0].uri).toBe('test://resource');
    });
  });

  describe('tool execution', () => {
    it('should execute registered tool', async () => {
      server.registerTool(
        {
          name: 'echo',
          description: 'Echo tool',
          inputSchema: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'Message to echo' }
            },
            required: ['message']
          }
        },
        async (args) => successResult(`Echo: ${args.message}`)
      );

      const result = await server.callTool('echo', { message: 'hello' });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBe('Echo: hello');
    });

    it('should return error for unknown tool', async () => {
      const result = await server.callTool('unknown_tool', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('should handle tool errors', async () => {
      server.registerTool(
        { name: 'failing', description: 'Failing tool', inputSchema: { type: 'object', properties: {} } },
        async () => { throw new Error('Tool error'); }
      );

      const result = await server.callTool('failing', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Tool error');
    });

    it('should increment request count', async () => {
      server.registerTool(
        { name: 'test', description: 'Test', inputSchema: { type: 'object', properties: {} } },
        async () => successResult('ok')
      );

      await server.callTool('test', {});
      await server.callTool('test', {});

      const state = server.getState();
      expect(state.requestCount).toBe(2);
    });
  });

  describe('resource reading', () => {
    it('should read registered resource', async () => {
      server.registerResource(
        { uri: 'test://resource', name: 'Test', description: 'Test', mimeType: 'text/plain' },
        async (uri) => textResourceContent(uri, 'text/plain', 'Hello')
      );

      const content = await server.readResource('test://resource');

      expect(content.contents[0].text).toBe('Hello');
      expect(content.contents[0].mimeType).toBe('text/plain');
    });

    it('should throw for unknown resource', async () => {
      await expect(server.readResource('unknown://resource')).rejects.toThrow('not found');
    });
  });

  describe('server lifecycle', () => {
    it('should start and stop server', async () => {
      expect(server.getState().isRunning).toBe(false);

      await server.start();
      expect(server.getState().isRunning).toBe(true);

      await server.stop();
      expect(server.getState().isRunning).toBe(false);
    });

    it('should reset server state', async () => {
      server.registerTool(
        { name: 'test', description: 'Test', inputSchema: { type: 'object', properties: {} } },
        async () => successResult('ok')
      );

      await server.callTool('test', {});

      server.reset();

      const state = server.getState();
      expect(state.requestCount).toBe(0);
      expect(state.errorCount).toBe(0);
    });
  });

  describe('formatting', () => {
    it('should format tools as markdown', () => {
      server.registerTool(
        {
          name: 'test_tool',
          description: 'A test tool',
          inputSchema: {
            type: 'object',
            properties: {
              input: { type: 'string', description: 'Input parameter' }
            },
            required: ['input']
          }
        },
        async () => successResult('ok')
      );

      const md = server.formatToolsMarkdown();

      expect(md).toContain('test_tool');
      expect(md).toContain('A test tool');
      expect(md).toContain('input');
    });

    it('should format resources as markdown', () => {
      server.registerResource(
        { uri: 'test://resource', name: 'Test Resource', description: 'A test', mimeType: 'text/plain' },
        async () => textResourceContent('test://resource', 'text/plain', 'content')
      );

      const md = server.formatResourcesMarkdown();

      expect(md).toContain('Test Resource');
      expect(md).toContain('test://resource');
    });
  });
});

describe('Result helpers', () => {
  it('should create success result', () => {
    const result = successResult('test');
    expect(result.content[0].text).toBe('test');
    expect(result.isError).toBeUndefined();
  });

  it('should create error result', () => {
    const result = errorResult('error message');
    expect(result.content[0].text).toBe('error message');
    expect(result.isError).toBe(true);
  });

  it('should create json result', () => {
    const result = jsonResult({ key: 'value' });
    expect(result.content[0].text).toContain('key');
    expect(result.content[0].text).toContain('value');
  });

  it('should create markdown result', () => {
    const result = markdownResult('# Title');
    expect(result.content[0].text).toBe('# Title');
  });

  it('should create text resource content', () => {
    const content = textResourceContent('test://uri', 'text/plain', 'content');
    expect(content.contents[0].uri).toBe('test://uri');
    expect(content.contents[0].mimeType).toBe('text/plain');
    expect(content.contents[0].text).toBe('content');
  });
});