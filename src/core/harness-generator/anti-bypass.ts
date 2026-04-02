import { AntiBypassRule, IronLaw, RedFlag, PersuasionPrinciple } from './types.js';

/**
 * 说服力原则映射
 * 基于Cialdini研究，定义每种原则的典型应用模式
 */
export const PERSUASION_PATTERNS: Record<PersuasionPrinciple, {
  description: string;
  languagePatterns: string[];
}> = {
  authority: {
    description: 'Deference to expertise, credentials, or official sources',
    languagePatterns: [
      'YOU MUST',
      'Never',
      'Always',
      'No exceptions',
      'Non-negotiable',
      'Mandatory'
    ]
  },
  commitment: {
    description: 'Consistency with prior actions, statements, or public declarations',
    languagePatterns: [
      'Before proceeding',
      'After completing',
      'I\'m using [skill]',
      'I will'
    ]
  },
  scarcity: {
    description: 'Urgency from time limits or limited availability',
    languagePatterns: [
      'Immediately after',
      'Before any other',
      'First,',
      'Only after'
    ]
  },
  socialProof: {
    description: 'Conformity to what others do or what\'s considered normal',
    languagePatterns: [
      'Every time',
      'Always',
      '= failure',
      'Standard practice',
      'By convention'
    ]
  },
  unity: {
    description: 'Shared identity, "we-ness", in-group belonging',
    languagePatterns: [
      'your human partner',
      'we\'re colleagues',
      'we both want',
      'our codebase',
      'together'
    ]
  }
};

/**
 * 默认防绕过规则 (增强版，包含说服力原则)
 */
export const DEFAULT_ANTI_BYPASS_RULES: AntiBypassRule[] = [
  {
    id: 'simple-fix',
    excuse: 'simple fix',
    rebuttal: 'Simple fixes still need root cause analysis. Quick patches mask underlying issues. Test takes 30 seconds.',
    ironLawRef: 'IL002',
    persuasionPrinciple: 'authority'
  },
  {
    id: 'skip-test',
    excuse: 'skip test',
    rebuttal: 'Tests must pass. Skipping tests violates quality standards. No exceptions.',
    ironLawRef: 'IL003',
    persuasionPrinciple: 'authority'
  },
  {
    id: 'no-version',
    excuse: 'user didn\'t specify version',
    rebuttal: 'No version specified = use existing version. Version changes require explicit user consent. This protects your human partner from confusion.',
    ironLawRef: 'IL004',
    persuasionPrinciple: 'unity'
  },
  {
    id: 'legacy-project',
    excuse: 'legacy project',
    rebuttal: 'Legacy projects need standards even more. Technical debt compounds without rules. Every time.',
    ironLawRef: 'IL001',
    persuasionPrinciple: 'socialProof'
  },
  {
    id: 'quick-fix',
    excuse: 'quick fix',
    rebuttal: 'Quick fixes become permanent problems. Take time to do it right. Before proceeding, verify your approach.',
    ironLawRef: 'IL002',
    persuasionPrinciple: 'scarcity'
  },
  {
    id: 'just-once',
    excuse: 'just this once',
    rebuttal: 'No exceptions means no exceptions. This is non-negotiable.',
    ironLawRef: 'IL001',
    persuasionPrinciple: 'authority'
  },
  {
    id: 'already-tested',
    excuse: 'already manually tested',
    rebuttal: 'Manual testing is ad-hoc. You think you tested everything but have no record. Automated tests are systematic.',
    ironLawRef: 'IL003',
    persuasionPrinciple: 'socialProof'
  },
  {
    id: 'tests-after',
    excuse: 'tests after',
    rebuttal: 'Tests written after code pass immediately. Passing immediately proves nothing - might test wrong thing.',
    ironLawRef: 'IL003',
    persuasionPrinciple: 'authority'
  },
  {
    id: 'spirit-not-letter',
    excuse: 'spirit not letter',
    rebuttal: 'Violating the letter of the rules IS violating the spirit of the rules. Different words don\'t change the requirement.',
    ironLawRef: 'IL001',
    persuasionPrinciple: 'authority'
  },
  {
    id: 'keep-reference',
    excuse: 'keep as reference',
    rebuttal: 'Delete means delete. You\'ll adapt it - that\'s testing after. Start fresh.',
    ironLawRef: 'IL003',
    persuasionPrinciple: 'commitment'
  }
];

/**
 * 默认 Red Flags (违规前兆思维)
 */
export const DEFAULT_RED_FLAGS: RedFlag[] = [
  {
    thought: 'This is just a simple question',
    reality: 'Questions are tasks. Check for skills.',
    persuasionPrinciple: 'authority'
  },
  {
    thought: 'I need more context first',
    reality: 'Skill check comes BEFORE clarifying questions.',
    persuasionPrinciple: 'scarcity'
  },
  {
    thought: 'Let me explore the codebase first',
    reality: 'Skills tell you HOW to explore. Check first.',
    persuasionPrinciple: 'authority'
  },
  {
    thought: 'This doesn\'t need a formal skill',
    reality: 'If a skill exists, use it. No exceptions.',
    persuasionPrinciple: 'authority'
  },
  {
    thought: 'I\'ll just do this one thing first',
    reality: 'Check BEFORE doing anything.',
    persuasionPrinciple: 'scarcity'
  },
  {
    thought: 'This feels productive',
    reality: 'Undisciplined action wastes time. Skills prevent this.',
    persuasionPrinciple: 'socialProof'
  },
  {
    thought: 'Too simple to test',
    reality: 'Simple code breaks. Test takes 30 seconds.',
    ironLawRef: 'IL003',
    persuasionPrinciple: 'authority'
  },
  {
    thought: 'I\'m confident it works',
    reality: 'Confidence ≠ evidence. Run verification.',
    ironLawRef: 'IL005',
    persuasionPrinciple: 'authority'
  },
  {
    thought: 'Deleting X hours is wasteful',
    reality: 'Sunk cost fallacy. The time is already gone. Your choice: rewrite with confidence or keep unverified code.',
    ironLawRef: 'IL003',
    persuasionPrinciple: 'commitment'
  },
  {
    thought: 'TDD is dogmatic',
    reality: 'TDD IS pragmatic. Finds bugs before commit, prevents regressions, enables refactoring.',
    ironLawRef: 'IL003',
    persuasionPrinciple: 'socialProof'
  }
];

