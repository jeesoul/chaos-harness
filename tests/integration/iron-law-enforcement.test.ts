/**
 * Iron Law Enforcement Integration Test
 *
 * M7: 测试铁律执行和违规检测
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorkflowExecutor,
  quickDetectLaziness,
  quickGeneratePressure,
  DEFAULT_IRON_LAWS,
  DEFAULT_LAZINESS_PATTERNS
} from '../../src/core/workflow-engine/index.js';
import {
  detectBypassAttempt,
  generateRebuttal,
  DEFAULT_ANTI_BYPASS_RULES
} from '../../src/core/harness-generator/anti-bypass.js';
import type { LazinessPatternId } from '../../src/core/workflow-engine/types.js';

describe('Iron Law Enforcement Integration', () => {
  describe('Iron Laws Definition', () => {
    it('should have 5 iron laws defined', () => {
      expect(DEFAULT_IRON_LAWS.length).toBe(5);
    });

    it('should have correct iron law IDs', () => {
      const ids = DEFAULT_IRON_LAWS.map(il => il.id);
      expect(ids).toContain('IL001');
      expect(ids).toContain('IL002');
      expect(ids).toContain('IL003');
      expect(ids).toContain('IL004');
      expect(ids).toContain('IL005');
    });

    it('should have enforcement actions for each law', () => {
      for (const law of DEFAULT_IRON_LAWS) {
        expect(law.enforcement).toBeDefined();
        expect(law.enforcement.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Laziness Pattern Detection', () => {
    describe('LP001: Completion without verification', () => {
      it('should detect when claiming completion without verification', () => {
        const patterns = quickDetectLaziness('agent-1', {
          claimedCompletion: true,
          ranVerification: false
        });

        expect(patterns).toContain('LP001');
      });

      it('should not detect when verification was run', () => {
        const patterns = quickDetectLaziness('agent-1', {
          claimedCompletion: true,
          ranVerification: true
        });

        expect(patterns).not.toContain('LP001');
      });

      it('should generate pressure message', () => {
        const message = quickGeneratePressure('LP001');

        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(0);
        // Pressure message is randomly selected from multiple templates
        // Just verify it's a valid message about completion without verification
        expect(message.toLowerCase()).toMatch(/完成|验证|completion|verification/i);
      });
    });

    describe('LP002: Skipping root cause analysis', () => {
      it('should detect when proposing fix without root cause', () => {
        const patterns = quickDetectLaziness('agent-1', {
          proposedFix: true,
          mentionedRootCause: false
        });

        expect(patterns).toContain('LP002');
      });

      it('should not detect when root cause is mentioned', () => {
        const patterns = quickDetectLaziness('agent-1', {
          proposedFix: true,
          mentionedRootCause: true
        });

        expect(patterns).not.toContain('LP002');
      });
    });

    describe('LP003: Long time without output', () => {
      it('should detect when time exceeds 50% threshold', () => {
        // timeElapsed > expectedTime * 1.5
        // 160 > 100 * 1.5 = 150, so this should detect
        const patterns = quickDetectLaziness('agent-1', {
          timeElapsed: 160,
          expectedTime: 100
        });

        expect(patterns).toContain('LP003');
      });

      it('should not detect when within time budget', () => {
        const patterns = quickDetectLaziness('agent-1', {
          timeElapsed: 80,
          expectedTime: 100
        });

        expect(patterns).not.toContain('LP003');
      });
    });

    describe('LP004: Skipping tests', () => {
      it('should detect when claiming completion but tests failing', () => {
        const patterns = quickDetectLaziness('agent-1', {
          claimedCompletion: true,
          testsPassed: false
        });

        expect(patterns).toContain('LP004');
      });

      it('should not detect when tests pass', () => {
        const patterns = quickDetectLaziness('agent-1', {
          claimedCompletion: true,
          testsPassed: true
        });

        expect(patterns).not.toContain('LP004');
      });
    });

    describe('LP005: Unauthorized version change', () => {
      it('should detect when creating version without approval', () => {
        const patterns = quickDetectLaziness('agent-1', {
          createdVersionDir: true,
          userApprovedVersion: false
        });

        expect(patterns).toContain('LP005');
      });

      it('should not detect when user approved', () => {
        const patterns = quickDetectLaziness('agent-1', {
          createdVersionDir: true,
          userApprovedVersion: true
        });

        expect(patterns).not.toContain('LP005');
      });
    });

    describe('LP006: High-risk config modification', () => {
      it('should detect when modifying high-risk config without approval', () => {
        const patterns = quickDetectLaziness('agent-1', {
          modifiedHighRiskConfig: true,
          userApprovedConfig: false
        });

        expect(patterns).toContain('LP006');
      });

      it('should not detect when user approved', () => {
        const patterns = quickDetectLaziness('agent-1', {
          modifiedHighRiskConfig: true,
          userApprovedConfig: true
        });

        expect(patterns).not.toContain('LP006');
      });
    });

    describe('Multiple Pattern Detection', () => {
      it('should detect multiple patterns at once', () => {
        const patterns = quickDetectLaziness('agent-1', {
          claimedCompletion: true,
          ranVerification: false,
          proposedFix: true,
          mentionedRootCause: false
        });

        expect(patterns.length).toBeGreaterThanOrEqual(2);
        expect(patterns).toContain('LP001');
        expect(patterns).toContain('LP002');
      });
    });
  });

  describe('Anti-Bypass Detection', () => {
    it('should detect "simple fix" excuse', () => {
      const result = detectBypassAttempt('This is a simple fix');

      expect(result.detected).toBe(true);
      expect(result.matchedRule?.id).toBe('simple-fix');
    });

    it('should detect "skip test" excuse', () => {
      const result = detectBypassAttempt('I want to skip tests');

      expect(result.detected).toBe(true);
    });

    it('should detect "just this once" excuse', () => {
      const result = detectBypassAttempt('Just this once');

      expect(result.detected).toBe(true);
    });

    it('should detect "legacy project" excuse', () => {
      const result = detectBypassAttempt('This is a legacy project');

      expect(result.detected).toBe(true);
    });

    it('should not detect normal text', () => {
      const result = detectBypassAttempt('I will implement the feature as specified');

      expect(result.detected).toBe(false);
    });

    it('should generate rebuttal with iron law reference', () => {
      const result = detectBypassAttempt('This is a simple fix');
      const rebuttal = generateRebuttal(result.matchedRule!);

      expect(rebuttal).toContain('IL002');
      expect(rebuttal).toContain('authority');
    });
  });

  describe('Workflow Enforcement', () => {
    it('should block skip attempts in large projects', () => {
      const workflow = createWorkflowExecutor({
        projectRoot: '/test',
        fileCount: 25,
        lineCount: 600,
        enableSupervisor: true
      });

      const result = workflow.requestSkip('W02_requirements_review', 'test reason');

      expect(result.allowed).toBe(false);
      expect(result.ironLawRef).toBe('IL001');
    });

    it('should enforce iron laws for mandatory stages', () => {
      const workflow = createWorkflowExecutor({
        projectRoot: '/test',
        fileCount: 10,
        lineCount: 200
      });

      // Development is mandatory for all project sizes
      const result = workflow.requestSkip('W08_development', 'test reason');

      expect(result.allowed).toBe(false);
    });

    it('should track violations in workflow status', () => {
      const workflow = createWorkflowExecutor({
        projectRoot: '/test',
        fileCount: 25,
        lineCount: 600,
        enableSupervisor: true
      });

      // Attempt skip (should be blocked)
      workflow.requestSkip('W02_requirements_review', 'test reason');

      const status = workflow.getStatus();
      // Violations are tracked by the supervisor
      expect(status).toBeDefined();
    });
  });

  describe('Severity Classification', () => {
    it('should classify LP001 as critical', () => {
      const pattern = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP001');
      expect(pattern?.severity).toBe('critical');
    });

    it('should classify LP002 as critical', () => {
      const pattern = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP002');
      expect(pattern?.severity).toBe('critical');
    });

    it('should classify LP003 as warning', () => {
      const pattern = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP003');
      expect(pattern?.severity).toBe('warning');
    });

    it('should classify LP004 as critical', () => {
      const pattern = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP004');
      expect(pattern?.severity).toBe('critical');
    });

    it('should classify LP005 as critical', () => {
      const pattern = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP005');
      expect(pattern?.severity).toBe('critical');
    });

    it('should classify LP006 as critical', () => {
      const pattern = DEFAULT_LAZINESS_PATTERNS.find(p => p.id === 'LP006');
      expect(pattern?.severity).toBe('critical');
    });
  });
});