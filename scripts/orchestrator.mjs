#!/usr/bin/env node
/**
 * orchestrator — Chaos Harness v1.4.0 Plugin Dispatcher Core
 *
 * The brain of chaos-harness. Integrates capabilities from:
 *   - superpowers (subagent-driven development, parallel agents)
 *   - openspec (change proposal, spec-driven workflow)
 *   - everything-claude-code (agent configs, hooks, rules)
 *   - chaos-harness itself (gate validation, iron laws, recovery)
 *
 * Responsibilities:
 *   1. Detect installed plugins/projects
 *   2. Plan optimal execution path based on user input + available components
 *   3. Manage Gate state machine (delegates to gate-machine.mjs)
 *   4. Auto-recover on failure (delegates to gate-recovery.mjs)
 *   5. Emit unified status output
 *
 * Usage:
 *   node scripts/orchestrator.mjs orchestrate "user input here"
 *   node scripts/orchestrator.mjs detect
 *   node scripts/orchestrator.mjs report
 *   node scripts/orchestrator.mjs status
 *   node scripts/orchestrator.mjs recover
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname);
const SCRIPTS_DIR = join(PROJECT_ROOT, 'scripts');
const STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'orchestrator-state.json');

// ============================================================
// Constants
// ============================================================

/**
 * Plugin definitions — how to detect each component and what
 * capabilities it exposes.
 */
const PLUGIN_REGISTRY = {
  superpowers: {
    name: 'superpowers',
    label: 'Superpowers — Agent Workflow System',
    detectPaths: [
      // Claude Code plugin installation
      join(homedir(), '.claude', 'plugins', 'installed', 'superpowers'),
      join(homedir(), '.claude', 'plugins', 'installed', 'superpowers-chrome'),
      // Local project detection
      'skills/superpowers',
      'skills/superpowers-chrome',
      // Global npm
      join(homedir(), '.config', 'superpowers'),
      join(homedir(), '.superpowers'),
    ],
    detectDirs: ['superpowers'], // directory name pattern
    capabilities: [
      'subagent-driven-development',
      'parallel-agent-dispatch',
      'systematic-debugging',
      'verification-before-completion',
      'worktree-management',
      'test-driven-development',
      'code-review',
      'brainstorming',
      'skill-writing',
      'plan-writing',
      'plan-execution',
    ],
    priority: 1, // higher = checked first for execution planning
  },
  openspec: {
    name: 'openspec',
    label: 'OpenSpec — Spec-Driven Development',
    detectPaths: [
      join(homedir(), '.claude', 'plugins', 'installed', 'openspec'),
      join(homedir(), '.claude', 'plugins', 'installed', 'openspec-superpowers-flow'),
      'skills/openspec',
      'openspec',
      '.openspec',
      join(homedir(), '.config', 'openspec'),
    ],
    detectDirs: ['openspec'],
    capabilities: [
      'change-proposal',
      'spec-validation',
      'opsx-propose',
      'spec-driven-workflow',
    ],
    priority: 2,
  },
  'everything-claude-code': {
    name: 'everything-claude-code',
    label: 'Everything Claude Code — Agent Config Hub',
    detectPaths: [
      join(homedir(), '.claude', 'plugins', 'installed', 'everything-claude-code'),
      'skills/everything',
      'everything-claude-code',
      '.everything',
      join(homedir(), '.config', 'everything-claude-code'),
    ],
    detectDirs: ['everything'],
    capabilities: [
      'agent-config-loading',
      'hook-injection',
      'rule-enforcement',
      'context-enrichment',
    ],
    priority: 3,
  },
  'chaos-harness': {
    name: 'chaos-harness',
    label: 'Chaos Harness — Deterministic Constraint Framework',
    detectPaths: [
      PROJECT_ROOT,
    ],
    detectDirs: ['chaos-harness', '.chaos-harness'],
    capabilities: [
      'gate-validation',
      'iron-law-enforcement',
      'phase-guard',
      'recovery-engine',
      'laziness-detection',
      'overdrive-mode',
      'auto-context',
      'workflow-supervision',
      'plugin-management',
      'state-management',
    ],
    priority: 0, // always present (we are the harness)
  },
};

// ============================================================
// Marker Output
// ============================================================

/**
 * Emit a <HARNESS_ORCHESTRATOR> marker to stderr.
 * Claude Code hooks and downstream scripts read this.
 */
function emitMarker(data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  console.error(`<HARNESS_ORCHESTRATOR>${payload}</HARNESS_ORCHESTRATOR>`);
}

// ============================================================
// Component Detection
// ============================================================

