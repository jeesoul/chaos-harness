/**
 * Chaos Harness - 智能项目入侵系统
 *
 * Chaos demands order. Harness provides it.
 */

// Core Scanner
export { scan } from './core/scanner/index.js';
export { generateScanReport } from './core/scanner/report-generator.js';
export type {
  ScanResult,
  ScanOptions,
  LanguageInfo,
  BuildToolInfo,
  EnvironmentItem,
  DependencySource,
  CodeStyleInfo,
  TestCoverageInfo
} from './core/scanner/types.js';
export {
  ProjectType,
  ArchitectureType,
  DependencySourceType
} from './core/scanner/types.js';

// Version Manager
export { VersionManager } from './core/version-manager/index.js';
export {
  detectVersions,
  createVersionDirectory,
  selectVersion,
  VersionLocker,
  parseVersion,
  validateVersion,
  compareVersions,
  normalizeVersion,
  getNextVersion,
  suggestVersion,
} from './core/version-manager/index.js';
export type {
  VersionNumber,
  VersionDirectory,
  VersionLock,
  VersionSelection,
  DetectOptions,
  DetectResult,
  ValidationResult,
  SelectOptions,
  SelectResult,
} from './core/version-manager/index.js';

// Version
export const VERSION = '1.3.0';

// Environment Fixer
export {
  checkAndSuggestFix,
  generateEnvironmentMarkdown,
  classifyRisk,
  checkPrivateRepo,
  analyzeJdkLegacy,
  generateFixGuide,
  shouldAutoExecute,
  needsUserConfirmation,
  RiskLevel
} from './core/env-fixer/index.js';
export type {
  EnvironmentReport,
  EnvironmentCheckResult,
  EnvironmentIssue,
  FixGuide,
  FixStep,
  JdkLegacyInfo,
  PrivateRepoCheckResult,
  FixAction,
  CheckOptions
} from './core/env-fixer/index.js';

// Harness Generator
export {
  generateHarness,
  validateHarness,
  exportHarnessYaml,
  exportHarnessMarkdown,
  evaluateHarness,
  loadTemplate,
  findBestTemplate,
  listTemplates,
  evaluateActivationConditions,
  evaluateWarningConditions,
  calculateActivationScore,
  shouldActivate,
  checkChangeMonitor,
  buildDynamicRules,
  extractPrivateRepos,
  inferBuildCommands,
  detectTestFramework,
  inferCodeStyle,
  detectBypassAttempt,
  generateRebuttal,
  getIronLawForBypass,
  DEFAULT_ANTI_BYPASS_RULES,
  detectRedFlag,
  generateRedFlagWarning,
  DEFAULT_RED_FLAGS,
  DEFAULT_LOOPHOLE_CLOSURES,
  PERSUASION_PATTERNS,
  performTwoStageReview,
  reviewSpecCompliance,
  reviewCodeQuality,
  formatReviewMarkdown,
  EffectivenessTracker,
  formatEffectivenessMarkdown
} from './core/harness-generator/index.js';
export type {
  HarnessConfig,
  HarnessIdentity,
  HarnessGenerateOptions,
  HarnessValidationResult,
  IronLaw,
  LoopholeClosure,
  Recommendation,
  SelfCheckCondition,
  SelfCheckResult,
  RedFlag,
  PersuasionPrinciple,
  DynamicRules,
  AntiBypassRule,
  EffectivenessRecord,
  TwoStageReviewResult,
  ReviewIssue,
  ReviewRequest
} from './core/harness-generator/index.js';

// Workflow Engine
export {
  createWorkflow,
  createWorkflowExecutor,
  executeWorkflowStage,
  getWorkflowStatus,
  adaptWorkflowEngine,
  supervisorDetect,
  generateWorkflowMarkdown,
  requestSkipStage,
  getNextPendingStage,
  resetWorkflow,
  WorkflowExecutor,
  createStateMachine,
  executeStage,
  createAgentTeamManager,
  createTeam,
  createSupervisor,
  quickDetectLaziness,
  quickGeneratePressure,
  determineProjectScale,
  initializeAdaptiveFlow,
  adaptWorkflow,
  getAdaptiveFlowRule,
  getMandatoryStages,
  getSkippableStages,
  validateSkipRequest,
  generateAdaptiveFlowRecommendation,
  formatAdaptiveRulesMarkdown,
  STAGE_ORDER,
  getStageIndex,
  getNextStage,
  getPreviousStage,
  getStageDefinition,
  canSkipStage,
  getRequiredRoles,
  getStageInputs,
  getStageOutputs,
  validateStageTransition,
  formatStageMarkdown,
  getAllStagesMarkdown,
  DEFAULT_ADAPTIVE_FLOW_RULES,
  DEFAULT_IRON_LAWS,
  DEFAULT_LAZINESS_PATTERNS
} from './core/workflow-engine/index.js';
export type {
  WorkflowStage,
  ProjectScale,
  StageStatus,
  AgentRole,
  LazinessPatternId,
  StageDefinition,
  AgentTeamMember,
  LazinessPattern,
  WorkflowState,
  WorkflowConfig,
  WorkflowEngine,
  StageResult,
  ProjectChanges,
  StageTransitionEvent,
  SupervisorAction,
  WorkflowContext,
  AdaptiveFlowRule,
  CompleteWorkflowEngine,
  WorkflowStateMachine,
  AgentTeamManager,
  Supervisor
} from './core/workflow-engine/index.js';