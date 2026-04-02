import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  generateHarness,
  validateHarness,
  exportHarnessYaml,
  exportHarnessMarkdown,
  evaluateHarness
} from '../../../src/core/harness-generator/index.js';

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-output-harness');

const mockScanResult = {
  projectType: 'java-spring',
  language: { name: 'Java', version: '17' },
  buildTool: { name: 'Maven', version: '3.9' },
  dependencySources: [
    { type: 'public', url: 'https://repo.maven.apache.org/maven2' },
    { type: 'private', url: 'http://nexus.company.com/repository', authRequired: true }
  ],
  testCoverage: { framework: 'JUnit' },
  codeStyle: { inferredRules: ['className:PascalCase', 'methodName:camelCase'] }
};

describe('Harness Generator Integration', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  describe('generateHarness', () => {
    it('should generate harness from scan result', async () => {
      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      expect(harness.identity.name).toBeDefined();
      expect(harness.identity.version).toBeDefined();
      expect(harness.ironLaws.length).toBeGreaterThan(0);
      expect(harness.dynamicRules.buildCommands).toBeDefined();
    });

    it('should use specified template override', async () => {
      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR,
        templateOverride: 'java-spring-legacy'
      });

      expect(harness.identity.name).toContain('legacy');
    });

    it('should merge custom rules', async () => {
      const customIronLaw = {
        ironLaws: [{
          id: 'CUSTOM001',
          rule: 'Custom rule',
          enforcement: 'warn' as const,
          violationAction: 'Log warning'
        }]
      };

      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR,
        customRules: customIronLaw
      });

      expect(harness.ironLaws.some(il => il.id === 'CUSTOM001')).toBe(true);
    });

    it('should use generic template for unknown project type', async () => {
      const unknownScanResult = { projectType: 'unknown' };

      const harness = await generateHarness({
        scanResult: unknownScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      // Should fallback to generic template
      expect(harness.identity.name).toContain('generic');
    });

    it('should extract private repos from scan result', async () => {
      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      expect(harness.dynamicRules.privateRepositories.length).toBeGreaterThan(0);
      expect(harness.dynamicRules.privateRepositories[0].authRequired).toBe(true);
    });
  });

  describe('validateHarness', () => {
    it('should validate a valid harness', () => {
      const validHarness = {
        identity: {
          name: 'test-harness',
          version: 'v0.1',
          createdAt: '2026-04-02T00:00:00Z',
          createdBy: 'scanner' as const,
          suitableFor: ['java-spring'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [{ field: 'projectType', operator: 'equals' as const, value: 'java-spring', description: 'Match project type' }],
          warningConditions: [],
          changeMonitor: { watchedFiles: [], threshold: 0.2 }
        },
        ironLaws: [{ id: 'IL001', rule: 'Test rule', enforcement: 'block' as const, violationAction: 'Block' }],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: 'mvn clean install', withTests: 'mvn clean install' },
          testFramework: { primary: 'JUnit' },
          inferredCodeStyle: { namingConvention: {}, importStyle: 'default' }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const result = validateHarness(validHarness);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should catch missing identity name', () => {
      const invalidHarness = {
        identity: { name: '', version: 'v0.1', createdAt: '', createdBy: 'scanner' as const, suitableFor: [], confidenceThreshold: 0.8 },
        selfCheck: { activationConditions: [], warningConditions: [], changeMonitor: { watchedFiles: [], threshold: 0.2 } },
        ironLaws: [],
        recommendations: [],
        dynamicRules: { privateRepositories: [], buildCommands: { standard: '', withTests: '' }, testFramework: { primary: '' }, inferredCodeStyle: { namingConvention: {}, importStyle: '' } },
        antiBypass: [],
        effectivenessLog: ''
      };

      const result = validateHarness(invalidHarness);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should catch missing iron laws', () => {
      const invalidHarness = {
        identity: { name: 'test', version: 'v0.1', createdAt: '', createdBy: 'scanner' as const, suitableFor: [], confidenceThreshold: 0.8 },
        selfCheck: { activationConditions: [], warningConditions: [], changeMonitor: { watchedFiles: [], threshold: 0.2 } },
        ironLaws: [],
        recommendations: [],
        dynamicRules: { privateRepositories: [], buildCommands: { standard: '', withTests: '' }, testFramework: { primary: '' }, inferredCodeStyle: { namingConvention: {}, importStyle: '' } },
        antiBypass: [],
        effectivenessLog: ''
      };

      const result = validateHarness(invalidHarness);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('ironLaws'))).toBe(true);
    });

    it('should warn about empty activation conditions', () => {
      const harnessWithWarning = {
        identity: { name: 'test', version: 'v0.1', createdAt: '', createdBy: 'scanner' as const, suitableFor: [], confidenceThreshold: 0.8 },
        selfCheck: { activationConditions: [], warningConditions: [], changeMonitor: { watchedFiles: [], threshold: 0.2 } },
        ironLaws: [{ id: 'IL001', rule: 'Test', enforcement: 'block' as const, violationAction: 'Block' }],
        recommendations: [],
        dynamicRules: { privateRepositories: [], buildCommands: { standard: '', withTests: '' }, testFramework: { primary: '' }, inferredCodeStyle: { namingConvention: {}, importStyle: '' } },
        antiBypass: [],
        effectivenessLog: ''
      };

      const result = validateHarness(harnessWithWarning);
      expect(result.warnings.some(w => w.includes('activationConditions'))).toBe(true);
    });
  });

  describe('exportHarnessYaml', () => {
    it('should export harness as YAML', async () => {
      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      const yaml = exportHarnessYaml(harness);
      expect(yaml).toContain('identity:');
      expect(yaml).toContain('ironLaws:');
      expect(yaml).toContain('dynamicRules:');
    });
  });

  describe('exportHarnessMarkdown', () => {
    it('should export harness as Markdown', async () => {
      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      const md = exportHarnessMarkdown(harness);
      expect(md).toContain('# ');
      expect(md).toContain('## Iron Laws');
      expect(md).toContain('## Dynamic Rules');
      expect(md).toContain('## Anti-Bypass Rules');
    });

    it('should include iron law table', async () => {
      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      const md = exportHarnessMarkdown(harness);
      expect(md).toContain('| ID | Rule | Enforcement |');
    });
  });

  describe('evaluateHarness', () => {
    it('should evaluate harness activation', async () => {
      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      const evaluation = await evaluateHarness(harness, mockScanResult);
      expect(evaluation.activationScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.activationScore).toBeLessThanOrEqual(1);
      expect(typeof evaluation.shouldActivate).toBe('boolean');
    });

    it('should return activation results', async () => {
      const harness = await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      const evaluation = await evaluateHarness(harness, mockScanResult);
      expect(Array.isArray(evaluation.activationResults)).toBe(true);
      expect(Array.isArray(evaluation.warningResults)).toBe(true);
    });
  });

  describe('file output', () => {
    it('should write harness.yaml file', async () => {
      await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      const yamlFile = path.join(TEST_OUTPUT_DIR, 'harness.yaml');
      const content = await fs.readFile(yamlFile, 'utf-8');
      expect(content).toContain('identity:');
    });

    it('should write harness.md file', async () => {
      await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      const mdFile = path.join(TEST_OUTPUT_DIR, 'harness.md');
      const content = await fs.readFile(mdFile, 'utf-8');
      expect(content).toContain('# ');
    });

    it('should write template-info.json file', async () => {
      await generateHarness({
        scanResult: mockScanResult,
        outputPath: TEST_OUTPUT_DIR
      });

      const infoFile = path.join(TEST_OUTPUT_DIR, 'template-info.json');
      const content = await fs.readFile(infoFile, 'utf-8');
      const info = JSON.parse(content);
      expect(info.templateName).toBeDefined();
      expect(info.generatedAt).toBeDefined();
    });
  });
});