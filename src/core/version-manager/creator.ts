// src/core/version-manager/creator.ts

import { mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import type { VersionSelection, VersionNumber } from './types.js';
import { parseVersion, validateVersion } from './parser.js';

/**
 * Create a version directory
 * @param outputDir - The output directory where version directories are stored
 * @param version - The version string to create (e.g., "v0.1")
 * @returns VersionSelection with version info and path
 */
export async function createVersionDirectory(
  outputDir: string,
  version: string
): Promise<VersionSelection> {
  // Validate version format
  const validation = validateVersion(version);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const normalizedVersion = validation.normalized!;
  const parsed = parseVersion(normalizedVersion);

  if (!parsed) {
    throw new Error(`Failed to parse version: ${version}`);
  }

  const versionPath = join(outputDir, normalizedVersion);
  let isNew = false;

  // Check if directory already exists
  try {
    const dirStat = await stat(versionPath);
    if (dirStat.isDirectory()) {
      // Directory exists, return without creating
      return {
        version: parsed,
        isNew: false,
        path: versionPath,
      };
    }
  } catch {
    // Directory doesn't exist, create it
    isNew = true;
  }

  // Create the version directory
  await mkdir(versionPath, { recursive: true });

  // Create or update VERSION-LOG.md
  await createVersionLog(versionPath, parsed);

  return {
    version: parsed,
    isNew,
    path: versionPath,
  };
}

/**
 * Create VERSION-LOG.md file in the version directory
 * @param versionPath - The path to the version directory
 * @param version - The version number object
 */
async function createVersionLog(
  versionPath: string,
  version: VersionNumber
): Promise<void> {
  const logPath = join(versionPath, 'VERSION-LOG.md');
  const timestamp = new Date().toISOString().split('T')[0];

  const content = `# Version Log

## ${version.full}

**Created:** ${timestamp}

- Initial version created
`;

  await writeFile(logPath, content, 'utf-8');
}