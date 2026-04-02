// src/core/version-manager/parser.ts

import type { VersionNumber, ValidationResult } from './types.js';

/**
 * Version regex pattern: v{major}.{minor}
 */
const VERSION_REGEX = /^v(\d+)\.(\d+)$/;

/**
 * Parse a version string into a VersionNumber object
 * @param version - The version string to parse (e.g., "v0.1")
 * @returns VersionNumber object or null if invalid
 */
export function parseVersion(version: string): VersionNumber | null {
  const match = version.match(VERSION_REGEX);
  if (!match) {
    return null;
  }

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);

  return {
    major,
    minor,
    full: version,
  };
}

/**
 * Validate a version string
 * @param version - The version string to validate
 * @returns ValidationResult with valid status and optional error/normalized
 */
export function validateVersion(version: string): ValidationResult {
  const parsed = parseVersion(version);

  if (parsed) {
    return {
      valid: true,
      normalized: parsed.full,
    };
  }

  return {
    valid: false,
    error: `Invalid version format: "${version}". Expected format: v{major}.{minor} (e.g., v0.1)`,
  };
}

/**
 * Compare two version strings
 * @param a - First version string
 * @param b - Second version string
 * @returns Negative if a < b, 0 if equal, positive if a > b
 */
export function compareVersions(a: string, b: string): number {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);

  if (!parsedA || !parsedB) {
    throw new Error('Invalid version format for comparison');
  }

  if (parsedA.major !== parsedB.major) {
    return parsedA.major - parsedB.major;
  }

  return parsedA.minor - parsedB.minor;
}

/**
 * Normalize a version string by adding 'v' prefix if missing
 * @param version - The version string to normalize
 * @returns Normalized version string with 'v' prefix
 */
export function normalizeVersion(version: string): string {
  if (version.startsWith('v')) {
    return version;
  }
  return `v${version}`;
}

/**
 * Get the next version by incrementing the minor version
 * @param currentVersion - The current version string
 * @returns The next version string
 */
export function getNextVersion(currentVersion: string): string {
  const parsed = parseVersion(currentVersion);
  if (!parsed) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }

  return `v${parsed.major}.${parsed.minor + 1}`;
}

/**
 * Suggest a version based on existing versions
 * @param hasExistingVersions - Whether there are existing versions
 * @param latestVersion - The latest version string or null
 * @returns The suggested version string
 */
export function suggestVersion(
  hasExistingVersions: boolean,
  latestVersion: string | null
): string {
  if (!hasExistingVersions || !latestVersion) {
    return 'v0.1';
  }

  return getNextVersion(latestVersion);
}