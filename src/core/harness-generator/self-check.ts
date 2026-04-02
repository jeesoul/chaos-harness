import { HarnessConfig, SelfCheckCondition, SelfCheckResult } from './types.js';

/**
 * Evaluate all activation conditions for a harness
 * @param harness - The harness configuration
 * @param scanResult - The project scan result
 * @returns Array of self-check results
 */
export async function evaluateActivationConditions(
  harness: HarnessConfig,
  scanResult: any
): Promise<SelfCheckResult[]> {
  const results: SelfCheckResult[] = [];

  for (const condition of harness.selfCheck.activationConditions) {
    const result = evaluateCondition(condition, scanResult);
    results.push(result);
  }

  return results;
}

/**
 * Evaluate all warning conditions for a harness
 * @param harness - The harness configuration
 * @param scanResult - The project scan result
 * @returns Array of self-check results
 */
export async function evaluateWarningConditions(
  harness: HarnessConfig,
  scanResult: any
): Promise<SelfCheckResult[]> {
  const results: SelfCheckResult[] = [];

  for (const condition of harness.selfCheck.warningConditions) {
    const result = evaluateCondition(condition, scanResult);
    results.push(result);
  }

  return results;
}

/**
 * Evaluate a single condition against scan result
 * @param condition - The condition to evaluate
 * @param scanResult - The project scan result
 * @returns Self-check result
 */
function evaluateCondition(
  condition: SelfCheckCondition,
  scanResult: any
): SelfCheckResult {
  const actualValue = getNestedValue(scanResult, condition.field);
  let passed = false;

  switch (condition.operator) {
    case 'equals':
      passed = actualValue === condition.value;
      break;
    case 'contains':
      passed = String(actualValue).includes(String(condition.value));
      break;
    case 'matches':
      const regex = condition.value instanceof RegExp
        ? condition.value
        : new RegExp(String(condition.value));
      passed = regex.test(String(actualValue));
      break;
    case 'exists':
      passed = actualValue !== undefined && actualValue !== null;
      break;
    case 'notExists':
      passed = actualValue === undefined || actualValue === null;
      break;
  }

  return {
    passed,
    condition,
    actualValue,
    message: passed
      ? `✓ ${condition.description}`
      : `✗ ${condition.description} (actual: ${actualValue})`
  };
}

/**
 * Get a nested value from an object using dot notation
 * @param obj - The object to traverse
 * @param path - Dot-separated path (e.g., "projectType.type")
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Calculate activation score based on passed conditions
 * @param harness - The harness configuration
 * @param scanResult - The project scan result
 * @returns Score between 0 and 1
 */
export async function calculateActivationScore(
  harness: HarnessConfig,
  scanResult: any
): Promise<number> {
  const results = await evaluateActivationConditions(harness, scanResult);
  const passed = results.filter(r => r.passed).length;
  return results.length > 0 ? passed / results.length : 0;
}

/**
 * Determine if harness should activate based on confidence threshold
 * @param harness - The harness configuration
 * @param activationScore - The calculated activation score
 * @returns True if harness should activate
 */
export function shouldActivate(
  harness: HarnessConfig,
  activationScore: number
): boolean {
  return activationScore >= harness.identity.confidenceThreshold;
}

/**
 * Check if project has changed beyond threshold
 * @param harness - The harness configuration
 * @param currentScanResult - Current scan result
 * @param previousScanResult - Previous scan result for comparison
 * @returns True if changes exceed threshold, suggesting harness upgrade
 */
export function checkChangeMonitor(
  harness: HarnessConfig,
  currentScanResult: any,
  previousScanResult: any
): {
  changedFiles: string[];
  changeRatio: number;
  needsUpgrade: boolean;
} {
  const watchedFiles = harness.selfCheck.changeMonitor.watchedFiles;
  const threshold = harness.selfCheck.changeMonitor.threshold;

  const changedFiles: string[] = [];

  for (const pattern of watchedFiles) {
    // Check if file/pattern exists in current but not in previous (or vice versa)
    const currentExists = checkPatternExists(currentScanResult, pattern);
    const previousExists = checkPatternExists(previousScanResult, pattern);

    if (currentExists !== previousExists) {
      changedFiles.push(pattern);
    }
  }

  // Calculate change ratio
  const changeRatio = watchedFiles.length > 0
    ? changedFiles.length / watchedFiles.length
    : 0;

  return {
    changedFiles,
    changeRatio,
    needsUpgrade: changeRatio >= threshold
  };
}

/**
 * Check if a pattern exists in scan result
 * @param scanResult - Scan result to check
 * @param pattern - File pattern to look for
 * @returns True if pattern exists
 */
function checkPatternExists(scanResult: any, pattern: string): boolean {
  // Check in various scan result fields
  const fieldsToCheck = [
    'files',
    'dependencies',
    'configFiles',
    'sourceFiles'
  ];

  for (const field of fieldsToCheck) {
    const value = scanResult[field];
    if (Array.isArray(value)) {
      if (value.some(item => {
        if (typeof item === 'string') return item.includes(pattern);
        if (typeof item === 'object') return item.path?.includes(pattern) || item.name?.includes(pattern);
        return false;
      })) {
        return true;
      }
    }
  }

  // Check specific known fields
  if (pattern.includes('pom.xml') && scanResult.buildTool?.name === 'Maven') return true;
  if (pattern.includes('package.json') && scanResult.buildTool?.name === 'npm') return true;
  if (pattern.includes('requirements.txt') && scanResult.language?.name?.includes('Python')) return true;

  return false;
}