#!/usr/bin/env node
/**
 * integrations/registry.mjs — 组件注册表
 *
 * 统一发现和调度所有可用组件（superpowers、openspec、everything、chaos-harness）
 *
 * 调用: node integrations/registry.mjs <command>
 *   scan <projectRoot>     — 扫描所有可用组件
 *   capabilities <projectRoot> — 返回能力列表
 *   best-path <input>      — 根据用户输入推荐最优执行路径
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname); // integrations/ → project root

// === 组件检测器 ===
function detectSuperpowers(projectRoot) {
  const paths = [
    join(projectRoot, '.claude', 'skills', 'subagent-driven-development', 'SKILL.md'),
    join(projectRoot, 'skills', 'subagent-driven-development', 'SKILL.md'),
  ];

  // Check if superpowers is a sibling or referenced in settings
  const settingsPath = join(projectRoot, '.claude', 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      const hooks = JSON.stringify(settings.hooks || '');
      if (hooks.includes('superpowers') || hooks.includes('subagent')) {
        return { detected: true, source: 'settings_reference', capabilities: ['subagent-dispatch', 'plan-execution', 'code-review'] };
      }
    } catch {}
  }

  for (const p of paths) {
    if (existsSync(p)) {
      return { detected: true, source: 'skill_file', capabilities: ['subagent-dispatch', 'plan-execution', 'code-review'] };
    }
  }

  // Check common plugin cache locations
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const pluginPaths = [
    join(home, '.claude', 'plugins', 'cache', 'superpowers'),
    join(home, '.claude', 'plugins', 'superpowers'),
  ];
  for (const p of pluginPaths) {
    if (existsSync(join(p, 'skills', 'subagent-driven-development', 'SKILL.md'))) {
      return { detected: true, source: 'plugin_cache', capabilities: ['subagent-dispatch', 'plan-execution', 'code-review'] };
    }
  }

  return { detected: false, source: null, capabilities: [] };
}

function detectOpenSpec(projectRoot) {
  const hasOpenSpecDir = existsSync(join(projectRoot, 'openspec'));
  const hasConfig = existsSync(join(projectRoot, 'openspec', 'config.yaml')) ||
                    existsSync(join(projectRoot, '.openspec.yaml'));
  const hasCli = checkNpmPackage('@fission-ai/openspec', projectRoot);

  if (hasOpenSpecDir || hasConfig || hasCli) {
    return {
      detected: true,
      source: hasOpenSpecDir ? 'openspec_dir' : hasConfig ? 'config_file' : 'npm_package',
      capabilities: ['change-proposal', 'task-generation', 'spec-management', 'archive'],
    };
  }
  return { detected: false, source: null, capabilities: [] };
}

function detectEverything(projectRoot) {
  const agents = existsSync(join(projectRoot, 'agents')) ? listAgents(join(projectRoot, 'agents')) : [];
  const rules = existsSync(join(projectRoot, 'rules')) ? listMdFiles(join(projectRoot, 'rules')) : [];
  const hooks = existsSync(join(projectRoot, 'hooks', 'hooks.json'));
  const contexts = existsSync(join(projectRoot, 'contexts')) ? listMdFiles(join(projectRoot, 'contexts')) : [];

  if (agents.length > 0 || rules.length > 0) {
    return {
      detected: true,
      agents,
      rules,
      contexts,
      hooks,
      capabilities: ['agent-dispatch', 'rule-injection', 'hook-config', 'context-mode'],
    };
  }
  return { detected: false, agents: [], rules: [], contexts: [], hooks: false, capabilities: [] };
}

function detectChaosHarness(projectRoot) {
  const scripts = existsSync(join(projectRoot, 'scripts')) ? listMjsFiles(join(projectRoot, 'scripts')) : [];
  const skills = existsSync(join(projectRoot, 'skills')) ? listSkillDirs(join(projectRoot, 'skills')) : [];
  const hasGateMachine = existsSync(join(projectRoot, 'scripts', 'gate-machine.mjs'));
  const hasOrchestrator = existsSync(join(projectRoot, 'scripts', 'orchestrator.mjs'));

  return {
    detected: true,
    scripts,
    skills,
    hasGateMachine,
    hasOrchestrator,
    capabilities: [
      hasGateMachine ? 'gate-machine' : null,
      hasOrchestrator ? 'orchestrator' : null,
      'validation',
      'hard-blocking',
      'recovery',
    ].filter(Boolean),
  };
}

// === 辅助函数 ===
function checkNpmPackage(name, projectRoot) {
  const pkgPath = join(projectRoot, 'node_modules', name, 'package.json');
  return existsSync(pkgPath);
}

function listAgents(dir) {
  try {
    return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
  } catch { return []; }
}

function listMdFiles(dir) {
  try {
    return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
  } catch { return []; }
}

function listMjsFiles(dir) {
  try {
    return readdirSync(dir).filter(f => f.endsWith('.mjs')).map(f => f.replace('.mjs', ''));
  } catch { return []; }
}

function listSkillDirs(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(join(dir, d.name, 'SKILL.md')))
      .map(d => d.name);
  } catch { return []; }
}

// === 核心 API ===
function scanAll(projectRoot = PROJECT_ROOT) {
  return {
    superpowers: detectSuperpowers(projectRoot),
    openspec: detectOpenSpec(projectRoot),
    everything: detectEverything(projectRoot),
    chaosHarness: detectChaosHarness(projectRoot),
    scannedAt: new Date().toISOString(),
  };
}

function getCapabilities(projectRoot = PROJECT_ROOT) {
  const registry = scanAll(projectRoot);
  const caps = {};

  for (const [name, info] of Object.entries(registry)) {
    if (info.detected && info.capabilities) {
      caps[name] = info.capabilities;
    }
  }

  return caps;
}

function getBestPath(userInput, projectRoot = PROJECT_ROOT) {
  const registry = scanAll(projectRoot);
  const input = userInput.toLowerCase();

  // 意图分类
  const isCreate = /创建|新建|写一个|做|开发|搭建|实现/.test(input);
  const isModify = /修改|改|替换|换|重构|迁移/.test(input);
  const isBug = /bug|错误|报错|问题|修复|修/.test(input);
  const isReview = /评审|审查|检查|review/.test(input);
  const isTest = /测试|test|用例|覆盖率/.test(input);

  const steps = [];

  // 所有项目都有的基础流程
  steps.push({
    step: 1,
    component: 'chaos-harness',
    action: 'gate-init',
    description: '初始化 Gate 状态机',
    required: true,
  });

  // 根据意图和项目能力选择最优路径
  if (isCreate && registry.openspec.detected) {
    steps.push({
      step: 2,
      component: 'openspec',
      action: 'propose',
      description: '使用 OpenSpec 生成变更提案',
      required: false,
    });
  }

  if ((isCreate || isModify) && registry.superpowers.detected) {
    steps.push({
      step: steps.length + 1,
      component: 'superpowers',
      action: 'subagent-dispatch',
      description: '使用 superpowers 子代理自动实现',
      required: false,
    });
  }

  if (isCreate || isModify) {
    steps.push({
      step: steps.length + 1,
      component: 'chaos-harness',
      action: 'gate-implement',
      description: 'Gate 3 实现阶段',
      required: true,
    });
  }

  if (isTest || isCreate || isModify) {
    steps.push({
      step: steps.length + 1,
      component: 'chaos-harness',
      action: 'gate-test',
      description: 'Gate 4 测试验证',
      required: true,
    });
  }

  if (isReview) {
    if (registry.everything.detected && registry.everything.agents.includes('code-reviewer')) {
      steps.push({
        step: steps.length + 1,
        component: 'everything',
        action: 'dispatch-agent',
        agent: 'code-reviewer',
        description: '使用 code-reviewer Agent 进行代码审查',
        required: false,
      });
    }
  }

  // 最后必须验证
  steps.push({
    step: steps.length + 1,
    component: 'chaos-harness',
    action: 'gate-verify',
    description: 'Gate 验证，校验产出完整性',
    required: true,
  });

  return {
    input: userInput,
    intent: { isCreate, isModify, isBug, isReview, isTest },
    availableComponents: Object.entries(registry).filter(([_, v]) => v.detected).map(([k]) => k),
    recommendedPath: steps,
  };
}

export { scanAll, getCapabilities, getBestPath, detectSuperpowers, detectOpenSpec, detectEverything, detectChaosHarness };

// === CLI ===
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('integrations/registry.mjs')) {
  const command = process.argv[2];
  const arg = process.argv.slice(3).join(' ');

  switch (command) {
    case 'scan': {
      const registry = scanAll(arg || PROJECT_ROOT);
      console.log(JSON.stringify(registry, null, 2));
      break;
    }
    case 'capabilities': {
      const caps = getCapabilities(arg || PROJECT_ROOT);
      console.log(JSON.stringify(caps, null, 2));
      break;
    }
    case 'best-path': {
      if (!arg) {
        console.error('Usage: node registry.mjs best-path <user input>');
        process.exit(1);
      }
      const path = getBestPath(arg);
      console.log(JSON.stringify(path, null, 2));
      break;
    }
    default:
      console.log('Usage: node integrations/registry.mjs <command> [args]');
      console.log('Commands: scan, capabilities, best-path');
      process.exit(1);
  }
}
