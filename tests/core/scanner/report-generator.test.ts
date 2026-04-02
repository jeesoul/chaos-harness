// tests/core/scanner/report-generator.test.ts

import { describe, it, expect } from 'vitest';
import { generateScanReport } from '../../../src/core/scanner/report-generator.js';
import { ProjectType, ArchitectureType, DependencySourceType, type ScanResult } from '../../../src/core/scanner/types.js';

describe('generateScanReport', () => {
  // Helper to create a minimal valid ScanResult
  function createMockScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
    return {
      timestamp: '2026-04-02T10:30:00.000Z',
      projectRoot: '/test/project',
      projectType: {
        type: ProjectType.JAVA_SPRING_LEGACY,
        confidence: 0.95,
        features: ['maven', 'spring']
      },
      language: {
        name: 'java',
        version: '1.8',
        isLegacy: true,
        label: 'Java 8 (Legacy)'
      },
      buildTool: {
        name: 'maven',
        version: '3.6.3',
        detectedFrom: 'pom.xml'
      },
      architecture: ArchitectureType.MONOLITH,
      dependencySources: [
        {
          id: 'central',
          type: DependencySourceType.PUBLIC,
          url: 'https://repo.maven.apache.org/maven2',
          authRequired: false,
          reachable: true
        }
      ],
      localEnv: [
        {
          tool: 'java',
          installed: true,
          version: '1.8.0_391',
          required: '1.8',
          satisfied: true
        }
      ],
      codeStyle: {
        lintTool: null,
        configPath: null,
        inferredRules: [],
        namingConvention: {
          className: null,
          methodName: null,
          constantName: null
        }
      },
      testCoverage: {
        framework: 'junit',
        hasUnitTests: true,
        hasIntegrationTests: false,
        coveragePercent: null
      },
      warnings: [],
      ...overrides
    };
  }

  describe('Markdown format', () => {
    it('should generate valid markdown', () => {
      const result = createMockScanResult();
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('# Chaos Harness 扫描报告');
      expect(report).toContain('## 版本: v0.1');
    });

    it('should include formatted scan timestamp', () => {
      const result = createMockScanResult({
        timestamp: '2026-04-02T14:30:00.000Z'
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('## 扫描时间:');
      // Should contain formatted date (YYYY-MM-DD HH:MM)
      expect(report).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });
  });

  describe('Project type labels', () => {
    it('should show correct label for JAVA_SPRING_LEGACY', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.JAVA_SPRING_LEGACY, confidence: 0.95, features: ['maven'] }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Java Spring Boot (Legacy)');
    });

    it('should show correct label for JAVA_SPRING', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.JAVA_SPRING, confidence: 0.95, features: ['maven'] },
        language: { name: 'java', version: '17', isLegacy: false, label: 'Java 17' }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Java Spring Boot');
    });

    it('should show correct label for REACT_VITE', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.REACT_VITE, confidence: 0.95, features: ['vite'] },
        language: { name: 'node', version: '18', isLegacy: false, label: 'Node.js 18' },
        buildTool: { name: 'npm', version: null, detectedFrom: 'package.json' },
        testCoverage: { framework: 'vitest', hasUnitTests: true, hasIntegrationTests: false, coveragePercent: null }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('React + Vite');
    });

    it('should show correct label for VUE_VITE', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.VUE_VITE, confidence: 0.95, features: ['vite'] },
        language: { name: 'node', version: '18', isLegacy: false, label: 'Node.js 18' },
        buildTool: { name: 'npm', version: null, detectedFrom: 'package.json' },
        testCoverage: { framework: 'vitest', hasUnitTests: true, hasIntegrationTests: false, coveragePercent: null }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Vue + Vite');
    });

    it('should show correct label for PYTHON_DJANGO', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.PYTHON_DJANGO, confidence: 0.95, features: ['django'] },
        language: { name: 'python', version: '3.11', isLegacy: false, label: 'Python 3.11' },
        buildTool: { name: 'pip', version: null, detectedFrom: 'requirements.txt' },
        testCoverage: { framework: 'pytest', hasUnitTests: true, hasIntegrationTests: false, coveragePercent: null }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Python Django');
    });

    it('should show correct label for PYTHON_FLASK', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.PYTHON_FLASK, confidence: 0.95, features: ['flask'] },
        language: { name: 'python', version: '3.11', isLegacy: false, label: 'Python 3.11' },
        buildTool: { name: 'pip', version: null, detectedFrom: 'requirements.txt' },
        testCoverage: { framework: 'pytest', hasUnitTests: true, hasIntegrationTests: false, coveragePercent: null }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Python Flask');
    });

    it('should show correct label for NODE_EXPRESS', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.NODE_EXPRESS, confidence: 0.95, features: ['express'] },
        language: { name: 'node', version: '18', isLegacy: false, label: 'Node.js 18' },
        buildTool: { name: 'npm', version: null, detectedFrom: 'package.json' },
        testCoverage: { framework: 'jest', hasUnitTests: true, hasIntegrationTests: false, coveragePercent: null }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Node.js Express');
    });

    it('should show correct label for GENERIC', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.GENERIC, confidence: 0.5, features: [] },
        language: null,
        buildTool: null,
        testCoverage: { framework: null, hasUnitTests: false, hasIntegrationTests: false, coveragePercent: null }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('通用项目');
    });

    it('should show correct label for UNKNOWN', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.UNKNOWN, confidence: 0, features: [] },
        language: null,
        buildTool: null,
        testCoverage: { framework: null, hasUnitTests: false, hasIntegrationTests: false, coveragePercent: null }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('未知类型');
    });
  });

  describe('Language version with legacy marker', () => {
    it('should show legacy marker for legacy Java', () => {
      const result = createMockScanResult({
        language: { name: 'java', version: '1.8', isLegacy: true, label: 'Java 8 (Legacy)' }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Java 8 (Legacy)');
    });

    it('should not show legacy marker for modern Java', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.JAVA_SPRING, confidence: 0.95, features: ['maven'] },
        language: { name: 'java', version: '17', isLegacy: false, label: 'Java 17' }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Java 17');
      expect(report).not.toContain('Legacy');
    });
  });

  describe('Status emoji display', () => {
    it('should show green checkmark for satisfied environment', () => {
      const result = createMockScanResult({
        localEnv: [{
          tool: 'java',
          installed: true,
          version: '1.8.0_391',
          required: '1.8',
          satisfied: true
        }]
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('✅');
      expect(report).toContain('满足');
    });

    it('should show red X for unsatisfied environment', () => {
      const result = createMockScanResult({
        localEnv: [{
          tool: 'java',
          installed: false,
          version: null,
          required: '1.8',
          satisfied: false
        }]
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('❌');
      expect(report).toContain('不满足');
    });

    it('should show warning emoji for missing lint tool', () => {
      const result = createMockScanResult({
        codeStyle: {
          lintTool: null,
          configPath: null,
          inferredRules: [],
          namingConvention: { className: null, methodName: null, constantName: null }
        }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('⚠️');
      expect(report).toContain('未配置');
    });

    it('should show green checkmark for configured lint tool', () => {
      const result = createMockScanResult({
        codeStyle: {
          lintTool: 'eslint',
          configPath: '.eslintrc.json',
          inferredRules: [],
          namingConvention: { className: null, methodName: null, constantName: null }
        }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('✅');
      expect(report).toContain('已配置');
    });

    it('should show green checkmark for existing tests', () => {
      const result = createMockScanResult({
        testCoverage: {
          framework: 'junit',
          hasUnitTests: true,
          hasIntegrationTests: false,
          coveragePercent: 75
        }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('✅');
      expect(report).toContain('有测试');
    });

    it('should show red X for missing tests', () => {
      const result = createMockScanResult({
        testCoverage: {
          framework: null,
          hasUnitTests: false,
          hasIntegrationTests: false,
          coveragePercent: null
        }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('❌');
      expect(report).toContain('无测试');
    });

    it('should show coverage percentage when available', () => {
      const result = createMockScanResult({
        testCoverage: {
          framework: 'junit',
          hasUnitTests: true,
          hasIntegrationTests: false,
          coveragePercent: 85.5
        }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('85.5%');
    });

    it('should show unknown coverage when not available', () => {
      const result = createMockScanResult({
        testCoverage: {
          framework: 'junit',
          hasUnitTests: true,
          hasIntegrationTests: false,
          coveragePercent: null
        }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('未知');
    });
  });

  describe('Warnings section', () => {
    it('should show warnings section when warnings present', () => {
      const result = createMockScanResult({
        warnings: ['Missing required tool: git', 'Configuration file not found']
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('## 警告');
      expect(report).toContain('- Missing required tool: git');
      expect(report).toContain('- Configuration file not found');
    });

    it('should not show warnings section when no warnings', () => {
      const result = createMockScanResult({
        warnings: []
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).not.toContain('## 警告');
    });
  });

  describe('Project overview table', () => {
    it('should include all overview fields', () => {
      const result = createMockScanResult();
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('## 项目概览');
      expect(report).toContain('项目类型');
      expect(report).toContain('语言版本');
      expect(report).toContain('构建工具');
      expect(report).toContain('架构模式');
      expect(report).toContain('依赖来源');
    });

    it('should show Maven as build tool', () => {
      const result = createMockScanResult({
        buildTool: { name: 'maven', version: '3.6.3', detectedFrom: 'pom.xml' }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('Maven');
    });

    it('should show npm as build tool', () => {
      const result = createMockScanResult({
        projectType: { type: ProjectType.REACT_VITE, confidence: 0.95, features: ['vite'] },
        language: { name: 'node', version: '18', isLegacy: false, label: 'Node.js 18' },
        buildTool: { name: 'npm', version: null, detectedFrom: 'package.json' },
        testCoverage: { framework: 'vitest', hasUnitTests: true, hasIntegrationTests: false, coveragePercent: null }
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('npm');
    });

    it('should show monolith architecture', () => {
      const result = createMockScanResult({
        architecture: ArchitectureType.MONOLITH
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('单体应用');
    });

    it('should show microservice architecture', () => {
      const result = createMockScanResult({
        architecture: ArchitectureType.MICROSERVICE
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('微服务');
    });
  });

  describe('Next steps section', () => {
    it('should include next steps section', () => {
      const result = createMockScanResult();
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('## 下一步');
      expect(report).toContain('确认扫描结果无误');
      expect(report).toContain('chaos-harness harness --version v0.1');
    });
  });

  describe('Null handling', () => {
    it('should handle null language gracefully', () => {
      const result = createMockScanResult({
        language: null
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('未知');
    });

    it('should handle null buildTool gracefully', () => {
      const result = createMockScanResult({
        buildTool: null
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('未检测到');
    });

    it('should handle empty localEnv array', () => {
      const result = createMockScanResult({
        localEnv: []
      });
      const report = generateScanReport(result, 'v0.1');

      expect(report).toContain('本地环境');
    });
  });
});