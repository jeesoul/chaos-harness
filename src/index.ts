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
export const VERSION = '0.1.0';

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
  buildDynamicRules,
  extractPrivateRepos,
  inferBuildCommands,
  detectTestFramework,
  inferCodeStyle,
  detectBypassAttempt,
  generateRebuttal,
  getIronLawForBypass,
  DEFAULT_ANTI_BYPASS_RULES,
  EffectivenessTracker,
  formatEffectivenessMarkdown
} from './core/harness-generator/index.js';
export type {
  HarnessConfig,
  HarnessIdentity,
  HarnessGenerateOptions,
  HarnessValidationResult,
  IronLaw,
  Recommendation,
  SelfCheckCondition,
  SelfCheckResult,
  DynamicRules,
  AntiBypassRule,
  EffectivenessRecord
} from './core/harness-generator/index.js';