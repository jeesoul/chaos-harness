// tests/core/version-manager/parser.test.ts

import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  validateVersion,
  compareVersions,
  normalizeVersion,
  getNextVersion,
  suggestVersion,
} from '../../../src/core/version-manager/parser.js';

describe('parseVersion', () => {
  it('should parse valid version string', () => {
    const result = parseVersion('v0.1');
    expect(result).toEqual({ major: 0, minor: 1, full: 'v0.1' });
  });

  it('should return null for invalid version string', () => {
    expect(parseVersion('invalid')).toBeNull();
  });

  it('should parse version with larger numbers', () => {
    const result = parseVersion('v10.25');
    expect(result).toEqual({ major: 10, minor: 25, full: 'v10.25' });
  });

  it('should return null for version without v prefix', () => {
    expect(parseVersion('0.1')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseVersion('')).toBeNull();
  });
});

describe('validateVersion', () => {
  it('should return valid for correct version format', () => {
    const result = validateVersion('v0.1');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for version without v prefix', () => {
    const result = validateVersion('0.1');
    expect(result.valid).toBe(false);
  });

  it('should return normalized version for valid input', () => {
    const result = validateVersion('v1.0');
    expect(result.normalized).toBe('v1.0');
  });

  it('should return error message for invalid input', () => {
    const result = validateVersion('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('compareVersions', () => {
  it('should return negative when first version is smaller', () => {
    expect(compareVersions('v0.1', 'v0.2')).toBeLessThan(0);
  });

  it('should return positive when first version is larger', () => {
    expect(compareVersions('v0.2', 'v0.1')).toBeGreaterThan(0);
  });

  it('should return zero for equal versions', () => {
    expect(compareVersions('v0.1', 'v0.1')).toBe(0);
  });

  it('should compare major versions correctly', () => {
    expect(compareVersions('v0.9', 'v1.0')).toBeLessThan(0);
  });

  it('should compare versions with different major numbers', () => {
    expect(compareVersions('v2.0', 'v1.9')).toBeGreaterThan(0);
  });
});

describe('normalizeVersion', () => {
  it('should add v prefix if missing', () => {
    expect(normalizeVersion('0.1')).toBe('v0.1');
  });

  it('should keep v prefix if present', () => {
    expect(normalizeVersion('v0.1')).toBe('v0.1');
  });

  it('should handle versions with larger numbers', () => {
    expect(normalizeVersion('10.25')).toBe('v10.25');
  });
});

describe('getNextVersion', () => {
  it('should increment minor version', () => {
    expect(getNextVersion('v0.1')).toBe('v0.2');
  });

  it('should increment minor version correctly for larger numbers', () => {
    expect(getNextVersion('v1.9')).toBe('v1.10');
  });

  it('should handle major version 0', () => {
    expect(getNextVersion('v0.0')).toBe('v0.1');
  });
});

describe('suggestVersion', () => {
  it('should suggest v0.1 when no existing versions', () => {
    expect(suggestVersion(false, null)).toBe('v0.1');
  });

  it('should increment from latest version when versions exist', () => {
    expect(suggestVersion(true, 'v0.1')).toBe('v0.2');
  });

  it('should suggest v0.1 when hasExistingVersions is true but latestVersion is null', () => {
    expect(suggestVersion(true, null)).toBe('v0.1');
  });

  it('should increment from higher versions correctly', () => {
    expect(suggestVersion(true, 'v2.5')).toBe('v2.6');
  });
});