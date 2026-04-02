import { describe, it, expect } from 'vitest';
import { detectProjectType } from '../../../src/core/scanner/project-detector.js';
import { ProjectType } from '../../../src/core/scanner/types.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('detectProjectType', () => {
  const fixturesDir = join(__dirname, 'fixtures');

  describe('Java Spring Boot Legacy Project', () => {
    it('should detect Java Spring Boot legacy project (JDK 8 + Spring Boot 2.x)', async () => {
      const projectRoot = join(fixturesDir, 'java-maven-project');
      const result = await detectProjectType(projectRoot);

      expect(result.type).toBe(ProjectType.JAVA_SPRING_LEGACY);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.features).toContain('maven');
      expect(result.features).toContain('spring-boot');
      expect(result.features).toContain('java-1.8');
    });
  });

  describe('Node React Vite Project', () => {
    it('should detect React Vite project', async () => {
      const projectRoot = join(fixturesDir, 'node-npm-project');
      const result = await detectProjectType(projectRoot);

      expect(result.type).toBe(ProjectType.REACT_VITE);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.features).toContain('npm');
      expect(result.features).toContain('react');
      expect(result.features).toContain('vite');
    });
  });

  describe('Python Django Project', () => {
    it('should detect Python Django project', async () => {
      const projectRoot = join(fixturesDir, 'python-project');
      const result = await detectProjectType(projectRoot);

      expect(result.type).toBe(ProjectType.PYTHON_DJANGO);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.features).toContain('pip');
      expect(result.features).toContain('django');
    });
  });

  describe('Unknown Project', () => {
    it('should return UNKNOWN for empty/unknown projects', async () => {
      const projectRoot = join(fixturesDir, 'non-existent-project');
      const result = await detectProjectType(projectRoot);

      expect(result.type).toBe(ProjectType.UNKNOWN);
      expect(result.confidence).toBe(0);
      expect(result.features).toHaveLength(0);
    });
  });

  describe('Confidence Scoring', () => {
    it('should calculate confidence correctly based on feature matches', async () => {
      // Test Java project with 3+ features (maven, spring-boot, java-1.8)
      const javaProject = join(fixturesDir, 'java-maven-project');
      const javaResult = await detectProjectType(javaProject);

      // 3 features should give 0.8+ confidence
      expect(javaResult.features.length).toBeGreaterThanOrEqual(3);
      expect(javaResult.confidence).toBeGreaterThanOrEqual(0.8);

      // Test React project with 3+ features (npm, react, vite)
      const reactProject = join(fixturesDir, 'node-npm-project');
      const reactResult = await detectProjectType(reactProject);

      expect(reactResult.features.length).toBeGreaterThanOrEqual(3);
      expect(reactResult.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });
});