// src/core/env-fixer/index.ts

import {
  EnvironmentReport,
  EnvironmentCheckResult,
  EnvironmentIssue,
  CheckOptions,
  FixGuide
} from './types.js';
import { checkEnvironment, EnvCheckResult } from '../scanner/env-checker.js';
import { classifyRisk } from './risk-classifier.js';
import { analyzeJdkLegacy } from './jdk-legacy.js';
import { generateFixGuide, generateMarkdownGuide } from './fix-guide.js';

/**
 * Check environment and suggest fixes
 * @param requirements Tool version requirements
 * @param options Check options
 * @returns Environment report with checks, issues, and fix guides
 */
export async function checkAndSuggestFix(
  requirements: Record<string, string>,
  options?: CheckOptions
): Promise<EnvironmentReport> {
  const checks: EnvironmentCheckResult[] = [];
  const issues: EnvironmentIssue[] = [];

  // Check environment
  const envResults = await checkEnvironment(requirements);

  for (const result of envResults) {
    const check: EnvironmentCheckResult = {
      tool: result.tool,
      installed: result.installed,
      version: result.version,
      required: result.required,
      satisfied: result.satisfied ?? false,
      issues: []
    };

    // Generate issues
    if (!result.installed) {
      const issue: EnvironmentIssue = {
        tool: result.tool,
        issue: 'not_installed',
        rootCause: `${result.tool}未安装`,
        fixActions: [{
          id: `install-${result.tool.toLowerCase()}`,
          description: `安装${result.tool}`,
          riskLevel: classifyRisk(`install-${result.tool.toLowerCase()}`)
        }]
      };
      check.issues.push(issue);
      issues.push(issue);
    } else if (result.satisfied === false) {
      const issue: EnvironmentIssue = {
        tool: result.tool,
        issue: 'version_mismatch',
        rootCause: `版本不满足: 需要${result.required}, 当前${result.version}`,
        fixActions: [{
          id: `upgrade-${result.tool.toLowerCase()}`,
          description: `升级${result.tool}到${result.required}`,
          riskLevel: classifyRisk(`upgrade-${result.tool.toLowerCase()}`)
        }]
      };
      check.issues.push(issue);
      issues.push(issue);
    }

    checks.push(check);
  }

  // JDK Legacy detection
  if (requirements.java) {
    const jdkInfo = analyzeJdkLegacy(requirements.java);
    if (jdkInfo.isLegacy) {
      const issue: EnvironmentIssue = {
        tool: 'JDK',
        issue: 'legacy_version',
        rootCause: '使用JDK 8 Legacy版本',
        fixActions: [{
          id: 'jdk-legacy-compat',
          description: '查看兼容性建议',
          riskLevel: classifyRisk('info')
        }]
      };
      issues.push(issue);
    }
  }

  // Generate fix guides
  const fixGuides = issues.map(i => generateFixGuide(i));

  return {
    timestamp: new Date().toISOString(),
    checks,
    issues,
    fixGuides,
    summary: {
      total: checks.length,
      passed: checks.filter(c => c.satisfied).length,
      failed: checks.filter(c => !c.satisfied && !c.installed).length,
      warnings: checks.filter(c => !c.satisfied && c.installed).length
    }
  };
}

/**
 * Generate environment report in markdown format
 * @param report Environment report
 * @returns Markdown formatted report
 */
export function generateEnvironmentMarkdown(report: EnvironmentReport): string {
  const lines: string[] = [
    '# Chaos Harness 环境检测报告',
    '',
    `## 检测时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}`,
    '',
    '## 状态汇总',
    '',
    `| 检测项 | 已安装 | 版本 | 要求 | 状态 |`,
    `|--------|--------|------|------|------|`,
  ];

  for (const check of report.checks) {
    const status = check.satisfied ? '✅' : (check.installed ? '⚠️' : '❌');
    lines.push(`| ${check.tool} | ${check.installed ? '是' : '否'} | ${check.version || '-'} | ${check.required || '-'} | ${status} |`);
  }

  if (report.issues.length > 0) {
    lines.push('');
    lines.push('## 待处理问题');
    lines.push('');
    for (const guide of report.fixGuides) {
      lines.push(generateMarkdownGuide(guide));
      lines.push('');
    }
  }

  lines.push('');
  lines.push('## 统计');
  lines.push('');
  lines.push(`- 总计: ${report.summary.total}`);
  lines.push(`- 通过: ${report.summary.passed}`);
  lines.push(`- 失败: ${report.summary.failed}`);
  lines.push(`- 警告: ${report.summary.warnings}`);

  return lines.join('\n');
}

// Re-export types
export * from './types.js';

// Re-export functions
export { classifyRisk, shouldAutoExecute, needsUserConfirmation } from './risk-classifier.js';
export { checkPrivateRepo, checkMultiplePrivateRepos } from './private-repo.js';
export { analyzeJdkLegacy, getKnownIssues, getCompatibleVersions } from './jdk-legacy.js';
export { generateFixGuide, generateMarkdownGuide } from './fix-guide.js';