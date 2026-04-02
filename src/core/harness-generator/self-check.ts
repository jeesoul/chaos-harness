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