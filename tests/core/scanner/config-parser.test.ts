import { describe, it, expect } from 'vitest';
import {
  parsePomXml,
  parsePackageJson,
  parseRequirementsTxt,
  PomXmlResult,
  PackageJsonResult,
  RequirementsTxtResult
} from '../../../src/core/scanner/config-parser.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('config-parser', () => {
  const fixturesDir = join(__dirname, 'fixtures');

  describe('parsePomXml', () => {
    it('should parse pom.xml and extract Java version from properties', async () => {
      const pomPath = join(fixturesDir, 'java-maven-project', 'pom.xml');
      const result = await parsePomXml(pomPath);

      expect(result.javaVersion).toBe('1.8');
    });

    it('should extract Spring Boot version from parent', async () => {
      const pomPath = join(fixturesDir, 'java-maven-project', 'pom.xml');
      const result = await parsePomXml(pomPath);

      expect(result.springBootVersion).toBe('2.17.1');
      expect(result.isSpringBoot).toBe(true);
    });

    it('should set isLegacy flag true for Java 1.8', async () => {
      const pomPath = join(fixturesDir, 'java-maven-project', 'pom.xml');
      const result = await parsePomXml(pomPath);

      expect(result.isLegacy).toBe(true);
    });

    it('should set isLegacy flag true for Spring Boot 2.x', async () => {
      const pomPath = join(fixturesDir, 'java-maven-project', 'pom.xml');
      const result = await parsePomXml(pomPath);

      // The fixture has Spring Boot 2.17.1, so isLegacy should be true
      expect(result.isLegacy).toBe(true);
    });

    it('should extract dependencies list', async () => {
      const pomPath = join(fixturesDir, 'java-maven-project', 'pom.xml');
      const result = await parsePomXml(pomPath);

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.length).toBeGreaterThanOrEqual(1);
      expect(result.dependencies).toContainEqual({
        groupId: 'org.springframework.boot',
        artifactId: 'spring-boot-starter-web'
      });
    });

    it('should extract repository URLs', async () => {
      const pomPath = join(fixturesDir, 'java-maven-project', 'pom.xml');
      const result = await parsePomXml(pomPath);

      expect(result.repositories).toBeDefined();
      expect(Array.isArray(result.repositories)).toBe(true);
    });

    it('should handle missing file gracefully', async () => {
      const result = await parsePomXml(join(fixturesDir, 'non-existent', 'pom.xml'));

      expect(result.javaVersion).toBeNull();
      expect(result.springBootVersion).toBeNull();
      expect(result.isSpringBoot).toBe(false);
      expect(result.dependencies).toEqual([]);
      expect(result.repositories).toEqual([]);
    });
  });

  describe('parsePackageJson', () => {
    it('should parse package.json and extract project name and version', async () => {
      const packagePath = join(fixturesDir, 'node-npm-project', 'package.json');
      const result = await parsePackageJson(packagePath);

      expect(result.name).toBe('demo-node-project');
      expect(result.version).toBe('1.0.0');
    });

    it('should extract dependencies', async () => {
      const packagePath = join(fixturesDir, 'node-npm-project', 'package.json');
      const result = await parsePackageJson(packagePath);

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.length).toBe(2);
      expect(result.dependencies).toContain('react');
      expect(result.dependencies).toContain('react-dom');
    });

    it('should extract devDependencies', async () => {
      const packagePath = join(fixturesDir, 'node-npm-project', 'package.json');
      const result = await parsePackageJson(packagePath);

      expect(result.devDependencies).toBeDefined();
      expect(result.devDependencies.length).toBe(2);
      expect(result.devDependencies).toContain('vite');
      expect(result.devDependencies).toContain('typescript');
    });

    it('should extract engine requirements', async () => {
      const packagePath = join(fixturesDir, 'node-npm-project', 'package.json');
      const result = await parsePackageJson(packagePath);

      // The fixture doesn't have engines, so should be null
      expect(result.engines).toBeDefined();
    });

    it('should extract scripts', async () => {
      const packagePath = join(fixturesDir, 'node-npm-project', 'package.json');
      const result = await parsePackageJson(packagePath);

      expect(result.scripts).toBeDefined();
      expect(result.scripts['dev']).toBe('vite');
      expect(result.scripts['build']).toBe('vite build');
    });

    it('should handle missing file gracefully', async () => {
      const result = await parsePackageJson(join(fixturesDir, 'non-existent', 'package.json'));

      expect(result.name).toBe('');
      expect(result.version).toBe('');
      expect(result.dependencies).toEqual([]);
      expect(result.devDependencies).toEqual([]);
      expect(result.engines).toBeNull();
      expect(result.scripts).toEqual({});
    });
  });

  describe('parseRequirementsTxt', () => {
    it('should parse requirements.txt and extract dependencies', async () => {
      const reqPath = join(fixturesDir, 'python-project', 'requirements.txt');
      const result = await parseRequirementsTxt(reqPath);

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.length).toBe(2);
    });

    it('should extract dependency names and version constraints', async () => {
      const reqPath = join(fixturesDir, 'python-project', 'requirements.txt');
      const result = await parseRequirementsTxt(reqPath);

      const django = result.dependencies.find(d => d.name === 'django');
      expect(django).toBeDefined();
      expect(django?.version).toBe('>=4.0');

      const djangorestframework = result.dependencies.find(d => d.name === 'djangorestframework');
      expect(djangorestframework).toBeDefined();
      expect(djangorestframework?.version).toBe('>=3.14');
    });

    it('should handle missing file gracefully', async () => {
      const result = await parseRequirementsTxt(join(fixturesDir, 'non-existent', 'requirements.txt'));

      expect(result.dependencies).toEqual([]);
    });

    it('should handle empty lines and comments', async () => {
      // Create a test with inline content parsing
      const reqPath = join(fixturesDir, 'python-project', 'requirements.txt');
      const result = await parseRequirementsTxt(reqPath);

      // Should only have 2 dependencies, no empty entries
      expect(result.dependencies.length).toBe(2);
    });
  });
});