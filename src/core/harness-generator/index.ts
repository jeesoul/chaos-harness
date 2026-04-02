/**
 * Chaos Harness Generator - Entry Integration
 *
 * NO HARNESS WITHOUT SCAN RESULTS
 * Harness必须具备自我意识
 */

import { loadTemplate, findBestTemplate, listTemplates } from './template-loader.js';
import {
  evaluateActivationConditions,
  evaluateWarningConditions,
  calculateActivationScore,
  shouldActivate
} from './self-check.js';
import {
  buildDynamicRules,
  extractPrivateRepos,
  inferBuildCommands,
  detectTestFramework,
  inferCodeStyle
} from './dynamic-rules.js';
import {
  detectBypassAttempt,
  generateRebuttal,
  getIronLawForBypass,
  DEFAULT_ANTI_BYPASS_RULES
} from './anti-bypass.js';
import {
  EffectivenessTracker,
  formatEffectivenessMarkdown
} from './effectiveness.js';
import {
  HarnessConfig,
  HarnessGenerateOptions,
  HarnessValidationResult,
  SelfCheckResult,
  DynamicRules
} from './types.js';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

/**
 * Generate a harness configuration from scan results
 *
 * @param options - Generation options including scan result and output path
 * @returns Complete harness configuration
 *
 * @example
 * const harness = await generateHarness({
 *   scanResult: { projectType: 'java-spring', ... },
 *   outputPath: './output/v0.1/Harness'
 * });
 */
export async function generateHarness(options: HarnessGenerateOptions): Promise<HarnessConfig> {
  const { scanResult, outputPath, templateOverride, customRules } = options;

  // Step 1: Find or use specified template
  const templateName = templateOverride || await findBestTemplate(scanResult);
  const template = await loadTemplate(templateName);

  // Step 2: Build dynamic rules from scan result
  const dynamicRules = buildDynamicRules(scanResult);

  // Step 3: Merge with custom rules if provided
  const mergedConfig: HarnessConfig = {
    ...template,
    identity: {
      ...template.identity,
      createdAt: new Date().toISOString(),
      createdBy: 'scanner'
    },
    dynamicRules: {
      ...template.dynamicRules,
      ...dynamicRules
    },
    ...customRules
  };

  // Step 4: Validate harness
  const validation = validateHarness(mergedConfig);
  if (!validation.valid) {
    throw new Error(`Invalid harness configuration: ${validation.errors.join(', ')}`);
  }

  // Step 5: Write to output path if specified
  if (outputPath) {
    await writeHarnessFiles(mergedConfig, outputPath, templateName);
  }

  return mergedConfig;
}

/**
 * Validate a harness configuration
 *
 * @param config - Harness configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateHarness(config: HarnessConfig): HarnessValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required identity fields
  if (!config.identity?.name) {
    errors.push('identity.name is required');
  }
  if (!config.identity?.version) {
    errors.push('identity.version is required');
  }
  if (!config.identity?.confidenceThreshold || config.identity.confidenceThreshold < 0 || config.identity.confidenceThreshold > 1) {
    errors.push('identity.confidenceThreshold must be between 0 and 1');
  }

  // Check iron laws
  if (!config.ironLaws || config.ironLaws.length === 0) {
    errors.push('ironLaws must have at least one rule');
  }

  // Check self-check conditions
  if (!config.selfCheck?.activationConditions || config.selfCheck.activationConditions.length === 0) {
    warnings.push('selfCheck.activationConditions is empty - harness will always activate');
  }

  // Check dynamic rules
  if (!config.dynamicRules?.buildCommands) {
    warnings.push('dynamicRules.buildCommands is missing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export harness configuration as YAML string
 *
 * @param config - Harness configuration
 * @returns YAML string representation
 */
export function exportHarnessYaml(config: HarnessConfig): string {
  return yaml.stringify(config);
}

/**
 * Export harness configuration as Markdown document
 *
 * @param config - Harness configuration
 * @returns Markdown string representation
 */