/**
 * 默认漏洞封堵模式
 */
export const DEFAULT_LOOPHOLE_CLOSURES = [
  {
    pattern: 'spirit vs letter',
    rebuttal: 'Violating the letter of the rules IS violating the spirit. No "technicalities".'
  },
  {
    pattern: 'just this once',
    rebuttal: 'No exceptions means no exceptions. This is not negotiable.'
  },
  {
    pattern: 'different words',
    rebuttal: 'Rule applies regardless of phrasing. "Should" = "must".'
  },
  {
    pattern: 'keep as reference',
    rebuttal: 'Delete means delete. You will adapt it. Delete and start fresh.'
  },
  {
    pattern: 'already spent time',
    rebuttal: 'Sunk cost fallacy. Keeping unverified code is technical debt.'
  },
  {
    pattern: 'my project is special',
    rebuttal: 'Iron laws apply to all projects. No project-specific exceptions.'
  }
];

export interface BypassDetectionResult {
  detected: boolean;
  matchedRule: AntiBypassRule | null;
  inputText: string;
  persuasionPrinciple?: PersuasionPrinciple;
}

/**
 * 检测绕过尝试
 */
export function detectBypassAttempt(
  text: string,
  customRules?: AntiBypassRule[]
): BypassDetectionResult {
  const rules = customRules || DEFAULT_ANTI_BYPASS_RULES;
  const lowerText = text.toLowerCase();

  for (const rule of rules) {
    if (lowerText.includes(rule.excuse.toLowerCase())) {
      return {
        detected: true,
        matchedRule: rule,
        inputText: text,
        persuasionPrinciple: rule.persuasionPrinciple
      };
    }
  }

  return {
    detected: false,
    matchedRule: null,
    inputText: text
  };
}

/**
 * 检测 Red Flag (违规前兆思维)
 */
export function detectRedFlag(
  text: string,
  customFlags?: RedFlag[]
): { detected: boolean; matchedFlag: RedFlag | null } {
  const flags = customFlags || DEFAULT_RED_FLAGS;
  const lowerText = text.toLowerCase();

  for (const flag of flags) {
    const thoughtLower = flag.thought.toLowerCase();
    // Check if key phrases from the thought appear in the text
    const keyPhrases = thoughtLower.split(/[,.]/).map(p => p.trim()).filter(p => p.length > 3);

    for (const phrase of keyPhrases) {
      if (lowerText.includes(phrase)) {
        return { detected: true, matchedFlag: flag };
      }
    }
  }

  return { detected: false, matchedFlag: null };
}

/**
 * 生成反驳 (增强版，包含说服力原则)
 */
export function generateRebuttal(rule: AntiBypassRule): string {
  const principleInfo = rule.persuasionPrinciple
    ? PERSUASION_PATTERNS[rule.persuasionPrinciple]
    : null;

  let rebuttal = `⚠️ **Excuse detected:** "${rule.excuse}"\n\n`;
  rebuttal += `**Rebuttal:** ${rule.rebuttal}`;

  if (rule.ironLawRef) {
    rebuttal += `\n\n*Referenced Iron Law: ${rule.ironLawRef}*`;
  }

  if (principleInfo) {
    rebuttal += `\n\n*Persuasion principle: ${rule.persuasionPrinciple}* (${principleInfo.description})`;
  }

  return rebuttal;
}

/**
 * 生成 Red Flag 警告
 */
export function generateRedFlagWarning(flag: RedFlag): string {
  let warning = `🚩 **Warning thought detected:** "${flag.thought}"\n\n`;
  warning += `**Reality:** ${flag.reality}`;

  if (flag.ironLawRef) {
    warning += `\n\n*Related Iron Law: ${flag.ironLawRef}*`;
  }

  if (flag.persuasionPrinciple) {
    warning += `\n\n*Stop and reconsider your approach.*`;
  }

  return warning;
}

/**
 * 获取铁律关联
 */
export function getIronLawForBypass(
  rule: AntiBypassRule,
  ironLaws: IronLaw[]
): IronLaw | undefined {
  if (!rule.ironLawRef) return undefined;
  return ironLaws.find(il => il.id === rule.ironLawRef);
}

/**
 * 批量检测绕过尝试
 */
export function detectMultipleBypassAttempts(
  text: string,
  customRules?: AntiBypassRule[]
): BypassDetectionResult[] {
  const rules = customRules || DEFAULT_ANTI_BYPASS_RULES;
  const results: BypassDetectionResult[] = [];
  const lowerText = text.toLowerCase();

  for (const rule of rules) {
    if (lowerText.includes(rule.excuse.toLowerCase())) {
      results.push({
        detected: true,
        matchedRule: rule,
        inputText: text,
        persuasionPrinciple: rule.persuasionPrinciple
      });
    }
  }

  return results;
}