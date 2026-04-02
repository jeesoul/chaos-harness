// src/core/scanner/index.ts

import { existsSync } from 'fs';
import { join } from 'path';
import {
  ProjectType,
  ArchitectureType,
  DependencySourceType,
  type ScanOptions,
  type ScanResult,
  type LanguageInfo,
  type BuildToolInfo,
  type DependencySource,
  type CodeStyleInfo,
  type TestCoverageInfo
} from './types.js';
import { detectProjectType } from './project-detector.js';
import { parsePomXml, parsePackageJson, parseRequirementsTxt } from './config-parser.js';
import { checkEnvironment } from './env-checker.js';

/**
 * Main scan function that analyzes a project and returns comprehensive information
 * @param options Scan options including projectRoot path
 * @returns ScanResult containing all detected project information
 */
export async function scan(options: ScanOptions): Promise<ScanResult> {
  const { projectRoot, skipEnvCheck = false, skipCodeAnalysis = false, verbose = false } = options;
  const warnings: string[] = [];

  // 1. Validate projectRoot exists
  if (!existsSync(projectRoot)) {
    throw new Error(`Project root does not exist: ${projectRoot}`);
  }

  // 2. Detect project type
  const projectType = await detectProjectType(projectRoot);

  if (verbose) {
    console.log(`Detected project type: ${projectType.type} (confidence: ${projectType.confidence})`);
  }

  // 3. Parse config files based on project type
  let language: LanguageInfo | null = null;
  let buildTool: BuildToolInfo | null = null;
  const dependencySources: DependencySource[] = [];
  let envRequirements: Record<string, string> = {};

  // Parse based on project type
  if (isJavaProject(projectType.type)) {
    const pomPath = join(projectRoot, 'pom.xml');
    const pomResult = await parsePomXml(pomPath);

    // Set language info
    language = {
      name: 'java',
      version: pomResult.javaVersion || 'unknown',
      isLegacy: pomResult.isLegacy,
      label: pomResult.isLegacy ? 'Java (Legacy)' : 'Java'
    };

    // Set build tool info
    buildTool = {
      name: 'maven',
      version: null,
      detectedFrom: 'pom.xml'
    };

    // Set environment requirements
    if (pomResult.javaVersion) {
      envRequirements.java = pomResult.javaVersion;
    }
    envRequirements.maven = '3.0';

    // Extract dependency sources (repositories)
    for (const repo of pomResult.repositories) {
      dependencySources.push({
        id: repo.id,
        type: repo.url.includes('private') || repo.url.includes('nexus') || repo.url.includes('artifactory')
          ? DependencySourceType.PRIVATE
          : DependencySourceType.PUBLIC,
        url: repo.url,
        authRequired: repo.url.includes('private') || repo.url.includes('nexus') || repo.url.includes('artifactory'),
        reachable: null
      });
    }

    // Add Maven Central as default if no repositories defined
    if (dependencySources.length === 0) {
      dependencySources.push({
        id: 'central',
        type: DependencySourceType.PUBLIC,
        url: 'https://repo.maven.apache.org/maven2',
        authRequired: false,
        reachable: null
      });
    }
  }

  if (isNodeProject(projectType.type)) {
    const packagePath = join(projectRoot, 'package.json');
    const packageResult = await parsePackageJson(packagePath);

    // Set language info
    let nodeVersion = 'unknown';
    if (packageResult.engines && packageResult.engines.node) {
      nodeVersion = packageResult.engines.node;
    }

    language = {
      name: 'node',
      version: nodeVersion,
      isLegacy: false,
      label: 'Node.js'
    };

    // Set build tool info
    buildTool = {
      name: 'npm',
      version: null,
      detectedFrom: 'package.json'
    };

    // Set environment requirements
    envRequirements.node = nodeVersion !== 'unknown' ? nodeVersion : '14.0';

    // Add npm registry as default
    dependencySources.push({
      id: 'npm-registry',
      type: DependencySourceType.PUBLIC,
      url: 'https://registry.npmjs.org',
      authRequired: false,
      reachable: null
    });
  }

  if (isPythonProject(projectType.type)) {
    const requirementsPath = join(projectRoot, 'requirements.txt');
    const requirementsResult = await parseRequirementsTxt(requirementsPath);

    // Set language info
    language = {
      name: 'python',
      version: 'unknown',
      isLegacy: false,
      label: 'Python'
    };

    // Set build tool info
    buildTool = {
      name: 'pip',
      version: null,
      detectedFrom: 'requirements.txt'
    };

    // Set environment requirements
    envRequirements.python = '3.0';

    // Add PyPI as default
    dependencySources.push({
      id: 'pypi',
      type: DependencySourceType.PUBLIC,
      url: 'https://pypi.org/simple',
      authRequired: false,
      reachable: null
    });
  }

  // 4. Check environment
  let localEnv: ScanResult['localEnv'] = [];
  if (!skipEnvCheck && Object.keys(envRequirements).length > 0) {
    try {
      localEnv = await checkEnvironment(envRequirements);
    } catch (error) {
      warnings.push(`Environment check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 5. Determine architecture
  const architecture = detectArchitecture(projectRoot);

  // 6. Build code style info (simplified)
  const codeStyle: CodeStyleInfo = detectCodeStyle(projectRoot);

  // 7. Build test coverage info (simplified)
  const testCoverage: TestCoverageInfo = detectTestCoverage(projectRoot, projectType.type);

  // 8. Build and return ScanResult
  const result: ScanResult = {
    timestamp: new Date().toISOString(),
    projectRoot,
    projectType,
    language,
    buildTool,
    architecture,
    dependencySources,
    localEnv,
    codeStyle,
    testCoverage,
    warnings
  };

  return result;
}

/**
 * Check if project type is Java-based
 */
function isJavaProject(type: ProjectType): boolean {
  return [
    ProjectType.JAVA_SPRING,
    ProjectType.JAVA_SPRING_LEGACY,
    ProjectType.JAVA_MAVEN,
    ProjectType.JAVA_GRADLE
  ].includes(type);
}

/**
 * Check if project type is Node-based
 */
function isNodeProject(type: ProjectType): boolean {
  return [
    ProjectType.REACT_VITE,
    ProjectType.VUE_VITE,
    ProjectType.NODE_EXPRESS
  ].includes(type);
}

/**
 * Check if project type is Python-based
 */
function isPythonProject(type: ProjectType): boolean {
  return [
    ProjectType.PYTHON_DJANGO,
    ProjectType.PYTHON_FLASK
  ].includes(type);
}

/**
 * Detect architecture type based on project structure
 */
function detectArchitecture(projectRoot: string): ArchitectureType {
  // Check for docker-compose.yml
  if (existsSync(join(projectRoot, 'docker-compose.yml')) ||
      existsSync(join(projectRoot, 'docker-compose.yaml'))) {
    return ArchitectureType.MICROSERVICE;
  }

  // Check for kubernetes/ or k8s/ directories
  if (existsSync(join(projectRoot, 'kubernetes')) ||
      existsSync(join(projectRoot, 'k8s'))) {
    return ArchitectureType.MICROSERVICE;
  }

  // Default to monolith
  return ArchitectureType.MONOLITH;
}

/**
 * Detect code style information (simplified)
 */
function detectCodeStyle(projectRoot: string): CodeStyleInfo {
  const codeStyle: CodeStyleInfo = {
    lintTool: null,
    configPath: null,
    inferredRules: [],
    namingConvention: {
      className: null,
      methodName: null,
      constantName: null
    }
  };

  // Check for ESLint
  if (existsSync(join(projectRoot, '.eslintrc')) ||
      existsSync(join(projectRoot, '.eslintrc.js')) ||
      existsSync(join(projectRoot, '.eslintrc.json')) ||
      existsSync(join(projectRoot, '.eslintrc.yml'))) {
    codeStyle.lintTool = 'eslint';

    // Find config path
    if (existsSync(join(projectRoot, '.eslintrc.json'))) {
      codeStyle.configPath = '.eslintrc.json';
    } else if (existsSync(join(projectRoot, '.eslintrc.js'))) {
      codeStyle.configPath = '.eslintrc.js';
    } else if (existsSync(join(projectRoot, '.eslintrc.yml'))) {
      codeStyle.configPath = '.eslintrc.yml';
    } else {
      codeStyle.configPath = '.eslintrc';
    }
  }

  // Check for Checkstyle (Java)
  if (existsSync(join(projectRoot, 'checkstyle.xml'))) {
    codeStyle.lintTool = 'checkstyle';
    codeStyle.configPath = 'checkstyle.xml';
  }

  // Check for Prettier
  if (existsSync(join(projectRoot, '.prettierrc')) ||
      existsSync(join(projectRoot, '.prettierrc.json')) ||
      existsSync(join(projectRoot, '.prettierrc.js'))) {
    if (codeStyle.lintTool) {
      codeStyle.inferredRules.push('prettier-formatting');
    }
  }

  return codeStyle;
}

/**
 * Detect test coverage information (simplified)
 */
function detectTestCoverage(projectRoot: string, projectType: ProjectType): TestCoverageInfo {
  const testCoverage: TestCoverageInfo = {
    framework: null,
    hasUnitTests: false,
    hasIntegrationTests: false,
    coveragePercent: null
  };

  // Check for common test directories
  const testDirs = ['test', 'tests', 'src/test', '__tests__'];
  for (const dir of testDirs) {
    if (existsSync(join(projectRoot, dir))) {
      testCoverage.hasUnitTests = true;
      break;
    }
  }

  // Check for integration test markers
  const integrationTestDirs = ['it', 'integration-test', 'integration-tests', 'src/it'];
  for (const dir of integrationTestDirs) {
    if (existsSync(join(projectRoot, dir))) {
      testCoverage.hasIntegrationTests = true;
      break;
    }
  }

  // Determine framework based on project type
  if (isJavaProject(projectType)) {
    if (existsSync(join(projectRoot, 'pom.xml'))) {
      testCoverage.framework = 'junit';
    }
  } else if (isNodeProject(projectType)) {
    if (existsSync(join(projectRoot, 'jest.config.js')) ||
        existsSync(join(projectRoot, 'jest.config.ts'))) {
      testCoverage.framework = 'jest';
    } else if (existsSync(join(projectRoot, 'vitest.config.ts')) ||
               existsSync(join(projectRoot, 'vitest.config.js'))) {
      testCoverage.framework = 'vitest';
    }
  } else if (isPythonProject(projectType)) {
    if (existsSync(join(projectRoot, 'pytest.ini'))) {
      testCoverage.framework = 'pytest';
    } else if (existsSync(join(projectRoot, 'setup.cfg'))) {
      testCoverage.framework = 'unittest';
    }
  }

  return testCoverage;
}

// Re-export types and functions for convenience
export * from './types.js';
export { detectProjectType } from './project-detector.js';
export { parsePomXml, parsePackageJson, parseRequirementsTxt } from './config-parser.js';
export { checkEnvironment } from './env-checker.js';