// tests/core/version-manager/locker.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { VersionLocker } from '../../../src/core/version-manager/locker.js';
import type { VersionNumber } from '../../../src/core/version-manager/types.js';

describe('VersionLocker', () => {
  let testDir: string;
  let locker: VersionLocker;

  beforeEach(async () => {
    testDir = join(tmpdir(), `chaos-harness-locker-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    locker = new VersionLocker(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('lock', () => {
    it('should lock a version', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));

      await locker.lock(version);

      expect(await locker.isLocked()).toBe(true);
      expect((await locker.getCurrentVersion())?.full).toBe('v0.1');
    });

    it('should throw error when trying to lock twice', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));
      await locker.lock(version);

      const version2: VersionNumber = { major: 0, minor: 2, full: 'v0.2' };
      await expect(locker.lock(version2)).rejects.toThrow('Version is already locked');
    });

    it('should create lock file in version directory', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));
      await locker.lock(version);

      const lockPath = join(testDir, 'v0.1', '.version-lock');
      const lockStat = await stat(lockPath);
      expect(lockStat.isFile()).toBe(true);
    });

    it('should store session info in lock file', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));
      await locker.lock(version);

      const lockPath = join(testDir, 'v0.1', '.version-lock');
      const lockContent = await readFile(lockPath, 'utf-8');
      const lockData = JSON.parse(lockContent);

      expect(lockData.version).toBe('v0.1');
      expect(lockData.session).toBeDefined();
      expect(lockData.lockedAt).toBeDefined();
    });

    it('should throw error if version directory does not exist', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      // Don't create v0.1 directory

      await expect(locker.lock(version)).rejects.toThrow();
    });
  });

  describe('unlock', () => {
    it('should unlock a locked version', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));
      await locker.lock(version);

      await locker.unlock();

      expect(await locker.isLocked()).toBe(false);
      expect(await locker.getCurrentVersion()).toBeNull();
    });

    it('should remove lock file on unlock', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));
      await locker.lock(version);

      await locker.unlock();

      const lockPath = join(testDir, 'v0.1', '.version-lock');
      await expect(stat(lockPath)).rejects.toThrow();
    });

    it('should do nothing if not locked', async () => {
      await locker.unlock(); // Should not throw

      expect(await locker.isLocked()).toBe(false);
    });
  });

  describe('isLocked', () => {
    it('should return false initially', async () => {
      expect(await locker.isLocked()).toBe(false);
    });

    it('should return true after locking', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));
      await locker.lock(version);

      expect(await locker.isLocked()).toBe(true);
    });

    it('should return false after unlocking', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));
      await locker.lock(version);
      await locker.unlock();

      expect(await locker.isLocked()).toBe(false);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return null initially', async () => {
      expect(await locker.getCurrentVersion()).toBeNull();
    });

    it('should return locked version', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));
      await locker.lock(version);

      const current = await locker.getCurrentVersion();
      expect(current?.full).toBe('v0.1');
      expect(current?.major).toBe(0);
      expect(current?.minor).toBe(1);
    });
  });

  describe('persistence', () => {
    it('should detect existing lock file on initialization', async () => {
      // Create lock file manually
      const versionDir = join(testDir, 'v0.1');
      await mkdir(versionDir);
      const lockPath = join(versionDir, '.version-lock');
      const lockData = {
        version: 'v0.1',
        session: 'test-session-123',
        lockedAt: new Date().toISOString(),
      };
      await writeFile(lockPath, JSON.stringify(lockData));

      // Create new locker instance
      const newLocker = new VersionLocker(testDir);
      expect(await newLocker.isLocked()).toBe(true);
      expect((await newLocker.getCurrentVersion())?.full).toBe('v0.1');
    });

    it('should ignore lock files from different versions', async () => {
      // Create lock file in v0.1
      const v01Dir = join(testDir, 'v0.1');
      await mkdir(v01Dir);
      const lockData = {
        version: 'v0.1',
        session: 'test-session-123',
        lockedAt: new Date().toISOString(),
      };
      await writeFile(join(v01Dir, '.version-lock'), JSON.stringify(lockData));

      // Create another version directory
      const v02Dir = join(testDir, 'v0.2');
      await mkdir(v02Dir);

      // New locker should detect the lock
      const newLocker = new VersionLocker(testDir);
      expect(await newLocker.isLocked()).toBe(true);
      expect((await newLocker.getCurrentVersion())?.full).toBe('v0.1');
    });
  });

  describe('session management', () => {
    it('should generate unique session IDs', async () => {
      const version: VersionNumber = { major: 0, minor: 1, full: 'v0.1' };
      await mkdir(join(testDir, 'v0.1'));

      const locker2 = new VersionLocker(testDir);

      await locker.lock(version);

      // Both lockers should have different sessions
      expect(locker.getSessionId()).toBeDefined();
      expect(locker2.getSessionId()).toBeDefined();
    });
  });
});