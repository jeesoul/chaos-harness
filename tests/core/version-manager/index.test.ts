// tests/core/version-manager/index.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { VersionManager } from '../../../src/core/version-manager/index.js';

describe('VersionManager', () => {
  let testDir: string;
  let manager: VersionManager;

  beforeEach(async () => {
    testDir = join(tmpdir(), `chaos-harness-manager-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    manager = new VersionManager(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('initialize', () => {
    it('should initialize with no existing versions', async () => {
      await manager.initialize();

      expect(await manager.isLocked()).toBe(false);
      expect(await manager.getCurrentVersion()).toBeNull();
    });

    it('should initialize with autoCreate creating v0.1', async () => {
      await manager.initialize({ autoCreate: true });

      expect(await manager.isLocked()).toBe(true);
      expect((await manager.getCurrentVersion())?.full).toBe('v0.1');
    });

    it('should initialize with single existing version', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await writeFile(join(testDir, 'v0.1', 'VERSION-LOG.md'), '# Version Log');

      await manager.initialize();

      expect(await manager.isLocked()).toBe(true);
      expect((await manager.getCurrentVersion())?.full).toBe('v0.1');
    });

    it('should throw error when multiple versions without selection', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.2'));

      await expect(manager.initialize()).rejects.toThrow('Multiple versions detected');
    });

    it('should initialize with specified version', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.2'));

      await manager.initialize({ specifiedVersion: 'v0.1' });

      expect(await manager.isLocked()).toBe(true);
      expect((await manager.getCurrentVersion())?.full).toBe('v0.1');
    });

    it('should initialize with default version', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.2'));

      await manager.initialize({ defaultVersion: 'v0.1' });

      expect(await manager.isLocked()).toBe(true);
      expect((await manager.getCurrentVersion())?.full).toBe('v0.1');
    });

    it('should create specified version with autoCreate', async () => {
      await manager.initialize({ specifiedVersion: 'v0.5', autoCreate: true });

      expect(await manager.isLocked()).toBe(true);
      expect((await manager.getCurrentVersion())?.full).toBe('v0.5');
    });

    it('should throw error when already initialized', async () => {
      await manager.initialize({ autoCreate: true });

      await expect(manager.initialize()).rejects.toThrow('VersionManager already initialized');
    });
  });

  describe('getCurrentVersion', () => {
    it('should return null before initialization', async () => {
      expect(await manager.getCurrentVersion()).toBeNull();
    });

    it('should return locked version after initialization', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await manager.initialize({ autoCreate: true });

      const version = await manager.getCurrentVersion();
      expect(version?.full).toBe('v0.1');
    });
  });

  describe('isLocked', () => {
    it('should return false before initialization', async () => {
      expect(await manager.isLocked()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await manager.initialize();

      expect(await manager.isLocked()).toBe(true);
    });
  });

  describe('getVersionPath', () => {
    it('should throw error before initialization', async () => {
      await expect(manager.getVersionPath()).rejects.toThrow('Version not initialized');
    });

    it('should return correct path after initialization', async () => {
      await manager.initialize({ autoCreate: true });

      const path = await manager.getVersionPath();
      expect(path).toBe(join(testDir, 'v0.1'));
    });

    it('should return path with subpath', async () => {
      await manager.initialize({ autoCreate: true });

      const path = await manager.getVersionPath('logs');
      expect(path).toBe(join(testDir, 'v0.1', 'logs'));
    });
  });

  describe('lock persistence', () => {
    it('should detect existing lock on new manager instance', async () => {
      // Initialize first manager
      await mkdir(join(testDir, 'v0.1'));
      await manager.initialize();

      // Create new manager instance
      const newManager = new VersionManager(testDir);
      expect(await newManager.isLocked()).toBe(true);
      expect((await newManager.getCurrentVersion())?.full).toBe('v0.1');
    });

    it('should maintain lock file', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await manager.initialize();

      const lockPath = join(testDir, 'v0.1', '.version-lock');
      const lockStat = await stat(lockPath);
      expect(lockStat.isFile()).toBe(true);
    });
  });

  describe('getVersions', () => {
    it('should return empty array before initialization', async () => {
      const versions = await manager.getVersions();
      expect(versions).toHaveLength(0);
    });

    it('should return detected versions after initialization', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.2'));

      // Initialize with specific version
      await manager.initialize({ specifiedVersion: 'v0.1' });

      const versions = await manager.getVersions();
      expect(versions).toHaveLength(2);
    });
  });

  describe('session management', () => {
    it('should have unique session ID', async () => {
      const sessionId = manager.getSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
    });

    it('should have different session IDs for different managers', async () => {
      const manager2 = new VersionManager(testDir);
      expect(manager.getSessionId()).not.toBe(manager2.getSessionId());
    });
  });
});