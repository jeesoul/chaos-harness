import { describe, it, expect, beforeAll } from 'vitest';
import { loadTemplate, listTemplates, calculateMatchScore, findBestTemplate } from '../../../src/core/harness-generator/template-loader.js';
import { HarnessConfig } from '../../../src/core/harness-generator/types.js';

describe('TemplateLoader', () => {
  describe('loadTemplate', () => {
    it('should load java-spring template', async () => {
      const template = await loadTemplate('java-spring');
      expect(template.identity.name).toBe('java-spring-harness');
      expect(template.identity.suitableFor).toContain('java-spring');
      expect(template.identity.confidenceThreshold).toBeGreaterThan(0);
    });

    it('should load java-spring-legacy template', async () => {
      const template = await loadTemplate('java-spring-legacy');
      expect(template.identity.name).toBe('java-spring-legacy-harness');
      expect(template.identity.suitableFor).toContain('java-spring-legacy');
    });

    it('should load generic template', async () => {
      const template = await loadTemplate('generic');
      expect(template.identity.name).toBe('generic-harness');
      expect(template.identity.suitableFor).toContain('generic');
    });

    it('should throw error for non-existent template', async () => {
      await expect(loadTemplate('non-existent-template')).rejects.toThrow();
    });
  });

  describe('listTemplates', () => {
    it('should list all available templates', async () => {
      const templates = await listTemplates();
      expect(templates).toContain('java-spring');
      expect(templates).toContain('java-spring-legacy');
      expect(templates).toContain('generic');
    });
  });

  describe('calculateMatchScore', () => {
    it('should calculate match score for project', async () => {
      const scanResult = { projectType: 'java-spring', javaVersion: '17' };
      const score = await calculateMatchScore('java-spring', scanResult);
      expect(score).toBeGreaterThan(0.8);
    });

    it('should return high score for legacy project', async () => {
      const scanResult = { projectType: 'java-spring-legacy', javaVersion: '1.8' };
      const score = await calculateMatchScore('java-spring-legacy', scanResult);
      expect(score).toBeGreaterThan(0.8);
    });

    it('should return low score for mismatched project', async () => {
      const scanResult = { projectType: 'node-express' };
      const score = await calculateMatchScore('java-spring', scanResult);
      expect(score).toBeLessThan(0.5);
    });

    it('should match based on language name', async () => {
      const scanResult = { language: { name: 'java', version: '17' } };
      const score = await calculateMatchScore('java-spring', scanResult);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('findBestTemplate', () => {
    it('should find best matching template', async () => {
      const scanResult = { projectType: 'java-spring-legacy', javaVersion: '1.8' };
      const best = await findBestTemplate(scanResult);
      expect(best).toBe('java-spring-legacy');
    });

    it('should return generic template as fallback', async () => {
      const scanResult = { projectType: 'unknown' };
      const template = await findBestTemplate(scanResult);
      expect(template).toBe('generic');
    });

    it('should match java-spring for modern spring project', async () => {
      const scanResult = { projectType: 'java-spring', javaVersion: '17' };
      const best = await findBestTemplate(scanResult);
      expect(best).toBe('java-spring');
    });

    it('should return generic for empty scan result', async () => {
      const scanResult = {};
      const best = await findBestTemplate(scanResult);
      expect(best).toBe('generic');
    });
  });
});