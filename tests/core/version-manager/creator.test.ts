// tests/core/version-manager/creator.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createVersionDirectory } from '../../../src/core/version-manager/creator.js';

describe('createVersionDirectory', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `chaos-harness-creator-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should create a new version directory', async () => {
    const result = await createVersionDirectory(testDir, 'v0.1');

    expect(result.version.full).toBe('v0.1');
    expect(result.isNew).toBe(true);
    expect(result.path).toBe(join(testDir, 'v0.1'));

    // Verify directory exists
    const dirStat = await stat(result.path);
    expect(dirStat.isDirectory()).toBe(true);
  });

  it('should create VERSION-LOG.md in new directory', async () => {
    const result = await createVersionDirectory(testDir, 'v0.1');

    const logPath = join(result.path, 'VERSION-LOG.md');
    const logContent = await readFile(logPath, 'utf-8');

    expect(logContent).toContain('# Version Log');
    expect(logContent).toContain('## v0.1');
    expect(logContent).toContain('Initial version created');
  });

  it('should return existing directory without error', async () => {
    // Create directory first
    await mkdir(join(testDir, 'v0.1'));

    const result = await createVersionDirectory(testDir, 'v0.1');

    expect(result.version.full).toBe('v0.1');
    expect(result.isNew).toBe(false);
    expect(result.path).toBe(join(testDir, 'v0.1'));
  });

  it('should append to VERSION-LOG.md if creating new version', async () => {
    // Create v0.1 first
    await createVersionDirectory(testDir, 'v0.1');

    // Create v0.2
    const result = await createVersionDirectory(testDir, 'v0.2');

    expect(result.version.full).toBe('v0.2');
    expect(result.isNew).toBe(true);

    const logPath = join(result.path, 'VERSION-LOG.md');
    const logContent = await readFile(logPath, 'utf-8');
    expect(logContent).toContain('## v0.2');
  });

  it('should throw error for invalid version format', async () => {
    await expect(createVersionDirectory(testDir, 'invalid')).rejects.toThrow();
  });

  it('should throw error for version without v prefix', async () => {
    await expect(createVersionDirectory(testDir, '0.1')).rejects.toThrow();
  });

  it('should create nested version directories', async () => {
    const nestedDir = join(testDir, 'nested', 'path');
    await mkdir(nestedDir, { recursive: true });

    const result = await createVersionDirectory(nestedDir, 'v1.0');

    expect(result.version.full).toBe('v1.0');
    expect(result.path).toBe(join(nestedDir, 'v1.0'));
  });

  it('should include timestamp in VERSION-LOG.md', async () => {
    const result = await createVersionDirectory(testDir, 'v0.1');

    const logPath = join(result.path, 'VERSION-LOG.md');
    const logContent = await readFile(logPath, 'utf-8');

    // Check for ISO date format pattern (YYYY-MM-DD)
    expect(logContent).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should handle versions with major version > 0', async () => {
    const result = await createVersionDirectory(testDir, 'v1.0');

    expect(result.version.full).toBe('v1.0');
    expect(result.version.major).toBe(1);
    expect(result.version.minor).toBe(0);
  });

  it('should handle versions with double-digit minor', async () => {
    const result = await createVersionDirectory(testDir, 'v0.15');

    expect(result.version.full).toBe('v0.15');
    expect(result.version.minor).toBe(15);
  });
});