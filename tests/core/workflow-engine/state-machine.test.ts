import { describe, it, expect, beforeEach } from 'vitest';
import {
  WorkflowStateMachine,
  createStateMachine,
  executeStage
} from '../../../src/core/workflow-engine/state-machine.js';
import { WorkflowConfig, WorkflowStage, DEFAULT_IRON_LAWS } from '../../../src/core/workflow-engine/types.js';

describe('Workflow State Machine', () => {
  let machine: WorkflowStateMachine;

  beforeEach(() => {
    const config: WorkflowConfig = {
      projectScale: 'medium',
      enableSupervisor: true,
      ironLaws: DEFAULT_IRON_LAWS
    };
    machine = createStateMachine(config);
  });

  describe('initialization', () => {
    it('should initialize with first stage as in_progress', () => {
      expect(machine.getCurrentStage()).toBe('W01_requirements_design');
      expect(machine.getStageStatus('W01_requirements_design')).toBe('in_progress');
    });

    it('should initialize all other stages as pending', () => {
      expect(machine.getStageStatus('W02_requirements_review')).toBe('pending');
      expect(machine.getStageStatus('W12_release')).toBe('pending');
    });

    it('should have empty skip log initially', () => {
      expect(machine.state.skipLog.length).toBe(0);
    });

    it('should have empty violations initially', () => {
      expect(machine.state.violations.length).toBe(0);
    });
  });

  describe('transitionTo', () => {
    it('should transition to next stage successfully', () => {
      // First complete current stage
      machine.state.stages.set('W01_requirements_design', 'completed');

      const result = machine.transitionTo('W02_requirements_review');
      expect(result).toBe(true);
      expect(machine.getCurrentStage()).toBe('W02_requirements_review');
      expect(machine.getStageStatus('W02_requirements_review')).toBe('in_progress');
    });

    it('should not allow jumping over incomplete stages', () => {
      const result = machine.transitionTo('W03_architecture_design');
      expect(result).toBe(false);
      expect(machine.getCurrentStage()).toBe('W01_requirements_design');
    });

    it('should not allow backwards transition', () => {
      machine.state.stages.set('W01_requirements_design', 'completed');
      machine.transitionTo('W02_requirements_review');

      const result = machine.transitionTo('W01_requirements_design');
      expect(result).toBe(false);
      expect(machine.getCurrentStage()).toBe('W02_requirements_review');
    });

    it('should record transition in log', () => {
      machine.state.stages.set('W01_requirements_design', 'completed');
      machine.transitionTo('W02_requirements_review');

      const history = machine.getTransitionHistory();
      expect(history.length).toBe(1);
      expect(history[0].from).toBe('W01_requirements_design');
      expect(history[0].to).toBe('W02_requirements_review');
    });
  });

  describe('canTransition', () => {
    it('should return true for valid transition', () => {
      machine.state.stages.set('W01_requirements_design', 'completed');
      expect(machine.canTransition('W02_requirements_review')).toBe(true);
    });

    it('should return false for invalid transition', () => {
      expect(machine.canTransition('W03_architecture_design')).toBe(false);
    });
  });

  describe('skipStage', () => {
    it('should skip skippable stage in small project', () => {
      machine.state.projectScale = 'small';
      const result = machine.skipStage('W07_agent_allocation', '小型项目单人开发');
      expect(result).toBe(true);
      expect(machine.getStageStatus('W07_agent_allocation')).toBe('skipped');
    });

    it('should not skip mandatory stage', () => {
      const result = machine.skipStage('W08_development', 'test reason');
      expect(result).toBe(false);
      expect(machine.getStageStatus('W08_development')).toBe('pending');
    });

    it('should not skip any stage in large project', () => {
      machine.state.projectScale = 'large';
      const result = machine.skipStage('W02_requirements_review', 'test reason');
      expect(result).toBe(false);
    });

    it('should log skip reason', () => {
      machine.state.projectScale = 'small';
      machine.skipStage('W07_agent_allocation', '小型项目单人开发');

      expect(machine.state.skipLog.length).toBe(1);
      expect(machine.state.skipLog[0].stage).toBe('W07_agent_allocation');
      expect(machine.state.skipLog[0].reason).toContain('小型项目');
    });
  });

  describe('blockStage', () => {
    it('should block stage successfully', () => {
      machine.blockStage('W01_requirements_design', 'Missing requirements');
      expect(machine.getStageStatus('W01_requirements_design')).toBe('blocked');
    });

    it('should unblock stage', () => {
      machine.blockStage('W01_requirements_design', 'Missing requirements');
      const result = machine.unblockStage('W01_requirements_design');
      expect(result).toBe(true);
      expect(machine.getStageStatus('W01_requirements_design')).toBe('in_progress');
    });
  });

  describe('getProgressSummary', () => {
    it('should return correct summary initially', () => {
      const summary = machine.getProgressSummary();
      expect(summary.total).toBe(12);
      expect(summary.inProgress).toBe(1);
      expect(summary.pending).toBe(11);
      expect(summary.completed).toBe(0);
      expect(summary.skipped).toBe(0);
      expect(summary.blocked).toBe(0);
    });

    it('should update summary after completion', () => {
      machine.state.stages.set('W01_requirements_design', 'completed');
      machine.state.stages.set('W02_requirements_review', 'skipped');

      const summary = machine.getProgressSummary();
      expect(summary.completed).toBe(1);
      expect(summary.skipped).toBe(1);
    });
  });

  describe('isComplete', () => {
    it('should return false initially', () => {
      expect(machine.isComplete()).toBe(false);
    });

    it('should return true when last stage is completed', () => {
      machine.state.stages.set('W12_release', 'completed');
      expect(machine.isComplete()).toBe(true);
    });

    it('should return true when last stage is skipped', () => {
      machine.state.stages.set('W12_release', 'skipped');
      expect(machine.isComplete()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      machine.transitionTo('W02_requirements_review');
      machine.reset();

      expect(machine.getCurrentStage()).toBe('W01_requirements_design');
      expect(machine.getTransitionHistory().length).toBe(0);
    });
  });

  describe('formatStateMarkdown', () => {
    it('should format state correctly', () => {
      const md = machine.formatStateMarkdown();
      expect(md).toContain('Workflow State');
      expect(md).toContain('当前阶段');
      expect(md).toContain('W01_requirements_design');
    });

    it('should include progress summary', () => {
      const md = machine.formatStateMarkdown();
      expect(md).toContain('进度摘要');
      expect(md).toContain('完成');
    });
  });
});

describe('executeStage', () => {
  it('should execute stage successfully', async () => {
    const config: WorkflowConfig = {
      projectScale: 'medium',
      enableSupervisor: true,
      ironLaws: DEFAULT_IRON_LAWS
    };
    const machine = createStateMachine(config);

    const result = await executeStage(machine, 'W01_requirements_design', async () => ({
      outputs: ['requirements.md'],
      issues: []
    }));

    expect(result.success).toBe(true);
    expect(result.outputs).toContain('requirements.md');
  });

  it('should return failure for wrong stage', async () => {
    const config: WorkflowConfig = {
      projectScale: 'medium',
      enableSupervisor: true,
      ironLaws: DEFAULT_IRON_LAWS
    };
    const machine = createStateMachine(config);

    const result = await executeStage(machine, 'W08_development', async () => ({
      outputs: [],
      issues: []
    }));

    expect(result.success).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});