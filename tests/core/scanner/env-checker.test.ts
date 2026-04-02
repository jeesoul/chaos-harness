import { describe, it, expect } from 'vitest';
import {
  checkEnvironment,
  parseJavaVersion,
  parseNodeVersion,
  parsePythonVersion,
  compareVersions
} from '../../../src/core/scanner/env-checker.js';
import type { EnvCheckResult } from '../../../src/core/scanner/env-checker.js';

describe('env-checker', () => {
  describe('parseJavaVersion', () => {
    it('should parse Java 1.8 format', () => {
      const output = 'java version "1.8.0_391"\nJava(TM) SE Runtime Environment';
      expect(parseJavaVersion(output)).toBe('1.8.0');
    });

    it('should parse Java 8 format', () => {
      const output = 'openjdk version "8.0.392" OpenJDK Runtime Environment';
      expect(parseJavaVersion(output)).toBe('8.0.392');
    });

    it('should parse Java 17 format', () => {
      const output = 'openjdk version "17.0.1" OpenJDK Runtime Environment';
      expect(parseJavaVersion(output)).toBe('17.0.1');
    });

    it('should parse Java 21 format', () => {
      const output = 'openjdk version "21.0.2" OpenJDK Runtime Environment';
      expect(parseJavaVersion(output)).toBe('21.0.2');
    });

    it('should return null for invalid output', () => {
      expect(parseJavaVersion('')).toBeNull();
      expect(parseJavaVersion('no version here')).toBeNull();
    });
  });

  describe('parseNodeVersion', () => {
    it('should parse Node version with v prefix', () => {
      const output = 'v18.19.0';
      expect(parseNodeVersion(output)).toBe('18.19.0');
    });

    it('should parse Node version 20', () => {
      const output = 'v20.11.0';
      expect(parseNodeVersion(output)).toBe('20.11.0');
    });

    it('should parse Node version 22', () => {
      const output = 'v22.0.0';
      expect(parseNodeVersion(output)).toBe('22.0.0');
    });

    it('should return null for invalid output', () => {
      expect(parseNodeVersion('')).toBeNull();
      expect(parseNodeVersion('invalid')).toBeNull();
    });
  });

  describe('parsePythonVersion', () => {
    it('should parse Python 3.11 format', () => {
      const output = 'Python 3.11.0';
      expect(parsePythonVersion(output)).toBe('3.11.0');
    });

    it('should parse Python 3.12 format', () => {
      const output = 'Python 3.12.1';
      expect(parsePythonVersion(output)).toBe('3.12.1');
    });

    it('should parse Python 3.10 format', () => {
      const output = 'Python 3.10.13';
      expect(parsePythonVersion(output)).toBe('3.10.13');
    });

    it('should return null for invalid output', () => {
      expect(parsePythonVersion('')).toBeNull();
      expect(parsePythonVersion('not python')).toBeNull();
    });
  });

  describe('compareVersions', () => {
    it('should return true when installed version equals required', () => {
      expect(compareVersions('17.0.1', '17.0.1')).toBe(true);
      expect(compareVersions('18.19.0', '18.19.0')).toBe(true);
    });

    it('should return true when installed version is higher', () => {
      expect(compareVersions('18.0.0', '17.0.0')).toBe(true);
      expect(compareVersions('17.1.0', '17.0.0')).toBe(true);
      expect(compareVersions('17.0.2', '17.0.1')).toBe(true);
    });

    it('should return false when installed version is lower', () => {
      expect(compareVersions('16.0.0', '17.0.0')).toBe(false);
      expect(compareVersions('17.0.0', '17.1.0')).toBe(false);
      expect(compareVersions('17.0.1', '17.0.2')).toBe(false);
    });

    it('should handle Java 1.8 = Java 8 equivalence', () => {
      // Java 1.8 should equal Java 8
      expect(compareVersions('1.8.0', '8')).toBe(true);
      expect(compareVersions('1.8.0_391', '8')).toBe(true);
      expect(compareVersions('8.0.392', '1.8')).toBe(true);
    });

    it('should handle version without patch', () => {
      expect(compareVersions('18', '18')).toBe(true);
      expect(compareVersions('18.19', '18.19')).toBe(true);
      expect(compareVersions('18.19', '18.18')).toBe(true);
      expect(compareVersions('18.18', '18.19')).toBe(false);
    });

    it('should handle different version lengths', () => {
      expect(compareVersions('18.19.0', '18')).toBe(true);
      expect(compareVersions('17', '17.0.1')).toBe(false);
    });
  });

  describe('checkEnvironment', () => {
    it('should check all required tools', async () => {
      const requirements = {
        java: '8',
        node: '18',
        python: '3.10',
        maven: '3.6',
        git: '2.0'
      };

      const results = await checkEnvironment(requirements);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(5);

      // Check that all tools are present in results
      const toolNames = results.map(r => r.tool);
      expect(toolNames).toContain('java');
      expect(toolNames).toContain('node');
      expect(toolNames).toContain('python');
      expect(toolNames).toContain('maven');
      expect(toolNames).toContain('git');
    });

    it('should return correct structure for each tool', async () => {
      const requirements = { node: '18' };
      const results = await checkEnvironment(requirements);

      expect(results.length).toBe(1);
      const result = results[0];

      expect(result).toHaveProperty('tool');
      expect(result).toHaveProperty('installed');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('required');
      expect(result).toHaveProperty('satisfied');
    });

    it('should handle missing tools gracefully', async () => {
      const requirements = {
        nonexistentTool: '1.0'
      };

      const results = await checkEnvironment(requirements);

      expect(results.length).toBe(1);
      const result = results[0];

      expect(result.tool).toBe('nonexistentTool');
      expect(result.installed).toBe(false);
      expect(result.version).toBeNull();
      expect(result.satisfied).toBe(false);
    });

    it('should handle empty requirements', async () => {
      const results = await checkEnvironment({});
      expect(results).toEqual([]);
    });

    it('should mark satisfied correctly when version meets requirement', async () => {
      const requirements = { node: '1' }; // Very low version requirement
      const results = await checkEnvironment(requirements);

      if (results[0].installed) {
        expect(results[0].satisfied).toBe(true);
      }
    });

    it('should set required field from requirements', async () => {
      const requirements = {
        java: '11',
        node: '18.0.0'
      };

      const results = await checkEnvironment(requirements);

      const javaResult = results.find(r => r.tool === 'java');
      const nodeResult = results.find(r => r.tool === 'node');

      expect(javaResult?.required).toBe('11');
      expect(nodeResult?.required).toBe('18.0.0');
    });
  });
});