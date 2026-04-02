// src/core/version-manager/locker.ts

import { stat, readFile, writeFile, unlink, readdir } from 'fs/promises';
import { join } from 'path';
import type { VersionNumber, VersionLock } from './types.js';
import { randomUUID } from 'crypto';

/**
 * VersionLocker - Session-scoped version locking mechanism
 * Once locked, the version cannot be changed during the session
 */
export class VersionLocker {
  private readonly outputDir: string;
  private readonly sessionId: string;
  private lockState: VersionLock;
  private initialized: boolean = false;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.sessionId = randomUUID();
    this.lockState = {
      currentVersion: null,
      lockedAt: null,
      session: null,
    };
  }

  /**
   * Initialize the locker by checking for existing locks
   * Must be called before using other methods
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.loadExistingLock();
    this.initialized = true;
  }

  /**
   * Lock to a specific version
   * @param version - The version to lock to
   * @throws Error if already locked
   */
  async lock(version: VersionNumber): Promise<void> {
    await this.initialize();

    if (this.lockState.currentVersion !== null) {
      throw new Error(
        `Version is already locked to ${this.lockState.currentVersion.full}`
      );
    }

    // Verify version directory exists
    const versionPath = join(this.outputDir, version.full);
    try {
      await stat(versionPath);
    } catch {
      throw new Error(`Version directory does not exist: ${versionPath}`);
    }

    // Create lock file
    const lockPath = join(versionPath, '.version-lock');
    const lockData = {
      version: version.full,
      session: this.sessionId,
      lockedAt: new Date().toISOString(),
    };

    await writeFile(lockPath, JSON.stringify(lockData, null, 2), 'utf-8');

    // Update in-memory lock
    this.lockState = {
      currentVersion: version,
      lockedAt: new Date(),
      session: this.sessionId,
    };
  }

  /**
   * Unlock the current version
   * Removes the lock file and clears the in-memory lock
   */
  async unlock(): Promise<void> {
    await this.initialize();

    if (this.lockState.currentVersion === null) {
      return;
    }

    // Remove lock file
    const versionPath = join(this.outputDir, this.lockState.currentVersion.full);
    const lockPath = join(versionPath, '.version-lock');

    try {
      await unlink(lockPath);
    } catch {
      // Lock file may not exist, ignore
    }

    // Clear in-memory lock
    this.lockState = {
      currentVersion: null,
      lockedAt: null,
      session: null,
    };
  }

  /**
   * Check if version is locked
   * @returns true if locked
   */
  async isLocked(): Promise<boolean> {
    await this.initialize();
    return this.lockState.currentVersion !== null;
  }

  /**
   * Get the current locked version
   * @returns VersionNumber or null if not locked
   */
  async getCurrentVersion(): Promise<VersionNumber | null> {
    await this.initialize();
    return this.lockState.currentVersion;
  }

  /**
   * Get the session ID
   * @returns The session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Load existing lock from file system
   * Called during initialization
   */
  private async loadExistingLock(): Promise<void> {
    try {
      const entries = await readdir(this.outputDir);

      for (const entry of entries) {
        const lockPath = join(this.outputDir, entry, '.version-lock');
        try {
          const lockContent = await readFile(lockPath, 'utf-8');
          const lockData = JSON.parse(lockContent);

          // Restore lock state
          const [major, minor] = lockData.version
            .replace('v', '')
            .split('.')
            .map(Number);

          this.lockState = {
            currentVersion: {
              major,
              minor,
              full: lockData.version,
            },
            lockedAt: new Date(lockData.lockedAt),
            session: lockData.session,
          };
          return; // Found a lock, stop searching
        } catch {
          // No lock file in this directory, continue
        }
      }
    } catch {
      // Directory doesn't exist or can't be read, no lock
    }
  }
}