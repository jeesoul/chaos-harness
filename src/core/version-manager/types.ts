// src/core/version-manager/types.ts

/**
 * 版本号格式
 */
export interface VersionNumber {
  major: number;
  minor: number;
  full: string;  // "v0.1"
}

/**
 * 版本目录信息
 */
export interface VersionDirectory {
  path: string;
  version: VersionNumber;
  createdAt: Date | null;
  isLocked: boolean;
}

/**
 * 版本锁定状态
 */
export interface VersionLock {
  currentVersion: VersionNumber | null;
  lockedAt: Date | null;
  session: string | null;
}

/**
 * 版本选择结果
 */
export interface VersionSelection {
  version: VersionNumber;
  isNew: boolean;
  path: string;
}

/**
 * 版本检测选项
 */
export interface DetectOptions {
  outputDir: string;
  autoCreate?: boolean;
  defaultVersion?: string;
}

/**
 * 版本检测结果
 */
export interface DetectResult {
  versions: VersionDirectory[];
  hasVersions: boolean;
  latestVersion: VersionNumber | null;
  recommendedAction: 'create' | 'use_default' | 'select';
}

/**
 * 版本验证结果
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}