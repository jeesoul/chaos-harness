import { describe, it, expect } from 'vitest';
import {
  determineProjectScale,
  getAdaptiveFlowRule,
  initializeAdaptiveFlow,
  adaptWorkflow,
  getMandatoryStages,
  getSkippableStages,
  validateSkipRequest,
  generateAdaptiveFlowRecommendation,
  formatAdaptiveRulesMarkdown
} from '../../../src/core/workflow-engine/adaptive-flow.js';
import { WorkflowState, WorkflowStage, StageStatus } from '../../../src/core/workflow-engine/types.js';

describe('Adaptive Flow', () => {
  describe('determineProjectScale', () => {
    it('should return small for minimal project', () => {
      const scale = determineProjectScale(3, 80);
      expect(scale).toBe('small');
    });

    it('should return medium for moderate project', () => {
      const scale = determineProjectScale(10, 300);
      expect(scale).toBe('medium');
    });

    it('should return large for big project', () => {
      const scale = determineProjectScale(25, 600);
      expect(scale).toBe('large');
    });

    it('should upgrade to large for complex architecture', () => {
      const scale = determineProjectScale(10, 300, {
        hasComplexArchitecture: true
      });
      expect(scale).toBe('large');
    });

    it('should handle edge cases', () => {
      // Exactly 5 files, 100 lines = small
      expect(determineProjectScale(5, 100)).toBe('small');

      // Exactly 20 files = large
      expect(determineProjectScale(20, 400)).toBe('large');

      // Exactly 500 lines = large
      expect(determineProjectScale(15, 500)).toBe('large');
    });
  });

  describe('getAdaptiveFlowRule', () => {
    it('should return correct rule for small', () => {
      const rule = getAdaptiveFlowRule('small');
      expect(rule.scale).toBe('small');
      expect(rule.mandatoryStages.length).toBe(5);
      expect(rule.skippableStages.length).toBeGreaterThan(0);
    });

    it('should return correct rule for medium', () => {
      const rule = getAdaptiveFlowRule('medium');
      expect(rule.scale).toBe('medium');
      expect(rule.mandatoryStages.length).toBe(8);
    });

    it('should return correct rule for large', () => {
      const rule = getAdaptiveFlowRule('large');
      expect(rule.scale).toBe('large');
      expect(rule.mandatoryStages.length).toBe(12);
      expect(rule.skippableStages.length).toBe(0);
    });
  });

  describe('initializeAdaptiveFlow', () => {
    it('should initialize small project with skipped stages', () => {
      const stages = initializeAdaptiveFlow('small');

      // Review stages should be skipped in small project
      expect(stages.get('W02_requirements_review')).toBe('skipped');
      expect(stages.get('W04_architecture_review')).toBe('skipped');
    });

    it('should initialize large project with all stages pending', () => {
      const stages = initializeAdaptiveFlow('large');

      // No stages should be skipped in large project
      for (const stage of stages.keys()) {
        if (stages.get(stage) !== 'in_progress') {
          expect(stages.get(stage)).toBe('pending');
        }
      }
    });

    it('should set first mandatory stage as in_progress', () => {
      const stages = initializeAdaptiveFlow('medium');
      const firstInProgress = Array.from(stages.entries())
        .find(([_, status]) => status === 'in_progress');

      expect(firstInProgress).toBeDefined();
      expect(firstInProgress?.[1]).toBe('in_progress');
    });
  });

  describe('adaptWorkflow', () => {
    it('should detect scale upgrade', () => {
      const state: WorkflowState = {
        currentStage: 'W08_development',
        projectScale: 'medium',
        stages: new Map<WorkflowStage, StageStatus>(),
        agentTeam: [],
        skipLog: [],
        violations: []
      };
      state.stages.set('W01_requirements_design', 'completed');
      state.stages.set('W02_requirements_review', 'skipped');

      const result = adaptWorkflow(state, {
        filesAdded: 15,
        filesModified: 5,
        linesAdded: 500,
        linesDeleted: 100,
        complexityIncrease: true
      });

      expect(result.scaleChanged).toBe(true);
      expect(result.newScale).toBe('large');
    });

    it('should reactivate skipped stages when upgrading to large', () => {
      const state: WorkflowState = {
        currentStage: 'W08_development',
        projectScale: 'small',
        stages: new Map<WorkflowStage, StageStatus>(),
        agentTeam: [],
        skipLog: [],
        violations: []
      };
      state.stages.set('W02_requirements_review', 'skipped');
      state.stages.set('W04_architecture_review', 'skipped');

      const result = adaptWorkflow(state, {
        filesAdded: 20,
        filesModified: 10,
        linesAdded: 600,
        linesDeleted: 200,
        complexityIncrease: true
      });

      expect(result.scaleChanged).toBe(true);
      expect(result.stageChanges.length).toBeGreaterThan(0);
      expect(result.stageChanges.some(c => c.newStatus === 'pending')).toBe(true);
    });

    it('should not change scale when changes match current scale', () => {
      const state: WorkflowState = {
        currentStage: 'W08_development',
        projectScale: 'small',
        stages: new Map<WorkflowStage, StageStatus>(),
        agentTeam: [],
        skipLog: [],
        violations: []
      };

      const result = adaptWorkflow(state, {
        filesAdded: 2,
        filesModified: 1,
        linesAdded: 50,
        linesDeleted: 10,
        complexityIncrease: false
      });

      // Scale is small (3 files, 50 lines), which matches current scale
      expect(result.scaleChanged).toBe(false);
    });
  });

  describe('getMandatoryStages', () => {
    it('should return development for all scales', () => {
      for (const scale of ['small', 'medium', 'large'] as const) {
        const stages = getMandatoryStages(scale);
        expect(stages).toContain('W08_development');
      }
    });

    it('should return all stages for large', () => {
      const stages = getMandatoryStages('large');
      expect(stages.length).toBe(12);
    });
  });

  describe('getSkippableStages', () => {
    it('should return empty for large', () => {
      const stages = getSkippableStages('large');
      expect(stages.length).toBe(0);
    });

    it('should return agent allocation for small', () => {
      const stages = getSkippableStages('small');
      expect(stages).toContain('W07_agent_allocation');
    });
  });

  describe('validateSkipRequest', () => {
    it('should reject all skips for large projects', () => {
      const result = validateSkipRequest('W02_requirements_review', 'large', 'test');
      expect(result.allowed).toBe(false);
      expect(result.ironLawRef).toBe('IL001');
    });

    it('should reject mandatory stage skips', () => {
      const result = validateSkipRequest('W08_development', 'small', 'test');
      expect(result.allowed).toBe(false);
    });

    it('should allow skippable stages for small projects', () => {
      const result = validateSkipRequest('W07_agent_allocation', 'small', '单人开发');
      expect(result.allowed).toBe(true);
    });
  });

  describe('generateAdaptiveFlowRecommendation', () => {
    it('should generate recommendation for small project', () => {
      const rec = generateAdaptiveFlowRecommendation(3, 80);

      expect(rec.scale).toBe('small');
      expect(rec.rule).toBeDefined();
      expect(rec.recommendation).toContain('Mandatory Stages');
    });

    it('should upgrade to large for complex architecture', () => {
      const rec = generateAdaptiveFlowRecommendation(10, 300, {
        hasComplexArchitecture: true
      });

      // Complex architecture triggers upgrade to large
      expect(rec.scale).toBe('large');
      expect(rec.warnings.some(w => w.includes('Large projects'))).toBe(true);
    });

    it('should warn about complex architecture for medium projects', () => {
      const rec = generateAdaptiveFlowRecommendation(10, 300, {
        hasMultipleModules: false,
        hasComplexArchitecture: false
      });

      // Without complex architecture, it stays medium
      expect(rec.scale).toBe('medium');
    });
  });

  describe('formatAdaptiveRulesMarkdown', () => {
    it('should format all rules', () => {
      const md = formatAdaptiveRulesMarkdown();
      expect(md).toContain('Adaptive Flow Rules');
      expect(md).toContain('SMALL Projects');
      expect(md).toContain('MEDIUM Projects');
      expect(md).toContain('LARGE Projects');
    });
  });
});