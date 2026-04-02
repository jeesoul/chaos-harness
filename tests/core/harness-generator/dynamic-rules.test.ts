import { describe, it, expect } from 'vitest';
import {
  extractPrivateRepos,
  inferBuildCommands,
  detectTestFramework,
  inferCodeStyle,
  buildDynamicRules
} from '../../../src/core/harness-generator/dynamic-rules.js';

describe('DynamicRules', () => {
  describe('extractPrivateRepos', () => {
    it('should extract private repos from pom.xml', () => {
      const scanResult = {
        dependencySources: [
          { type: 'private', url: 'http://nexus.company.com/maven-public/', authRequired: true }
        ]
      };
      const repos = extractPrivateRepos(scanResult);
      expect(repos.length).toBe(1);
      expect(repos[0].url).toContain('nexus.company.com');
    });

    it('should return empty array when no private repos', () => {
      const scanResult = {
        dependencySources: [
          { type: 'public', url: 'https://repo.maven.apache.org/maven2/' }
        ]
      };
      const repos = extractPrivateRepos(scanResult);
      expect(repos.length).toBe(0);
    });

    it('should handle missing dependencySources', () => {
      const scanResult = {};
      const repos = extractPrivateRepos(scanResult);
      expect(repos.length).toBe(0);
    });

    it('should set authRequired to false by default', () => {
      const scanResult = {
        dependencySources: [
          { type: 'private', url: 'http://private.repo.com/libs/' }
        ]
      };
      const repos = extractPrivateRepos(scanResult);
      expect(repos[0].authRequired).toBe(false);
    });
  });

  describe('inferBuildCommands', () => {
    it('should return Maven commands for Java project', () => {
      const scanResult = { buildTool: { name: 'Maven' } };
      const commands = inferBuildCommands(scanResult);
      expect(commands.standard).toBe('mvn clean install -DskipTests');
      expect(commands.withTests).toBe('mvn clean install');
    });

    it('should return npm commands for Node project', () => {
      const scanResult = { buildTool: { name: 'npm' } };
      const commands = inferBuildCommands(scanResult);
      expect(commands.standard).toBe('npm install');
      expect(commands.withTests).toBe('npm test');
    });

    it('should return Gradle commands for Gradle project', () => {
      const scanResult = { buildTool: { name: 'Gradle' } };
      const commands = inferBuildCommands(scanResult);
      expect(commands.standard).toBe('./gradlew build -x test');
      expect(commands.withTests).toBe('./gradlew build');
    });

    it('should return pip commands for Python project', () => {
      const scanResult = { buildTool: { name: 'pip' } };
      const commands = inferBuildCommands(scanResult);
      expect(commands.standard).toBe('pip install -r requirements.txt');
      expect(commands.withTests).toBe('pytest');
    });

    it('should return default commands for unknown build tool', () => {
      const scanResult = { buildTool: { name: 'Unknown' } };
      const commands = inferBuildCommands(scanResult);
      expect(commands.standard).toBe('make build');
      expect(commands.withTests).toBe('make test');
    });

    it('should handle missing buildTool', () => {
      const scanResult = {};
      const commands = inferBuildCommands(scanResult);
      expect(commands.standard).toBe('make build');
      expect(commands.withTests).toBe('make test');
    });
  });

  describe('detectTestFramework', () => {
    it('should detect JUnit for Java', () => {
      const scanResult = { projectType: 'java-spring', testCoverage: { framework: 'JUnit' } };
      const framework = detectTestFramework(scanResult);
      expect(framework.primary).toBe('JUnit');
    });

    it('should infer JUnit for java-spring project type', () => {
      const scanResult = { projectType: 'java-spring' };
      const framework = detectTestFramework(scanResult);
      expect(framework.primary).toBe('JUnit');
      expect(framework.mock).toBe('Mockito');
    });

    it('should infer Jest for node-express project type', () => {
      const scanResult = { projectType: 'node-express' };
      const framework = detectTestFramework(scanResult);
      expect(framework.primary).toBe('Jest');
    });

    it('should return Unknown for unrecognized project type', () => {
      const scanResult = { projectType: 'unknown-type' };
      const framework = detectTestFramework(scanResult);
      expect(framework.primary).toBe('Unknown');
    });
  });

  describe('inferCodeStyle', () => {
    it('should detect naming conventions', () => {
      const scanResult = {
        codeStyle: {
          inferredRules: ['className: PascalCase', 'methodName: camelCase']
        }
      };
      const style = inferCodeStyle(scanResult);
      expect(style.namingConvention.className).toBe('PascalCase');
    });

    it('should return empty naming convention when no rules', () => {
      const scanResult = {};
      const style = inferCodeStyle(scanResult);
      expect(style.namingConvention).toEqual({});
    });

    it('should detect import style for Java projects', () => {
      const scanResult = { projectType: 'java-spring' };
      const style = inferCodeStyle(scanResult);
      expect(style.importStyle).toBe('full-qualified');
    });

    it('should detect import style for Python projects', () => {
      const scanResult = { projectType: 'python-django' };
      const style = inferCodeStyle(scanResult);
      expect(style.importStyle).toBe('module-import');
    });
  });

  describe('buildDynamicRules', () => {
    it('should build complete dynamic rules from scan result', () => {
      const scanResult = {
        buildTool: { name: 'Maven' },
        projectType: 'java-spring',
        dependencySources: [
          { type: 'private', url: 'http://nexus.company.com/maven-public/', authRequired: true }
        ],
        codeStyle: {
          inferredRules: ['className: PascalCase']
        }
      };
      const rules = buildDynamicRules(scanResult);
      expect(rules.privateRepositories.length).toBe(1);
      expect(rules.buildCommands.standard).toBe('mvn clean install -DskipTests');
      expect(rules.testFramework.primary).toBe('JUnit');
      expect(rules.inferredCodeStyle.namingConvention.className).toBe('PascalCase');
    });
  });
});