/**
 * 风险级别
 */
export enum RiskLevel {
  LOW = 'low',           // 自动执行
  MEDIUM = 'medium',     // 确认后执行
  HIGH = 'high',         // 必须用户明确同意
  CANNOT_AUTO = 'cannot' // 无法自动处理
}

/**
 * 修复操作
 */
export interface FixAction {
  id: string;
  description: string;
  riskLevel: RiskLevel;
  commands?: string[];
  guideSteps?: string[];
  requiresUserInput?: boolean;
}

/**
 * 环境问题
 */
export interface EnvironmentIssue {
  tool: string;
  issue: string;
  rootCause: string;
  fixActions: FixAction[];
}

/**
 * 检测结果
 */
export interface EnvironmentCheckResult {
  tool: string;
  installed: boolean;
  version: string | null;
  required: string | null;
  satisfied: boolean;
  issues: EnvironmentIssue[];
}

/**
 * 私服检测结果
 */
export interface PrivateRepoCheckResult {
  url: string;
  reachable: boolean;
  authRequired: boolean;
  responseCode: number | null;
  error: string | null;
}

/**
 * JDK Legacy 信息
 */
export interface JdkLegacyInfo {
  isLegacy: boolean;
  javaVersion: string | null;
  springBootVersion: string | null;
  knownIssues: string[];
  compatibleVersions: {
    lombok: string;
    springCloud: string;
    junit: string;
  };
}

/**
 * 修复指导
 */
export interface FixGuide {
  title: string;
  riskLevel: RiskLevel;
  steps: FixStep[];
  warnings: string[];
}

export interface FixStep {
  order: number;
  action: string;
  command?: string;
  description: string;
}

/**
 * 环境报告
 */
export interface EnvironmentReport {
  timestamp: string;
  checks: EnvironmentCheckResult[];
  issues: EnvironmentIssue[];
  fixGuides: FixGuide[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * 检测选项
 */
export interface CheckOptions {
  skipPrivateRepoCheck?: boolean;
  timeout?: number;
}