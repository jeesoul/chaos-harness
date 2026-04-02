// src/core/scanner/report-generator.ts

import {
  ProjectType,
  ArchitectureType,
  type ScanResult,
  type EnvironmentItem
} from './types.js';

/**
 * Project type labels for display
 */
const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.JAVA_SPRING]: 'Java Spring Boot',
  [ProjectType.JAVA_SPRING_LEGACY]: 'Java Spring Boot (Legacy)',
  [ProjectType.JAVA_MAVEN]: 'Java Maven',
  [ProjectType.JAVA_GRADLE]: 'Java Gradle',
  [ProjectType.REACT_VITE]: 'React + Vite',
  [ProjectType.VUE_VITE]: 'Vue + Vite',
  [ProjectType.PYTHON_DJANGO]: 'Python Django',
  [ProjectType.PYTHON_FLASK]: 'Python Flask',
  [ProjectType.NODE_EXPRESS]: 'Node.js Express',
  [ProjectType.GENERIC]: '通用项目',
  [ProjectType.UNKNOWN]: '未知类型'
};

/**
 * Architecture type labels for display
 */
const ARCHITECTURE_LABELS: Record<ArchitectureType, string> = {
  [ArchitectureType.MONOLITH]: '单体应用',
  [ArchitectureType.MICROSERVICE]: '微服务',
  [ArchitectureType.FRONTEND_ONLY]: '纯前端',
  [ArchitectureType.BACKEND_ONLY]: '纯后端',
  [ArchitectureType.FULLSTACK]: '全栈应用',
  [ArchitectureType.UNKNOWN]: '未知'
};

/**
 * Build tool labels for display
 */
const BUILD_TOOL_LABELS: Record<string, string> = {
  maven: 'Maven',
  gradle: 'Gradle',
  npm: 'npm',
  yarn: 'Yarn',
  pnpm: 'pnpm',
  pip: 'pip',
  poetry: 'Poetry'
};

/**
 * Status indicators with emojis
 */
const STATUS_ICONS = {
  satisfied: '✅',
  warning: '⚠️',
  error: '❌'
};

/**
 * Format timestamp to readable date string
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Get status icon and label for environment item
 */
function getEnvStatus(env: EnvironmentItem): { icon: string; label: string; description: string } {
  if (env.installed && env.satisfied) {
    return {
      icon: STATUS_ICONS.satisfied,
      label: '满足',
      description: env.version || '已安装'
    };
  } else if (env.installed && !env.satisfied) {
    return {
      icon: STATUS_ICONS.warning,
      label: '部分满足',
      description: `已安装 ${env.version || '未知版本'}，需要 ${env.required}`
    };
  } else {
    return {
      icon: STATUS_ICONS.error,
      label: '不满足',
      description: env.required ? `需要 ${env.required}` : '未安装'
    };
  }
}

/**
 * Get code style status
 */
function getCodeStyleStatus(codeStyle: ScanResult['codeStyle']): { icon: string; label: string; description: string } {
  if (codeStyle.lintTool) {
    return {
      icon: STATUS_ICONS.satisfied,
      label: '已配置',
      description: `${codeStyle.lintTool}${codeStyle.configPath ? ` (${codeStyle.configPath})` : ''}`
    };
  }
  return {
    icon: STATUS_ICONS.warning,
    label: '未配置',
    description: '未检测到ESLint/Checkstyle'
  };
}

/**
 * Get test coverage status
 */
function getTestCoverageStatus(testCoverage: ScanResult['testCoverage']): { icon: string; label: string; description: string } {
  if (testCoverage.hasUnitTests || testCoverage.hasIntegrationTests) {
    const parts: string[] = [];
    if (testCoverage.framework) {
      parts.push(testCoverage.framework);
    }
    if (testCoverage.coveragePercent !== null) {
      parts.push(`覆盖率: ${testCoverage.coveragePercent}%`);
    } else {
      parts.push('覆盖率: 未知');
    }
    return {
      icon: STATUS_ICONS.satisfied,
      label: '有测试',
      description: parts.join(', ')
    };
  }
  return {
    icon: STATUS_ICONS.error,
    label: '无测试',
    description: '未检测到测试文件'
  };
}

/**
 * Generate dependency source label
 */
