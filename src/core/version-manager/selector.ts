// src/core/version-manager/selector.ts

import type { SelectOptions, SelectResult, VersionNumber } from './types.js';
import { detectVersions } from './detector.js';
import { createVersionDirectory } from './creator.js';
import { parseVersion, validateVersion, normalizeVersion, compareVersions } from './parser.js';

/**
 * Select a version for the session
 * @param options - Selection options
 * @returns SelectResult with selection info and recommendations
 */
export async function selectVersion(options: SelectOptions): Promise<SelectResult> {
  const { outputDir, autoCreate = false, defaultVersion, specifiedVersion } = options;

  // Detect existing versions
  const detectResult = await detectVersions(outputDir);
  const existingVersions: VersionNumber[] = detectResult.versions.map(v => v.version);

  // Sort existing versions descending (latest first)
  existingVersions.sort((a, b) => compareVersions(b.full, a.full));

  // Determine suggested version
  let suggestedVersion: VersionNumber;
  if (detectResult.hasVersions && detectResult.latestVersion) {
    suggestedVersion = detectResult.latestVersion;
  } else {
    suggestedVersion = { major: 0, minor: 1, full: 'v0.1' };
  }

  // Handle specified version
  if (specifiedVersion) {
    const normalized = normalizeVersion(specifiedVersion);
    const validation = validateVersion(normalized);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const parsed = parseVersion(normalized);
    if (!parsed) {
      throw new Error(`Invalid version format: ${specifiedVersion}`);
    }

    // Check if specified version exists
    const exists = existingVersions.some(v => v.full === normalized);

    if (exists) {
      const selection = await createVersionDirectory(outputDir, normalized);
      return {
        selection: { ...selection, isNew: false },
        suggestedVersion: parsed,
        existingVersions,
        needsSelection: false,
      };
    }

    // Version doesn't exist
    if (autoCreate) {
      const selection = await createVersionDirectory(outputDir, normalized);
      return {
        selection,
        suggestedVersion: parsed,
        existingVersions,
        needsSelection: false,
      };
    }

    throw new Error(`Version ${normalized} does not exist. Use autoCreate to create it.`);
  }

  // Handle default version
  if (defaultVersion) {
    const normalized = normalizeVersion(defaultVersion);
    const validation = validateVersion(normalized);

    if (validation.valid) {
      const exists = existingVersions.some(v => v.full === normalized);

      if (exists) {
        const selection = await createVersionDirectory(outputDir, normalized);
        return {
          selection: { ...selection, isNew: false },
          suggestedVersion: parseVersion(normalized) || suggestedVersion,
          existingVersions,
          needsSelection: false,
        };
      }

      if (autoCreate) {
        const selection = await createVersionDirectory(outputDir, normalized);
        return {
          selection,
          suggestedVersion: parseVersion(normalized) || suggestedVersion,
          existingVersions,
          needsSelection: false,
        };
      }

      // Default not found, fallback to latest or suggest creation
      if (detectResult.hasVersions) {
        const latest = existingVersions[0];
        const selection = await createVersionDirectory(outputDir, latest.full);
        return {
          selection: { ...selection, isNew: false },
          suggestedVersion: latest,
          existingVersions,
          needsSelection: false,
        };
      }
    }
  }

  // No specified or default version
  if (!detectResult.hasVersions) {
    // No versions exist
    if (autoCreate) {
      const selection = await createVersionDirectory(outputDir, 'v0.1');
      return {
        selection,
        suggestedVersion: { major: 0, minor: 1, full: 'v0.1' },
        existingVersions: [],
        needsSelection: false,
      };
    }

    return {
      selection: null,
      suggestedVersion: { major: 0, minor: 1, full: 'v0.1' },
      existingVersions: [],
      needsSelection: true,
    };
  }

  // Single version exists - auto-select
  if (existingVersions.length === 1) {
    const version = existingVersions[0];
    const selection = await createVersionDirectory(outputDir, version.full);
    return {
      selection: { ...selection, isNew: false },
      suggestedVersion: version,
      existingVersions,
      needsSelection: false,
    };
  }

  // Multiple versions - need selection
  return {
    selection: null,
    suggestedVersion: existingVersions[0], // Latest
    existingVersions,
    needsSelection: true,
  };
}