import { describe, it, expect } from 'vitest';
import {
  evaluateActivationConditions,
  evaluateWarningConditions,
  calculateActivationScore,
  shouldActivate,
  checkChangeMonitor
} from '../../../src/core/harness-generator/self-check.js';
import { loadTemplate } from '../../../src/core/harness-generator/template-loader.js';
import { HarnessConfig } from '../../../src/core/harness-generator/types.js';

describe('SelfCheck', () => {
  describe('evaluateActivationConditions', () => {
    it('should pass when all conditions match', async () => {
      const harness = await loadTemplate('java-spring');
      const scanResult = {
        projectType: { type: 'java-spring' },
        buildTool: { name: 'maven' }
      };
      const results = await evaluateActivationConditions(harness, scanResult);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('should fail when condition not met', async () => {
      const harness = await loadTemplate('java-spring');
      const scanResult = {
        projectType: { type: 'java-spring' },
        buildTool: { name: 'gradle' }
      };
      const results = await evaluateActivationConditions(harness, scanResult);
      expect(results.some(r => !r.passed)).toBe(true);
    });

    it('should return empty array for harness with no activation conditions', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };
      const results = await evaluateActivationConditions(harness, {});
      expect(results).toEqual([]);
    });

    it('should handle missing fields gracefully', async () => {
      const harness = await loadTemplate('java-spring');
      const scanResult = {};
      const results = await evaluateActivationConditions(harness, scanResult);
      expect(results.every(r => !r.passed)).toBe(true);
    });
  });

  describe('evaluateWarningConditions', () => {
    it('should warn when legacy Java version detected', async () => {
      const harness = await loadTemplate('java-spring');
      const scanResult = {
        language: { version: '1.8.0' }
      };
      const results = await evaluateWarningConditions(harness, scanResult);
      expect(results.some(r => r.passed)).toBe(true);
    });

    it('should not warn when modern Java version used', async () => {
      const harness = await loadTemplate('java-spring');
      const scanResult = {
        language: { version: '17.0.1' }
      };
      const results = await evaluateWarningConditions(harness, scanResult);
      expect(results.every(r => !r.passed)).toBe(true);
    });

    it('should return empty array for harness with no warning conditions', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };
      const results = await evaluateWarningConditions(harness, {});
      expect(results).toEqual([]);
    });
  });

  describe('calculateActivationScore', () => {
    it('should return 1.0 when all conditions pass', async () => {
      const harness = await loadTemplate('java-spring');
      const scanResult = {
        projectType: { type: 'java-spring' },
        buildTool: { name: 'maven' }
      };
      const score = await calculateActivationScore(harness, scanResult);
      expect(score).toBe(1.0);
    });

    it('should return 0.0 when no conditions pass', async () => {
      const harness = await loadTemplate('java-spring');
      const scanResult = {};
      const score = await calculateActivationScore(harness, scanResult);
      expect(score).toBe(0.0);
    });

    it('should return 0.5 when half of conditions pass', async () => {
      const harness = await loadTemplate('java-spring');
      const scanResult = {
        projectType: { type: 'java-spring' }
      };
      const score = await calculateActivationScore(harness, scanResult);
      expect(score).toBe(0.5);
    });

    it('should return 0 for harness with no activation conditions', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };
      const score = await calculateActivationScore(harness, {});
      expect(score).toBe(0);
    });
  });

  describe('shouldActivate', () => {
    it('should return true when score meets threshold', async () => {
      const harness = await loadTemplate('java-spring');
      const result = shouldActivate(harness, 0.8);
      expect(result).toBe(true);
    });

    it('should return false when score below threshold', async () => {
      const harness = await loadTemplate('java-spring');
      const result = shouldActivate(harness, 0.5);
      expect(result).toBe(false);
    });

    it('should return true when score exceeds threshold', async () => {
      const harness = await loadTemplate('java-spring');
      const result = shouldActivate(harness, 1.0);
      expect(result).toBe(true);
    });
  });

  describe('evaluateCondition operators', () => {
    it('should handle equals operator', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [
            {
              field: 'name',
              operator: 'equals',
              value: 'test-project',
              description: 'Project name matches'
            }
          ],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const passResult = await evaluateActivationConditions(harness, { name: 'test-project' });
      expect(passResult[0].passed).toBe(true);

      const failResult = await evaluateActivationConditions(harness, { name: 'other-project' });
      expect(failResult[0].passed).toBe(false);
    });

    it('should handle contains operator', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [
            {
              field: 'description',
              operator: 'contains',
              value: 'spring',
              description: 'Description contains spring'
            }
          ],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const passResult = await evaluateActivationConditions(harness, { description: 'a spring boot project' });
      expect(passResult[0].passed).toBe(true);

      const failResult = await evaluateActivationConditions(harness, { description: 'a node project' });
      expect(failResult[0].passed).toBe(false);
    });

    it('should handle matches operator', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [
            {
              field: 'version',
              operator: 'matches',
              value: '^\\d+\\.\\d+\\.\\d+$',
              description: 'Version follows semver'
            }
          ],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const passResult = await evaluateActivationConditions(harness, { version: '1.0.0' });
      expect(passResult[0].passed).toBe(true);

      const failResult = await evaluateActivationConditions(harness, { version: 'v1.0' });
      expect(failResult[0].passed).toBe(false);
    });

    it('should handle exists operator', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [
            {
              field: 'configFile',
              operator: 'exists',
              value: '',
              description: 'Config file exists'
            }
          ],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const passResult = await evaluateActivationConditions(harness, { configFile: 'config.yml' });
      expect(passResult[0].passed).toBe(true);

      const failResult = await evaluateActivationConditions(harness, {});
      expect(failResult[0].passed).toBe(false);
    });

    it('should handle notExists operator', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [
            {
              field: 'deprecatedFile',
              operator: 'notExists',
              value: '',
              description: 'Deprecated file should not exist'
            }
          ],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const passResult = await evaluateActivationConditions(harness, {});
      expect(passResult[0].passed).toBe(true);

      const failResult = await evaluateActivationConditions(harness, { deprecatedFile: 'old-config.xml' });
      expect(failResult[0].passed).toBe(false);
    });
  });

  describe('checkChangeMonitor', () => {
    it('should detect changes in watched files', async () => {
      const harness = await loadTemplate('java-spring');
      const currentScanResult = {
        buildTool: { name: 'Gradle' }, // Changed from Maven - implies pom.xml changed to build.gradle
        files: ['build.gradle', 'application.yml', 'src/main.java']
      };
      const previousScanResult = {
        buildTool: { name: 'Maven' },
        files: ['pom.xml', 'application.yml', 'src/main.java']
      };

      const result = checkChangeMonitor(harness, currentScanResult, previousScanResult);
      expect(result.changedFiles.length).toBeGreaterThan(0);
    });

    it('should return no changes when scan results match', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: ['pom.xml', 'package.json'],
            threshold: 0.5
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const currentScanResult = { buildTool: { name: 'Maven' } };
      const previousScanResult = { buildTool: { name: 'Maven' } };

      const result = checkChangeMonitor(harness, currentScanResult, previousScanResult);
      expect(result.changeRatio).toBe(0);
      expect(result.needsUpgrade).toBe(false);
    });

    it('should calculate change ratio correctly', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: ['pom.xml', 'package.json', 'requirements.txt'],
            threshold: 0.5
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const currentScanResult = { buildTool: { name: 'npm' } }; // Maven to npm
      const previousScanResult = { buildTool: { name: 'Maven' } };

      const result = checkChangeMonitor(harness, currentScanResult, previousScanResult);
      expect(result.changeRatio).toBeGreaterThan(0);
    });

    it('should return empty changed files when both are empty', async () => {
      const harness: HarnessConfig = {
        identity: {
          name: 'test-harness',
          version: '1.0.0',
          createdAt: '2026-04-02',
          createdBy: 'manual',
          suitableFor: ['test'],
          confidenceThreshold: 0.8
        },
        selfCheck: {
          activationConditions: [],
          warningConditions: [],
          changeMonitor: {
            watchedFiles: [],
            threshold: 0.5
          }
        },
        ironLaws: [],
        recommendations: [],
        dynamicRules: {
          privateRepositories: [],
          buildCommands: { standard: '', withTests: '' },
          testFramework: { primary: '' },
          inferredCodeStyle: {
            namingConvention: {},
            importStyle: ''
          }
        },
        antiBypass: [],
        effectivenessLog: ''
      };

      const result = checkChangeMonitor(harness, {}, {});
      expect(result.changedFiles).toEqual([]);
      expect(result.changeRatio).toBe(0);
    });
  });
});