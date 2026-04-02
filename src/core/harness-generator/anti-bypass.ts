import { AntiBypassRule, IronLaw } from './types.js';

const DEFAULT_ANTI_BYPASS_RULES: AntiBypassRule[] = [
  {
    id: 'simple-fix',
    excuse: 'simple fix',
    rebuttal: 'Simple fixes still need root cause analysis. Quick patches mask underlying issues.',
    ironLawRef: 'IL002'
  },
  {
    id: 'skip-test',
    excuse: 'skip test',
    rebuttal: 'Tests must pass. Skipping tests violates quality standards.',
    ironLawRef: 'IL003'
  },
  {
    id: 'no-version',
    excuse: 'user didn\'t specify version',
    rebuttal: 'No version specified = use existing version. Version changes require explicit user consent.',
    ironLawRef: 'IL004'
  },
  {
    id: 'legacy-project',
    excuse: 'legacy project',
    rebuttal: 'Legacy projects need standards even more. Technical debt compounds without rules.',
    ironLawRef: 'IL001'
  },
  {
    id: 'quick-fix',
    excuse: 'quick fix',
    rebuttal: 'Quick fixes become permanent problems. Take time to do it right.',
    ironLawRef: 'IL002'
  }
];

export interface BypassDetectionResult {
  detected: boolean;
  matchedRule: AntiBypassRule | null;
  inputText: string;
}

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
        inputText: text
      };
    }
  }

  return {
    detected: false,
    matchedRule: null,
    inputText: text
  };
}

export function generateRebuttal(rule: AntiBypassRule): string {
  return `⚠️ **Excuse detected:** "${rule.excuse}"\n\n**Rebuttal:** ${rule.rebuttal}${rule.ironLawRef ? `\n\n*Referenced Iron Law: ${rule.ironLawRef}*` : ''}`;
}

export function getIronLawForBypass(
  rule: AntiBypassRule,
  ironLaws: IronLaw[]
): IronLaw | undefined {
  if (!rule.ironLawRef) return undefined;
  return ironLaws.find(il => il.id === rule.ironLawRef);
}

export { DEFAULT_ANTI_BYPASS_RULES };