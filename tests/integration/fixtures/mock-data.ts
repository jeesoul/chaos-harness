/**
 * Integration Test Fixtures
 *
 * M7: 测试数据和Mock对象
 */

import { ProjectType, ArchitectureType, DependencySourceType } from '../../../src/core/scanner/types.js';
import type { ScanResult } from '../../../src/core/scanner/types.js';
import type { HarnessConfig } from '../../../src/core/harness-generator/types.js';

/**
 * Mock Java Spring扫描结果
 */
export const mockJavaSpringScanResult: ScanResult = {
  timestamp: new Date().toISOString(),
  projectRoot: '/test/java-project',
  projectType: {
    type: ProjectType.JAVA_SPRING,
    confidence: 0.95,
    features: ['spring-boot', 'spring-web', 'spring-data-jpa']
  },
  language: {
    name: 'Java',
    version: '17',
    isLegacy: false,
    label: 'Java 17'
  },
  buildTool: {
    name: 'Maven',
    version: '3.9.0',
    detectedFrom: 'pom.xml'
  },
  architecture: ArchitectureType.MONOLITH,
  dependencySources: [
    {
      id: 'maven-central',
      type: DependencySourceType.PUBLIC,
      url: 'https://repo.maven.apache.org/maven2',
      authRequired: false,
      reachable: true
    }
  ],
  localEnv: [
    { tool: 'java', installed: true, version: '17.0.2', required: '17', satisfied: true },
    { tool: 'maven', installed: true, version: '3.9.0', required: '3.6', satisfied: true }
  ],
  codeStyle: {
    lintTool: 'checkstyle',
    configPath: 'checkstyle.xml',
    inferredRules: ['indentation: 2 spaces', 'max_line_length: 120'],
    namingConvention: {
      className: 'PascalCase',
      methodName: 'camelCase',
      constantName: 'UPPER_SNAKE_CASE'
    }
  },
  testCoverage: {
    framework: 'JUnit 5',
    hasUnitTests: true,
    hasIntegrationTests: true,
    coveragePercent: 75
  },
  warnings: []
};

/**
 * Mock Node Express扫描结果
 */
export const mockNodeExpressScanResult: ScanResult = {
  timestamp: new Date().toISOString(),
  projectRoot: '/test/node-project',
  projectType: {
    type: ProjectType.NODE_EXPRESS,
    confidence: 0.90,
    features: ['express', 'typescript', 'jest']
  },
  language: {
    name: 'TypeScript',
    version: '5.0',
    isLegacy: false,
    label: 'TypeScript 5.0'
  },
  buildTool: {
    name: 'npm',
    version: '10.0.0',
    detectedFrom: 'package.json'
  },
  architecture: ArchitectureType.BACKEND_ONLY,
  dependencySources: [
    {
      id: 'npm-registry',
      type: DependencySourceType.PUBLIC,
      url: 'https://registry.npmjs.org',
      authRequired: false,
      reachable: true
    }
  ],
  localEnv: [
    { tool: 'node', installed: true, version: '18.0.0', required: '18', satisfied: true },
    { tool: 'npm', installed: true, version: '10.0.0', required: '8', satisfied: true }
  ],
  codeStyle: {
    lintTool: 'eslint',
    configPath: '.eslintrc.json',
    inferredRules: ['semi: always', 'quotes: single'],
    namingConvention: {
      className: 'PascalCase',
      methodName: 'camelCase',
      constantName: 'UPPER_SNAKE_CASE'
    }
  },
  testCoverage: {
    framework: 'Jest',
    hasUnitTests: true,
    hasIntegrationTests: false,
    coveragePercent: 80
  },
  warnings: []
};

/**
 * Mock Java Legacy扫描结果 (JDK 8)
 */
export const mockJavaLegacyScanResult: ScanResult = {
  timestamp: new Date().toISOString(),
  projectRoot: '/test/legacy-java-project',
  projectType: {
    type: ProjectType.JAVA_SPRING_LEGACY,
    confidence: 0.92,
    features: ['spring-boot', 'spring-web']
  },
  language: {
    name: 'Java',
    version: '1.8',
    isLegacy: true,
    label: 'JDK 8 Legacy'
  },
  buildTool: {
    name: 'Maven',
    version: '3.6.0',
    detectedFrom: 'pom.xml'
  },
  architecture: ArchitectureType.MONOLITH,
  dependencySources: [
    {
      id: 'maven-central',
      type: DependencySourceType.PUBLIC,
      url: 'https://repo.maven.apache.org/maven2',
      authRequired: false,
      reachable: true
    },
    {
      id: 'private-repo',
      type: DependencySourceType.PRIVATE,
      url: 'https://nexus.company.com/maven2',
      authRequired: true,
      reachable: null
    }
  ],
  localEnv: [
    { tool: 'java', installed: true, version: '1.8.0_301', required: '1.8', satisfied: true },
    { tool: 'maven', installed: true, version: '3.6.0', required: '3.3', satisfied: true }
  ],
  codeStyle: {
    lintTool: null,
    configPath: null,
    inferredRules: [],
    namingConvention: {
      className: 'PascalCase',
      methodName: 'camelCase',
      constantName: 'UPPER_SNAKE_CASE'
    }
  },
  testCoverage: {
    framework: 'JUnit 4',
    hasUnitTests: true,
    hasIntegrationTests: false,
    coveragePercent: 60
  },
  warnings: ['JDK 8 detected - consider upgrading']
};

/**
 * Mock Harness配置
 */
export const mockHarnessConfig: Partial<HarnessConfig> = {
  identity: {
    name: 'test-project',
    version: 'v0.1',
    createdAt: new Date().toISOString(),
    createdBy: 'scanner',
    suitableFor: ['java-spring'],
    confidenceThreshold: 0.8
  },
  ironLaws: [
    {
      id: 'IL001',
      rule: 'NO WORKFLOW STEP SKIP WITHOUT EXPLICIT USER CONSENT',
      enforcement: 'block',
      violationAction: 'Block and log'
    }
  ],
  antiBypass: [
    {
      id: 'AB001',
      excuse: 'simple fix',
      rebuttal: 'Simple fixes still need verification'
    }
  ],
  selfCheck: {
    activationConditions: [],
    warningConditions: [],
    changeMonitor: {
      watchedFiles: [],
      threshold: 0.5
    },
    redFlags: [
      {
        thought: 'This is just a simple question',
        reality: 'Questions are tasks'
      }
    ]
  },
  recommendations: [],
  dynamicRules: {
    privateRepos: [],
    buildCommands: [],
    testCommands: [],
    codeStyleRules: []
  },
  effectivenessLog: ''
};

/**
 * 测试项目文件内容
 */
export const sampleJavaPomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>test-project</artifactId>
  <version>1.0.0</version>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>
  <properties>
    <java.version>17</java.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
  </dependencies>
</project>`;

export const samplePackageJson = `{
  "name": "test-node-project",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "start": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/express": "^4.17.0"
  }
}`;

/**
 * 创建临时测试目录
 */
export function createTestProjectFiles(baseDir: string): void {
  // This is a placeholder - in real tests, use fs operations
  console.log(`Would create test files in ${baseDir}`);
}