function getDependencySourceLabel(sources: ScanResult['dependencySources']): string {
  if (sources.length === 0) {
    return '未检测到';
  }

  const publicSources = sources.filter(s => s.type === 'public');
  const privateSources = sources.filter(s => s.type === 'private');

  if (privateSources.length > 0) {
    return '私有仓库';
  }

  if (publicSources.length > 0) {
    // Map common repository IDs to friendly names
    const sourceNames: Record<string, string> = {
      central: 'Maven Central',
      'npm-registry': 'npm Registry',
      pypi: 'PyPI'
    };
    const name = sourceNames[publicSources[0].id] || publicSources[0].id;
    return name;
  }

  return '未知来源';
}

/**
 * Generate a Markdown scan report
 * @param result The scan result to generate a report from
 * @param version The version of chaos-harness
 * @returns Markdown formatted report string
 */
export function generateScanReport(result: ScanResult, version: string): string {
  const lines: string[] = [];

  // Header
  lines.push('# Chaos Harness 扫描报告');
  lines.push('');
  lines.push(`## 版本: ${version}`);
  lines.push(`## 扫描时间: ${formatTimestamp(result.timestamp)}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Project Overview
  lines.push('## 项目概览');
  lines.push('');
  lines.push('| 属性 | 值 |');
  lines.push('|------|-----|');

  // Project type
  const projectTypeLabel = PROJECT_TYPE_LABELS[result.projectType.type] || '未知类型';
  lines.push(`| 项目类型 | ${projectTypeLabel} |`);

  // Language version
  const languageLabel = result.language
    ? (result.language.isLegacy ? `${result.language.label}` : result.language.label)
    : '未知';
  lines.push(`| 语言版本 | ${languageLabel} |`);

  // Build tool
  const buildToolLabel = result.buildTool
    ? (BUILD_TOOL_LABELS[result.buildTool.name] || result.buildTool.name)
    : '未检测到';
  lines.push(`| 构建工具 | ${buildToolLabel} |`);

  // Architecture
  const architectureLabel = ARCHITECTURE_LABELS[result.architecture] || '未知';
  lines.push(`| 架构模式 | ${architectureLabel} |`);

  // Dependency source
  const depSourceLabel = getDependencySourceLabel(result.dependencySources);
  lines.push(`| 依赖来源 | ${depSourceLabel} |`);

  lines.push('');
  lines.push('---');
  lines.push('');

  // Status Summary
  lines.push('## 状态汇总');
  lines.push('');
  lines.push('| 维度 | 状态 | 说明 |');
  lines.push('|------|------|------|');

  // Local environment status
  const envStatuses = result.localEnv.map(env => getEnvStatus(env));
  if (envStatuses.length > 0) {
    const allSatisfied = envStatuses.every(s => s.icon === STATUS_ICONS.satisfied);
    const anySatisfied = envStatuses.some(s => s.icon === STATUS_ICONS.satisfied);
    const overallIcon = allSatisfied ? STATUS_ICONS.satisfied : (anySatisfied ? STATUS_ICONS.warning : STATUS_ICONS.error);

    // Get first environment item for display
    const firstEnv = result.localEnv[0];
    const firstStatus = getEnvStatus(firstEnv);
    lines.push(`| 本地环境 | ${firstStatus.icon} ${firstStatus.label} | ${firstStatus.description} |`);

    // Add additional environment items if present
    for (let i = 1; i < result.localEnv.length; i++) {
      const status = getEnvStatus(result.localEnv[i]);
      lines.push(`| (${result.localEnv[i].tool}) | ${status.icon} ${status.label} | ${status.description} |`);
    }
  } else {
    lines.push(`| 本地环境 | ${STATUS_ICONS.warning} 未检查 | 跳过环境检测 |`);
  }

  // Code style status
  const codeStyleStatus = getCodeStyleStatus(result.codeStyle);
  lines.push(`| 代码规范 | ${codeStyleStatus.icon} ${codeStyleStatus.label} | ${codeStyleStatus.description} |`);

  // Test coverage status
  const testStatus = getTestCoverageStatus(result.testCoverage);
  lines.push(`| 测试覆盖 | ${testStatus.icon} ${testStatus.label} | ${testStatus.description} |`);

  lines.push('');
  lines.push('---');
  lines.push('');

  // Warnings section (only if there are warnings)
  if (result.warnings.length > 0) {
    lines.push('## 警告');
    lines.push('');
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Next steps
  lines.push('## 下一步');
  lines.push('');
  lines.push('1. 确认扫描结果无误');
  lines.push(`2. 运行 \`chaos-harness harness --version ${version}\` 生成项目专属Harness`);
  lines.push('');

  return lines.join('\n');
}