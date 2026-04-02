// src/core/scanner/types.ts

/**
 * 项目类型枚举
 */
export enum ProjectType {
  JAVA_SPRING = 'java-spring',
  JAVA_SPRING_LEGACY = 'java-spring-legacy',
  JAVA_MAVEN = 'java-maven',
  JAVA_GRADLE = 'java-gradle',
  REACT_VITE = 'react-vite',
  VUE_VITE = 'vue-vite',
  PYTHON_DJANGO = 'python-django',
  PYTHON_FLASK = 'python-flask',
  NODE_EXPRESS = 'node-express',
  GENERIC = 'generic',
  UNKNOWN = 'unknown'
}

/**
 * 语言信息
 */
export interface LanguageInfo {
  name: string;
  version: string;
  isLegacy: boolean;
  label: string;
}

/**
 * 构建工具信息
 */
export interface BuildToolInfo {
  name: string;
  version: string | null;
  detectedFrom: string;
}

/**
 * 项目架构类型
 */
export enum ArchitectureType {
  MONOLITH = 'monolith',
  MICROSERVICE = 'microservice',
  FRONTEND_ONLY = 'frontend-only',
  BACKEND_ONLY = 'backend-only',
  FULLSTACK = 'fullstack',
  UNKNOWN = 'unknown'
}

/**
 * 依赖来源类型
 */
export enum DependencySourceType {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

/**
 * 依赖来源信息
 */
export interface DependencySource {
  id: string;
  type: DependencySourceType;
  url: string;
  authRequired: boolean;
  reachable: boolean | null;
}

/**
 * 环境项状态
 */
export interface EnvironmentItem {
  tool: string;
  installed: boolean;
  version: string | null;
  required: string | null;
  satisfied: boolean | null;
}

/**
 * 代码风格信息
 */
export interface CodeStyleInfo {
  lintTool: string | null;
  configPath: string | null;
  inferredRules: string[];
  namingConvention: {
    className: string | null;
    methodName: string | null;
    constantName: string | null;
  };
}

/**
 * 测试覆盖信息
 */
export interface TestCoverageInfo {
  framework: string | null;
  hasUnitTests: boolean;
  hasIntegrationTests: boolean;
  coveragePercent: number | null;
}

/**
 * 完整扫描结果
 */
export interface ScanResult {
  timestamp: string;
  projectRoot: string;
  projectType: {
    type: ProjectType;
    confidence: number;
    features: string[];
  };
  language: LanguageInfo | null;
  buildTool: BuildToolInfo | null;
  architecture: ArchitectureType;
  dependencySources: DependencySource[];
  localEnv: EnvironmentItem[];
  codeStyle: CodeStyleInfo;
  testCoverage: TestCoverageInfo;
  warnings: string[];
}

/**
 * 扫描选项
 */
export interface ScanOptions {
  projectRoot: string;
  skipEnvCheck?: boolean;
  skipCodeAnalysis?: boolean;
  verbose?: boolean;
}