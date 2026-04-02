// src/core/env-fixer/risk-classifier.ts

import { RiskLevel, FixAction, EnvironmentIssue } from './types.js';

const RISK_MAPPING: Record<string, RiskLevel> = {
  'npm install': RiskLevel.LOW,
  'pip install': RiskLevel.LOW,
  'mvn dependency': RiskLevel.LOW,
  'install-jdk': RiskLevel.MEDIUM,
  'install-node': RiskLevel.MEDIUM,
  'install-python': RiskLevel.MEDIUM,
  'install-docker': RiskLevel.MEDIUM,
  'private-repo-auth': RiskLevel.HIGH,
  'ssh-key-config': RiskLevel.HIGH,
  'env-variable': RiskLevel.HIGH,
  'gui-install': RiskLevel.CANNOT_AUTO,
  'paid-software': RiskLevel.CANNOT_AUTO,
  'manual-download': RiskLevel.CANNOT_AUTO
};

export function classifyRisk(action: string): RiskLevel {
  for (const [key, level] of Object.entries(RISK_MAPPING)) {
    if (action.toLowerCase().includes(key.toLowerCase())) {
      return level;
    }
  }
  return RiskLevel.MEDIUM; // 默认中等风险
}

export function getFixActions(issue: EnvironmentIssue): FixAction[] {
  // 根据问题类型生成修复操作
  return issue.fixActions;
}

export function shouldAutoExecute(riskLevel: RiskLevel): boolean {
  return riskLevel === RiskLevel.LOW;
}

export function needsUserConfirmation(riskLevel: RiskLevel): boolean {
  return riskLevel === RiskLevel.MEDIUM || riskLevel === RiskLevel.HIGH;
}