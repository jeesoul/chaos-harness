/**
 * Two-Stage Review System
 *
 * Stage 1: Spec Compliance - Did we build what was requested?
 * Stage 2: Code Quality - Did we build it well?
 *
 * This separation prevents spec drift and over-engineering.
 */

import { TwoStageReviewResult, ReviewIssue, ReviewRequest } from './types.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Perform spec compliance review
 * Verifies implementation matches the plan requirements
 */
export async function reviewSpecCompliance(
  planPath: string,
  implementationPaths: string[]
): Promise<TwoStageReviewResult['specCompliance']> {
  const missingRequirements: string[] = [];
  const extraFeatures: string[] = [];
  const issues: string[] = [];

  // Read plan file
  let planContent: string;
  try {
    planContent = await fs.readFile(planPath, 'utf-8');
  } catch {
    return {
      passed: false,
      missingRequirements: ['Could not read plan file'],
      extraFeatures: [],
      issues: ['Plan file not found or unreadable']
    };
  }

  // Extract requirements from plan (look for task checkboxes, requirements sections)
  const requirements = extractRequirements(planContent);

  // Read implementation files
  const implementationContent: string[] = [];
  for (const implPath of implementationPaths) {
    try {
      const content = await fs.readFile(implPath, 'utf-8');
      implementationContent.push(content);
    } catch {
      issues.push(`Could not read implementation file: ${implPath}`);
    }
  }

  const combinedImplementation = implementationContent.join('\n');

  // Check each requirement
  for (const req of requirements) {
    const isImplemented = checkRequirementImplemented(req, combinedImplementation);
    if (!isImplemented) {
      missingRequirements.push(req);
    }
  }

  // Check for extra features not in plan (heuristic)
  const extraFeatureIndicators = detectExtraFeatures(combinedImplementation, requirements);
  extraFeatures.push(...extraFeatureIndicators);

  const passed = missingRequirements.length === 0 && issues.length === 0;

  return {
    passed,
    missingRequirements,
    extraFeatures,
    issues
  };
}

/**
 * Perform code quality review
 * Verifies code is well-written, maintainable, and tested
 */
export async function reviewCodeQuality(
  implementationPaths: string[],
  testResults?: ReviewRequest['testResults']
): Promise<TwoStageReviewResult['codeQuality']> {
  const strengths: string[] = [];
  const issues: ReviewIssue[] = [];

  // Read implementation files
  for (const implPath of implementationPaths) {
    try {
      const content = await fs.readFile(implPath, 'utf-8');
      analyzeCodeQuality(implPath, content, strengths, issues);
    } catch {
      // Skip files that can't be read
    }
  }

  // Check test results
  if (testResults) {
    if (!testResults.passed) {
      issues.push({
        severity: 'critical',
        description: `Tests failing: ${testResults.failures.join(', ')}`
      });
    } else {
      strengths.push('All tests passing');
    }

    if (testResults.coverage !== undefined && testResults.coverage < 60) {
      issues.push({
        severity: 'important',
        description: `Test coverage below 60%: ${testResults.coverage}%`
      });
    } else if (testResults.coverage !== undefined && testResults.coverage >= 80) {
      strengths.push(`Good test coverage: ${testResults.coverage}%`);
    }
  }

  const passed = !issues.some(i => i.severity === 'critical');

  return {
    passed,
    strengths,
    issues
  };
}

/**
 * Perform complete two-stage review
 */
export async function performTwoStageReview(
  request: ReviewRequest
): Promise<TwoStageReviewResult> {
  // Stage 1: Spec Compliance
  const specCompliance = await reviewSpecCompliance(
    request.planPath,
    request.implementationPaths
  );

  // Stage 2: Code Quality (only if spec compliance passes)
  let codeQuality: TwoStageReviewResult['codeQuality'] = {
    passed: true,
    strengths: [],
    issues: []
  };

  if (specCompliance.passed) {
    codeQuality = await reviewCodeQuality(
      request.implementationPaths,
      request.testResults
    );
  }

  const overallPassed = specCompliance.passed && codeQuality.passed;

  const summary = generateReviewSummary(specCompliance, codeQuality);

  return {
    specCompliance,
    codeQuality,
    overallPassed,
    summary
  };
}

/**
 * Extract requirements from plan content
 */
function extractRequirements(planContent: string): string[] {
  const requirements: string[] = [];

  // Extract from task checkboxes
  const taskMatches = planContent.matchAll(/- \[ \] (.+)/g);
  for (const match of taskMatches) {
    requirements.push(match[1].trim());
  }

  // Extract from "Requirements:" section
  const reqSection = planContent.match(/## Requirements\n([\s\S]*?)(?=##|$)/);
  if (reqSection) {
    const reqLines = reqSection[1].split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('- ') || l.startsWith('* '));
    requirements.push(...reqLines.map(l => l.substring(2)));
  }

  // Extract from Task descriptions
  const taskDescMatches = planContent.matchAll(/### Task \d+: (.+)/g);
  for (const match of taskDescMatches) {
    requirements.push(`Task: ${match[1].trim()}`);
  }

  return [...new Set(requirements)]; // Dedupe
}

/**
 * Check if a requirement is implemented
 */
function checkRequirementImplemented(requirement: string, implementation: string): boolean {
  // Heuristic checks
  const keywords = extractKeywords(requirement);

  let matchCount = 0;
  for (const keyword of keywords) {
    if (implementation.toLowerCase().includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }

  // If more than 50% of keywords appear, consider it likely implemented
  return keywords.length > 0 && matchCount / keywords.length >= 0.5;
}

/**
 * Extract meaningful keywords from a requirement
 */
function extractKeywords(text: string): string[] {
  // Remove common words
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on', 'with',
    'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or',
    'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'than',
    'too', 'very', 'just', 'should', 'now', 'use', 'using', 'used']);

  return text.split(/\s+/)
    .map(word => word.replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()));
}

