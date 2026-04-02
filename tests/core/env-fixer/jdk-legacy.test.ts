// tests/core/env-fixer/jdk-legacy.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeJdkLegacy, getKnownIssues, getCompatibleVersions } from '../../../src/core/env-fixer/jdk-legacy.js';

describe('JdkLegacyHandler', () => {
  it('should detect JDK 8 as legacy', () => {
    const result = analyzeJdkLegacy('1.8');
    expect(result.isLegacy).toBe(true);
  });

  it('should detect JDK 1.8.0_xxx as legacy', () => {
    const result = analyzeJdkLegacy('1.8.0_391');
    expect(result.isLegacy).toBe(true);
  });

  it('should not mark JDK 17 as legacy', () => {
    const result = analyzeJdkLegacy('17');
    expect(result.isLegacy).toBe(false);
  });

  it('should return known issues for JDK 8', () => {
    const issues = getKnownIssues('1.8');
    expect(issues).toContain('lombok版本需≤1.18.20');
    expect(issues).toContain('不支持var关键字');
  });

  it('should return compatible versions for JDK 8 + Spring Boot 2.x', () => {
    const versions = getCompatibleVersions('1.8', '2.17.1');
    expect(versions.lombok).toBe('≤1.18.20');
    expect(versions.junit).toBe('JUnit 4 或 JUnit 5 Vintage Engine');
  });
});