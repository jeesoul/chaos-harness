import { describe, it, expect } from 'vitest';
import {
  createFullMcpServer,
  getAllToolDefinitions,
  getToolCount,
  printServerInfo
} from '../../../src/core/mcp-server/index.js';

describe('MCP Server Integration', () => {
  describe('createFullMcpServer', () => {
    it('should create server with all tools by default', () => {
      const server = createFullMcpServer();
      const state = server.getState();

      expect(state.toolsRegistered).toBeGreaterThan(0);
      expect(state.resourcesRegistered).toBeGreaterThan(0);
    });

    it('should allow disabling tools', () => {
      const server = createFullMcpServer({
        enableScannerTools: false,
        enableVersionTools: false,
        enableHarnessTools: false,
        enableWorkflowTools: false,
        enableTemplateResources: false
      });

      const state = server.getState();
      expect(state.toolsRegistered).toBe(0);
      expect(state.resourcesRegistered).toBe(0);
    });

    it('should allow partial tool registration', () => {
      const server = createFullMcpServer({
        enableScannerTools: true,
        enableVersionTools: false,
        enableHarnessTools: false,
        enableWorkflowTools: false
      });

      const state = server.getState();
      expect(state.toolsRegistered).toBe(2); // 2 scanner tools
    });
  });

  describe('getAllToolDefinitions', () => {
    it('should return all tool definitions', () => {
      const definitions = getAllToolDefinitions();

      expect(definitions.length).toBeGreaterThan(0);

      // Check for expected tools
      const toolNames = definitions.map(d => d.name);
      expect(toolNames).toContain('chaos_scan');
      expect(toolNames).toContain('chaos_detect_versions');
      expect(toolNames).toContain('chaos_generate_harness');
      expect(toolNames).toContain('chaos_create_workflow');
    });

    it('should have valid input schemas', () => {
      const definitions = getAllToolDefinitions();

      for (const def of definitions) {
        expect(def.inputSchema.type).toBe('object');
        expect(def.inputSchema.properties).toBeDefined();
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
      }
    });
  });

  describe('getToolCount', () => {
    it('should return correct counts', () => {
      const count = getToolCount();

      expect(count.scanner).toBe(2);
      expect(count.version).toBe(4);
      expect(count.harness).toBe(5);
      expect(count.workflow).toBe(6);
      expect(count.total).toBe(count.scanner + count.version + count.harness + count.workflow);
    });
  });

  describe('printServerInfo', () => {
    it('should print server information', () => {
      const info = printServerInfo();

      expect(info).toContain('Chaos Harness MCP Server');
      expect(info).toContain('Tools');
      expect(info).toContain('Resources');
    });
  });

  describe('tool execution', () => {
    it('should execute chaos_list_templates successfully', async () => {
      const server = createFullMcpServer();

      const result = await server.callTool('chaos_list_templates', {});

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBeDefined();
    });

    it('should execute chaos_list_stages successfully', async () => {
      const server = createFullMcpServer();

      const result = await server.callTool('chaos_list_stages', {});

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.stages.length).toBe(12);
    });

    it('should execute chaos_list_iron_laws successfully', async () => {
      const server = createFullMcpServer();

      const result = await server.callTool('chaos_list_iron_laws', {});

      expect(result.isError).toBeUndefined();

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.ironLaws.length).toBe(5);
    });

    it('should handle invalid arguments', async () => {
      const server = createFullMcpServer();

      const result = await server.callTool('chaos_scan', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('required');
    });
  });

  describe('resource access', () => {
    it('should list template resources', () => {
      const server = createFullMcpServer();
      const resources = server.getResourceList();

      expect(resources.length).toBe(5);
      expect(resources.some(r => r.uri === 'chaos://templates/java-spring')).toBe(true);
      expect(resources.some(r => r.uri === 'chaos://templates/java-spring-legacy')).toBe(true);
    });
  });
});