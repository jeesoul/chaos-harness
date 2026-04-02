// tests/core/env-fixer/risk-classifier.test.ts

import { describe, it, expect } from 'vitest';
import { classifyRisk, getFixActions, shouldAutoExecute, needsUserConfirmation } from '../../../src/core/env-fixer/risk-classifier.js';
import { RiskLevel, EnvironmentIssue, FixAction } from '../../../src/core/env-fixer/types.js';

describe('RiskClassifier', () => {
  it('should classify npm install as LOW risk', () => {
    expect(classifyRisk('npm install package')).toBe(RiskLevel.LOW);
  });

  it('should classify pip install as LOW risk', () => {
    expect(classifyRisk('pip install package')).toBe(RiskLevel.LOW);
  });

  it('should classify JDK installation as MEDIUM risk', () => {
    expect(classifyRisk('install-jdk')).toBe(RiskLevel.MEDIUM);
  });

  it('should classify Node installation as MEDIUM risk', () => {
    expect(classifyRisk('install-node')).toBe(RiskLevel.MEDIUM);
  });

  it('should classify private repo auth as HIGH risk', () => {
    expect(classifyRisk('private-repo-auth')).toBe(RiskLevel.HIGH);
  });

  it('should classify SSH key config as HIGH risk', () => {
    expect(classifyRisk('ssh-key-config')).toBe(RiskLevel.HIGH);
  });

  it('should classify GUI installation as CANNOT_AUTO', () => {
    expect(classifyRisk('gui-install')).toBe(RiskLevel.CANNOT_AUTO);
  });

  it('should classify paid software as CANNOT_AUTO', () => {
    expect(classifyRisk('paid-software')).toBe(RiskLevel.CANNOT_AUTO);
  });
});

describe('shouldAutoExecute', () => {
  it('should return true for LOW risk', () => {
    expect(shouldAutoExecute(RiskLevel.LOW)).toBe(true);
  });

  it('should return false for MEDIUM risk', () => {
    expect(shouldAutoExecute(RiskLevel.MEDIUM)).toBe(false);
  });

  it('should return false for HIGH risk', () => {
    expect(shouldAutoExecute(RiskLevel.HIGH)).toBe(false);
  });

  it('should return false for CANNOT_AUTO risk', () => {
    expect(shouldAutoExecute(RiskLevel.CANNOT_AUTO)).toBe(false);
  });
});

describe('needsUserConfirmation', () => {
  it('should return false for LOW risk', () => {
    expect(needsUserConfirmation(RiskLevel.LOW)).toBe(false);
  });

  it('should return true for MEDIUM risk', () => {
    expect(needsUserConfirmation(RiskLevel.MEDIUM)).toBe(true);
  });

  it('should return true for HIGH risk', () => {
    expect(needsUserConfirmation(RiskLevel.HIGH)).toBe(true);
  });

  it('should return false for CANNOT_AUTO risk', () => {
    expect(needsUserConfirmation(RiskLevel.CANNOT_AUTO)).toBe(false);
  });
});

describe('getFixActions', () => {
  it('should return fix actions from issue', () => {
    const fixActions: FixAction[] = [
      {
        id: 'fix-1',
        description: 'Test fix',
        riskLevel: RiskLevel.LOW
      }
    ];
    const issue: EnvironmentIssue = {
      tool: 'npm',
      issue: 'missing dependency',
      rootCause: 'not installed',
      fixActions
    };
    expect(getFixActions(issue)).toBe(fixActions);
  });
});