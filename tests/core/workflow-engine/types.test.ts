import { describe, it, expect } from 'vitest';
import {
  WorkflowStage,
  ProjectScale,
  StageStatus,
  AgentRole,
  LazinessPatternId,
  DEFAULT_ADAPTIVE_FLOW_RULES,
  DEFAULT_IRON_LAWS,
  DEFAULT_LAZINESS_PATTERNS
} from '../../../src/core/workflow-engine/types.js';

describe('Workflow Engine Types', () => {
  describe('WorkflowStage', () => {
    it('should define all 12 stages', () => {
      const stages: WorkflowStage[] = [
        'W01_requirements_design',
        'W02_requirements_review',
        'W03_architecture_design',
        'W04_architecture_review',
        'W05_detail_design',
        'W06_api_design',
        'W07_agent_allocation',
        'W08_development',
        'W09_code_review',
        'W10_test_version',
        'W11_automated_test',
        'W12_release'
      ];

      expect(stages.length).toBe(12);
    });
  });

  describe('ProjectScale', () => {
    it('should define three scales', () => {
      const scales: ProjectScale[] = ['small', 'medium', 'large'];
      expect(scales.length).toBe(3);
    });
  });

  describe('StageStatus', () => {
    it('should define five statuses', () => {
      const statuses: StageStatus[] = ['pending', 'in_progress', 'blocked', 'completed', 'skipped'];
      expect(statuses.length).toBe(5);
    });
  });

  describe('AgentRole', () => {
    it('should define five roles', () => {
      const roles: AgentRole[] = ['architect', 'backend_dev', 'frontend_dev', 'tester', 'supervisor'];
      expect(roles.length).toBe(5);
    });
  });

  describe('LazinessPatternId', () => {
    it('should define six patterns', () => {
      const patterns: LazinessPatternId[] = ['LP001', 'LP002', 'LP003', 'LP004', 'LP005', 'LP006'];
      expect(patterns.length).toBe(6);
    });
  });

  describe('DEFAULT_ADAPTIVE_FLOW_RULES', () => {
    it('should have three rules for each scale', () => {
      expect(DEFAULT_ADAPTIVE_FLOW_RULES.length).toBe(3);
    });

    it('should have correct small project definition', () => {
      const small = DEFAULT_ADAPTIVE_FLOW_RULES.find(r => r.scale === 'small');
      expect(small).toBeDefined();
      expect(small?.definition).toContain('≤5');
      expect(small?.skippableStages).toContain('W07_agent_allocation');
    });

    it('should have correct medium project definition', () => {
      const medium = DEFAULT_ADAPTIVE_FLOW_RULES.find(r => r.scale === 'medium');
      expect(medium).toBeDefined();
      expect(medium?.skippableStages).toContain('W06_api_design');
    });

    it('should have correct large project definition', () => {
      const large = DEFAULT_ADAPTIVE_FLOW_RULES.find(r => r.scale === 'large');
      expect(large).toBeDefined();
      expect(large?.mandatoryStages.length).toBe(12);
      expect(large?.skippableStages.length).toBe(0);
    });
  });

  describe('DEFAULT_IRON_LAWS', () => {
    it('should have five iron laws', () => {
      expect(DEFAULT_IRON_LAWS.length).toBe(5);
    });

    it('should have correct IL001', () => {
      const il001 = DEFAULT_IRON_LAWS.find(il => il.id === 'IL001');
      expect(il001).toBeDefined();
      expect(il001?.rule).toContain('NO WORKFLOW STEP SKIP');
    });

    it('should have correct IL002', () => {
      const il002 = DEFAULT_IRON_LAWS.find(il => il.id === 'IL002');
      expect(il002).toBeDefined();
      expect(il002?.rule).toContain('NO COMPLETION CLAIMS');
    });

    it('should have enforcement for each law', () => {
      for (const law of DEFAULT_IRON_LAWS) {
        expect(law.enforcement).toBeDefined();
        expect(law.enforcement.length).toBeGreaterThan(0);
      }
    });
  });

  describe('DEFAULT_LAZINESS_PATTERNS', () => {
    it('should have six patterns', () => {
      expect(DEFAULT_LAZINESS_PATTERNS.length).toBe(6);
    });

    it('should have LP001 for completion without verification', () => {
      const lp001 = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP001');
      expect(lp001).toBeDefined();
      expect(lp001?.severity).toBe('critical');
    });

    it('should have LP002 for skipping root cause', () => {
      const lp002 = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP002');
      expect(lp002).toBeDefined();
      expect(lp002?.severity).toBe('critical');
    });

    it('should have LP003 for long time without output', () => {
      const lp003 = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP003');
      expect(lp003).toBeDefined();
      expect(lp003?.severity).toBe('warning');
    });

    it('should have handling method for each pattern', () => {
      for (const pattern of DEFAULT_LAZINESS_PATTERNS) {
        expect(pattern.handlingMethod).toBeDefined();
        expect(pattern.handlingMethod.length).toBeGreaterThan(0);
      }
    });
  });
});