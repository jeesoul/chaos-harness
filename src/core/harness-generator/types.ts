/**
 * Harness身份标识
 */
export interface HarnessIdentity {
  name: string;
  version: string;
  createdAt: string;
  createdBy: 'scanner' | 'manual';
  suitableFor: string[];
  confidenceThreshold: number;
}

/**
 * 自我检测条件
 */
export interface SelfCheckCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'exists' | 'notExists';
  value: string | RegExp;
  description: string;
}

/**
 * 自我检测结果
 */
export interface SelfCheckResult {
  passed: boolean;
  condition: SelfCheckCondition;
  actualValue: any;
  message: string;
}

/**
 * 说服力原则 (基于 Cialdini 研究)
 * - Authority: 权威语言 "YOU MUST", "Never"
 * - Commitment: 要求声明和追踪
 * - Scarcity: 时间限制 "Before proceeding"
 * - SocialProof: 普遍模式 "Every time", "= failure"
 * - Unity: 协作语言 "your human partner"
 */
export type PersuasionPrinciple = 'authority' | 'commitment' | 'scarcity' | 'socialProof' | 'unity';

/**
 * 漏洞封堵模式
 * 显式声明常见的绕过尝试和反驳
 */
export interface LoopholeClosure {
  pattern: string;
  rebuttal: string;
  ironLawRef?: string;
}

/**
 * 铁律规则
 */
export interface IronLaw {
  id: string;
  rule: string;
  enforcement: 'block' | 'warn' | 'log';
  violationAction: string;
  /** 显式漏洞封堵 */
  loopholes?: LoopholeClosure[];
}

/**
 * Red Flag - 违规前兆思维
 * 当 Agent 有这些想法时，说明即将违规
 */
export interface RedFlag {
  /** 触发性想法 */
  thought: string;
  /** 现实情况 */
  reality: string;
  /** 关联铁律 */
  ironLawRef?: string;
  /** 使用的说服力原则 */
  persuasionPrinciple?: PersuasionPrinciple;
}

/**
 * 推荐规则
 */
export interface Recommendation {
  id: string;
  rule: string;
  skipCondition?: string;
  skipRecord?: string;
}

/**
 * 动态规则
 */
export interface DynamicRules {
  privateRepositories: Array<{ id: string; url: string; authRequired: boolean }>;
  buildCommands: { standard: string; withTests: string };
  testFramework: { primary: string; mock?: string };
  inferredCodeStyle: {
    namingConvention: Record<string, string>;
    importStyle: string;
  };
}

/**
 * 防绕过规则
 */
export interface AntiBypassRule {
  id: string;
  excuse: string;
  rebuttal: string;
  ironLawRef?: string;
  /** 使用的说服力原则 */
  persuasionPrinciple?: PersuasionPrinciple;
}

/**
 * 效果记录
 */
export interface EffectivenessRecord {
  timestamp: string;
  taskId: string;
  ironLawViolations: number;
  recommendationsSkipped: string[];
  userSatisfaction: number | null;
  notes: string;
}

/**
 * 两阶段审查结果
 */
export interface TwoStageReviewResult {
  specCompliance: {
    passed: boolean;
    missingRequirements: string[];
    extraFeatures: string[];
    issues: string[];
  };
  codeQuality: {
    passed: boolean;
    strengths: string[];
    issues: ReviewIssue[];
  };
  overallPassed: boolean;
  summary: string;
}

/**
 * 审查问题
 */
export interface ReviewIssue {
  severity: 'critical' | 'important' | 'minor';
  description: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

/**
 * 审查请求
 */
export interface ReviewRequest {
  planPath: string;
  implementationPaths: string[];
  testResults?: {
    passed: boolean;
    coverage?: number;
    failures: string[];
  };
}

/**
 * 完整Harness配置
 */
export interface HarnessConfig {
  identity: HarnessIdentity;
  selfCheck: {
    activationConditions: SelfCheckCondition[];
    warningConditions: SelfCheckCondition[];
    changeMonitor: {
      watchedFiles: string[];
      threshold: number;
    };
    /** Red Flags - 违规前兆思维检测 */
    redFlags?: RedFlag[];
  };
  ironLaws: IronLaw[];
  /** 全局漏洞封堵模式 */
  loopholeClosure?: LoopholeClosure[];
  recommendations: Recommendation[];
  dynamicRules: DynamicRules;
  antiBypass: AntiBypassRule[];
  effectivenessLog: string;
}

/**
 * Harness生成选项
 */
export interface HarnessGenerateOptions {
  scanResult: any;
  outputPath: string;
  templateOverride?: string;
  customRules?: Partial<HarnessConfig>;
}

/**
 * 验证结果
 */
export interface HarnessValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}