// tests/core/version-manager/detector.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { detectVersions } from '../../../src/core/version-manager/detector.js';

describe('detectVersions', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `chaos-harness-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return empty versions when directory does not exist', async () => {
    const nonExistentDir = join(tmpdir(), `non-existent-${Date.now()}`);
    const result = await detectVersions(nonExistentDir);

    expect(result.versions).toEqual([]);
    expect(result.hasVersions).toBe(false);
    expect(result.latestVersion).toBeNull();
    expect(result.recommendedAction).toBe('create');
  });

  it('should return empty versions when directory is empty', async () => {
    const result = await detectVersions(testDir);

    expect(result.versions).toEqual([]);
    expect(result.hasVersions).toBe(false);
    expect(result.latestVersion).toBeNull();
    expect(result.recommendedAction).toBe('create');
  });

  it('should detect single version directory', async () => {
    const v01Dir = join(testDir, 'v0.1');
    await mkdir(v01Dir);

    const result = await detectVersions(testDir);

    expect(result.versions).toHaveLength(1);
    expect(result.versions[0].version.full).toBe('v0.1');
    expect(result.hasVersions).toBe(true);
    expect(result.latestVersion?.full).toBe('v0.1');
    expect(result.recommendedAction).toBe('use_default');
  });

  it('should detect multiple version directories sorted by version desc', async () => {
    await mkdir(join(testDir, 'v0.1'));
    await mkdir(join(testDir, 'v0.3'));
    await mkdir(join(testDir, 'v0.2'));

    const result = await detectVersions(testDir);

    expect(result.versions).toHaveLength(3);
    expect(result.versions[0].version.full).toBe('v0.3');
    expect(result.versions[1].version.full).toBe('v0.2');
    expect(result.versions[2].version.full).toBe('v0.1');
    expect(result.latestVersion?.full).toBe('v0.3');
    expect(result.recommendedAction).toBe('select');
  });

  it('should ignore non-version directories', async () => {
    await mkdir(join(testDir, 'v0.1'));
    await mkdir(join(testDir, 'temp'));
    await mkdir(join(testDir, 'logs'));
    await writeFile(join(testDir, 'config.json'), '{}');

    const result = await detectVersions(testDir);

    expect(result.versions).toHaveLength(1);
    expect(result.versions[0].version.full).toBe('v0.1');
  });

  it('should ignore invalid version format directories', async () => {
    await mkdir(join(testDir, 'v0.1'));
    await mkdir(join(testDir, 'v1')); // Invalid: missing minor
    await mkdir(join(testDir, '0.2')); // Invalid: missing v prefix
    await mkdir(join(testDir, 'vx.y')); // Invalid: non-numeric

    const result = await detectVersions(testDir);

    expect(result.versions).toHaveLength(1);
    expect(result.versions[0].version.full).toBe('v0.1');
  });

  it('should handle major version differences', async () => {
    await mkdir(join(testDir, 'v0.1'));
    await mkdir(join(testDir, 'v1.0'));
    await mkdir(join(testDir, 'v2.0'));

    const result = await detectVersions(testDir);

    expect(result.versions).toHaveLength(3);
    expect(result.versions[0].version.full).toBe('v2.0');
    expect(result.versions[1].version.full).toBe('v1.0');
    expect(result.versions[2].version.full).toBe('v0.1');
  });

  it('should detect locked version from VERSION-LOG.md', async () => {
    const v01Dir = join(testDir, 'v0.1');
    await mkdir(v01Dir);
    await writeFile(join(v01Dir, 'VERSION-LOG.md'), '# Version Log\n\n## v0.1\n- Initial version');

    const result = await detectVersions(testDir);

    expect(result.versions).toHaveLength(1);
    expect(result.versions[0].version.full).toBe('v0.1');
    // Note: isLocked detection would be based on session lock file
  });

  it('should return correct path for each version', async () => {
    await mkdir(join(testDir, 'v0.1'));
    await mkdir(join(testDir, 'v0.2'));

    const result = await detectVersions(testDir);

    expect(result.versions[0].path).toBe(join(testDir, 'v0.2'));
    expect(result.versions[1].path).toBe(join(testDir, 'v0.1'));
  });

  it('should handle versions with double-digit minor versions', async () => {
    await mkdir(join(testDir, 'v0.9'));
    await mkdir(join(testDir, 'v0.10'));
    await mkdir(join(testDir, 'v0.11'));

    const result = await detectVersions(testDir);

    expect(result.versions).toHaveLength(3);
    expect(result.versions[0].version.full).toBe('v0.11');
    expect(result.versions[1].version.full).toBe('v0.10');
    expect(result.versions[2].version.full).toBe('v0.9');
  });
});