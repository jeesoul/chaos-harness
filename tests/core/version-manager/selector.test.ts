// tests/core/version-manager/selector.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { selectVersion } from '../../../src/core/version-manager/selector.js';
import type { SelectOptions } from '../../../src/core/version-manager/types.js';

describe('selectVersion', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `chaos-harness-selector-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('no versions', () => {
    it('should suggest creating v0.1 when no versions exist', async () => {
      const options: SelectOptions = { outputDir: testDir };
      const result = await selectVersion(options);

      expect(result.suggestedVersion.full).toBe('v0.1');
      expect(result.needsSelection).toBe(true);
      expect(result.existingVersions).toHaveLength(0);
    });

    it('should create v0.1 when autoCreate is true and no versions', async () => {
      const options: SelectOptions = { outputDir: testDir, autoCreate: true };
      const result = await selectVersion(options);

      expect(result.selection?.version.full).toBe('v0.1');
      expect(result.selection?.isNew).toBe(true);
      expect(result.needsSelection).toBe(false);
    });
  });

  describe('single version', () => {
    it('should auto-select single existing version', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await writeFile(join(testDir, 'v0.1', 'VERSION-LOG.md'), '# Version Log');

      const options: SelectOptions = { outputDir: testDir };
      const result = await selectVersion(options);

      expect(result.selection?.version.full).toBe('v0.1');
      expect(result.selection?.isNew).toBe(false);
      expect(result.needsSelection).toBe(false);
      expect(result.existingVersions).toHaveLength(1);
    });

    it('should auto-select single version even with autoCreate', async () => {
      await mkdir(join(testDir, 'v0.1'));

      const options: SelectOptions = { outputDir: testDir, autoCreate: true };
      const result = await selectVersion(options);

      expect(result.selection?.version.full).toBe('v0.1');
      expect(result.selection?.isNew).toBe(false);
    });
  });

  describe('multiple versions', () => {
    it('should require selection when multiple versions exist', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.2'));

      const options: SelectOptions = { outputDir: testDir };
      const result = await selectVersion(options);

      expect(result.needsSelection).toBe(true);
      expect(result.existingVersions).toHaveLength(2);
      expect(result.suggestedVersion.full).toBe('v0.2'); // Latest
    });

    it('should use specified version when provided', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.2'));

      const options: SelectOptions = { outputDir: testDir, specifiedVersion: 'v0.1' };
      const result = await selectVersion(options);

      expect(result.selection?.version.full).toBe('v0.1');
      expect(result.selection?.isNew).toBe(false);
      expect(result.needsSelection).toBe(false);
    });

    it('should create specified version if not existing with autoCreate', async () => {
      await mkdir(join(testDir, 'v0.1'));

      const options: SelectOptions = { outputDir: testDir, specifiedVersion: 'v0.5', autoCreate: true };
      const result = await selectVersion(options);

      expect(result.selection?.version.full).toBe('v0.5');
      expect(result.selection?.isNew).toBe(true);
    });

    it('should throw error for non-existing specified version without autoCreate', async () => {
      await mkdir(join(testDir, 'v0.1'));

      const options: SelectOptions = { outputDir: testDir, specifiedVersion: 'v0.5' };
      await expect(selectVersion(options)).rejects.toThrow();
    });
  });

  describe('default version', () => {
    it('should use default version when provided and existing', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.2'));

      const options: SelectOptions = { outputDir: testDir, defaultVersion: 'v0.1' };
      const result = await selectVersion(options);

      expect(result.selection?.version.full).toBe('v0.1');
      expect(result.needsSelection).toBe(false);
    });

    it('should create default version when autoCreate is true', async () => {
      const options: SelectOptions = { outputDir: testDir, defaultVersion: 'v0.1', autoCreate: true };
      const result = await selectVersion(options);

      expect(result.selection?.version.full).toBe('v0.1');
      expect(result.selection?.isNew).toBe(true);
    });

    it('should fallback to latest if default not found without autoCreate', async () => {
      await mkdir(join(testDir, 'v0.2'));

      const options: SelectOptions = { outputDir: testDir, defaultVersion: 'v0.1' };
      const result = await selectVersion(options);

      // Should use existing v0.2 as fallback
      expect(result.selection?.version.full).toBe('v0.2');
    });
  });

  describe('version sorting', () => {
    it('should return versions sorted by version descending', async () => {
      await mkdir(join(testDir, 'v0.3'));
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.2'));

      const options: SelectOptions = { outputDir: testDir };
      const result = await selectVersion(options);

      expect(result.existingVersions[0].full).toBe('v0.3');
      expect(result.existingVersions[1].full).toBe('v0.2');
      expect(result.existingVersions[2].full).toBe('v0.1');
    });

    it('should handle major version differences', async () => {
      await mkdir(join(testDir, 'v1.0'));
      await mkdir(join(testDir, 'v0.5'));

      const options: SelectOptions = { outputDir: testDir };
      const result = await selectVersion(options);

      expect(result.existingVersions[0].full).toBe('v1.0');
      expect(result.existingVersions[1].full).toBe('v0.5');
    });
  });

  describe('suggested version', () => {
    it('should suggest next version from latest', async () => {
      await mkdir(join(testDir, 'v0.1'));

      const options: SelectOptions = { outputDir: testDir, autoCreate: false };
      const result = await selectVersion(options);

      // For single version, it's auto-selected, suggested should be the same
      expect(result.suggestedVersion.full).toBe('v0.1');
    });

    it('should suggest latest for multiple versions', async () => {
      await mkdir(join(testDir, 'v0.1'));
      await mkdir(join(testDir, 'v0.5'));

      const options: SelectOptions = { outputDir: testDir };
      const result = await selectVersion(options);

      expect(result.suggestedVersion.full).toBe('v0.5');
    });
  });

  describe('path handling', () => {
    it('should return correct path for selection', async () => {
      await mkdir(join(testDir, 'v0.1'));

      const options: SelectOptions = { outputDir: testDir, autoCreate: true };
      const result = await selectVersion(options);

      expect(result.selection?.path).toBe(join(testDir, 'v0.1'));
    });

    it('should return correct path for new version', async () => {
      const options: SelectOptions = { outputDir: testDir, specifiedVersion: 'v0.3', autoCreate: true };
      const result = await selectVersion(options);

      expect(result.selection?.path).toBe(join(testDir, 'v0.3'));
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent output directory', async () => {
      const nonExistentDir = join(tmpdir(), `non-existent-${Date.now()}`);
      const options: SelectOptions = { outputDir: nonExistentDir };
      const result = await selectVersion(options);

      expect(result.existingVersions).toHaveLength(0);
      expect(result.suggestedVersion.full).toBe('v0.1');
    });

    it('should validate specified version format', async () => {
      const options: SelectOptions = { outputDir: testDir, specifiedVersion: 'invalid' };
      await expect(selectVersion(options)).rejects.toThrow();
    });

    it('should normalize specified version', async () => {
      await mkdir(join(testDir, 'v0.1'));

      // Test with version without 'v' prefix
      const options: SelectOptions = { outputDir: testDir, specifiedVersion: '0.1' };
      const result = await selectVersion(options);

      expect(result.selection?.version.full).toBe('v0.1');
    });
  });
});