/**
 * Scan for a single plugin by checking its registered paths.
 * Returns { detected: boolean, path: string|null }
 */
function detectPlugin(pluginDef) {
  // 1. Check explicit paths
  for (const p of pluginDef.detectPaths) {
    if (existsSync(p)) {
      return { detected: true, path: resolve(p), method: 'explicit-path' };
    }
  }

  // 2. Scan common plugin locations for directory name matches
  const scanLocations = [
    join(homedir(), '.claude', 'plugins', 'installed'),
    join(PROJECT_ROOT, 'skills'),
    PROJECT_ROOT,
  ];

  for (const location of scanLocations) {
    if (!existsSync(location)) continue;
    try {
      const entries = readdirSync(location, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        for (const pattern of pluginDef.detectDirs) {
          if (entry.name.includes(pattern)) {
            return { detected: true, path: resolve(location, entry.name), method: 'directory-scan' };
          }
        }
      }
    } catch {
      // permission error or not a directory — skip
    }
  }

  // 3. Check if the plugin is referenced in Claude settings
  const settingsPaths = [
    join(PROJECT_ROOT, '.claude', 'settings.json'),
    join(PROJECT_ROOT, '.claude', 'settings.local.json'),
    join(homedir(), '.claude', 'settings.json'),
  ];

  for (const sp of settingsPaths) {
    if (!existsSync(sp)) continue;
    try {
      const content = readFileSync(sp, 'utf8');
      if (content.includes(pluginDef.name)) {
        return { detected: true, path: sp, method: 'settings-reference' };
      }
    } catch { /* skip */ }
  }

  return { detected: false, path: null, method: null };
}

/**
 * Detect all installed components.
 * Returns a map of pluginName -> { detected, path, method, capabilities }
 */
function detectComponents(projectRoot = PROJECT_ROOT) {
  const results = {};

  for (const [key, def] of Object.entries(PLUGIN_REGISTRY)) {
    const detection = detectPlugin(def);
    results[key] = {
      name: def.name,
      label: def.label,
      detected: detection.detected,
      path: detection.path,
      detectionMethod: detection.method,
      capabilities: detection.detected ? def.capabilities : [],
      priority: def.priority,
    };
  }

  // Also scan for additional skills directories in the project
  const skillsDir = join(projectRoot, 'skills');
  if (existsSync(skillsDir)) {
    try {
      const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);

      results['chaos-harness'].skillCount = skillDirs.length;
      results['chaos-harness'].skills = skillDirs;
    } catch { /* skip */ }
  }

  // Detect available scripts
  if (existsSync(SCRIPTS_DIR)) {
    try {
      const scripts = readdirSync(SCRIPTS_DIR)
        .filter(f => f.endsWith('.mjs') || f.endsWith('.sh') || f.endsWith('.bat'));
      results['chaos-harness'].scriptCount = scripts.length;
      results['chaos-harness'].scripts = scripts;
    } catch { /* skip */ }
  }

  return results;
}

// ============================================================
// Execution Planning
// ============================================================

/**
 * Given user input and detected components, determine the optimal
 * execution path. Returns a structured plan.
 */