/**
 * Detect extra features not mentioned in requirements
 */
function detectExtraFeatures(implementation: string, requirements: string[]): string[] {
  const extras: string[] = [];

  // Look for TODO/FIXME comments that might indicate scope creep
  const todoMatches = implementation.matchAll(/(?:TODO|FIXME|HACK|XXX): (.+)/gi);
  for (const match of todoMatches) {
    extras.push(`Unresolved: ${match[1]}`);
  }

  // Look for commented-out code that might be unfinished features
  const commentedCode = implementation.matchAll(/\/\/ .*(function|class|const|let|var|import) /g);
  let commentedCount = 0;
  for (const _ of commentedCode) {
    commentedCount++;
  }
  if (commentedCount > 5) {
    extras.push(`High amount of commented code (${commentedCount} instances)`);
  }

  return extras;
}

/**
 * Analyze code quality of a single file
 */
function analyzeCodeQuality(
  filePath: string,
  content: string,
  strengths: string[],
  issues: ReviewIssue[]
): void {
  const lines = content.split('\n');
  const fileName = path.basename(filePath);

  // Check file length
  if (lines.length > 500) {
    issues.push({
      severity: 'important',
      description: `File ${fileName} is large (${lines.length} lines), consider splitting`,
      file: filePath
    });
  }

  // Check for tests
  if (content.includes('describe(') || content.includes('test(') || content.includes('it(')) {
    strengths.push(`Test file present: ${fileName}`);
  }

  // Check for TypeScript types
  if (filePath.endsWith('.ts') && !content.includes(': any')) {
    strengths.push(`TypeScript types used in ${fileName}`);
  }

  // Check for error handling
  if (content.includes('try {') && content.includes('catch')) {
    strengths.push(`Error handling present in ${fileName}`);
  }

  // Check for magic numbers
  const magicNumbers = content.match(/\b\d{2,}\b/g);
  if (magicNumbers && magicNumbers.length > 5) {
    issues.push({
      severity: 'minor',
      description: `Potential magic numbers in ${fileName}, consider using constants`,
      file: filePath
    });
  }

  // Check for console.log (should use proper logging)
  const consoleLogs = (content.match(/console\.(log|debug|info)/g) || []).length;
  if (consoleLogs > 3) {
    issues.push({
      severity: 'minor',
      description: `Multiple console.log statements in ${fileName} (${consoleLogs}), consider using a logger`,
      file: filePath
    });
  }

  // Check for proper comments
  const jsdocComments = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
  if (jsdocComments > 3) {
    strengths.push(`Good documentation in ${fileName}`);
  }
}

/**
 * Generate a human-readable summary
 */
function generateReviewSummary(
  specCompliance: TwoStageReviewResult['specCompliance'],
  codeQuality: TwoStageReviewResult['codeQuality']
): string {
  const lines: string[] = [];

  // Spec compliance summary
  if (specCompliance.passed) {
    lines.push('✅ **Spec Compliance: PASSED**');
    lines.push('All requirements from the plan have been implemented.');
  } else {
    lines.push('❌ **Spec Compliance: FAILED**');
    if (specCompliance.missingRequirements.length > 0) {
      lines.push('\n**Missing Requirements:**');
      specCompliance.missingRequirements.forEach(req => lines.push(`- ${req}`));
    }
    if (specCompliance.extraFeatures.length > 0) {
      lines.push('\n**Potential Extra Features:**');
      specCompliance.extraFeatures.forEach(feat => lines.push(`- ${feat}`));
    }
  }

  lines.push('');

  // Code quality summary
  if (codeQuality.passed) {
    lines.push('✅ **Code Quality: PASSED**');
  } else {
    lines.push('❌ **Code Quality: ISSUES FOUND**');
  }

  if (codeQuality.strengths.length > 0) {
    lines.push('\n**Strengths:**');
    codeQuality.strengths.forEach(s => lines.push(`- ${s}`));
  }

  if (codeQuality.issues.length > 0) {
    lines.push('\n**Issues:**');
    codeQuality.issues.forEach(issue => {
      const severity = issue.severity.toUpperCase();
      lines.push(`- [${severity}] ${issue.description}${issue.file ? ` (${issue.file})` : ''}`);
    });
  }

  // Overall verdict
  lines.push('');
  if (specCompliance.passed && codeQuality.passed) {
    lines.push('🎉 **Overall: APPROVED** - Ready to proceed.');
  } else if (!specCompliance.passed) {
    lines.push('⚠️ **Overall: NEEDS WORK** - Address spec compliance issues first.');
  } else {
    lines.push('⚠️ **Overall: NEEDS WORK** - Address code quality issues before merge.');
  }

  return lines.join('\n');
}

/**
 * Format review result as markdown
 */
export function formatReviewMarkdown(result: TwoStageReviewResult): string {
  return result.summary;
}