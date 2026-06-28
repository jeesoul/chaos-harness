#!/usr/bin/env node
/**
 * gate-machine — Gate 状态机核心引擎
 * 调度验证、管理生命周期、处理 hooks 触发
 *
 * 调用:
 *   node gate-machine.mjs --gate <gate-id>        # 检查单个 Gate
 *   node gate-machine.mjs --session-start          # 会话启动检查
 *   node gate-machine.mjs --transition <stage-id>  # 阶段切换
 *   node gate-machine.mjs --status                 # 显示所有 Gate 状态
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { execSync, execFileSync } from 'node:child_process';

import { resolvePluginRoot, resolveProjectRoot, normalizePath } from './path-utils.mjs';
import { readJson, writeJsonAtomic, ensureDir } from './hook-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();
const gatesDir = join(pluginRoot, '.chaos-harness', 'gates');
const stateJsonPath = join(pluginRoot, '.chaos-harness', 'state.json');

/**
 * 首次安装：生成默认注册表
 */
function generateDefaultRegistry() {
  const registryPath = join(gatesDir, 'gate-registry.json');
  if (existsSync(registryPath)) return;

  ensureDir(gatesDir);

  const state = readJson(stateJsonPath, null);
  const stages = state?.workflow?.stages_completed?.map(s => s.stage) || [];

  const defaultGates = [
    {
      id: 'gate-quality-iron-law',
      type: 'quality',
      level: 'hard',
      description: '铁律违规零容忍',
      trigger: 'pre-write',
      cachePolicy: 'never',
      validators: [{ type: 'iron-law-check' }],
      dependsOn: [],
    },
    {
      id: 'gate-quality-format',
      type: 'quality',
      level: 'soft',
      description: '代码格式建议',
      trigger: 'pre-commit',
      cachePolicy: 'on-change',
      validators: [{ type: 'lint-check' }],
      dependsOn: [],
    },
  ];

  const allStages = [
    { id: 'gate-w01-requirements', stage: 'W01_requirements' },
    { id: 'gate-w03-architecture', stage: 'W03_architecture' },
    { id: 'gate-w08-development', stage: 'W08_development' },
    { id: 'gate-w09-code-review', stage: 'W09_code_review' },
    { id: 'gate-w10-testing', stage: 'W10_testing' },
    { id: 'gate-w12-release', stage: 'W12_release' },
  ];

  for (let i = 0; i < allStages.length; i++) {
    const stage = allStages[i];
    const prevDeps = i > 0 ? [allStages[i - 1].id] : [];

    defaultGates.push({
      id: stage.id,
      type: 'stage',
      stage: stage.stage,
      level: 'hard',
      description: `${stage.stage} 进入检查`,
      trigger: 'stage-transition',
      cachePolicy: 'always',
      validators: [],
      dependsOn: prevDeps,
    });
  }

  const registry = {
    gates: defaultGates,
    version: '1.3.2',
    createdAt: new Date().toISOString(),
  };

  writeJsonAtomic(registryPath, registry);
  console.log('Generated default gate registry');
}

/**
 * 加载注册表
 */
function loadRegistry() {
  generateDefaultRegistry();
  const registryPath = join(gatesDir, 'gate-registry.json');
  const registry = readJson(registryPath, null);
  if (!registry) {
    console.error('ERROR: gate-registry.json is invalid');
    process.exit(1);
  }
  return registry;
}

/**
 * 检查单个 Gate
 */