function planExecution(input, components) {
  const detected = Object.values(components).filter(c => c.detected);
  const plan = {
    input,
    inputSummary: summarizeInput(input),
    timestamp: new Date().toISOString(),
    availableComponents: detected.map(c => c.name),
    steps: [],
    executionMode: 'sequential',
    warnings: [],
  };

  // Determine execution mode based on available components
  const hasSuperpowers = !!components.superpowers?.detected;
  const hasOpenSpec = !!components.openspec?.detected;
  const hasEverything = !!components['everything-claude-code']?.detected;
  const hasHarness = !!components['chaos-harness']?.detected;

  // If superpowers + multiple agents available → parallel mode
  if (hasSuperpowers && hasHarness) {
    plan.executionMode = 'parallel-agent';
  }

  // ---- Step 1: Input Analysis (chaos-harness always) ----
  if (hasHarness) {
    plan.steps.push({
      phase: 'input-analysis',
      component: 'chaos-harness',
      action: 'intent-classification',
      script: 'intent-analyzer.mjs',
      description: 'Analyze user intent and classify request type',
      required: true,
    });

    plan.steps.push({
      phase: 'iron-law-check',
      component: 'chaos-harness',
      action: 'constraint-validation',
      script: 'iron-law-check.mjs',
      description: 'Validate request against iron laws',
      required: true,
    });

    plan.steps.push({
      phase: 'gate-initialization',
      component: 'chaos-harness',
      action: 'gate-init',
      script: 'gate-machine.mjs',
      description: 'Initialize or resume Gate state machine',
      required: true,
    });
  }

  // ---- Step 2: Spec / Proposal (openspec) ----
  if (hasOpenSpec) {
    plan.steps.push({
      phase: 'change-proposal',
      component: 'openspec',
      action: 'opsx-propose',
      description: 'Generate change proposal via OpenSpec workflow',
      required: false,
      dependsOn: 'input-analysis',
    });
  }

  // ---- Step 3: Task Decomposition (superpowers) ----
  if (hasSuperpowers) {
    plan.steps.push({
      phase: 'task-decomposition',
      component: 'superpowers',
      action: 'subagent-driven-development',
      description: 'Decompose task into subagent-driven subtasks',
      required: false,
      dependsOn: hasOpenSpec ? 'change-proposal' : 'input-analysis',
    });

    plan.steps.push({
      phase: 'parallel-execution',
      component: 'superpowers',
      action: 'dispatch-parallel-agents',
      description: 'Dispatch parallel agents for independent subtasks',
      required: false,
      dependsOn: 'task-decomposition',
    });
  }

  // ---- Step 4: Context Enrichment (everything) ----
  if (hasEverything) {
    plan.steps.push({
      phase: 'context-loading',
      component: 'everything-claude-code',
      action: 'load-agent-configs',
      description: 'Load agent configurations, hooks, and rules',
      required: false,
      dependsOn: 'input-analysis',
    });
  }

  // ---- Step 5: Gate Validation (chaos-harness) ----
  if (hasHarness) {
    plan.steps.push({
      phase: 'gate-verification',
      component: 'chaos-harness',
      action: 'gate-verify',
      script: 'gate-machine.mjs',
      description: 'Verify Gate outputs meet requirements',
      required: true,
      dependsOn: hasSuperpowers ? 'parallel-execution' : 'input-analysis',
    });

    plan.steps.push({
      phase: 'recovery-check',
      component: 'chaos-harness',
      action: 'recovery-verify',
      script: 'gate-recovery.mjs',
      description: 'Check for failures and plan recovery if needed',
      required: true,
      dependsOn: 'gate-verification',
    });
  }

  // ---- Warnings ----
  if (!hasSuperpowers && !hasOpenSpec && !hasEverything) {
    plan.warnings.push(
      'Only chaos-harness detected. No external plugins found for enhanced workflow. ' +
      'Consider installing superpowers for subagent-driven development.'
    );
  }

  if (!hasHarness) {
    plan.warnings.push('chaos-harness not detected. Gate validation will be unavailable.');
  }

  return plan;
}

/**
 * Summarize user input into a classification.
 */
function summarizeInput(input) {
  if (!input || input.length < 2) {
    return { type: 'empty', length: input?.length || 0 };
  }

  const lower = input.toLowerCase();
  const type = classifyIntent(lower);

  return {
    type,
    length: input.length,
    keywords: extractKeywords(lower),
  };
}

function classifyIntent(lower) {
  if (/create|build|develop|implement|write|make|add|design|architect/i.test(lower)) {
    if (/bug|fix|error|fail|broken/i.test(lower)) return 'bug-fix';
    if (/test|spec|e2e|coverage/i.test(lower)) return 'testing';
    if (/deploy|release|publish|ci|cd/i.test(lower)) return 'deployment';
    if (/ui|frontend|page|component|style/i.test(lower)) return 'ui-development';
    if (/api|endpoint|server|backend|database/i.test(lower)) return 'backend-development';
    return 'feature-development';
  }
  if (/review|audit|inspect|check|analyze/i.test(lower)) return 'review';
  if (/refactor|migrate|upgrade|update|improve/i.test(lower)) return 'refactoring';
  if (/explain|how|what|why|help/i.test(lower)) return 'question';
  if (/plan|design|spec|proposal|proposal/i.test(lower)) return 'planning';
  return 'general';
}

function extractKeywords(lower) {
  const keywordPatterns = [
    /\b(subagent|parallel|agent)\b/gi,
    /\b(gate|validation|verify)\b/gi,
    /\b(spec|proposal|change)\b/gi,
    /\b(test|e2e|coverage)\b/gi,
    /\b(deploy|release|publish)\b/gi,
    /\b(refactor|migrate)\b/gi,
    /\b(ui|frontend|frontend)\b/gi,
    /\b(api|backend|database)\b/gi,
  ];

  const found = [];
  for (const pattern of keywordPatterns) {
    const matches = lower.match(pattern);
    if (matches) found.push(...matches);
  }
  return [...new Set(found)];
}

