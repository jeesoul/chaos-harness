import { describe, it, expect, beforeEach } from 'vitest';
import {
  Supervisor,
  createSupervisor,
  quickDetectLaziness,
  quickGeneratePressure
} from '../../../src/core/workflow-engine/supervisor.js';
import { LazinessPatternId, DEFAULT_LAZINESS_PATTERNS, DEFAULT_IRON_LAWS, WorkflowState, WorkflowStage, StageStatus } from '../../../src/core/workflow-engine/types.js';

describe('Supervisor', () => {
  let supervisor: Supervisor;

  beforeEach(() => {
    supervisor = createSupervisor();
  });

  describe('detectLaziness', () => {
    it('should detect LP001: completion without verification', () => {
      const patterns = supervisor.detectLaziness('agent-1', {
        claimedCompletion: true,
        ranVerification: false
      });

      expect(patterns).toContain('LP001');
    });

    it('should detect LP002: fix without root cause', () => {
      const patterns = supervisor.detectLaziness('agent-1', {
        proposedFix: true,
        mentionedRootCause: false
      });

      expect(patterns).toContain('LP002');
    });

    it('should detect LP003: long time without output', () => {
      const patterns = supervisor.detectLaziness('agent-1', {
        timeElapsed: 100,
        expectedTime: 50
      });

      expect(patterns).toContain('LP003');
    });

    it('should detect LP004: skipping tests', () => {
      const patterns = supervisor.detectLaziness('agent-1', {
        claimedCompletion: true,
        testsPassed: false
      });

      expect(patterns).toContain('LP004');
    });

    it('should detect LP005: unauthorized version change', () => {
      const patterns = supervisor.detectLaziness('agent-1', {
        createdVersionDir: true,
        userApprovedVersion: false
      });

      expect(patterns).toContain('LP005');
    });

    it('should detect LP006: high-risk config modification', () => {
      const patterns = supervisor.detectLaziness('agent-1', {
        modifiedHighRiskConfig: true,
        userApprovedConfig: false
      });

      expect(patterns).toContain('LP006');
    });

    it('should return empty when no patterns detected', () => {
      const patterns = supervisor.detectLaziness('agent-1', {
        claimedCompletion: true,
        ranVerification: true,
        testsPassed: true
      });

      expect(patterns.length).toBe(0);
    });

    it('should detect multiple patterns', () => {
      const patterns = supervisor.detectLaziness('agent-1', {
        claimedCompletion: true,
        ranVerification: false,
        proposedFix: true,
        mentionedRootCause: false
      });

      expect(patterns.length).toBe(2);
      expect(patterns).toContain('LP001');
      expect(patterns).toContain('LP002');
    });
  });

  describe('intervene', () => {
    it('should create intervention action', () => {
      const action = supervisor.intervene('agent-1', 'LP001');

      expect(action.agentId).toBe('agent-1');
      expect(action.pattern).toBe('LP001');
      expect(action.action).toBe('block');
      expect(action.message).toBeDefined();
    });

    it('should use pressure for LP003', () => {
      const action = supervisor.intervene('agent-1', 'LP003');

      expect(action.action).toBe('pressure');
    });

    it('should use warn for non-critical patterns', () => {
      const customPatterns = DEFAULT_LAZINESS_PATTERNS.map(p =>
        p.id === 'LP001' ? { ...p, severity: 'warning' as const } : p
      );
      const customSupervisor = createSupervisor(customPatterns);

      const action = customSupervisor.intervene('agent-1', 'LP001');
      expect(action.action).toBe('warn');
    });

    it('should record action', () => {
      supervisor.intervene('agent-1', 'LP001');
      supervisor.intervene('agent-2', 'LP002');

      const history = supervisor.getViolationHistory();
      expect(history.length).toBe(2);
    });
  });

  describe('generatePressureMessage', () => {
    it('should generate pressure message', () => {
      supervisor.intervene('agent-1', 'LP003');
      const message = supervisor.generatePressureMessage('agent-1');

      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return default message when no actions', () => {
      const message = supervisor.generatePressureMessage('agent-1');
      expect(message).toContain('进度检查');
    });
  });

  describe('logViolation', () => {
    it('should log violation to workflow state', () => {
      const state: WorkflowState = {
        currentStage: 'W08_development',
        projectScale: 'medium',
        stages: new Map<WorkflowStage, StageStatus>(),
        agentTeam: [],
        skipLog: [],
        violations: []
      };

      supervisor.logViolation('agent-1', 'LP001', state);

      expect(state.violations.length).toBe(1);
      expect(state.violations[0].agent).toBe('agent-1');
      expect(state.violations[0].pattern).toBe('LP001');
    });
  });

  describe('getIronLawRef', () => {
    it('should return correct iron law for LP001', () => {
      const ref = supervisor.getIronLawRef('LP001');
      expect(ref).toBe('IL002');
    });

    it('should return correct iron law for LP002', () => {
      const ref = supervisor.getIronLawRef('LP002');
      expect(ref).toBe('IL003');
    });
  });

  describe('getIronLaw', () => {
    it('should return iron law definition', () => {
      const law = supervisor.getIronLaw('IL001');
      expect(law).toBeDefined();
      expect(law?.id).toBe('IL001');
    });
  });

  describe('formatViolationReport', () => {
    it('should format empty report', () => {
      const report = supervisor.formatViolationReport();
      expect(report).toContain('No violations detected');
    });

    it('should format report with violations', () => {
      supervisor.intervene('agent-1', 'LP001');
      supervisor.intervene('agent-2', 'LP002');

      const report = supervisor.formatViolationReport();
      expect(report).toContain('Violation Report');
      expect(report).toContain('agent-1');
      expect(report).toContain('LP001');
    });
  });

  describe('detectBatch', () => {
    it('should detect patterns for multiple agents', () => {
      const agents = [
        { id: 'agent-1', name: 'Dev 1', role: 'backend_dev' as const, responsibilities: [], skills: [], status: 'idle' as const },
        { id: 'agent-2', name: 'Dev 2', role: 'backend_dev' as const, responsibilities: [], skills: [], status: 'idle' as const }
      ];

      const contexts = new Map();
      contexts.set('agent-1', { claimedCompletion: true, ranVerification: false });
      contexts.set('agent-2', { proposedFix: true, mentionedRootCause: false });

      const results = supervisor.detectBatch(agents, contexts);

      expect(results.length).toBe(2);
      expect(results.find(r => r.agentId === 'agent-1')?.patterns).toContain('LP001');
      expect(results.find(r => r.agentId === 'agent-2')?.patterns).toContain('LP002');
    });
  });
});

describe('quickDetectLaziness', () => {
  it('should detect laziness without creating instance', () => {
    const patterns = quickDetectLaziness('agent-1', {
      claimedCompletion: true,
      ranVerification: false
    });

    expect(patterns).toContain('LP001');
  });
});

describe('quickGeneratePressure', () => {
  it('should generate pressure message quickly', () => {
    const message = quickGeneratePressure('LP001');
    expect(message).toBeDefined();
    expect(message.length).toBeGreaterThan(0);
  });
});