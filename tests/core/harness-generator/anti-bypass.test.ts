import { describe, it, expect } from 'vitest';
import { detectBypassAttempt, generateRebuttal, getIronLawForBypass, DEFAULT_ANTI_BYPASS_RULES } from '../../../src/core/harness-generator/anti-bypass.js';
import { AntiBypassRule, IronLaw } from '../../../src/core/harness-generator/types.js';

describe('AntiBypass', () => {
  describe('detectBypassAttempt', () => {
    it('should detect "simple fix" excuse', () => {
      const result = detectBypassAttempt('This is a simple fix, just change one line');
      expect(result.detected).toBe(true);
      expect(result.matchedRule).not.toBeNull();
      expect(result.matchedRule?.id).toBe('simple-fix');
    });

    it('should detect "no tests needed" excuse', () => {
      const result = detectBypassAttempt('This change is too small for tests');
      expect(result.detected).toBe(false);
    });

    it('should not flag normal statements', () => {
      const result = detectBypassAttempt('I will implement the feature now');
      expect(result.detected).toBe(false);
      expect(result.matchedRule).toBeNull();
    });

    it('should detect "skip test" excuse', () => {
      const result = detectBypassAttempt('Let\'s just skip test for now');
      expect(result.detected).toBe(true);
      expect(result.matchedRule?.id).toBe('skip-test');
    });

    it('should detect "quick fix" excuse', () => {
      const result = detectBypassAttempt('This is just a quick fix');
      expect(result.detected).toBe(true);
      expect(result.matchedRule?.id).toBe('quick-fix');
    });

    it('should be case-insensitive', () => {
      const result = detectBypassAttempt('This is a SIMPLE FIX');
      expect(result.detected).toBe(true);
      expect(result.matchedRule?.id).toBe('simple-fix');
    });

    it('should use custom rules when provided', () => {
      const customRules: AntiBypassRule[] = [
        {
          id: 'custom-excuse',
          excuse: 'custom pattern',
          rebuttal: 'Custom rebuttal',
          ironLawRef: 'IL001'
        }
      ];
      const result = detectBypassAttempt('I found a custom pattern here', customRules);
      expect(result.detected).toBe(true);
      expect(result.matchedRule?.id).toBe('custom-excuse');
    });

    it('should return input text in result', () => {
      const text = 'This is a simple fix';
      const result = detectBypassAttempt(text);
      expect(result.inputText).toBe(text);
    });
  });

  describe('generateRebuttal', () => {
    it('should generate rebuttal for detected excuse', () => {
      const rule: AntiBypassRule = {
        id: 'simple-fix',
        excuse: 'simple fix',
        rebuttal: 'Simple fixes still need verification',
        ironLawRef: 'IL002'
      };
      const rebuttal = generateRebuttal(rule);
      expect(rebuttal).toContain('verification');
      expect(rebuttal).toContain('simple fix');
      expect(rebuttal).toContain('IL002');
    });

    it('should generate rebuttal without iron law reference', () => {
      const rule: AntiBypassRule = {
        id: 'test-excuse',
        excuse: 'test excuse',
        rebuttal: 'Test rebuttal message'
      };
      const rebuttal = generateRebuttal(rule);
      expect(rebuttal).toContain('Test rebuttal message');
      expect(rebuttal).not.toContain('Iron Law');
    });

    it('should format rebuttal with proper structure', () => {
      const rule: AntiBypassRule = {
        id: 'legacy-project',
        excuse: 'legacy project',
        rebuttal: 'Legacy projects need standards even more.',
        ironLawRef: 'IL001'
      };
      const rebuttal = generateRebuttal(rule);
      expect(rebuttal).toContain('Excuse detected');
      expect(rebuttal).toContain('legacy project');
      expect(rebuttal).toContain('Rebuttal');
    });
  });

  describe('getIronLawForBypass', () => {
    it('should find referenced iron law', () => {
      const rule: AntiBypassRule = {
        id: 'simple-fix',
        excuse: 'simple fix',
        rebuttal: 'Test rebuttal',
        ironLawRef: 'IL002'
      };
      const ironLaws: IronLaw[] = [
        { id: 'IL001', rule: 'Rule 1', enforcement: 'block', violationAction: 'Stop' },
        { id: 'IL002', rule: 'Rule 2', enforcement: 'warn', violationAction: 'Warn' },
        { id: 'IL003', rule: 'Rule 3', enforcement: 'log', violationAction: 'Log' }
      ];
      const result = getIronLawForBypass(rule, ironLaws);
      expect(result).toBeDefined();
      expect(result?.id).toBe('IL002');
    });

    it('should return undefined when no iron law reference', () => {
      const rule: AntiBypassRule = {
        id: 'test-excuse',
        excuse: 'test excuse',
        rebuttal: 'Test rebuttal'
      };
      const ironLaws: IronLaw[] = [
        { id: 'IL001', rule: 'Rule 1', enforcement: 'block', violationAction: 'Stop' }
      ];
      const result = getIronLawForBypass(rule, ironLaws);
      expect(result).toBeUndefined();
    });

    it('should return undefined when iron law not found', () => {
      const rule: AntiBypassRule = {
        id: 'test-excuse',
        excuse: 'test excuse',
        rebuttal: 'Test rebuttal',
        ironLawRef: 'IL999'
      };
      const ironLaws: IronLaw[] = [
        { id: 'IL001', rule: 'Rule 1', enforcement: 'block', violationAction: 'Stop' }
      ];
      const result = getIronLawForBypass(rule, ironLaws);
      expect(result).toBeUndefined();
    });
  });

  describe('DEFAULT_ANTI_BYPASS_RULES', () => {
    it('should have expected default rules', () => {
      expect(DEFAULT_ANTI_BYPASS_RULES.length).toBeGreaterThan(0);
      expect(DEFAULT_ANTI_BYPASS_RULES.find(r => r.id === 'simple-fix')).toBeDefined();
      expect(DEFAULT_ANTI_BYPASS_RULES.find(r => r.id === 'skip-test')).toBeDefined();
      expect(DEFAULT_ANTI_BYPASS_RULES.find(r => r.id === 'quick-fix')).toBeDefined();
    });

    it('should have all required fields in rules', () => {
      for (const rule of DEFAULT_ANTI_BYPASS_RULES) {
        expect(rule.id).toBeTruthy();
        expect(rule.excuse).toBeTruthy();
        expect(rule.rebuttal).toBeTruthy();
      }
    });
  });
});