// ============================================================
// Orchestration — Execute the Plan
// ============================================================

/**
 * Main orchestration function: detect → plan → execute → report.
 * This is the entry point for `orchestrator.mjs orchestrate "input"`.
 */
function orchestrate(projectRoot, input) {
  const state = readOrchestratorState();

  // Phase 1: Detect
  const components = detectComponents(projectRoot);
  state.lastDetection = {
    timestamp: new Date().toISOString(),
    components: Object.fromEntries(
      Object.entries(components).map(([k, v]) => [k, { detected: v.detected, path: v.path }])
    ),
  };

  // Phase 2: Plan
  const plan = planExecution(input, components);
  state.lastPlan = plan;

  // Phase 3: Execute scripts that are available
  const executionResults = executePlan(projectRoot, plan, components);
  state.lastExecution = executionResults;

  // Phase 4: Recovery check if there were failures
  const failures = executionResults.filter(r => r.status === 'failed');
  if (failures.length > 0) {
    const recoveryResult = attemptRecovery(projectRoot, components);
    state.lastRecovery = recoveryResult;
  }

  // Persist state
  writeOrchestratorState(state);

  // Emit result
  emitMarker({
    type: 'orchestration_complete',
    mode: plan.executionMode,
    components: Object.values(components)
      .filter(c => c.detected)
      .map(c => c.name),
    stepsExecuted: executionResults.length,
    stepsFailed: failures.length,
    recoveryNeeded: failures.length > 0,
    plan,
  });

  return { components, plan, executionResults, state };
}

/**
 * Execute a plan by running the corresponding scripts.
 */
