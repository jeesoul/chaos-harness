/**
 * MCP Server End-to-End Test
 *
 * M7: 测试MCP Server端到端功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFullMcpServer,
  getAllToolDefinitions,
  getToolCount,
  printServerInfo
} from '../../src/core/mcp-server/index.js';
import type { ChaosMcpServer } from '../../src/core/mcp-server/index.js';

describe('MCP Server End-to-End', () => {
  let server: ChaosMcpServer;

  beforeEach(() => {
    server = createFullMcpServer();
  });

  describe('Server Initialization', () => {
    it('should create server with all tools registered', () => {
      const state = server.getState();

      expect(state.toolsRegistered).toBe(17);
      expect(state.resourcesRegistered).toBe(5);
      expect(state.isRunning).toBe(false);
    });

    it('should have correct tool count by category', () => {
      const count = getToolCount();

      expect(count.scanner).toBe(2);
      expect(count.version).toBe(4);
      expect(count.harness).toBe(5);
      expect(count.workflow).toBe(6);
      expect(count.total).toBe(17);
    });

    it('should list all tool definitions', () => {
      const definitions = getAllToolDefinitions();

      expect(definitions.length).toBe(17);

      // Verify each tool has required fields
      for (const def of definitions) {
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.inputSchema).toBeDefined();
        expect(def.inputSchema.type).toBe('object');
      }
    });
  });

  describe('Tool Execution', () => {
    it('should execute chaos_list_templates successfully', async () => {
      const result = await server.callTool('chaos_list_templates', {});

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBeDefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.templates)).toBe(true);
    });

    it('should execute chaos_list_stages successfully', async () => {
      const result = await server.callTool('chaos_list_stages', {});

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.stages.length).toBe(12);
    });

    it('should execute chaos_list_iron_laws successfully', async () => {
      const result = await server.callTool('chaos_list_iron_laws', {});

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.ironLaws.length).toBe(5);
    });

    it('should execute chaos_detect_bypass successfully', async () => {
      const result = await server.callTool('chaos_detect_bypass', {
        text: 'This is a simple fix'
      });

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.detected).toBe(true);
    });

    it('should execute chaos_detect_laziness successfully', async () => {
      const result = await server.callTool('chaos_detect_laziness', {
        agentId: 'test-agent',
        claimedCompletion: true,
        ranVerification: false
      });

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.patternsDetected).toBeGreaterThan(0);
    });

    it('should validate version correctly', async () => {
      const result = await server.callTool('chaos_validate_version', {
        version: 'v1.0'
      });

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.valid).toBe(true);
    });

    it('should reject invalid version', async () => {
      const result = await server.callTool('chaos_validate_version', {
        version: 'invalid'
      });

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.valid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return error for missing required parameters', async () => {
      const result = await server.callTool('chaos_scan', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('required');
    });

    it('should return error for unknown tool', async () => {
      const result = await server.callTool('unknown_tool', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('should increment request count', async () => {
      const initialState = server.getState();

      await server.callTool('chaos_list_stages', {});
      await server.callTool('chaos_list_iron_laws', {});

      const newState = server.getState();
      expect(newState.requestCount).toBe(initialState.requestCount + 2);
    });
  });

  describe('Resource Access', () => {
    it('should list template resources', () => {
      const resources = server.getResourceList();

      expect(resources.length).toBe(5);

      const uris = resources.map(r => r.uri);
      expect(uris).toContain('chaos://templates/java-spring');
      expect(uris).toContain('chaos://templates/java-spring-legacy');
      expect(uris).toContain('chaos://templates/node-express');
      expect(uris).toContain('chaos://templates/python-django');
      expect(uris).toContain('chaos://templates/generic');
    });

    it('should have correct MIME types for resources', () => {
      const resources = server.getResourceList();

      for (const resource of resources) {
        expect(resource.mimeType).toBe('application/yaml');
      }
    });
  });

  describe('Server Information', () => {
    it('should print server info', () => {
      const info = printServerInfo();

      expect(info).toContain('Chaos Harness MCP Server');
      expect(info).toContain('Tools');
      expect(info).toContain('17');
      expect(info).toContain('Resources');
    });

    it('should format tools markdown', () => {
      const md = server.formatToolsMarkdown();

      expect(md).toContain('chaos_scan');
      expect(md).toContain('chaos_list_templates');
      expect(md).toContain('chaos_create_workflow');
    });

    it('should format resources markdown', () => {
      const md = server.formatResourcesMarkdown();

      expect(md).toContain('java-spring');
      expect(md).toContain('node-express');
    });
  });

  describe('State Management', () => {
    it('should track server state', () => {
      const state = server.getState();

      expect(state.isRunning).toBe(false);
      expect(state.toolsRegistered).toBeGreaterThan(0);
      expect(state.resourcesRegistered).toBeGreaterThan(0);
    });

    it('should reset state', async () => {
      await server.callTool('chaos_list_stages', {});

      server.reset();

      const state = server.getState();
      expect(state.requestCount).toBe(0);
      expect(state.errorCount).toBe(0);
    });
  });
});