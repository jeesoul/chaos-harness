// src/core/env-fixer/fix-guide.ts

import { FixGuide, FixStep, EnvironmentIssue, RiskLevel } from './types.js';
import { classifyRisk } from './risk-classifier.js';

const FIX_TEMPLATES: Record<string, { steps: FixStep[]; warnings: string[] }> = {
  'install-jdk': {
    steps: [
      { order: 1, action: '下载JDK', description: '从官网下载JDK安装包' },
      { order: 2, action: '安装JDK', description: '运行安装程序' },
      { order: 3, action: '配置环境变量', command: 'setx JAVA_HOME "C:\\Program Files\\Java\\jdk"', description: '设置JAVA_HOME' }
    ],
    warnings: ['安装后需重启终端生效']
  },
  'private-repo-auth': {
    steps: [
      { order: 1, action: '获取账号', description: '联系管理员获取私服账号' },
      { order: 2, action: '配置settings.xml', description: '在~/.m2/settings.xml中配置server' }
    ],
    warnings: ['不要将密码提交到代码仓库', '建议使用加密的settings.xml']
  },
  'install-node': {
    steps: [
      { order: 1, action: '下载Node.js', description: '从nodejs.org下载' },
      { order: 2, action: '安装', description: '运行安装程序' }
    ],
    warnings: []
  }
};

export function generateFixGuide(issue: EnvironmentIssue): FixGuide {
  // Look up template by first fixAction id, or fall back to issue string
  const actionId = issue.fixActions[0]?.id;
  const template = (actionId && FIX_TEMPLATES[actionId]) || FIX_TEMPLATES[issue.issue] || {
    steps: [{ order: 1, action: '手动处理', description: issue.rootCause }],
    warnings: []
  };

  const riskLevel = issue.fixActions[0]?.riskLevel || classifyRisk(issue.issue);

  return {
    title: `修复: ${issue.tool} - ${issue.issue}`,
    riskLevel,
    steps: template.steps,
    warnings: template.warnings
  };
}

export function generateMarkdownGuide(guide: FixGuide): string {
  const lines: string[] = [
    `## ${guide.title}`,
    '',
    `**风险级别:** ${getRiskLevelLabel(guide.riskLevel)}`,
    '',
    '### 步骤',
    ''
  ];

  for (const step of guide.steps) {
    lines.push(`${step.order}. ${step.action}`);
    lines.push(`   ${step.description}`);
    if (step.command) {
      lines.push(`   \`\`\`bash`);
      lines.push(`   ${step.command}`);
      lines.push(`   \`\`\``);
    }
  }

  if (guide.warnings.length > 0) {
    lines.push('');
    lines.push('### 警告');
    lines.push('');
    for (const warning of guide.warnings) {
      lines.push(`- ⚠️ ${warning}`);
    }
  }

  return lines.join('\n');
}

function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    [RiskLevel.LOW]: '🟢 低风险 - 自动执行',
    [RiskLevel.MEDIUM]: '🟡 中风险 - 需确认',
    [RiskLevel.HIGH]: '🔴 高风险 - 需明确同意',
    [RiskLevel.CANNOT_AUTO]: '⚫ 无法自动处理'
  };
  return labels[level];
}