// src/core/version-manager/detector.ts

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import type { VersionDirectory, DetectResult, VersionNumber } from './types.js';
import { parseVersion, compareVersions } from './parser.js';

/**
 * Detect version directories in the output directory
 * @param outputDir - The output directory to scan
 * @returns DetectResult with versions list and recommendations
 */
export async function detectVersions(outputDir: string): Promise<DetectResult> {
  const versions: VersionDirectory[] = [];

  // Check if directory exists
  try {
    await stat(outputDir);
  } catch {
    return {
      versions: [],
      hasVersions: false,
      latestVersion: null,
      recommendedAction: 'create',
    };
  }

  // Read directory entries
  let entries: string[];
  try {
    entries = await readdir(outputDir);
  } catch {
    return {
      versions: [],
      hasVersions: false,
      latestVersion: null,
      recommendedAction: 'create',
    };
  }

  // Filter and parse version directories
  for (const entry of entries) {
    const parsed = parseVersion(entry);
    if (parsed) {
      const entryPath = join(outputDir, entry);
      const entryStat = await stat(entryPath);

      if (entryStat.isDirectory()) {
        versions.push({
          path: entryPath,
          version: parsed,
          createdAt: entryStat.birthtime,
          isLocked: false, // Will be updated by locker module
        });
      }
    }
  }

  // Sort versions by version number descending (latest first)
  versions.sort((a, b) => compareVersions(b.version.full, a.version.full));

  const hasVersions = versions.length > 0;
  const latestVersion: VersionNumber | null = hasVersions ? versions[0].version : null;

  // Determine recommended action
  let recommendedAction: 'create' | 'use_default' | 'select';
  if (!hasVersions) {
    recommendedAction = 'create';
  } else if (versions.length === 1) {
    recommendedAction = 'use_default';
  } else {
    recommendedAction = 'select';
  }

  return {
    versions,
    hasVersions,
    latestVersion,
    recommendedAction,
  };
}