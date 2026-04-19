/**
 * everything-claude-code Integration Adapter
 *
 * Bridges everything-claude-code's 14 Agent definitions, 6 lifecycle Hook types,
 * 8 Rules, and 3 Context modes into the chaos-harness ecosystem.
 *
 * Usage:
 *   import * as everything from './integrations/everything/adapter.mjs';
 *
 *   const result = await everything.detect(projectRoot);
 *   if (result.detected) {
 *     const agents = await everything.getAgents(projectRoot);
 *     const recommendation = everything.recommendAgent('fix the build error');
 *   }
 *
 * @module integrations/everything/adapter
 * @since v1.4.0
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

// ---------------------------------------------------------------------------
// Constants — everything-claude-code canonical definitions
// ---------------------------------------------------------------------------

/** All 14 canonical agent identifiers */
const EVERYTHING_AGENTS = Object.freeze([
  'architecture-analyzer',
  'build-error-resolver',
  'code-reviewer',
  'context-manager',
  'dependency-auditor',
  'documentation-writer',
  'git-worktree-manager',
  'performance-analyzer',
  'refactoring-engine',
  'security-auditor',
  'session-manager',
  'tdd-guide',
  'test-generator',
  'ui-ux-reviewer',
]);

/** All 6 lifecycle hook event types */
const EVERYTHING_HOOK_TYPES = Object.freeze([
  'pre-session',
  'post-session',
  'pre-commit',
  'post-commit',
  'pre-build',
  'post-build',
]);

/** All 8 canonical rules */
const EVERYTHING_RULE_NAMES = Object.freeze([
  'agent-selection',
  'context-switching',
  'tool-usage',
  'output-format',
  'error-handling',
  'session-management',
  'file-conventions',
  'review-gate',
]);

/** All 3 context modes */
const EVERYTHING_CONTEXT_MODES = Object.freeze(['dev', 'review', 'research']);

/**
 * Keyword-to-agent mapping for the recommendation engine.
 * Maps user intent keywords to the most appropriate everything agent.
 */
const AGENT_KEYWORD_MAP = Object.freeze({
  'build-error-resolver': [
    'build', 'error', 'compile', 'fail', 'crash', 'exception', 'stack trace',
    'diagnose', 'troubleshoot', 'bug', 'fix', 'broken',
  ],
  'tdd-guide': [
    'test', 'tdd', 'unit test', 'integration test', 'jest', 'vitest',
    'mocha', 'test driven', 'test-first', 'red green',
  ],
  'code-reviewer': [
    'review', 'code review', 'pull request', 'pr', 'merge', 'feedback',
    'quality', 'lint', 'style',
  ],
  'security-auditor': [
    'security', 'vulnerability', 'cve', 'audit', 'auth', 'token',
    'encryption', 'xss', 'csrf', 'injection', 'sanitize',
  ],
  'performance-analyzer': [
    'performance', 'slow', 'optimize', 'benchmark', 'profiling', 'memory leak',
    'cpu', 'bottleneck', 'latency', 'throughput',
  ],
  'architecture-analyzer': [
    'architecture', 'design', 'pattern', 'structure', 'module',
    'dependency', 'coupling', 'cohesion', 'monolith', 'microservice',
  ],
  'refactoring-engine': [
    'refactor', 'clean up', 'restructure', 'rename', 'extract', 'simplify',
    'dry', 'duplicate', 'tech debt',
  ],
  'documentation-writer': [
    'document', 'readme', 'doc', 'api doc', 'comment', 'javadoc',
    'jsdoc', 'changelog', 'guide', 'tutorial',
  ],
  'test-generator': [
    'generate test', 'auto test', 'coverage', 'test case', 'mock',
    'stub', 'fixture', 'e2e',
  ],
  'dependency-auditor': [
    'dependency', 'package', 'npm', 'install', 'update', 'upgrade',
    'outdated', 'lockfile', 'version',
  ],
  'ui-ux-reviewer': [
    'ui', 'ux', 'design', 'accessibility', 'responsive', 'a11y',
    'layout', 'component', 'css', 'style',
  ],
  'git-worktree-manager': [
    'worktree', 'branch', 'pr', 'parallel', 'checkout', 'stash',
    'rebase', 'merge conflict',
  ],
  'context-manager': [
    'context', 'session', 'state', 'memory', 'preference',
    'workspace', 'setup',
  ],
  'session-manager': [
    'session', 'conversation', 'history', 'compact', 'summarize',
    'reset', 'new chat',
  ],
});

