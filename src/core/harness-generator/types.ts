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
 * 铁律规则
 */
export interface IronLaw {
  id: string;
  rule: string;
  enforcement: 'block' | 'warn' | 'log';
  violationAction: string;
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
  };
  ironLaws: IronLaw[];
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