// src/core/version-manager/index.ts

import { join } from 'path';
import type { SelectOptions, VersionNumber, VersionDirectory } from './types.js';
import { detectVersions } from './detector.js';
import { createVersionDirectory } from './creator.js';
import { selectVersion } from './selector.js';
import { VersionLocker } from './locker.js';

/**
 * VersionManager - Main entry point for version management
 * Integrates all version management modules
 */
export class VersionManager {
  private readonly outputDir: string;
  private readonly locker: VersionLocker;
  private initialized: boolean = false;
  private detectedVersions: VersionDirectory[] = [];

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.locker = new VersionLocker(outputDir);
  }

  /**
   * Initialize the version manager
   * Detects versions, selects/creates one, and locks it
   * @param options - Initialization options
   */
  async initialize(options?: {
    autoCreate?: boolean;
    defaultVersion?: string;
    specifiedVersion?: string;
  }): Promise<void> {
    if (this.initialized) {
      throw new Error('VersionManager already initialized');
    }

    // Check for existing lock
    const isAlreadyLocked = await this.locker.isLocked();
    if (isAlreadyLocked) {
      this.initialized = true;
      return;
    }

    // Detect existing versions
    const detectResult = await detectVersions(this.outputDir);
    this.detectedVersions = detectResult.versions;

    // Handle multiple versions without selection
    if (detectResult.versions.length > 1 && !options?.specifiedVersion && !options?.defaultVersion) {
      throw new Error(
        `Multiple versions detected: ${detectResult.versions.map(v => v.version.full).join(', ')}. ` +
        `Please specify a version using specifiedVersion or defaultVersion option.`
      );
    }

    // Select version
    const selectOptions: SelectOptions = {
      outputDir: this.outputDir,
      autoCreate: options?.autoCreate ?? false,
      defaultVersion: options?.defaultVersion,
      specifiedVersion: options?.specifiedVersion,
    };

    // For no versions and no autoCreate, we need special handling
    if (!detectResult.hasVersions && !options?.autoCreate) {
      // Don't lock if no version was selected
      this.initialized = true;
      return;
    }

    const result = await selectVersion(selectOptions);

    if (!result.selection) {
      // No selection made, just initialize without locking
      this.initialized = true;
      return;
    }

    // Lock the selected version
    await this.locker.lock(result.selection.version);

    this.initialized = true;
  }

  /**
   * Check if version is locked
   * @returns true if locked
   */
  async isLocked(): Promise<boolean> {
    return await this.locker.isLocked();
  }

  /**
   * Get the current locked version
   * @returns VersionNumber or null
   */
  async getCurrentVersion(): Promise<VersionNumber | null> {
    return await this.locker.getCurrentVersion();
  }

  /**
   * Get the path to the current version directory
   * @param subpath - Optional subpath within the version directory
   * @returns Full path
   */
  async getVersionPath(subpath?: string): Promise<string> {
    const version = await this.getCurrentVersion();
    if (!version) {
      throw new Error('Version not initialized');
    }

    const basePath = join(this.outputDir, version.full);
    if (subpath) {
      return join(basePath, subpath);
    }
    return basePath;
  }

  /**
   * Get all detected versions
   * @returns Array of VersionDirectory
   */
  async getVersions(): Promise<VersionDirectory[]> {
    if (!this.initialized) {
      return [];
    }
    return this.detectedVersions;
  }

  /**
   * Get the session ID
   * @returns Session ID string
   */
  getSessionId(): string {
    return this.locker.getSessionId();
  }

  /**
   * Create a new version directory (without locking)
   * @param version - Version string to create
   * @returns VersionSelection result
   */
  async createVersion(version: string): Promise<{
    version: VersionNumber;
    isNew: boolean;
    path: string;
  }> {
    return await createVersionDirectory(this.outputDir, version);
  }
}

// Re-export types and utilities
export type {
  VersionNumber,
  VersionDirectory,
  VersionLock,
  VersionSelection,
  DetectOptions,
  DetectResult,
  ValidationResult,
  SelectOptions,
  SelectResult,
} from './types.js';

export { detectVersions } from './detector.js';
export { createVersionDirectory } from './creator.js';
export { selectVersion } from './selector.js';
export { VersionLocker } from './locker.js';
export {
  parseVersion,
  validateVersion,
  compareVersions,
  normalizeVersion,
  getNextVersion,
  suggestVersion,
} from './parser.js';