/**
 * Mapping from everything agents to chaos-harness skills.
 * Declares how each everything agent capability can be absorbed as a
 * sub-capability within the chaos-harness skill ecosystem.
 */
const CHAOS_MERGE_MAP = Object.freeze({
  'architecture-analyzer': {
    chaosSkill: 'product-lifecycle',
    subCapability: 'architecture-analysis',
    compatibility: 'high',
    reason: 'Product lifecycle skill already covers architecture analysis phase.',
  },
  'build-error-resolver': {
    chaosSkill: 'auto-context',
    subCapability: 'error-detection',
    compatibility: 'medium',
    reason: 'auto-context can absorb error context detection as a sub-feature.',
  },
  'code-reviewer': {
    chaosSkill: 'collaboration-reviewer',
    subCapability: 'code-review',
    compatibility: 'high',
    reason: 'Direct mapping — collaboration-reviewer handles code review workflows.',
  },
  'context-manager': {
    chaosSkill: 'project-state',
    subCapability: 'context-management',
    compatibility: 'high',
    reason: 'project-state manages session/project state — natural fit.',
  },
  'dependency-auditor': {
    chaosSkill: 'plugin-manager',
    subCapability: 'dependency-audit',
    compatibility: 'medium',
    reason: 'plugin-manager can extend to cover dependency auditing.',
  },
  'documentation-writer': {
    chaosSkill: 'harness-generator',
    subCapability: 'documentation',
    compatibility: 'low',
    reason: 'harness-generator focuses on config; doc writer is orthogonal but complementary.',
  },
  'git-worktree-manager': {
    chaosSkill: 'agent-team-orchestrator',
    subCapability: 'worktree-management',
    compatibility: 'medium',
    reason: 'Agent orchestration benefits from worktree-based parallel development.',
  },
  'performance-analyzer': {
    chaosSkill: 'overdrive',
    subCapability: 'performance-analysis',
    compatibility: 'medium',
    reason: 'overdrive (performance optimization) can include analysis sub-capability.',
  },
  'refactoring-engine': {
    chaosSkill: 'simplify',
    subCapability: 'automated-refactoring',
    compatibility: 'high',
    reason: 'simplify skill directly overlaps with refactoring engine functionality.',
  },
  'security-auditor': {
    chaosSkill: 'iron-law-enforcer',
    subCapability: 'security-audit',
    compatibility: 'medium',
    reason: 'Iron law enforcer can extend to security constraint checking.',
  },
  'session-manager': {
    chaosSkill: 'project-state',
    subCapability: 'session-management',
    compatibility: 'high',
    reason: 'project-state already handles session lifecycle concepts.',
  },
  'tdd-guide': {
    chaosSkill: 'test-assistant',
    subCapability: 'tdd-workflow',
    compatibility: 'high',
    reason: 'test-assistant can absorb TDD workflow guidance.',
  },
  'test-generator': {
    chaosSkill: 'test-assistant',
    subCapability: 'test-generation',
    compatibility: 'high',
    reason: 'test-assistant already covers test case generation.',
  },
  'ui-ux-reviewer': {
    chaosSkill: 'ui-generator',
    subCapability: 'ui-ux-review',
    compatibility: 'high',
    reason: 'ui-generator can extend to include review capabilities.',
  },
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Safely read a file, returning null if it does not exist or cannot be read.
 * @param {string} filePath - Absolute file path.
 * @returns {Promise<string|null>} File contents or null.
 */
async function safeRead(filePath) {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Check if a directory exists.
 * @param {string} dirPath - Absolute directory path.
 * @returns {Promise<boolean>}
 */
async function dirExists(dirPath) {
  try {
    const s = await stat(dirPath);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/**
 * List files in a directory matching a file extension.
 * @param {string} dirPath - Absolute directory path.
 * @param {string} ext - File extension without dot, e.g. 'md' or 'json'.
 * @returns {Promise<string[]>} Basenames of matching files.
 */
async function listFilesByExt(dirPath, ext) {
  if (!(await dirExists(dirPath))) return [];
  try {
    const entries = await readdir(dirPath);
    return entries.filter((f) => extname(f) === `.${ext}`);
  } catch {
    return [];
  }
}

/**
 * Parse YAML-like frontmatter from a markdown file.
 * Supports key: value, key: [array], and multi-line list syntax.
 * @param {string} content - Raw file content.
 * @returns {Record<string, string|string[]>} Parsed frontmatter as flat key-value pairs.
 */
function parseFrontmatter(content) {
  const fm = {};
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return fm;
  const lines = match[1].split('\n');
  let currentKey = null;
  let isList = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // List continuation (lines starting with - inside a list)
    if (isList && line.startsWith('- ')) {
      if (currentKey && Array.isArray(fm[currentKey])) {
        fm[currentKey].push(line.slice(2).trim());
      }
      continue;
    }

    // Close list mode when we hit a new key
    isList = false;

    const kvMatch = line.match(/^([\w-]+)\s*:\s*(.*)/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const value = kvMatch[2].trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      // Inline array: [a, b, c]
      fm[key] = value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (value === '') {
      // Start of a multi-line list
      isList = true;
      fm[key] = [];
      currentKey = key;
    } else {
      // Scalar value — strip surrounding quotes if present
      fm[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return fm;
}

// ---------------------------------------------------------------------------
// Public API — 8 functions
// ---------------------------------------------------------------------------

/**
 * 1. detect(projectRoot) — Detect whether an everything-claude-code installation exists.
 *
 * Checks for agents/, rules/, and hooks/ directories and their contents.
 * Returns detection results with file-level detail.
 *
 * @param {string} projectRoot - Absolute path to the project root.
 * @returns {Promise<{
 *   detected: boolean,
 *   agents: string[],
 *   rules: string[],
 *   contexts: string[],
 *   hasHooks: boolean,
 *   hookEvents: string[],
 *   agentCount: number,
 *   ruleCount: number,
 *   contextCount: number
 * }>}
 */
export async function detect(projectRoot) {
  const agentsDir = join(projectRoot, 'agents');
  const rulesDir = join(projectRoot, 'rules');
  const hooksDir = join(projectRoot, 'hooks');
  const contextsDir = join(projectRoot, 'contexts');

  const [agentFiles, ruleFiles, contextFiles, hooksJson] = await Promise.all([
    listFilesByExt(agentsDir, 'md'),
    listFilesByExt(rulesDir, 'md'),
    listFilesByExt(contextsDir, 'md'),
    safeRead(join(hooksDir, 'hooks.json')),
  ]);

  const agentNames = agentFiles.map((f) => f.replace(/\.md$/, ''));
  const ruleNames = ruleFiles.map((f) => f.replace(/\.md$/, ''));
  const contextNames = contextFiles.map((f) => f.replace(/\.md$/, ''));

  let hookEvents = [];
  if (hooksJson) {
    try {
      const parsed = JSON.parse(hooksJson);
      hookEvents = Object.keys(parsed).filter((k) => EVERYTHING_HOOK_TYPES.includes(k));
    } catch {
      // Malformed hooks.json — treat as no hooks configured
    }
  }

  const detected = agentNames.length > 0 || ruleNames.length > 0;

  return {
    detected,
    agents: agentNames,
    rules: ruleNames,
    contexts: contextNames,
    hasHooks: hookEvents.length > 0,
    hookEvents,
    agentCount: agentNames.length,
    ruleCount: ruleNames.length,
    contextCount: contextNames.length,
  };
}

/**
 * 2. getAgents(projectRoot) — List all available Agents with metadata.
 *
 * Scans agents/*.md files, parses frontmatter to extract name, description,
 * tools, model preferences, and trigger conditions.
 *
 * @param {string} projectRoot - Absolute path to the project root.
 * @returns {Promise<Array<{
 *   file: string,
 *   name: string,
 *   description: string,
 *   tools: string[],
 *   model: string,
 *   triggers: string[]
 * }>>}
 */
export async function getAgents(projectRoot) {
  const agentsDir = join(projectRoot, 'agents');
  const files = await listFilesByExt(agentsDir, 'md');
  if (files.length === 0) return [];

  const results = await Promise.all(
    files.map(async (file) => {
      const content = await safeRead(join(agentsDir, file));
      if (!content) return null;

      const fm = parseFrontmatter(content);
      const name = fm.name || file.replace(/\.md$/, '');
      const description = fm.description || 'No description provided.';

      // Normalize tools: could be string, array, or undefined
      let tools = [];
      if (typeof fm.tools === 'string') {
        tools = [fm.tools];
      } else if (Array.isArray(fm.tools)) {
        tools = fm.tools;
      }

      const model = fm.model || 'default';

      // Extract triggers from frontmatter, or derive from agent keyword map
      let triggers = [];
      if (typeof fm.triggers === 'string') {
        triggers = [fm.triggers];
      } else if (Array.isArray(fm.triggers)) {
        triggers = fm.triggers;
      }

      // If no explicit triggers, derive from the canonical agent keywords
      if (triggers.length === 0) {
        const agentId = file.replace(/\.md$/, '');
        const keywords = AGENT_KEYWORD_MAP[agentId];
        if (keywords) {
          triggers = keywords.slice(0, 5);
        }
      }

      return {
        file,
        name,
        description,
        tools,
        model,
        triggers,
      };
    }),
  );

  return results.filter(Boolean);
}

/**
 * 3. getRules(projectRoot) — List all rules defined in the project.
 *
 * Scans rules/*.md files and extracts rule metadata from frontmatter.
 * Returns rule name, description, and body content (stripped of frontmatter).
 *
 * @param {string} projectRoot - Absolute path to the project root.
 * @returns {Promise<Array<{
 *   file: string,
 *   name: string,
 *   description: string,
 *   content: string
 * }>>}
 */
export async function getRules(projectRoot) {
  const rulesDir = join(projectRoot, 'rules');
  const files = await listFilesByExt(rulesDir, 'md');
  if (files.length === 0) return [];

  const results = await Promise.all(
    files.map(async (file) => {
      const content = await safeRead(join(rulesDir, file));
      if (!content) return null;

      const fm = parseFrontmatter(content);
      const name = fm.name || file.replace(/\.md$/, '');
      const description = fm.description || 'No description provided.';

      // Extract content after frontmatter block
      const firstDash = content.indexOf('---');
      if (firstDash === 0) {
        const secondDash = content.indexOf('---', firstDash + 3);
        const body = secondDash > 0 ? content.slice(secondDash + 3).trim() : '';
        return { file, name, description, content: body };
      }

      return { file, name, description, content: content.trim() };
    }),
  );

  return results.filter(Boolean);
}

/**
 * 4. getHooks(projectRoot) — List all Hook configurations grouped by lifecycle event.
 *
 * Reads hooks/hooks.json and parses hook definitions for each lifecycle event.
 * Supports both string-only and object-style hook entries.
 *
 * @param {string} projectRoot - Absolute path to the project root.
 * @returns {Promise<Record<string, Array<{
 *   command: string,
 *   description: string,
 *   enabled: boolean,
 *   condition?: string
 * }>>>}
 */
export async function getHooks(projectRoot) {
  const hooksPath = join(projectRoot, 'hooks', 'hooks.json');
  const raw = await safeRead(hooksPath);
  if (!raw) return {};

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  /** @type {Record<string, Array<{command: string, description: string, enabled: boolean, condition?: string}>} */
  const grouped = {};

  for (const [event, hooks] of Object.entries(parsed)) {
    if (!EVERYTHING_HOOK_TYPES.includes(event)) continue;

    if (!Array.isArray(hooks)) {
      grouped[event] = [];
      continue;
    }

    grouped[event] = hooks.map((h) => {
      if (typeof h === 'string') {
        return {
          command: h,
          description: '',
          enabled: true,
        };
      }
      return {
        command: h.command || h.cmd || h.script || '',
        description: h.description || h.desc || '',
        enabled: h.enabled !== false,
        condition: h.condition || h.when || undefined,
      };
    });
  }

  return grouped;
}

/**
 * 5. getContexts(projectRoot) — List all context modes defined in the project.
 *
 * Scans contexts/*.md files and returns mode specifications.
 * Recognized modes: dev, review, research. Falls back to default
 * behavior descriptions when no frontmatter behaviors are found.
 *
 * @param {string} projectRoot - Absolute path to the project root.
 * @returns {Promise<Array<{
 *   file: string,
 *   mode: string,
 *   description: string,
 *   behaviors: string[]
 * }>>}
 */
export async function getContexts(projectRoot) {
  const contextsDir = join(projectRoot, 'contexts');
  const files = await listFilesByExt(contextsDir, 'md');
  if (files.length === 0) return [];

  const DEFAULT_BEHAVIORS = {
    dev: [
      'Auto-detect project type',
      'Enable code generation and editing',
      'Use build tools for compilation',
      'Fast iteration mode',
    ],
    review: [
      'Read-only analysis mode',
      'No file modifications',
      'Code quality and security checks',
      'Architecture review focus',
    ],
    research: [
      'Deep analysis and exploration',
      'Comprehensive documentation',
      'Multiple solution comparison',
      'No implementation — analysis only',
    ],
  };

  const results = await Promise.all(
    files.map(async (file) => {
      const content = await safeRead(join(contextsDir, file));
      if (!content) return null;

      const fm = parseFrontmatter(content);
      const modeName = fm.mode || fm.name || file.replace(/\.md$/, '');
      const description = fm.description || 'No description provided.';

      // Extract behaviors from frontmatter, or use mode-specific defaults
      let behaviors = [];
      if (Array.isArray(fm.behaviors)) {
        behaviors = fm.behaviors;
      } else if (DEFAULT_BEHAVIORS[modeName]) {
        behaviors = DEFAULT_BEHAVIORS[modeName];
      }

      return {
        file,
        mode: modeName,
        description,
        behaviors,
      };
    }),
  );

  return results.filter(Boolean);
}

/**
 * 6. recommendAgent(userInput, context) — Recommend the optimal Agent based on user input.
 *
 * Uses keyword matching to map user intent to the most appropriate
 * everything agent. Returns a scored result with primary recommendation
 * and up to 3 fallbacks. Adjusts scoring based on context mode.
 *
 * @param {string} userInput - The user's natural language input.
 * @param {string} [context='dev'] - Current context mode: 'dev' | 'review' | 'research'.
 * @returns {{
 *   primary: string|null,
 *   score: number,
 *   matchedKeywords: string[],
 *   fallbacks: Array<{agent: string, score: number, matchedKeywords: string[]}>
 * }}
 */
export function recommendAgent(userInput, context = 'dev') {
  const input = userInput.toLowerCase();
  /** @type {Array<{agent: string, score: number, matchedKeywords: string[]}>} */
  const scored = [];

  for (const [agent, keywords] of Object.entries(AGENT_KEYWORD_MAP)) {
    const matched = keywords.filter((kw) => input.includes(kw));
    if (matched.length === 0) continue;

    // Score: weighted by keyword length — longer keywords are more specific
    const score = matched.reduce((sum, kw) => sum + kw.length / 10, 0);
    scored.push({ agent, score, matchedKeywords: matched });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Context-based scoring adjustments
  if (context === 'review') {
    const reviewAgents = new Set([
      'code-reviewer', 'security-auditor', 'architecture-analyzer',
      'ui-ux-reviewer', 'performance-analyzer',
    ]);
    for (const s of scored) {
      if (reviewAgents.has(s.agent)) {
        s.score *= 1.5;
      } else {
        s.score *= 0.7;
      }
    }
    scored.sort((a, b) => b.score - a.score);
  }

  if (context === 'research') {
    const researchAgents = new Set([
      'architecture-analyzer', 'documentation-writer', 'security-auditor',
      'performance-analyzer', 'dependency-auditor',
    ]);
    for (const s of scored) {
      if (researchAgents.has(s.agent)) {
        s.score *= 1.3;
      }
    }
    scored.sort((a, b) => b.score - a.score);
  }

  const primary = scored.length > 0 ? scored[0] : null;
  const fallbacks = scored.slice(1, 4);

  return {
    primary: primary ? primary.agent : null,
    score: primary ? Math.round(primary.score * 100) / 100 : 0,
    matchedKeywords: primary ? primary.matchedKeywords : [],
    fallbacks: fallbacks.map((f) => ({
      agent: f.agent,
      score: Math.round(f.score * 100) / 100,
      matchedKeywords: f.matchedKeywords,
    })),
  };
}

/**
 * 7. injectRules(projectRoot, rules) — Inject specified rules into session context.
 *
 * Reads the specified rule files from rules/ directory, extracts their
 * content (stripping frontmatter), and merges them into a single block
 * of rule text suitable for injection into a session system prompt.
 *
 * @param {string} projectRoot - Absolute path to the project root.
 * @param {string[]} ruleNames - Rule identifiers (filenames without .md extension).
 * @returns {Promise<{
 *   injected: string,
 *   found: string[],
 *   missing: string[],
 *   totalChars: number
 * }>}
 */
export async function injectRules(projectRoot, ruleNames) {
  const rulesDir = join(projectRoot, 'rules');
  /** @type {string[]} */
  const found = [];
  /** @type {string[]} */
  const missing = [];
  /** @type {string[]} */
  const contents = [];

  for (const name of ruleNames) {
    // Support both with and without .md extension
    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const content = await safeRead(join(rulesDir, fileName));

    if (content === null) {
      missing.push(name);
      continue;
    }

    found.push(name);

    // Strip frontmatter — keep only the rule body
    const firstDash = content.indexOf('---');
    let body;
    if (firstDash === 0) {
      const secondDash = content.indexOf('---', firstDash + 3);
      body = secondDash > 0 ? content.slice(secondDash + 3).trim() : content.trim();
    } else {
      body = content.trim();
    }

    contents.push(`## Rule: ${name}\n\n${body}`);
  }

  const injected = contents.length > 0
    ? `<!-- Injected rules from everything-claude-code -->\n${contents.join('\n\n---\n\n')}`
    : '';

  return {
    injected,
    found,
    missing,
    totalChars: injected.length,
  };
}

/**
 * 8. mergeWithChaos(projectRoot) — Merge everything best practices into chaos-harness.
 *
 * Analyzes all 14 everything agents and determines how each can be absorbed
 * as a sub-capability within the chaos-harness skill ecosystem. Also maps
 * hooks to their chaos-harness equivalents and rules to iron laws.
 * Returns a structured merge plan with compatibility ratings and reasoning.
 *
 * @param {string} projectRoot - Absolute path to the project root.
 * @returns {Promise<{
 *   agents: Array<{
 *     everythingAgent: string,
 *     chaosSkill: string,
 *     subCapability: string,
 *     compatibility: string,
 *     reason: string,
 *     installed: boolean
 *   }>,
 *   hooks: Array<{
 *     everythingHook: string,
 *     chaosHook: string,
 *     note: string
 *   }>,
 *   rules: Array<{
 *     everythingRule: string,
 *     chaosLaw: string,
 *     note: string
 *   }>,
 *   summary: { high: number, medium: number, low: number }
 * }>}
 */
export async function mergeWithChaos(projectRoot) {
  // Detect what's actually installed in the project
  const { agents: installedAgents } = await detect(projectRoot);

  // Build agent merge plan — prioritize installed agents
  const agents = Object.entries(CHAOS_MERGE_MAP)
    .map(([agent, mapping]) => ({
      everythingAgent: agent,
      chaosSkill: mapping.chaosSkill,
      subCapability: mapping.subCapability,
      compatibility: mapping.compatibility,
      reason: mapping.reason,
      installed: installedAgents.includes(agent),
    }))
    .sort((a, b) => {
      // Installed agents first, then by compatibility level
      if (a.installed !== b.installed) return a.installed ? -1 : 1;
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.compatibility] ?? 3) - (order[b.compatibility] ?? 3);
    });

  // Hook mapping: everything lifecycle events -> chaos-harness hook equivalents
  const hooks = [
    {
      everythingHook: 'pre-session',
      chaosHook: 'pre-compact',
      note: 'Both run before session processing; pre-session can inject context, pre-compact saves state.',
    },
    {
      everythingHook: 'post-session',
      chaosHook: 'post-compact',
      note: 'Both run after session; can be unified for state persistence.',
    },
    {
      everythingHook: 'pre-commit',
      chaosHook: 'pre-commit',
      note: 'Direct mapping — both validate before commit.',
    },
    {
      everythingHook: 'post-commit',
      chaosHook: 'post-commit',
      note: 'Direct mapping — both handle post-commit actions.',
    },
    {
      everythingHook: 'pre-build',
      chaosHook: 'pre-build',
      note: 'Both run before build; chaos-harness can adopt pre-build validation.',
    },
    {
      everythingHook: 'post-build',
      chaosHook: 'post-build',
      note: 'Both run after build; can unify for build result analysis.',
    },
  ];

  // Rule-to-iron-law mapping
  const rules = [
    {
      everythingRule: 'agent-selection',
      chaosLaw: 'IL-TEAM002',
      note: 'Agent selection maps to "DEVELOPMENT REQUIRES PARALLEL AGENTS" — auto-select optimal agents.',
    },
    {
      everythingRule: 'context-switching',
      chaosLaw: 'IL004',
      note: 'Context switching requires user consent per "NO VERSION CHANGES WITHOUT USER CONSENT".',
    },
    {
      everythingRule: 'tool-usage',
      chaosLaw: 'IL005',
      note: 'Tool usage constraints map to "NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL".',
    },
    {
      everythingRule: 'output-format',
      chaosLaw: 'IL001',
      note: 'Output formatting aligns with "NO DOCUMENTS WITHOUT VERSION LOCK" — structured outputs.',
    },
    {
      everythingRule: 'error-handling',
      chaosLaw: 'IL003',
      note: 'Error handling maps to "NO COMPLETION CLAIMS WITHOUT VERIFICATION" — validate outcomes.',
    },
    {
      everythingRule: 'session-management',
      chaosLaw: 'IL-TEAM003',
      note: 'Session management aligns with "MONITORING MUST BE CONTINUOUS" — track session state.',
    },
    {
      everythingRule: 'file-conventions',
      chaosLaw: 'IL-JAVA001',
      note: 'File conventions map to code style requirements (CheckStyle for Java, ESLint for JS).',
    },
    {
      everythingRule: 'review-gate',
      chaosLaw: 'IL-TEAM001',
      note: 'Review gate maps to "REVIEW REQUIRES MULTIPLE AGENTS" — mandatory multi-agent review.',
    },
  ];

  // Summary counts by compatibility level
  const summary = {
    high: agents.filter((a) => a.compatibility === 'high').length,
    medium: agents.filter((a) => a.compatibility === 'medium').length,
    low: agents.filter((a) => a.compatibility === 'low').length,
  };

  return { agents, hooks, rules, summary };
}

// ---------------------------------------------------------------------------
// CLI entry point — run diagnostics when executed directly
// ---------------------------------------------------------------------------

if (process.argv[1] && /everything[\\/]adapter\.mjs$/.test(process.argv[1])) {
  const targetRoot = process.argv[2] || process.cwd();
  console.log(`[everything adapter] Diagnosing: ${targetRoot}\n`);

  const detection = await detect(targetRoot);
  console.log('Detection:', JSON.stringify(detection, null, 2));

  if (detection.detected) {
    console.log('\n--- Agents ---');
    const agents = await getAgents(targetRoot);
    console.log(JSON.stringify(agents, null, 2));

    console.log('\n--- Rules ---');
    const rules = await getRules(targetRoot);
    console.log(JSON.stringify(rules.map((r) => ({ file: r.file, name: r.name })), null, 2));

    console.log('\n--- Hooks ---');
    const hooks = await getHooks(targetRoot);
    console.log(JSON.stringify(hooks, null, 2));

    console.log('\n--- Contexts ---');
    const contexts = await getContexts(targetRoot);
    console.log(JSON.stringify(contexts, null, 2));
  }

  // Demo recommendation
  const demoInput = process.argv[3] || 'fix the build error in the project';
  console.log(`\n--- Recommendation for: "${demoInput}" ---`);
  const rec = recommendAgent(demoInput);
  console.log(JSON.stringify(rec, null, 2));

  // Demo merge plan
  console.log('\n--- Merge Plan Summary ---');
  const merge = await mergeWithChaos(targetRoot);
  console.log(JSON.stringify(merge.summary, null, 2));
}
