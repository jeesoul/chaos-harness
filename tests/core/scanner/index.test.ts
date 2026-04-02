// tests/core/scanner/index.test.ts

import { describe, it, expect } from 'vitest';
import { scan } from '../../../src/core/scanner/index.js';
import { ProjectType, ArchitectureType } from '../../../src/core/scanner/types.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, rmSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('scan', () => {
  const fixturesDir = join(__dirname, 'fixtures');

  describe('Java Maven Project', () => {
    it('should scan Java Maven project successfully', async () => {
      const projectRoot = join(fixturesDir, 'java-maven-project');
      const result = await scan({ projectRoot });

      expect(result.timestamp).toBeDefined();
      expect(result.projectRoot).toBe(projectRoot);
      expect(result.projectType.type).toBe(ProjectType.JAVA_SPRING_LEGACY);
      expect(result.projectType.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.projectType.features).toContain('maven');
      expect(result.architecture).toBe(ArchitectureType.MONOLITH);
      expect(result.language).not.toBeNull();
      expect(result.language?.name).toBe('java');
      expect(result.buildTool).not.toBeNull();
      expect(result.buildTool?.name).toBe('maven');
      expect(result.warnings).toBeInstanceOf(Array);
    });
  });

  describe('Node npm Project', () => {
    it('should scan Node npm project successfully', async () => {
      const projectRoot = join(fixturesDir, 'node-npm-project');
      const result = await scan({ projectRoot });

      expect(result.timestamp).toBeDefined();
      expect(result.projectRoot).toBe(projectRoot);
      expect(result.projectType.type).toBe(ProjectType.REACT_VITE);
      expect(result.projectType.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.projectType.features).toContain('npm');
      expect(result.architecture).toBe(ArchitectureType.MONOLITH);
      expect(result.language).not.toBeNull();
      expect(result.language?.name).toBe('node');
      expect(result.buildTool).not.toBeNull();
      expect(result.buildTool?.name).toBe('npm');
      expect(result.warnings).toBeInstanceOf(Array);
    });
  });

  describe('Python Project', () => {
    it('should scan Python project successfully', async () => {
      const projectRoot = join(fixturesDir, 'python-project');
      const result = await scan({ projectRoot });

      expect(result.timestamp).toBeDefined();
      expect(result.projectRoot).toBe(projectRoot);
      expect(result.projectType.type).toBe(ProjectType.PYTHON_DJANGO);
      expect(result.projectType.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.projectType.features).toContain('pip');
      expect(result.architecture).toBe(ArchitectureType.MONOLITH);
      expect(result.language).not.toBeNull();
      expect(result.language?.name).toBe('python');
      expect(result.buildTool).not.toBeNull();
      expect(result.buildTool?.name).toBe('pip');
      expect(result.warnings).toBeInstanceOf(Array);
    });
  });

  describe('Non-existent Directory', () => {
    it('should throw error for non-existent directory', async () => {
      const projectRoot = join(fixturesDir, 'non-existent-project');

      await expect(scan({ projectRoot })).rejects.toThrow();
    });
  });

  describe('Architecture Detection', () => {
    it('should detect MICROSERVICE architecture when docker-compose.yml exists', async () => {
      // Create a temporary project with docker-compose.yml
      const tempDir = join(fixturesDir, 'temp-microservice-project');
      try {
        mkdirSync(tempDir, { recursive: true });
        writeFileSync(join(tempDir, 'docker-compose.yml'), 'version: "3"');
        writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

        const result = await scan({ projectRoot: tempDir });

        expect(result.architecture).toBe(ArchitectureType.MICROSERVICE);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should detect MICROSERVICE architecture when kubernetes/ exists', async () => {
      // Create a temporary project with kubernetes/ directory
      const tempDir = join(fixturesDir, 'temp-k8s-project');
      try {
        mkdirSync(join(tempDir, 'kubernetes'), { recursive: true });
        writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

        const result = await scan({ projectRoot: tempDir });

        expect(result.architecture).toBe(ArchitectureType.MICROSERVICE);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should detect MICROSERVICE architecture when k8s/ exists', async () => {
      // Create a temporary project with k8s/ directory
      const tempDir = join(fixturesDir, 'temp-k8s-dir-project');
      try {
        mkdirSync(join(tempDir, 'k8s'), { recursive: true });
        writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }));

        const result = await scan({ projectRoot: tempDir });

        expect(result.architecture).toBe(ArchitectureType.MICROSERVICE);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('Warnings Collection', () => {
    it('should collect warnings during scan', async () => {
      const projectRoot = join(fixturesDir, 'java-maven-project');
      const result = await scan({ projectRoot });

      // Warnings should be an array (may be empty or contain warnings about missing tools)
      expect(result.warnings).toBeInstanceOf(Array);
    });
  });

  describe('Skip Environment Check', () => {
    it('should skip environment check when skipEnvCheck is true', async () => {
      const projectRoot = join(fixturesDir, 'java-maven-project');
      const result = await scan({ projectRoot, skipEnvCheck: true });

      // localEnv should be empty when skipEnvCheck is true
      expect(result.localEnv).toHaveLength(0);
    });
  });
});