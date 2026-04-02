// tests/core/env-fixer/fix-guide.test.ts

import { describe, it, expect } from 'vitest';
import { generateFixGuide, generateMarkdownGuide } from '../../../src/core/env-fixer/fix-guide.js';
import { EnvironmentIssue, FixGuide, RiskLevel } from '../../../src/core/env-fixer/types.js';

describe('FixGuideGenerator', () => {
  it('should generate guide for missing JDK', () => {
    const issue: EnvironmentIssue = {
      tool: 'JDK',
      issue: 'not_installed',
      rootCause: 'JDK未安装',
      fixActions: [
        { id: 'install-jdk', description: '安装JDK', riskLevel: RiskLevel.MEDIUM }
      ]
    };
    const guide = generateFixGuide(issue);
    expect(guide.title).toContain('JDK');
    expect(guide.steps.length).toBeGreaterThan(0);
  });

  it('should generate guide for private repo auth', () => {
    const issue: EnvironmentIssue = {
      tool: 'PrivateRepo',
      issue: 'auth_required',
      rootCause: '私服需要认证',
      fixActions: [
        { id: 'private-repo-auth', description: '配置私服认证', riskLevel: RiskLevel.HIGH }
      ]
    };
    const guide = generateFixGuide(issue);
    expect(guide.riskLevel).toBe(RiskLevel.HIGH);
    expect(guide.warnings.length).toBeGreaterThan(0);
  });

  it('should generate markdown output', () => {
    const guide: FixGuide = {
      title: 'Test Guide',
      riskLevel: RiskLevel.LOW,
      steps: [{ order: 1, action: 'Test', description: 'Test step' }],
      warnings: []
    };
    const md = generateMarkdownGuide(guide);
    expect(md).toContain('# Test Guide');
    expect(md).toContain('风险级别');
  });
});