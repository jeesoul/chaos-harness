// tests/core/env-fixer/index.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkAndSuggestFix,
  generateEnvironmentMarkdown,
  classifyRisk,
  analyzeJdkLegacy,
  generateFixGuide
} from '../../../src/core/env-fixer/index.js';
import { RiskLevel, EnvironmentReport, EnvironmentIssue } from '../../../src/core/env-fixer/types.js';
import * as envChecker from '../../../src/core/scanner/env-checker.js';

// Mock the env-checker module
vi.mock('../../../src/core/scanner/env-checker.js', () => ({
  checkEnvironment: vi.fn()
}));

describe('env-fixer index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('checkAndSuggestFix', () => {
    it('should return passed report when all tools are satisfied', async () => {
      vi.mocked(envChecker.checkEnvironment).mockResolvedValue([
        { tool: 'node', installed: true, version: '18.0.0', required: '16.0.0', satisfied: true }
      ]);

      const report = await checkAndSuggestFix({ node: '16.0.0' });

      expect(report.checks).toHaveLength(1);
      expect(report.checks[0].satisfied).toBe(true);
      expect(report.issues).toHaveLength(0);
      expect(report.summary.passed).toBe(1);
      expect(report.summary.failed).toBe(0);
    });

    it('should detect not installed tools', async () => {
      vi.mocked(envChecker.checkEnvironment).mockResolvedValue([
        { tool: 'java', installed: false, version: null, required: '17', satisfied: false }
      ]);

      const report = await checkAndSuggestFix({ java: '17' });

      expect(report.checks).toHaveLength(1);
      expect(report.checks[0].installed).toBe(false);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].issue).toBe('not_installed');
      expect(report.summary.failed).toBe(1);
    });

    it('should detect version mismatch', async () => {
      vi.mocked(envChecker.checkEnvironment).mockResolvedValue([
        { tool: 'node', installed: true, version: '14.0.0', required: '18.0.0', satisfied: false }
      ]);

      const report = await checkAndSuggestFix({ node: '18.0.0' });

      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].issue).toBe('version_mismatch');
      expect(report.summary.warnings).toBe(1);
    });

    it('should detect JDK legacy version', async () => {
      vi.mocked(envChecker.checkEnvironment).mockResolvedValue([
        { tool: 'java', installed: true, version: '1.8.0', required: '1.8', satisfied: true }
      ]);

      const report = await checkAndSuggestFix({ java: '1.8' });

      // Should have JDK legacy issue
      const jdkIssue = report.issues.find(i => i.issue === 'legacy_version');
      expect(jdkIssue).toBeDefined();
    });

    it('should generate fix guides for issues', async () => {
      vi.mocked(envChecker.checkEnvironment).mockResolvedValue([
        { tool: 'python', installed: false, version: null, required: '3.10', satisfied: false }
      ]);

      const report = await checkAndSuggestFix({ python: '3.10' });

      expect(report.fixGuides).toHaveLength(1);
      expect(report.fixGuides[0].title).toContain('python');
    });

    it('should include timestamp in report', async () => {
      vi.mocked(envChecker.checkEnvironment).mockResolvedValue([]);

      const report = await checkAndSuggestFix({});

      expect(report.timestamp).toBeDefined();
      expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
    });
  });

  describe('generateEnvironmentMarkdown', () => {
    it('should generate markdown report', () => {
      const report: EnvironmentReport = {
        timestamp: '2024-01-01T00:00:00.000Z',
        checks: [
          { tool: 'node', installed: true, version: '18.0.0', required: '16.0.0', satisfied: true, issues: [] },
          { tool: 'java', installed: false, version: null, required: '17', satisfied: false, issues: [] }
        ],
        issues: [],
        fixGuides: [],
        summary: { total: 2, passed: 1, failed: 1, warnings: 0 }
      };

      const md = generateEnvironmentMarkdown(report);

      expect(md).toContain('# Chaos Harness 环境检测报告');
      expect(md).toContain('检测时间');
      expect(md).toContain('node');
      expect(md).toContain('java');
      expect(md).toContain('总计: 2');
      expect(md).toContain('通过: 1');
      expect(md).toContain('失败: 1');
    });

    it('should show status icons correctly', () => {
      const report: EnvironmentReport = {
        timestamp: '2024-01-01T00:00:00.000Z',
        checks: [
          { tool: 'node', installed: true, version: '18.0.0', required: '16.0.0', satisfied: true, issues: [] },
          { tool: 'java', installed: true, version: '11', required: '17', satisfied: false, issues: [] },
          { tool: 'python', installed: false, version: null, required: '3.10', satisfied: false, issues: [] }
        ],
        issues: [],
        fixGuides: [],
        summary: { total: 3, passed: 1, failed: 1, warnings: 1 }
      };

      const md = generateEnvironmentMarkdown(report);

      expect(md).toContain('✅'); // passed
      expect(md).toContain('⚠️'); // warning
      expect(md).toContain('❌'); // failed
    });

    it('should include fix guides in report', () => {
      const issue: EnvironmentIssue = {
        tool: 'JDK',
        issue: 'not_installed',
        rootCause: 'JDK未安装',
        fixActions: [{ id: 'install-jdk', description: '安装JDK', riskLevel: RiskLevel.MEDIUM }]
      };
      const report: EnvironmentReport = {
        timestamp: '2024-01-01T00:00:00.000Z',
        checks: [
          { tool: 'java', installed: false, version: null, required: '17', satisfied: false, issues: [issue] }
        ],
        issues: [issue],
        fixGuides: [generateFixGuide(issue)],
        summary: { total: 1, passed: 0, failed: 1, warnings: 0 }
      };

      const md = generateEnvironmentMarkdown(report);

      expect(md).toContain('## 待处理问题');
    });
  });

  describe('exports', () => {
    it('should export classifyRisk', () => {
      expect(typeof classifyRisk).toBe('function');
      expect(classifyRisk('npm install')).toBe(RiskLevel.LOW);
    });

    it('should export analyzeJdkLegacy', () => {
      expect(typeof analyzeJdkLegacy).toBe('function');
      const info = analyzeJdkLegacy('1.8');
      expect(info.isLegacy).toBe(true);
    });

    it('should export generateFixGuide', () => {
      expect(typeof generateFixGuide).toBe('function');
    });
  });
});