export function exportHarnessMarkdown(config: HarnessConfig): string {
  const lines: string[] = [
    `# ${config.identity.name}`,
    '',
    `**Version:** ${config.identity.version}`,
    `**Created:** ${config.identity.createdAt}`,
    `**Created By:** ${config.identity.createdBy}`,
    '',
    `## Suitable For`,
    '',
    ...config.identity.suitableFor.map(s => `- ${s}`),
    '',
    `**Confidence Threshold:** ${config.identity.confidenceThreshold}`,
    '',
    '## Iron Laws',
    '',
    '| ID | Rule | Enforcement |',
    '|----|------|-------------|',
    ...config.ironLaws.map(il =>
      `| ${il.id} | ${il.rule} | ${il.enforcement} |`
    ),
    '',
    '## Recommendations',
    '',
    ...config.recommendations.map(r =>
      `- **${r.id}:** ${r.rule}${r.skipCondition ? ` (skip if: ${r.skipCondition})` : ''}`
    ),
    '',
    '## Dynamic Rules',
    '',
    '### Build Commands',
    '',
    `- Standard: \`${config.dynamicRules.buildCommands.standard}\``,
    `- With Tests: \`${config.dynamicRules.buildCommands.withTests}\``,
    '',
    '### Test Framework',
    '',
    `- Primary: ${config.dynamicRules.testFramework.primary}`,
    config.dynamicRules.testFramework.mock ? `- Mock: ${config.dynamicRules.testFramework.mock}` : '',
    '',
    '## Anti-Bypass Rules',
    '',
    ...config.antiBypass.map(ab =>
      `- **${ab.excuse}:** ${ab.rebuttal}`
    ),
    ''
  ];

  return lines.join('\n');
}

/**
 * Evaluate a harness against a project
 *
 * @param harness - Harness configuration
 * @param scanResult - Project scan result
 * @returns Evaluation results
 */
export async function evaluateHarness(
  harness: HarnessConfig,
  scanResult: any
): Promise<{
  activationScore: number;
  shouldActivate: boolean;
  activationResults: SelfCheckResult[];
  warningResults: SelfCheckResult[];
}> {
  const activationResults = await evaluateActivationConditions(harness, scanResult);
  const warningResults = await evaluateWarningConditions(harness, scanResult);
  const activationScore = await calculateActivationScore(harness, scanResult);
  const canActivate = shouldActivate(harness, activationScore);

  return {
    activationScore,
    shouldActivate: canActivate,
    activationResults,
    warningResults
  };
}

/**
 * Write harness files to output directory
 *
 * @param config - Harness configuration
 * @param outputPath - Output directory path
 * @param templateName - Template name used
 */
async function writeHarnessFiles(
  config: HarnessConfig,
  outputPath: string,
  templateName: string
): Promise<void> {
  // Ensure output directory exists
  await fs.mkdir(outputPath, { recursive: true });

  // Write harness.yaml
  const yamlContent = exportHarnessYaml(config);
  await fs.writeFile(path.join(outputPath, 'harness.yaml'), yamlContent);

  // Write harness.md
  const markdownContent = exportHarnessMarkdown(config);
  await fs.writeFile(path.join(outputPath, 'harness.md'), markdownContent);

  // Write template info
  await fs.writeFile(
    path.join(outputPath, 'template-info.json'),
    JSON.stringify({
      templateName,
      generatedAt: new Date().toISOString()
    })
  );
}

// Re-export all submodules
export {
  // Template loader
  loadTemplate,
  findBestTemplate,
  listTemplates,

  // Self-check
  evaluateActivationConditions,
  evaluateWarningConditions,
  calculateActivationScore,
  shouldActivate,

  // Dynamic rules
  buildDynamicRules,
  extractPrivateRepos,
  inferBuildCommands,
  detectTestFramework,
  inferCodeStyle,

  // Anti-bypass
  detectBypassAttempt,
  generateRebuttal,
  getIronLawForBypass,
  DEFAULT_ANTI_BYPASS_RULES,

  // Effectiveness
  EffectivenessTracker,
  formatEffectivenessMarkdown
};

// Export types
export type {
  HarnessConfig,
  HarnessIdentity,
  HarnessGenerateOptions,
  HarnessValidationResult,
  IronLaw,
  Recommendation,
  SelfCheckCondition,
  SelfCheckResult,
  DynamicRules,
  AntiBypassRule,
  EffectivenessRecord
} from './types.js';