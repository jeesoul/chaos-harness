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

// Version
export const VERSION = '0.1.0';