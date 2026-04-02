/**
 * Adaptive Flow Integration Test
 *
 * M7: 测试自适应流程根据项目规模调整阶段
 */

import { describe, it, expect } from 'vitest';
import {
  determineProjectScale,
  initializeAdaptiveFlow,
  getMandatoryStages,
  getSkippableStages,
  validateSkipRequest,
  generateAdaptiveFlowRecommendation
} from '../../src/core/workflow-engine/adaptive-flow.js';
import type { WorkflowStage, StageStatus } from '../../src/core/workflow-engine/types.js';

describe('Adaptive Flow Integration', () => {
  describe('Project Scale Detection', () => {
    it('should classify small projects correctly', () => {
      // File count and line count both small
      expect(determineProjectScale(3, 50)).toBe('small');
      expect(determineProjectScale(5, 100)).toBe('small');
      expect(determineProjectScale(4, 80)).toBe('small');
    });

    it('should classify medium projects correctly', () => {
      // Between small and large
      expect(determineProjectScale(10, 200)).toBe('medium');
      expect(determineProjectScale(15, 400)).toBe('medium');
      expect(determineProjectScale(8, 150)).toBe('medium');
    });

    it('should classify large projects correctly', () => {
      // High file count or line count
      expect(determineProjectScale(25, 600)).toBe('large');
      expect(determineProjectScale(30, 300)).toBe('large');
      expect(determineProjectScale(10, 600)).toBe('large');
    });

    it('should upgrade to large for complex architecture', () => {
      // Medium project with complex architecture
      const scale = determineProjectScale(10, 300, {
        hasComplexArchitecture: true
      });

      expect(scale).toBe('large');
    });

    it('should upgrade to large for multiple modules', () => {
      const scale = determineProjectScale(10, 300, {
        hasMultipleModules: true
      });

      expect(scale).toBe('large');
    });
  });

  describe('Adaptive Stage Configuration', () => {
    describe('Small Projects', () => {
      const scale = 'small';

      it('should have 5 mandatory stages', () => {
        const stages = getMandatoryStages(scale);
        expect(stages.length).toBe(5);
        expect(stages).toContain('W08_development');
        expect(stages).toContain('W09_code_review');
        expect(stages).toContain('W12_release');
      });

      it('should have skippable stages', () => {
        const stages = getSkippableStages(scale);
        expect(stages.length).toBeGreaterThan(0);
        expect(stages).toContain('W07_agent_allocation');
      });

      it('should allow skipping review stages', () => {
        const result = validateSkipRequest('W02_requirements_review', scale, 'small project');
        expect(result.allowed).toBe(true);
      });
    });

    describe('Medium Projects', () => {
      const scale = 'medium';

      it('should have 8 mandatory stages', () => {
        const stages = getMandatoryStages(scale);
        expect(stages.length).toBe(8);
        expect(stages).toContain('W01_requirements_design');
        expect(stages).toContain('W03_architecture_design');
        expect(stages).toContain('W08_development');
      });

      it('should allow skipping API design', () => {
        const result = validateSkipRequest('W06_api_design', scale, 'no external API');
        expect(result.allowed).toBe(true);
      });

      it('should not allow skipping development', () => {
        const result = validateSkipRequest('W08_development', scale, 'test reason');
        expect(result.allowed).toBe(false);
      });
    });

    describe('Large Projects', () => {
      const scale = 'large';

      it('should have all 12 mandatory stages', () => {
        const stages = getMandatoryStages(scale);
        expect(stages.length).toBe(12);
      });

      it('should have no skippable stages', () => {
        const stages = getSkippableStages(scale);
        expect(stages.length).toBe(0);
      });

      it('should not allow skipping any stage', () => {
        const stages: WorkflowStage[] = [
          'W02_requirements_review', 'W04_architecture_review', 'W06_api_design', 'W07_agent_allocation'
        ];

        for (const stage of stages) {
          const result = validateSkipRequest(stage, scale, 'test reason');
          expect(result.allowed).toBe(false);
          expect(result.ironLawRef).toBe('IL001');
        }
      });
    });
  });

  describe('Adaptive Flow Initialization', () => {
    it('should initialize small project with skipped stages', () => {
      const stages = initializeAdaptiveFlow('small');

      // Review stages should be skipped
      expect(stages.get('W02_requirements_review')).toBe('skipped');
      expect(stages.get('W04_architecture_review')).toBe('skipped');
    });

    it('should initialize medium project with some skipped stages', () => {
      const stages = initializeAdaptiveFlow('medium');

      // API design can be skipped
      const apiDesignStatus = stages.get('W06_api_design');
      // May be skipped or pending depending on options
      expect(['skipped', 'pending']).toContain(apiDesignStatus);
    });

    it('should initialize large project with all stages pending', () => {
      const stages = initializeAdaptiveFlow('large');

      let inProgressCount = 0;
      let pendingCount = 0;

      for (const [, status] of stages) {
        if (status === 'in_progress') inProgressCount++;
        if (status === 'pending') pendingCount++;
      }

      // All stages should be either pending or in_progress (none skipped)
      expect(pendingCount + inProgressCount).toBe(12);
    });

    it('should set first mandatory stage as in_progress', () => {
      for (const scale of ['small', 'medium', 'large'] as const) {
        const stages = initializeAdaptiveFlow(scale);

        const inProgressStages: WorkflowStage[] = [];
        for (const [stage, status] of stages) {
          if (status === 'in_progress') {
            inProgressStages.push(stage);
          }
        }

        expect(inProgressStages.length).toBe(1);
      }
    });
  });

  describe('Flow Recommendations', () => {
    it('should generate recommendation for small project', () => {
      const rec = generateAdaptiveFlowRecommendation(3, 80);

      expect(rec.scale).toBe('small');
      expect(rec.rule.mandatoryStages.length).toBe(5);
      expect(rec.recommendation).toContain('Mandatory Stages');
    });

    it('should generate recommendation for medium project', () => {
      const rec = generateAdaptiveFlowRecommendation(12, 250);

      expect(rec.scale).toBe('medium');
      expect(rec.rule.mandatoryStages.length).toBe(8);
    });

    it('should generate recommendation for large project', () => {
      const rec = generateAdaptiveFlowRecommendation(30, 700);

      expect(rec.scale).toBe('large');
      expect(rec.rule.mandatoryStages.length).toBe(12);
      expect(rec.warnings).toContainEqual(expect.stringContaining('Large projects'));
    });

    it('should warn about complex architecture', () => {
      const rec = generateAdaptiveFlowRecommendation(10, 300, {
        hasComplexArchitecture: true
      });

      // Should be upgraded to large
      expect(rec.scale).toBe('large');
    });
  });
});