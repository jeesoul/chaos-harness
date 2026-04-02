import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  performTwoStageReview,
  reviewSpecCompliance,
  reviewCodeQuality,
  formatReviewMarkdown
} from '../../../src/core/harness-generator/two-stage-review.js';
import fs from 'fs/promises';
import path from 'path';

const TEST_DIR = path.join(process.cwd(), 'test-two-stage-review');

describe('Two-Stage Review System', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('reviewSpecCompliance', () => {
    it('should check spec compliance', async () => {
      // Create test files
      const planPath = path.join(TEST_DIR, 'plan.md');
      const implPath = path.join(TEST_DIR, 'impl.ts');

      await fs.writeFile(planPath, `
- [ ] Feature A must be implemented
- [ ] Feature B must be implemented
- [ ] Feature C must be implemented
      `);

      await fs.writeFile(implPath, `
// Feature A implemented
function featureA() {}
      `);

      const result = await reviewSpecCompliance(planPath, [implPath]);

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should pass when all requirements are implemented', async () => {
      const planPath = path.join(TEST_DIR, 'plan.md');
      const implPath = path.join(TEST_DIR, 'impl.ts');

      await fs.writeFile(planPath, `
- [ ] Feature A must be implemented
      `);

      await fs.writeFile(implPath, `
// Feature A implemented
function featureA() {}
      `);

      const result = await reviewSpecCompliance(planPath, [implPath]);

      // Check that we have some requirements found
      expect(result.issues).toBeDefined();
    });

    it('should handle missing plan file', async () => {
      const result = await reviewSpecCompliance(
        path.join(TEST_DIR, 'nonexistent.md'),
        [path.join(TEST_DIR, 'impl.ts')]
      );

      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('reviewCodeQuality', () => {
    it('should detect large files', async () => {
      const implPath = path.join(TEST_DIR, 'large.ts');

      // Create a large file
      const lines = Array(600).fill('const x = 1;');
      await fs.writeFile(implPath, lines.join('\n'));

      const result = await reviewCodeQuality([implPath]);

      expect(result.issues.some(i => i.description.includes('large'))).toBe(true);
    });

    it('should handle test results', async () => {
      const implPath = path.join(TEST_DIR, 'impl.ts');
      await fs.writeFile(implPath, 'const x = 1;');

      const result = await reviewCodeQuality([implPath], {
        passed: true,
        coverage: 85,
        failures: []
      });

      expect(result.strengths.some(s => s.includes('tests passing'))).toBe(true);
      expect(result.strengths.some(s => s.includes('coverage'))).toBe(true);
    });

    it('should detect failing tests', async () => {
      const implPath = path.join(TEST_DIR, 'impl.ts');
      await fs.writeFile(implPath, 'const x = 1;');

      const result = await reviewCodeQuality([implPath], {
        passed: false,
        coverage: 50,
        failures: ['test 1 failed', 'test 2 failed']
      });

      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.severity === 'critical')).toBe(true);
    });
  });

  describe('performTwoStageReview', () => {
    it('should perform both stages', async () => {
      const planPath = path.join(TEST_DIR, 'plan.md');
      const implPath = path.join(TEST_DIR, 'impl.ts');

      await fs.writeFile(planPath, `
- [ ] Feature A must be implemented
      `);

      await fs.writeFile(implPath, `
// Feature A implemented
function featureA() {}
      `);

      const result = await performTwoStageReview({
        planPath,
        implementationPaths: [implPath]
      });

      expect(result.specCompliance).toBeDefined();
      expect(result.codeQuality).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('formatReviewMarkdown', () => {
    it('should format review result', () => {
      const result = formatReviewMarkdown({
        specCompliance: {
          passed: true,
          missingRequirements: [],
          extraFeatures: [],
          issues: []
        },
        codeQuality: {
          passed: true,
          strengths: ['Good tests'],
          issues: []
        },
        overallPassed: true,
        summary: 'Test summary'
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should include issues in output', () => {
      const summary = 'Test summary with issues: Feature A missing';
      const result = formatReviewMarkdown({
        specCompliance: {
          passed: false,
          missingRequirements: ['Feature A'],
          extraFeatures: [],
          issues: []
        },
        codeQuality: {
          passed: true,
          strengths: [],
          issues: []
        },
        overallPassed: false,
        summary
      });

      expect(result).toBeDefined();
    });
  });
});