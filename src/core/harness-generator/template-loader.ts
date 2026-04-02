import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { HarnessConfig } from './types.js';

const TEMPLATES_DIR = path.join(process.cwd(), 'templates');

/**
 * Load a harness template by name
 * @param name - Template name (e.g., 'java-spring', 'generic')
 * @returns Parsed harness configuration
 */
export async function loadTemplate(name: string): Promise<HarnessConfig> {
  const templatePath = path.join(TEMPLATES_DIR, name, 'harness.yaml');
  const content = await fs.readFile(templatePath, 'utf-8');
  return yaml.parse(content) as HarnessConfig;
}

/**
 * List all available template names
 * @returns Array of template names
 */
export async function listTemplates(): Promise<string[]> {
  try {
    const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory())
      .map(e => e.name);
  } catch (error) {
    // Return empty array if templates directory doesn't exist
    return [];
  }
}

/**
 * Calculate match score between a template and scan result
 * @param templateName - Name of the template to evaluate
 * @param scanResult - Project scan result
 * @returns Match score between 0 and 1
 */
export async function calculateMatchScore(
  templateName: string,
  scanResult: any
): Promise<number> {
  const template = await loadTemplate(templateName);
  const suitableFor = template.identity.suitableFor;

  // Get projectType string value
  const projectTypeValue = typeof scanResult.projectType === 'string'
    ? scanResult.projectType
    : scanResult.projectType?.type || '';

  // Check for exact match - gives full score
  if (suitableFor.includes(projectTypeValue)) {
    return 1.0;
  }

  // Check if template name matches project type exactly
  if (projectTypeValue === templateName) {
    return 1.0;
  }

  // Calculate partial match score based on substring matches
  let matches = 0;
  const total = suitableFor.length;

  for (const suitable of suitableFor) {
    // Check if suitable is a substring of projectType
    if (projectTypeValue && projectTypeValue.includes(suitable)) {
      matches++;
      continue;
    }

    // Check if projectType is a substring of suitable
    if (projectTypeValue && suitable.includes(projectTypeValue)) {
      matches++;
      continue;
    }

    // Check language name
    if (scanResult.language?.name?.includes(suitable)) {
      matches++;
      continue;
    }

    // Check features array
    if (scanResult.projectType?.features && Array.isArray(scanResult.projectType.features)) {
      if (scanResult.projectType.features.some((f: string) => f.includes(suitable))) {
        matches++;
        continue;
      }
    }
  }

  return total > 0 ? matches / total : 0;
}

/**
 * Find the best matching template for a scan result
 * @param scanResult - Project scan result
 * @returns Name of the best matching template
 */
export async function findBestTemplate(scanResult: any): Promise<string> {
  const templates = await listTemplates();
  let bestMatch = 'generic';
  let bestScore = 0;

  for (const name of templates) {
    if (name === 'generic') continue;

    const score = await calculateMatchScore(name, scanResult);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = name;
    }
  }

  // Return generic if no good match found (score < 0.5)
  return bestScore >= 0.5 ? bestMatch : 'generic';
}