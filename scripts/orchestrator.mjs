#!/usr/bin/env node
/**
 * orchestrator — Chaos Harness v1.4.0 Plugin Dispatcher Core
 *
 * Integrates integration adapters at import time:
 *   - integrations/superpowers/adapter.mjs (subagent dispatch, model selection)
 *   - integrations/openspec/adapter.mjs (change proposal, apply, gate mapping)
 *   - integrations/everything/adapter.mjs (agent configs, rules, hooks, contexts)
 *   - integrations/registry.mjs (unified component discovery, best-path routing)
 *
 * When adapters are imported, they become first-class citizens in the
 * orchestration flow — detected → planned → dispatched automatically.
 *
 * Usage:
 *   node scripts/orchestrator.mjs orchestrate "user input here"
 *   node scripts/orchestrator.mjs detect
 *   node scripts/orchestrator.mjs report
 *   node scripts/orchestrator.mjs status
 *   node scripts/orchestrator.mjs plan "user input"
 *   node scripts/orchestrator.mjs recover
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname);
const SCRIPTS_DIR = join(PROJECT_ROOT, 'scripts');
const INTEGRATIONS_DIR = join(PROJECT_ROOT, 'integrations');
const STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'orchestrator-state.json');

// ============================================================
// Integration Adapter Imports — auto-detected at load time
// ============================================================

/**
 * Try to import an integration adapter. Returns null if the file
 * doesn't exist (e.g., user cloned chaos-harness without integrations).
 */
function loadAdapter(name) {
  const adapterPath = join(INTEGRATIONS_DIR, name, 'adapter.mjs');
  if (!existsSync(adapterPath)) {
    return null;
  }
  try {
    return import(pathToFileURL(adapterPath).href);
  } catch {
    return null;
  }
}

function loadRegistry() {
  const registryPath = join(INTEGRATIONS_DIR, 'registry.mjs');
  if (!existsSync(registryPath)) {
    return null;
  }
  try {
    return import(pathToFileURL(registryPath).href);
  } catch {
    return null;
  }
}

// ============================================================
// Marker Output
// ============================================================

function emitMarker(data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  console.error(`<HARNESS_ORCHESTRATOR>${payload}</HARNESS_ORCHESTRATOR>`);
}

// ============================================================
// Component Detection — via registry + adapters
// ============================================================

function detectComponents(projectRoot = PROJECT_ROOT) {
  const registry = loadRegistry();

  // Prefer registry's scanAll if available
  if (registry && typeof registry.scanAll === 'function') {
    try {
      return registry.scanAll(projectRoot);
    } catch {
      // Fall through to manual detection
    }
  }

  // Manual detection via individual adapters
  const results = {};
  const adapters = [
    { name: 'superpowers', key: 'superpowers' },
    { name: 'openspec', key: 'openspec' },
    { name: 'everything', key: 'everything' },
  ];

  for (const adapter of adapters) {
    const mod = loadAdapter(adapter.name);
    if (mod && typeof mod.detect === 'function') {
      try {
        const info = mod.detect(projectRoot);
        const caps = typeof mod.getCapabilities === 'function' ? mod.getCapabilities(projectRoot) : [];
        results[adapter.key] = {
          detected: info?.detected ?? false,
          path: info?.path || null,
          version: info?.version || null,
          source: info?.source || null,
          capabilities: caps?.capabilities || caps || [],
        };
        continue;
      } catch { /* fall through */ }
    }
    results[adapter.key] = { detected: false, path: null, version: null, source: null, capabilities: [] };
  }

  // chaos-harness is always present
  results['chaos-harness'] = {
    detected: true,
    path: PROJECT_ROOT,
    version: '1.4.0',
    source: 'self',
    capabilities: [
      'gate-validation', 'iron-law-enforcement', 'phase-guard',
      'recovery-engine', 'laziness-detection', 'overdrive-mode',
      'state-management',
    ],
  };

  results.scannedAt = new Date().toISOString();
  return results;
}

// ============================================================
// Execution Planning
// ============================================================

