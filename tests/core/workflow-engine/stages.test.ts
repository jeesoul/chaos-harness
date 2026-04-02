import { describe, it, expect } from 'vitest';
import {
  STAGE_ORDER,
  getStageIndex,
  getNextStage,
  getPreviousStage,
  getStageDefinition,
  canSkipStage,
  getRequiredRoles,
  getStageInputs,
  getStageOutputs,
  validateStageTransition,
  formatStageMarkdown,
  getAllStagesMarkdown
} from '../../../src/core/workflow-engine/stages.js';
import { WorkflowStage, StageStatus } from '../../../src/core/workflow-engine/types.js';

describe('Workflow Stages', () => {
  describe('STAGE_ORDER', () => {
    it('should have 12 stages in order', () => {
      expect(STAGE_ORDER.length).toBe(12);
      expect(STAGE_ORDER[0]).toBe('W01_requirements_design');
      expect(STAGE_ORDER[11]).toBe('W12_release');
    });

    it('should be in correct sequential order', () => {
      for (let i = 1; i < STAGE_ORDER.length; i++) {
        const prevIndex = parseInt(STAGE_ORDER[i - 1].substring(1, 3));
        const currentIndex = parseInt(STAGE_ORDER[i].substring(1, 3));
        expect(currentIndex).toBe(prevIndex + 1);
      }
    });
  });

  describe('getStageIndex', () => {
    it('should return correct index for each stage', () => {
      expect(getStageIndex('W01_requirements_design')).toBe(0);
      expect(getStageIndex('W08_development')).toBe(7);
      expect(getStageIndex('W12_release')).toBe(11);
    });

    it('should return -1 for invalid stage', () => {
      expect(getStageIndex('W99_invalid' as WorkflowStage)).toBe(-1);
    });
  });

  describe('getNextStage', () => {
    it('should return next stage correctly', () => {
      expect(getNextStage('W01_requirements_design')).toBe('W02_requirements_review');
      expect(getNextStage('W11_automated_test')).toBe('W12_release');
    });

    it('should return null for last stage', () => {
      expect(getNextStage('W12_release')).toBeNull();
    });
  });

  describe('getPreviousStage', () => {
    it('should return previous stage correctly', () => {
      expect(getPreviousStage('W02_requirements_review')).toBe('W01_requirements_design');
      expect(getPreviousStage('W12_release')).toBe('W11_automated_test');
    });

    it('should return null for first stage', () => {
      expect(getPreviousStage('W01_requirements_design')).toBeNull();
    });
  });

  describe('getStageDefinition', () => {
    it('should return definition for valid stage', () => {
      const def = getStageDefinition('W08_development');
      expect(def).toBeDefined();
      expect(def?.name).toBe('开发执行');
      expect(def?.canSkip).toBe(false);
    });

    it('should return undefined for invalid stage', () => {
      const def = getStageDefinition('W99_invalid' as WorkflowStage);
      expect(def).toBeUndefined();
    });

    it('should have required roles for each stage', () => {
      for (const stage of STAGE_ORDER) {
        const def = getStageDefinition(stage);
        expect(def?.requiredRoles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('canSkipStage', () => {
    it('should not allow skipping mandatory stages', () => {
      const result = canSkipStage('W08_development', 'small', 'test reason');
      expect(result.canSkip).toBe(false);
      expect(result.ironLawRef).toBe('IL001');
    });

    it('should not allow skipping any stage in large project', () => {
      const result = canSkipStage('W02_requirements_review', 'large', 'small project');
      expect(result.canSkip).toBe(false);
      expect(result.ironLawRef).toBe('IL001');
    });

    it('should allow skipping review stages in small project', () => {
      const result = canSkipStage('W02_requirements_review', 'small', '小型项目可合并到W01');
      expect(result.canSkip).toBe(true);
    });

    it('should allow skipping agent allocation in small project', () => {
      const result = canSkipStage('W07_agent_allocation', 'small', '单人开发');
      expect(result.canSkip).toBe(true);
    });
  });

  describe('getRequiredRoles', () => {
    it('should return architect for requirements design', () => {
      const roles = getRequiredRoles('W01_requirements_design');
      expect(roles).toContain('architect');
    });

    it('should return developer for development stage', () => {
      const roles = getRequiredRoles('W08_development');
      expect(roles).toContain('backend_dev');
    });

    it('should return tester for test stages', () => {
      const roles = getRequiredRoles('W11_automated_test');
      expect(roles).toContain('tester');
    });

    it('should return supervisor for review stages', () => {
      const roles = getRequiredRoles('W02_requirements_review');
      expect(roles).toContain('supervisor');
    });
  });

  describe('getStageInputs', () => {
    it('should return inputs for development stage', () => {
      const inputs = getStageInputs('W08_development');
      expect(inputs.length).toBeGreaterThan(0);
      expect(inputs.some(i => i.includes('设计'))).toBe(true);
    });
  });

  describe('getStageOutputs', () => {
    it('should return outputs for development stage', () => {
      const outputs = getStageOutputs('W08_development');
      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs).toContain('源代码');
    });
  });

  describe('validateStageTransition', () => {
    it('should allow sequential transition', () => {
      const statusMap = new Map<WorkflowStage, StageStatus>();
      statusMap.set('W01_requirements_design', 'completed');
      statusMap.set('W02_requirements_review', 'pending');

      const result = validateStageTransition('W01_requirements_design', 'W02_requirements_review', statusMap);
      expect(result.valid).toBe(true);
    });

    it('should not allow backwards transition', () => {
      const statusMap = new Map<WorkflowStage, StageStatus>();
      statusMap.set('W02_requirements_review', 'in_progress');

      const result = validateStageTransition('W02_requirements_review', 'W01_requirements_design', statusMap);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('backwards');
    });

    it('should not allow skipping incomplete stages', () => {
      const statusMap = new Map<WorkflowStage, StageStatus>();
      statusMap.set('W01_requirements_design', 'completed');
      statusMap.set('W02_requirements_review', 'pending');

      const result = validateStageTransition('W01_requirements_design', 'W03_architecture_design', statusMap);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Intermediate stage');
    });

    it('should allow jumping over skipped stages', () => {
      const statusMap = new Map<WorkflowStage, StageStatus>();
      statusMap.set('W01_requirements_design', 'completed');
      statusMap.set('W02_requirements_review', 'skipped');

      const result = validateStageTransition('W01_requirements_design', 'W03_architecture_design', statusMap);
      expect(result.valid).toBe(true);
    });
  });

  describe('formatStageMarkdown', () => {
    it('should format stage correctly', () => {
      const md = formatStageMarkdown('W08_development');
      expect(md).toContain('开发执行');
      expect(md).toContain('W08_development');
      expect(md).toContain('输入');
      expect(md).toContain('输出');
    });

    it('should include required roles', () => {
      const md = formatStageMarkdown('W08_development');
      expect(md).toContain('backend_dev');
    });
  });

  describe('getAllStagesMarkdown', () => {
    it('should generate complete overview', () => {
      const md = getAllStagesMarkdown();
      expect(md).toContain('Workflow Stages Overview');
      expect(md).toContain('铁律');
      expect(md).toContain('IL001');
    });

    it('should include all 12 stages', () => {
      const md = getAllStagesMarkdown();
      for (const stage of STAGE_ORDER) {
        expect(md).toContain(stage);
      }
    });
  });
});