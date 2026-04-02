/**
 * Full Workflow Integration Test
 *
 * M7: 测试完整工作流：扫描 → 版本创建 → Harness生成 → 工作流创建 → 偷懒检测
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { scan } from '../../src/core/scanner/index.js';
import { VersionManager } from '../../src/core/version-manager/index.js';
import { generateHarness, validateHarness } from '../../src/core/harness-generator/index.js';
import {
  createWorkflowExecutor,
  quickDetectLaziness,
  determineProjectScale
} from '../../src/core/workflow-engine/index.js';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const TEMP_DIR = path.join(process.cwd(), 'test-temp-workflow');

describe('Full Workflow Integration', () => {
  beforeEach(async () => {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  });

  describe('Java Spring Project Workflow', () => {
    const javaProjectRoot = path.join(FIXTURES_DIR, 'sample-java-project');

    it('should complete full workflow for Java Spring project', async () => {
      // Step 1: Scan project
      const scanResult = await scan({ projectRoot: javaProjectRoot });

      expect(scanResult).toBeDefined();
      expect(scanResult.projectType.type).toBe('java-spring');
      expect(scanResult.language).toBeDefined();

      // Step 2: Create version
      const versionManager = new VersionManager(TEMP_DIR);
      await versionManager.initialize({
        autoCreate: true,
        defaultVersion: 'v0.1'
      });

      // Step 3: Generate Harness
      const harnessPath = path.join(TEMP_DIR, 'v0.1', 'Harness');
      const harness = await generateHarness({
        scanResult,
        outputPath: harnessPath
      });

      expect(harness).toBeDefined();
      expect(harness.identity).toBeDefined();
      expect(harness.ironLaws.length).toBeGreaterThan(0);
      expect(harness.antiBypass.length).toBeGreaterThan(0);

      // Step 4: Validate Harness
      const validation = validateHarness(harness);
      expect(validation.valid).toBe(true);

      // Step 5: Create Workflow
      const workflow = createWorkflowExecutor({
        projectRoot: javaProjectRoot,
        version: 'v0.1',
        fileCount: 5,
        lineCount: 50,
        enableSupervisor: true
      });

      expect(workflow).toBeDefined();
      expect(workflow.getCurrentStage()).toBe('W01_requirements_design');

      // Step 6: Detect laziness patterns
      const laziness = quickDetectLaziness('test-agent', {
        claimedCompletion: true,
        ranVerification: false
      });

      expect(laziness.length).toBeGreaterThan(0);
      expect(laziness).toContain('LP001');
    });

    it('should detect project scale correctly', () => {
      // Small project
      const smallScale = determineProjectScale(3, 80);
      expect(smallScale).toBe('small');

      // Medium project
      const mediumScale = determineProjectScale(10, 300);
      expect(mediumScale).toBe('medium');

      // Large project
      const largeScale = determineProjectScale(25, 600);
      expect(largeScale).toBe('large');
    });
  });

  describe('Node Express Project Workflow', () => {
    const nodeProjectRoot = path.join(FIXTURES_DIR, 'sample-node-project');

    it('should complete full workflow for Node Express project', async () => {
      // Step 1: Scan project
      const scanResult = await scan({ projectRoot: nodeProjectRoot });

      expect(scanResult).toBeDefined();
      expect(scanResult.projectType.type).toBe('node-express');
      expect(scanResult.language).toBeDefined();

      // Step 2: Generate Harness
      const harnessPath = path.join(TEMP_DIR, 'Harness');
      const harness = await generateHarness({
        scanResult,
        outputPath: harnessPath
      });

      expect(harness).toBeDefined();
      expect(harness.identity).toBeDefined();

      // Step 3: Create Workflow
      const workflow = createWorkflowExecutor({
        projectRoot: nodeProjectRoot,
        fileCount: 3,
        lineCount: 80,
        enableSupervisor: true
      });

      const progress = workflow.getProgress();
      expect(progress.total).toBe(12);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project path gracefully', async () => {
      const invalidPath = '/nonexistent/path/to/project';

      await expect(scan({ projectRoot: invalidPath })).rejects.toThrow();
    });

    it('should handle invalid version format', async () => {
      const { validateVersion } = await import('../../src/core/version-manager/index.js');

      // validateVersion should reject invalid format
      const result = validateVersion('invalid-version');
      expect(result.valid).toBe(false);
    });

    it('should detect multiple laziness patterns', () => {
      const patterns = quickDetectLaziness('test-agent', {
        claimedCompletion: true,
        ranVerification: false,
        proposedFix: true,
        mentionedRootCause: false
      });

      expect(patterns.length).toBeGreaterThanOrEqual(2);
      expect(patterns).toContain('LP001');
      expect(patterns).toContain('LP002');
    });
  });

  describe('Workflow State Transitions', () => {
    it('should track workflow progress correctly', () => {
      const workflow = createWorkflowExecutor({
        projectRoot: FIXTURES_DIR,
        fileCount: 10,
        lineCount: 200
      });

      const status = workflow.getStatus();

      expect(status.state.currentStage).toBeDefined();
      expect(status.progress.total).toBe(12);
      expect(status.teamStatus.total).toBeGreaterThan(0);
    });

    it('should enforce iron laws during workflow', () => {
      const workflow = createWorkflowExecutor({
        projectRoot: FIXTURES_DIR,
        fileCount: 20,
        lineCount: 500,
        enableSupervisor: true
      });

      // Large project should have all stages mandatory
      const result = workflow.requestSkip('W08_development', 'test reason');

      expect(result.allowed).toBe(false);
      expect(result.ironLawRef).toBe('IL001');
    });
  });
});