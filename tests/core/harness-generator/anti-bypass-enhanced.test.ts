import { describe, it, expect } from 'vitest';
import {
  detectBypassAttempt,
  generateRebuttal,
  detectRedFlag,
  generateRedFlagWarning,
  DEFAULT_ANTI_BYPASS_RULES,
  DEFAULT_RED_FLAGS,
  DEFAULT_LOOPHOLE_CLOSURES,
  PERSUASION_PATTERNS
} from '../../../src/core/harness-generator/anti-bypass.js';

describe('Enhanced Anti-Bypass System', () => {
  describe('Persuasion Patterns', () => {
    it('should define all five persuasion principles', () => {
      expect(PERSUASION_PATTERNS.authority).toBeDefined();
      expect(PERSUASION_PATTERNS.commitment).toBeDefined();
      expect(PERSUASION_PATTERNS.scarcity).toBeDefined();
      expect(PERSUASION_PATTERNS.socialProof).toBeDefined();
      expect(PERSUASION_PATTERNS.unity).toBeDefined();
    });

    it('should have language patterns for each principle', () => {
      expect(PERSUASION_PATTERNS.authority.languagePatterns.length).toBeGreaterThan(0);
      expect(PERSUASION_PATTERNS.commitment.languagePatterns.length).toBeGreaterThan(0);
    });

    it('should have descriptions for each principle', () => {
      expect(PERSUASION_PATTERNS.authority.description).toBeDefined();
      expect(PERSUASION_PATTERNS.unity.description).toBeDefined();
    });
  });

  describe('detectBypassAttempt', () => {
    it('should detect bypass with persuasion principle', () => {
      const result = detectBypassAttempt('This is a simple fix, just change one line');

      expect(result.detected).toBe(true);
      expect(result.matchedRule).toBeDefined();
      expect(result.persuasionPrinciple).toBe('authority');
    });

    it('should detect "simple fix" excuse', () => {
      const result = detectBypassAttempt('This is a simple fix');

      expect(result.detected).toBe(true);
      expect(result.matchedRule?.id).toBe('simple-fix');
    });

    it('should detect "just this once" excuse', () => {
      const result = detectBypassAttempt('I\'ll skip tests just this once');

      expect(result.detected).toBe(true);
    });

    it('should detect "legacy project" excuse', () => {
      const result = detectBypassAttempt('This is a legacy project, rules don\'t apply');

      expect(result.detected).toBe(true);
      expect(result.matchedRule?.id).toBe('legacy-project');
    });

    it('should not detect bypass in normal text', () => {
      const result = detectBypassAttempt('I will implement the feature as specified');

      expect(result.detected).toBe(false);
    });
  });

  describe('detectRedFlag', () => {
    it('should detect red flag thinking', () => {
      const result = detectRedFlag('This is just a simple question');

      expect(result.detected).toBe(true);
      expect(result.matchedFlag).toBeDefined();
    });

    it('should detect "too simple to test" red flag', () => {
      const result = detectRedFlag('This code is too simple to test');

      expect(result.detected).toBe(true);
      expect(result.matchedFlag?.ironLawRef).toBe('IL003');
    });

    it('should detect "confident" red flag', () => {
      const result = detectRedFlag('I\'m confident it works');

      expect(result.detected).toBe(true);
      expect(result.matchedFlag?.ironLawRef).toBe('IL005');
    });

    it('should detect "deleting is wasteful" red flag', () => {
      const result = detectRedFlag('Deleting X hours is wasteful');

      expect(result.detected).toBe(true);
    });
  });

  describe('generateRebuttal', () => {
    it('should generate rebuttal with persuasion principle', () => {
      const rule = DEFAULT_ANTI_BYPASS_RULES.find(r => r.id === 'simple-fix')!;
      const rebuttal = generateRebuttal(rule);

      expect(rebuttal).toContain('Excuse detected');
      expect(rebuttal).toContain('Rebuttal');
      expect(rebuttal).toContain('authority');
    });

    it('should include iron law reference', () => {
      const rule = DEFAULT_ANTI_BYPASS_RULES.find(r => r.id === 'simple-fix')!;
      const rebuttal = generateRebuttal(rule);

      expect(rebuttal).toContain('IL002');
    });

    it('should include persuasion principle description', () => {
      const rule = DEFAULT_ANTI_BYPASS_RULES.find(r => r.id === 'legacy-project')!;
      const rebuttal = generateRebuttal(rule);

      expect(rebuttal).toContain('socialProof');
    });
  });

  describe('generateRedFlagWarning', () => {
    it('should generate warning for red flag', () => {
      const flag = DEFAULT_RED_FLAGS.find(f => f.thought.includes('simple question'))!;
      const warning = generateRedFlagWarning(flag);

      expect(warning).toContain('Warning thought detected');
      expect(warning).toContain('Reality');
    });

    it('should include iron law reference if present', () => {
      const flag = DEFAULT_RED_FLAGS.find(f => f.ironLawRef === 'IL003')!;
      const warning = generateRedFlagWarning(flag);

      expect(warning).toContain('IL003');
    });
  });

  describe('Default Rules', () => {
    it('should have enhanced anti-bypass rules with persuasion principles', () => {
      const rulesWithPrinciples = DEFAULT_ANTI_BYPASS_RULES.filter(r => r.persuasionPrinciple);

      expect(rulesWithPrinciples.length).toBeGreaterThan(0);
    });

    it('should have default red flags defined', () => {
      expect(DEFAULT_RED_FLAGS.length).toBeGreaterThan(0);

      const flagsWithIronLaws = DEFAULT_RED_FLAGS.filter(f => f.ironLawRef);
      expect(flagsWithIronLaws.length).toBeGreaterThan(0);
    });

    it('should have default loophole closures defined', () => {
      expect(DEFAULT_LOOPHOLE_CLOSURES.length).toBeGreaterThan(0);

      const spiritVsLetter = DEFAULT_LOOPHOLE_CLOSURES.find(l => l.pattern.includes('spirit'));
      expect(spiritVsLetter).toBeDefined();
    });

    it('should have at least 10 anti-bypass rules', () => {
      expect(DEFAULT_ANTI_BYPASS_RULES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have at least 10 red flags', () => {
      expect(DEFAULT_RED_FLAGS.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Integration with Iron Laws', () => {
    it('should reference iron laws in anti-bypass rules', () => {
      const rulesWithRefs = DEFAULT_ANTI_BYPASS_RULES.filter(r => r.ironLawRef);

      expect(rulesWithRefs.length).toBeGreaterThan(0);
    });

    it('should reference iron laws in red flags', () => {
      const flagsWithRefs = DEFAULT_RED_FLAGS.filter(f => f.ironLawRef);

      expect(flagsWithRefs.length).toBeGreaterThan(0);
    });
  });

  describe('Case Insensitivity', () => {
    it('should detect bypass regardless of case', () => {
      const result = detectBypassAttempt('This is a SIMPLE FIX');

      expect(result.detected).toBe(true);
    });

    it('should detect bypass in mixed case', () => {
      const result = detectBypassAttempt('Just This Once');

      expect(result.detected).toBe(true);
    });
  });
});