function planExecution(input, components, projectRoot = PROJECT_ROOT) {
  const detected = Object.entries(components).filter(([k, v]) => k !== 'scannedAt' && v?.detected);
  const plan = {
    input,
    inputSummary: summarizeInput(input),
    timestamp: new Date().toISOString(),
    availableComponents: detected.map(([k]) => k),
    steps: [],
    executionMode: 'sequential',
    warnings: [],
  };

  const has = (key) => components[key]?.detected;

  // Determine execution mode
  if (has('superpowers') && has('chaos-harness')) {
    plan.executionMode = 'parallel-agent';
  } else if (has('openspec') && has('chaos-harness')) {
    plan.executionMode = 'spec-driven';
  }

  // Step 1: chaos-harness always runs (Gate init + iron laws)
  if (has('chaos-harness')) {
    plan.steps.push({
      phase: 'gate-initialization',
      component: 'chaos-harness',
      action: 'gate-init',
      script: 'gate-machine.mjs',
      description: 'Initialize Gate state machine',
      required: true,
    });
  }

  // Step 2: OpenSpec change proposal (if available and intent is create/modify)
  const intent = plan.inputSummary;
  if (has('openspec') && (intent.isCreate || intent.isModify)) {
    plan.steps.push({
      phase: 'change-proposal',
      component: 'openspec',
      action: 'propose',
      script: null, // handled by adapter
      description: 'Generate change proposal via OpenSpec',
      required: false,
    });
  }

  // Step 3: Superpowers subagent dispatch (if available and intent is create/modify/test)
  if (has('superpowers') && (intent.isCreate || intent.isModify || intent.isTest)) {
    plan.steps.push({
      phase: 'task-decomposition',
      component: 'superpowers',
      action: 'subagent-driven-development',
      script: null, // handled by adapter
      description: 'Decompose task into subagent-driven subtasks',
      required: false,
      dependsOn: has('openspec') ? 'change-proposal' : 'gate-initialization',
    });
  }

  // Step 4: Everything agent/rule injection (if available)
  if (has('everything')) {
    plan.steps.push({
      phase: 'context-enrichment',
      component: 'everything',
      action: 'recommend-agent',
      script: null, // handled by adapter
      description: 'Load agent configs, rules, and recommend best agent',
      required: false,
    });
  }

  // Step 5: Gate verification (chaos-harness always)
  if (has('chaos-harness')) {
    plan.steps.push({
      phase: 'gate-verification',
      component: 'chaos-harness',
      action: 'gate-verify',
      script: 'gate-machine.mjs',
      description: 'Verify Gate outputs meet requirements',
      required: true,
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

  // Warnings
  if (!has('superpowers') && !has('openspec') && !has('everything')) {
    plan.warnings.push(
      'Only chaos-harness detected. No external plugins found for enhanced workflow. ' +
      'Consider installing superpowers for subagent-driven development.'
    );
  }

  return plan;
}

function summarizeInput(input) {
  if (!input || input.length < 2) {
    return { type: 'empty', isCreate: false, isModify: false, isBug: false, isReview: false, isTest: false, length: input?.length || 0 };
  }
  const lower = input.toLowerCase();
  return {
    isCreate: /创建|新建|写一个|做|开发|搭建|实现|create|build|develop|implement/i.test(lower),
    isModify: /修改|改|替换|换|重构|迁移|refactor|migrate|update/i.test(lower),
    isBug: /bug|错误|报错|修复|修|fix|error|fail/i.test(lower),
    isReview: /评审|审查|检查|review|audit/i.test(lower),
    isTest: /测试|test|用例|覆盖率|coverage/i.test(lower),
    length: input.length,
    keywords: extractKeywords(lower),
  };
}

function extractKeywords(lower) {
  const keywordPatterns = [
    /\b(subagent|parallel|agent)\b/gi,
    /\b(gate|validation|verify)\b/gi,
    /\b(spec|proposal|change)\b/gi,
    /\b(test|e2e|coverage)\b/gi,
    /\b(deploy|release|publish)\b/gi,
    /\b(refactor|migrate)\b/gi,
  ];
  const found = [];
  for (const pattern of keywordPatterns) {
    const matches = lower.match(pattern);
    if (matches) found.push(...matches);
  }
  return [...new Set(found)];
}

// ============================================================
// Orchestration — Execute the Plan via Adapters
// ============================================================

/**
 * Execute a single step by calling the corresponding adapter.
 * Uses spawnSync for adapter scripts (avoids async import issues).
 *
 * CLI conventions per adapter:
 *   superpowers: detect | capabilities | dispatch <taskDesc> [root]
 *   openspec:    detect | capabilities | propose "<idea>" [root]
 *   everything:  auto-run on invoke (no sub-commands), reads projectRoot as argv[1]
 */
function executeStep(step, projectRoot) {
  if (step.script) {
    // Local chaos-harness script
    const scriptPath = join(SCRIPTS_DIR, step.script);
    if (!existsSync(scriptPath)) {
      return { step: step.phase, status: 'skipped', message: `Script not found: ${step.script}` };
    }
    try {
      const result = spawnSync('node', [scriptPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return {
        step: step.phase,
        status: result.status === 0 ? 'completed' : 'failed',
        output: result.stdout?.trim() || null,
        error: result.stderr?.trim() || null,
      };
    } catch (err) {
      return { step: step.phase, status: 'failed', error: err.message?.slice(0, 500) };
    }
  }

  // Adapter-based step — call via spawnSync
  if (step.component === 'openspec') {
    const adapterPath = join(INTEGRATIONS_DIR, 'openspec', 'adapter.mjs');
    if (!existsSync(adapterPath)) {
      return { step: step.phase, status: 'skipped', message: 'openspec adapter not found' };
    }
    // CLI: propose "<idea>" [root]
    const idea = step.description || step.input || 'unknown';
    try {
      const result = spawnSync('node', [adapterPath, step.action, idea, projectRoot], {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 60000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return {
        step: step.phase,
        status: result.status === 0 ? 'completed' : 'skipped',
        output: result.stdout?.trim()?.slice(0, 2000) || null,
      };
    } catch (err) {
      return { step: step.phase, status: 'skipped', message: err.message?.slice(0, 200) };
    }
  }

  if (step.component === 'superpowers') {
    const adapterPath = join(INTEGRATIONS_DIR, 'superpowers', 'adapter.mjs');
    if (!existsSync(adapterPath)) {
      return { step: step.phase, status: 'skipped', message: 'superpowers adapter not found' };
    }
    // CLI: dispatch <taskDesc> [root]
    const taskDesc = step.description || step.input || 'unknown';
    try {
      const result = spawnSync('node', [adapterPath, step.action, taskDesc, projectRoot], {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return {
        step: step.phase,
        status: result.status === 0 ? 'completed' : 'skipped',
        output: result.stdout?.trim()?.slice(0, 2000) || null,
      };
    } catch (err) {
      return { step: step.phase, status: 'skipped', message: err.message?.slice(0, 200) };
    }
  }

  if (step.component === 'everything') {
    const adapterPath = join(INTEGRATIONS_DIR, 'everything', 'adapter.mjs');
    if (!existsSync(adapterPath)) {
      return { step: step.phase, status: 'skipped', message: 'everything adapter not found' };
    }
    // CLI: auto-run on invoke, projectRoot as argv[1]
    try {
      const result = spawnSync('node', [adapterPath, projectRoot], {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return {
        step: step.phase,
        status: result.status === 0 ? 'completed' : 'skipped',
        output: result.stdout?.trim()?.slice(0, 2000) || null,
      };
    } catch (err) {
      return { step: step.phase, status: 'skipped', message: err.message?.slice(0, 200) };
    }
  }

  return { step: step.phase, status: 'skipped', message: 'Unknown component' };
}

function orchestrate(projectRoot, input) {
  const state = readOrchestratorState();

  // Phase 1: Detect (via adapters + registry)
  const components = detectComponents(projectRoot);
  state.lastDetection = {
    timestamp: new Date().toISOString(),
    components: Object.fromEntries(
      Object.entries(components)
        .filter(([k, v]) => k !== 'scannedAt')
        .map(([k, v]) => [k, { detected: v.detected, path: v.path }])
    ),
  };

  // Phase 2: Plan
  const plan = planExecution(input, components, projectRoot);
  state.lastPlan = plan;

  // Phase 3: Execute via adapters
  const executionResults = [];
  for (const step of plan.steps) {
    const result = executeStep(step, projectRoot);
    executionResults.push(result);
  }
  state.lastExecution = executionResults;

  // Phase 4: Recovery check
  const failures = executionResults.filter(r => r.status === 'failed');
  if (failures.length > 0) {
    state.lastRecovery = attemptRecovery(projectRoot);
  }

  writeOrchestratorState(state);

  emitMarker({
    type: 'orchestration_complete',
    mode: plan.executionMode,
    components: Object.entries(components)
      .filter(([k, v]) => k !== 'scannedAt' && v?.detected)
      .map(([k]) => k),
    stepsExecuted: executionResults.length,
    stepsFailed: failures.length,
    recoveryNeeded: failures.length > 0,
    plan,
  });

  return { components, plan, executionResults, state };
}

function attemptRecovery(projectRoot) {
  const recoveryScript = join(SCRIPTS_DIR, 'gate-recovery.mjs');
  if (!existsSync(recoveryScript)) {
    return { status: 'unavailable', message: 'gate-recovery.mjs not found' };
  }
  try {
    const result = spawnSync('node', [recoveryScript, '--recover'], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { status: result.status === 0 ? 'completed' : 'failed', output: result.stdout?.trim() };
  } catch (err) {
    return { status: 'failed', error: err.message?.slice(0, 500) };
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

function generateReport(components) {
  if (!components) {
    components = detectComponents();
  }

  const detected = Object.entries(components)
    .filter(([k, v]) => k !== 'scannedAt' && v?.detected);
  const unavailable = Object.entries(components)
    .filter(([k, v]) => k !== 'scannedAt' && !v?.detected);

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: Object.keys(components).filter(k => k !== 'scannedAt').length,
      detected: detected.length,
      unavailable: unavailable.length,
    },
    detected: detected.map(([key, c]) => ({
      name: key,
      path: c.path,
      version: c.version || null,
      source: c.source || null,
      capabilities: c.capabilities || [],
    })),
    unavailable: unavailable.map(([key]) => key),
    allCapabilities: detected.flatMap(([, c]) => c.capabilities || []),
    recommendedWorkflow: determineRecommendedWorkflow(detected.map(([k]) => k)),
  };

  emitMarker({ type: 'component_report', ...report });
  return report;
}

function determineRecommendedWorkflow(detectedNames) {
  if (detectedNames.includes('superpowers') && detectedNames.includes('openspec') && detectedNames.includes('chaos-harness')) {
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
  if (detectedNames.includes('superpowers') && detectedNames.includes('chaos-harness')) {
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
  if (detectedNames.includes('openspec') && detectedNames.includes('chaos-harness')) {
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
  if (detectedNames.includes('chaos-harness')) {
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
        emitMarker({ type: 'error', message: 'orchestrate requires user input' });
        process.exit(1);
      }
      orchestrate(PROJECT_ROOT, input);
      break;

    case 'detect': {
      const components = detectComponents(PROJECT_ROOT);
      emitMarker({ type: 'detection', components });
      break;
    }

    case 'report':
      generateReport();
      break;

    case 'status': {
      const state = readOrchestratorState();
      const components = detectComponents(PROJECT_ROOT);
      emitMarker({
        type: 'status',
        runCount: state.runCount || 0,
        lastRun: state.updatedAt || null,
        components: Object.fromEntries(
          Object.entries(components)
            .filter(([k, v]) => k !== 'scannedAt')
            .map(([k, v]) => [k, v.detected])
        ),
        lastPlan: state.lastPlan ? { mode: state.lastPlan.executionMode, steps: state.lastPlan.steps.length } : null,
        lastExecution: state.lastExecution ? {
          total: state.lastExecution.length,
          completed: state.lastExecution.filter(r => r.status === 'completed').length,
          failed: state.lastExecution.filter(r => r.status === 'failed').length,
        } : null,
      });
      break;
    }

    case 'recover': {
      const recoveryResult = attemptRecovery(PROJECT_ROOT);
      emitMarker({ type: 'recovery', ...recoveryResult });
      break;
    }

    case 'plan': {
      if (!input) {
        emitMarker({ type: 'error', message: 'plan requires user input' });
        process.exit(1);
      }
      const components = detectComponents(PROJECT_ROOT);
      const plan = planExecution(input, components, PROJECT_ROOT);
      emitMarker({ type: 'plan', ...plan });
      break;
    }

    case 'help':
    default:
      emitMarker({
        type: 'help',
        version: '1.4.0',
        commands: {
          'orchestrate <input>': 'Full cycle: detect → plan → execute → report',
          'detect': 'Scan for installed plugins via adapters',
          'report': 'Generate component capability report',
          'status': 'Show orchestrator state and last execution',
          'recover': 'Attempt recovery from last failure',
          'plan <input>': 'Generate execution plan without running',
        },
        integrations: {
          superpowers: existsSync(join(INTEGRATIONS_DIR, 'superpowers', 'adapter.mjs')) ? 'loaded' : 'not found',
          openspec: existsSync(join(INTEGRATIONS_DIR, 'openspec', 'adapter.mjs')) ? 'loaded' : 'not found',
          everything: existsSync(join(INTEGRATIONS_DIR, 'everything', 'adapter.mjs')) ? 'loaded' : 'not found',
          registry: existsSync(join(INTEGRATIONS_DIR, 'registry.mjs')) ? 'loaded' : 'not found',
        },
      });
      break;
  }
}

if (process.argv[1] && process.argv[1].endsWith('orchestrator.mjs')) {
  main();
}

export { detectComponents, planExecution, orchestrate, generateReport };
