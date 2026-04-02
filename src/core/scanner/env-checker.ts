// src/core/scanner/env-checker.ts

import { execa } from 'execa';

/**
 * 环境检查结果
 */
export interface EnvCheckResult {
  tool: string;
  installed: boolean;
  version: string | null;
  required: string | null;
  satisfied: boolean | null;
}

/**
 * 工具配置
 */
interface ToolConfig {
  command: string;
  args: string[];
  versionParser: (output: string) => string | null;
}

/**
 * 工具配置映射
 */
const TOOL_CONFIGS: Record<string, ToolConfig> = {
  java: {
    command: 'java',
    args: ['-version'],
    versionParser: parseJavaVersion
  },
  node: {
    command: 'node',
    args: ['--version'],
    versionParser: parseNodeVersion
  },
  python: {
    command: 'python',
    args: ['--version'],
    versionParser: parsePythonVersion
  },
  maven: {
    command: 'mvn',
    args: ['-v'],
    versionParser: parseMavenVersion
  },
  git: {
    command: 'git',
    args: ['--version'],
    versionParser: parseGitVersion
  }
};

/**
 * 检查环境工具
 * @param requirements 工具版本要求映射
 * @returns 环境检查结果数组
 */
export async function checkEnvironment(
  requirements: Record<string, string>
): Promise<EnvCheckResult[]> {
  const results: EnvCheckResult[] = [];

  for (const [tool, requiredVersion] of Object.entries(requirements)) {
    const result = await checkTool(tool, requiredVersion);
    results.push(result);
  }

  return results;
}

/**
 * 检查单个工具
 */
async function checkTool(tool: string, requiredVersion: string): Promise<EnvCheckResult> {
  const config = TOOL_CONFIGS[tool];

  if (!config) {
    // Unknown tool - try to run it anyway
    return {
      tool,
      installed: false,
      version: null,
      required: requiredVersion,
      satisfied: false
    };
  }

  try {
    const { stdout, stderr } = await execa(config.command, config.args, {
      shell: true,
      timeout: 5000,
      reject: false
    });

    // Some tools output version to stderr (like java -version)
    const output = stdout || stderr;
    const version = config.versionParser(output);
    const installed = version !== null;

    let satisfied: boolean | null = null;
    if (installed && requiredVersion) {
      satisfied = compareVersions(version!, requiredVersion);
    } else if (!installed) {
      satisfied = false;
    }

    return {
      tool,
      installed,
      version,
      required: requiredVersion,
      satisfied
    };
  } catch {
    return {
      tool,
      installed: false,
      version: null,
      required: requiredVersion,
      satisfied: false
    };
  }
}

/**
 * 解析 Java 版本号
 * 支持格式:
 * - java version "1.8.0_391"
 * - openjdk version "17.0.1"
 * - openjdk version "8.0.392"
 */
export function parseJavaVersion(output: string): string | null {
  // Match version patterns like "1.8.0_391", "17.0.1", "8.0.392", "21.0.2"
  const versionMatch = output.match(/version\s+"([^"]+)"/);
  if (!versionMatch) {
    return null;
  }

  const rawVersion = versionMatch[1];

  // Handle 1.x format (Java 8 and below use 1.8.x format)
  // e.g., "1.8.0_391" -> "1.8.0"
  if (rawVersion.startsWith('1.')) {
    // Extract major.minor.patch, ignoring build info like _391
    const match = rawVersion.match(/^1\.(\d+)\.(\d+)/);
    if (match) {
      return `1.${match[1]}.${match[2]}`;
    }
  }

  // Handle modern format (Java 9+)
  // e.g., "17.0.1", "8.0.392", "21.0.2"
  const modernMatch = rawVersion.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (modernMatch) {
    const major = modernMatch[1];
    const minor = modernMatch[2] || '0';
    const patch = modernMatch[3] || '0';
    return `${major}.${minor}.${patch}`;
  }

  return null;
}

/**
 * 解析 Node.js 版本号
 * 支持格式: v18.19.0 -> 18.19.0
 */
export function parseNodeVersion(output: string): string | null {
  // Match version with v prefix
  const versionMatch = output.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (versionMatch) {
    return `${versionMatch[1]}.${versionMatch[2]}.${versionMatch[3]}`;
  }

  // Try just major.minor format
  const shortMatch = output.match(/v?(\d+)\.(\d+)/);
  if (shortMatch) {
    return `${shortMatch[1]}.${shortMatch[2]}.0`;
  }

  return null;
}

/**
 * 解析 Python 版本号
 * 支持格式: Python 3.11.0 -> 3.11.0
 */
export function parsePythonVersion(output: string): string | null {
  // Match Python version pattern
  const versionMatch = output.match(/Python\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (versionMatch) {
    const major = versionMatch[1];
    const minor = versionMatch[2];
    const patch = versionMatch[3] || '0';
    return `${major}.${minor}.${patch}`;
  }

  return null;
}

/**
 * 解析 Maven 版本号
 * 支持格式: Apache Maven 3.8.6 -> 3.8.6
 */
function parseMavenVersion(output: string): string | null {
  const versionMatch = output.match(/Apache Maven\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (versionMatch) {
    const major = versionMatch[1];
    const minor = versionMatch[2];
    const patch = versionMatch[3] || '0';
    return `${major}.${minor}.${patch}`;
  }

  return null;
}

/**
 * 解析 Git 版本号
 * 支持格式: git version 2.39.0 -> 2.39.0
 */
function parseGitVersion(output: string): string | null {
  const versionMatch = output.match(/git version\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (versionMatch) {
    const major = versionMatch[1];
    const minor = versionMatch[2];
    const patch = versionMatch[3] || '0';
    return `${major}.${minor}.${patch}`;
  }

  return null;
}

/**
 * 比较版本号
 * @param installed 已安装版本
 * @param required 要求版本
 * @returns 安装版本是否满足要求 (installed >= required)
 */
export function compareVersions(installed: string, required: string): boolean {
  // Normalize versions for comparison
  const normalizedInstalled = normalizeVersion(installed);
  const normalizedRequired = normalizeVersion(required);

  // Handle Java 1.8 = Java 8 equivalence
  const installedParts = normalizedInstalled.split('.');
  const requiredParts = normalizedRequired.split('.');

  // Java 1.8.x = Java 8.x equivalence
  if (installedParts[0] === '1' && installedParts[1] === '8' && requiredParts[0] === '8') {
    return true;
  }
  if (installedParts[0] === '8' && requiredParts[0] === '1' && requiredParts[1] === '8') {
    return true;
  }

  // Compare each part
  const maxLen = Math.max(installedParts.length, requiredParts.length);

  for (let i = 0; i < maxLen; i++) {
    const installedPart = parseInt(installedParts[i] || '0', 10);
    const requiredPart = parseInt(requiredParts[i] || '0', 10);

    if (installedPart > requiredPart) {
      return true;
    }
    if (installedPart < requiredPart) {
      return false;
    }
  }

  return true; // Equal versions
}

/**
 * 规范化版本号字符串
 */
function normalizeVersion(version: string): string {
  // Remove build metadata like _391
  let normalized = version.split('_')[0];
  // Remove leading/trailing dots
  normalized = normalized.replace(/^\.+|\.+$/g, '');
  return normalized;
}