function executePlan(projectRoot, plan, components) {
  const results = [];

  for (const step of plan.steps) {
    if (!step.script) {
      // Non-script step (e.g., external plugin action) — record as pending
      results.push({
        step: step.phase,
        component: step.component,
        action: step.action,
        status: 'pending-external',
        message: `Requires ${step.component} integration (not a local script)`,
      });
      continue;
    }

    const scriptPath = join(SCRIPTS_DIR, step.script);
    if (!existsSync(scriptPath)) {
      results.push({
        step: step.phase,
        component: step.component,
        action: step.action,
        status: 'skipped',
        message: `Script not found: ${scriptPath}`,
      });
      continue;
    }

    try {
      const output = execSync(`node "${scriptPath}"`, {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();

      results.push({
        step: step.phase,
        component: step.component,
        action: step.action,
        status: 'completed',
        output: output || null,
      });
    } catch (err) {
      results.push({
        step: step.phase,
        component: step.component,
        action: step.action,
        status: 'failed',
        error: err.message?.slice(0, 500) || String(err),
        stderr: err.stderr?.toString().slice(0, 500),
      });
    }
  }

  return results;
}

/**
 * Attempt recovery after execution failures.
 */
function attemptRecovery(projectRoot, components) {
  const recoveryScript = join(SCRIPTS_DIR, 'gate-recovery.mjs');

  if (!existsSync(recoveryScript)) {
    return { status: 'unavailable', message: 'gate-recovery.mjs not found' };
  }

  try {
    const output = execSync(`node "${recoveryScript}" --recover`, {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return { status: 'completed', output: output || null };
  } catch (err) {
    return {
      status: 'failed',
      error: err.message?.slice(0, 500) || String(err),
    };
  }
}

// ============================================================
// State Management
// ============================================================

function readOrchestratorState() {
  if (!existsSync(STATE_FILE)) {
    return {
      version: '1.4.0',
      createdAt: new Date().toISOString(),
      lastDetection: null,
      lastPlan: null,
      lastExecution: null,
      lastRecovery: null,
      runCount: 0,
    };
  }
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      version: '1.4.0',
      createdAt: new Date().toISOString(),
      lastDetection: null,
      lastPlan: null,
      lastExecution: null,
      lastRecovery: null,
      runCount: 0,
    };
  }
}

function writeOrchestratorState(state) {
  state.updatedAt = new Date().toISOString();
  state.runCount = (state.runCount || 0) + 1;
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ============================================================
// Report
// ============================================================

/**
 * Generate a human-readable report of detected components and capabilities.
 */
function report(components) {
  if (!components) {
    components = detectComponents();
  }

  const detected = Object.values(components).filter(c => c.detected);
  const undetected = Object.values(components).filter(c => !c.detected);

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: Object.keys(components).length,
      detected: detected.length,
      unavailable: undetected.length,
    },
    detected: detected.map(c => ({
      name: c.name,
      label: c.label,
      path: c.path,
      capabilities: c.capabilities,
      capabilityCount: c.capabilities.length,
    })),
    unavailable: undetected.map(c => c.name),
    allCapabilities: detected.flatMap(c => c.capabilities),
    recommendedWorkflow: determineRecommendedWorkflow(detected),
  };

  emitMarker({
    type: 'component_report',
    ...report,
  });

  return report;
}

function determineRecommendedWorkflow(detected) {
  const names = detected.map(c => c.name);

  if (names.includes('superpowers') && names.includes('openspec') && names.includes('chaos-harness')) {
    return {
      mode: 'full-orchestrated',
      description: 'Spec-driven, subagent-executed, gate-validated',
      flow: [
        'OpenSpec: change proposal',
        'Superpowers: subagent decomposition + parallel execution',
        'Chaos Harness: gate validation + iron law enforcement + recovery',
      ],
    };
  }

  if (names.includes('superpowers') && names.includes('chaos-harness')) {
    return {
      mode: 'agent-driven-gated',
      description: 'Subagent execution with gate validation',
      flow: [
        'Chaos Harness: intent analysis + gate init',
        'Superpowers: subagent decomposition + parallel execution',
        'Chaos Harness: gate verify + recovery',
      ],
    };
  }

  if (names.includes('openspec') && names.includes('chaos-harness')) {
    return {
      mode: 'spec-driven-gated',
      description: 'Spec-driven with gate validation',
      flow: [
        'Chaos Harness: intent analysis + gate init',
        'OpenSpec: change proposal',
        'Chaos Harness: gate verify + recovery',
      ],
    };
  }

  if (names.includes('chaos-harness')) {
    return {
      mode: 'gate-validated',
      description: 'Gate-validated sequential execution',
      flow: [
        'Chaos Harness: intent analysis + gate init + iron laws',
        'Sequential task execution',
        'Chaos Harness: gate verify + recovery',
      ],
    };
  }

  return {
    mode: 'manual',
    description: 'No plugins detected. Manual execution only.',
    flow: ['Manual task execution'],
  };
}

// ============================================================
// CLI Entry Point
// ============================================================

function main() {
  const command = process.argv[2] || 'help';
  const input = process.argv.slice(3).join(' ');

  switch (command) {
    case 'orchestrate':
      if (!input) {
        emitMarker({ type: 'error', message: 'orchestrate requires user input as argument' });
        process.exit(1);
      }
      orchestrate(PROJECT_ROOT, input);
      break;

    case 'detect':
      const components = detectComponents(PROJECT_ROOT);
      emitMarker({ type: 'detection', components });
      break;

    case 'report':
      report();
      break;

    case 'status': {
      const state = readOrchestratorState();
      const components = detectComponents(PROJECT_ROOT);
      emitMarker({
        type: 'status',
        runCount: state.runCount || 0,
        lastRun: state.updatedAt || null,
        components: Object.fromEntries(
          Object.entries(components).map(([k, v]) => [k, v.detected])
        ),
        lastPlan: state.lastPlan ? {
          mode: state.lastPlan.executionMode,
          steps: state.lastPlan.steps.length,
        } : null,
        lastExecution: state.lastExecution ? {
          total: state.lastExecution.length,
          completed: state.lastExecution.filter(r => r.status === 'completed').length,
          failed: state.lastExecution.filter(r => r.status === 'failed').length,
        } : null,
      });
      break;
    }

    case 'recover': {
      const recoveryResult = attemptRecovery(PROJECT_ROOT, detectComponents(PROJECT_ROOT));
      emitMarker({ type: 'recovery', ...recoveryResult });
      break;
    }

    case 'plan': {
      if (!input) {
        emitMarker({ type: 'error', message: 'plan requires user input as argument' });
        process.exit(1);
      }
      const components = detectComponents(PROJECT_ROOT);
      const plan = planExecution(input, components);
      emitMarker({ type: 'plan', ...plan });
      break;
    }

    case 'help':
    default:
      emitMarker({
        type: 'help',
        version: '1.4.0',
        commands: {
          'orchestrate <input>': 'Full orchestration cycle: detect → plan → execute → report',
          'detect': 'Scan for installed plugins and capabilities',
          'report': 'Generate component capability report',
          'status': 'Show orchestrator state and last execution results',
          'recover': 'Attempt recovery from last failure',
          'plan <input>': 'Generate execution plan without running it',
        },
      });
      break;
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('orchestrator.mjs')) {
  main();
}

// Export for programmatic use
export { detectComponents, planExecution, orchestrate, report as generateReport };