function checkGate(gateId, projectRoot, silent = false) {
  const enforcerPath = join(pluginRoot, 'scripts', 'gate-enforcer.mjs');
  try {
    execFileSync('node', [enforcerPath, gateId, '--root', projectRoot], {
      stdio: silent ? 'pipe' : 'inherit',
      timeout: 30000
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 会话启动检查
 */
function sessionStart(projectRoot) {
  console.log('[Gate Machine] Session start check...');

  const registry = loadRegistry();
  const stageGates = registry.gates.filter(g => g.type === 'stage');

  for (const gate of stageGates) {
    const statePath = join(gatesDir, `${gate.id}.json`);
    const state = readJson(statePath, null);
    if (state?.status === 'passed') {
      // 重新验证（静默模式，不输出到 stdout）
      checkGate(gate.id, projectRoot, true);
    }
  }

  // 提示可能的阶段切换
  suggestTransition(projectRoot, registry);
}

/**
 * 自动检测并提示阶段切换
 */
function suggestTransition(projectRoot, registry) {
  const state = readJson(stateJsonPath, null);
  if (!state) return;

  const stages = state.workflow?.stages_completed?.map(s => s.stage) || [];

  if (stages.includes('W08_development') && !stages.includes('W09_code_review')) {
    try {
      const output = execSync('git log --oneline --since="1 week ago"', {
        cwd: projectRoot,
        encoding: 'utf-8'
      });
      const count = output.trim().split('\n').filter(l => l.length > 0).length;
      if (count >= 5) {
        console.log('\n[Gate Machine] 开发阶段似乎已完成（5+ commits）。');
        console.log('运行 /gate-manager transition W09_code_review 进入代码审查阶段');
      }
    } catch {}
  }
}

/**
 * 阶段切换
 */
function transitionStage(stageId, projectRoot) {
  const registry = loadRegistry();

  const gate = registry.gates.find(g => g.stage === stageId);
  if (!gate) {
    console.error(`No gate defined for stage: ${stageId}`);
    process.exit(1);
  }

  // 检查所有依赖 Gates
  for (const depId of gate.dependsOn) {
    const depStatePath = join(gatesDir, `${depId}.json`);
    const depState = readJson(depStatePath, null);
    if (!depState || depState.status !== 'passed') {
      console.log(`Checking dependency: ${depId}...`);
      const ok = checkGate(depId, projectRoot);
      if (!ok) {
        console.error(`\nCannot transition: dependency ${depId} failed`);
        process.exit(1);
      }
    }
  }

  // 检查目标 Gate
  console.log(`Checking gate: ${gate.id}...`);
  const ok = checkGate(gate.id, projectRoot);
  if (!ok) {
    console.error(`\nCannot transition: ${gate.id} failed`);
    process.exit(1);
  }

  // 更新 state.json
  const state = readJson(stateJsonPath, null);
  if (!state) {
    console.error('Cannot read state.json');
    process.exit(1);
  }

  // 确保 workflow 字段存在
  if (!state.workflow) state.workflow = { stages_completed: [], stages_pending: [], current_stage: null };
  if (!state.workflow.stages_completed) state.workflow.stages_completed = [];

  // 标记当前阶段为完成
  if (!state.workflow.stages_completed.find(s => s.stage === stageId)) {
    state.workflow.stages_completed.push({
      stage: stageId,
      completed_at: new Date().toISOString(),
      output_path: `output/v1.3.2/${stageId}`,
    });
  }

  // 设置下一阶段
  state.workflow.current_stage = stageId;
  state.current_version = 'v1.3.2';
  state.last_session = new Date().toISOString();

  writeJsonAtomic(stateJsonPath, state);
  console.log(`\nTransitioned to stage: ${stageId}`);
}

/**
 * 显示所有 Gate 状态
 */
function showStatus() {
  const registry = loadRegistry();
  const stageGates = registry.gates.filter(g => g.type === 'stage');
  const qualityGates = registry.gates.filter(g => g.type === 'quality');

  console.log('\nGate Status Dashboard');
  console.log('='.repeat(40));

  console.log('\nStage Gates:');
  for (const gate of stageGates) {
    const statePath = join(gatesDir, `${gate.id}.json`);
    const state = readJson(statePath, null);
    const status = state?.status || 'pending';
    const date = state?.lastChecked ? new Date(state.lastChecked).toISOString().slice(0, 10) : '';
    console.log(`  [${statusPad(status)}] ${gate.id.padEnd(30)} ${status} ${date}`);
  }

  console.log('\nQuality Gates:');
  for (const gate of qualityGates) {
    const statePath = join(gatesDir, `${gate.id}.json`);
    const state = readJson(statePath, null);
    const status = state?.status || 'pending';
    const date = state?.lastChecked ? new Date(state.lastChecked).toISOString().slice(0, 10) : '';
    console.log(`  [${statusPad(status)}] ${gate.id.padEnd(30)} ${status} ${date}`);
  }

  // 统计
  const allGates = registry.gates;
  let passed = 0, pending = 0, softFail = 0;
  for (const gate of allGates) {
    const statePath = join(gatesDir, `${gate.id}.json`);
    const state = readJson(statePath, null);
    if (state?.status === 'passed') passed++;
    else if (state?.status === 'soft-fail') softFail++;
    else pending++;
  }
  console.log(`\nSummary: ${passed} passed, ${pending} pending, ${softFail} soft-fail`);
}

function statusPad(status) {
  switch (status) {
    case 'passed': return 'PASS';
    case 'soft-fail': return 'WARN';
    case 'failed': return 'FAIL';
    default: return '    ';
  }
}

/**
 * 主入口
 */
function main() {
  const args = process.argv.slice(2);
  const projectRoot = resolveProjectRoot() || process.cwd();

  const gateIdx = args.indexOf('--gate');
  const sessionIdx = args.indexOf('--session-start');
  const transitionIdx = args.indexOf('--transition');
  const statusIdx = args.indexOf('--status');

  if (gateIdx >= 0) {
    checkGate(args[gateIdx + 1], projectRoot);
  } else if (sessionIdx >= 0) {
    sessionStart(projectRoot);
  } else if (transitionIdx >= 0) {
    transitionStage(args[transitionIdx + 1], projectRoot);
  } else if (statusIdx >= 0) {
    showStatus();
  } else {
    console.error('Usage: node gate-machine.mjs --gate <id> | --session-start | --transition <stage> | --status');
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
