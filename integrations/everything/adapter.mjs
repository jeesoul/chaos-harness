#!/usr/bin/env node
/**
 * everything adapter — chaos-harness 对 everything-claude-code 的能力桥接
 *
 * 检测 everything-claude-code 是否安装，输出可用的 agents 列表，
 * 提供 agent 调度函数（通过 Claude Code Agent tool）。
 *
 * 支持 agents：
 *   - code-reviewer：代码评审
 *   - security-reviewer：安全审计
 *   - tdd-guide：TDD 指导
 *   - 以及 everything 配置中定义的其他 agents
 *
 * 同时加载 rules 和 hooks 配置信息。
 *
 * 调用:
 *   node integrations/everything/adapter.mjs detect [projectRoot]
 *   node integrations/everything/adapter.mjs capabilities [projectRoot]
 *   node integrations/everything/adapter.mjs dispatch <agent-id> <task> [projectRoot]
 *   node integrations/everything/adapter.mjs rules [projectRoot]
 *   node integrations/everything/adapter.mjs hooks [projectRoot]
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.argv[3] || dirname(dirname(__dirname));

// ─── 已知 Agent 定义 ────────────────────────────────────────────────────────

const KNOWN_AGENTS = {
  'code-reviewer': {
    name: 'Code Reviewer',
    description: '代码评审 Agent — 检查代码质量、风格、潜在 Bug',
    category: 'review',
    recommendedModel: 'sonnet',
    models: ['sonnet', 'opus'],
    requiresContext: ['filePaths', 'diff'],
    triggers: ['review', 'code review', 'pr review', 'check code'],
  },
  'security-reviewer': {
    name: 'Security Reviewer',
    description: '安全审计 Agent — 检测漏洞、敏感信息、注入风险',
    category: 'security',
    recommendedModel: 'opus',
    models: ['opus'],
    requiresContext: ['filePaths', 'scanTarget'],
    triggers: ['security', 'audit', 'vulnerability', 'secret', 'injection'],
  },
  'tdd-guide': {
    name: 'TDD Guide',
    description: 'TDD 指导 Agent — 测试驱动开发流程引导',
    category: 'development',
    recommendedModel: 'sonnet',
    models: ['sonnet', 'opus'],
    requiresContext: ['feature', 'testFramework'],
    triggers: ['tdd', 'test driven', 'write test', 'test first'],
  },
  'doc-writer': {
    name: 'Doc Writer',
    description: '文档生成 Agent — API 文档、README、注释',
    category: 'documentation',
    recommendedModel: 'sonnet',
    models: ['sonnet', 'haiku'],
    requiresContext: ['sourceFiles', 'docFormat'],
    triggers: ['document', 'readme', 'api doc', 'comment', 'javadoc'],
  },
  'refactor-agent': {
    name: 'Refactor Agent',
    description: '重构 Agent — 代码结构优化、重复消除',
    category: 'development',
    recommendedModel: 'opus',
    models: ['opus', 'sonnet'],
    requiresContext: ['targetFiles', 'refactorGoal'],
    triggers: ['refactor', 'clean up', 'simplify', 'reduce duplication'],
  },
  'performance-auditor': {
    name: 'Performance Auditor',
    description: '性能审计 Agent — 检测性能瓶颈和优化机会',
    category: 'performance',
    recommendedModel: 'opus',
    models: ['opus'],
    requiresContext: ['targetFiles', 'performanceMetric'],
    triggers: ['performance', 'slow', 'optimize', 'bottleneck'],
  },
  'architect': {
    name: 'Architect',
    description: '架构师 Agent — 架构设计评审和建议',
    category: 'architecture',
    recommendedModel: 'opus',
    models: ['opus'],
    requiresContext: ['designDoc', 'constraints'],
    triggers: ['architect', 'design', 'structure', 'pattern'],
  },
  'debugger': {
    name: 'Debugger',
    description: '调试 Agent — 系统性 Bug 定位',
    category: 'debugging',
    recommendedModel: 'opus',
    models: ['opus', 'sonnet'],
    requiresContext: ['error', 'stackTrace', 'reproduction'],
    triggers: ['debug', 'bug', 'error', 'crash', 'not working'],
  },
};

// ─── 检测 ──────────────────────────────────────────────────────────────────

/**
 * 检测 everything-claude-code 是否安装
 */
export function detect(root = PROJECT_ROOT) {
  const info = {
    name: 'everything-claude-code',
    available: false,
    locations: [],
    version: 'unknown',
    agents: [],
    rules: [],
    hooks: [],
  };

  // 检测 1: 项目内的 everything 配置
  const everythingConfig = findEverythingConfig(root);
  if (everythingConfig) {
    info.locations.push({ type: 'config', path: everythingConfig.path });
    info.available = true;
    info.version = everythingConfig.version || info.version;
    parseEverythingConfig(everythingConfig.content, info);
  }

  // 检测 2: 全局 ~/.claude/ 配置
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const globalConfigPath = join(homeDir, '.claude', 'everything.json');
  if (existsSync(globalConfigPath)) {
    try {
      const content = readFileSync(globalConfigPath, 'utf8');
      info.locations.push({ type: 'global-config', path: globalConfigPath });
      if (!info.available) info.available = true;
      parseEverythingConfig(content, info);
    } catch { /* skip */ }
  }

  // 检测 3: npm 包
  const pkgPath = join(root, 'node_modules', 'everything-claude-code', 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      info.locations.push({ type: 'npm-package', path: pkgPath });
      info.version = pkg.version;
      if (!info.available) info.available = true;
    } catch { /* skip */ }
  }

  // 检测 4: skills 目录下的 everything 相关 skill
  const skillsDir = join(root, 'skills');
  if (existsSync(skillsDir)) {
    try {
      const entries = readdirSync(skillsDir);
      for (const entry of entries) {
        if (entry.startsWith('everything') || entry.includes('everything')) {
          info.locations.push({ type: 'skill', path: join(skillsDir, entry) });
          if (!info.available) info.available = true;
        }
      }
    } catch { /* skip */ }
  }

  // 检测 5: rules 文件
  const rulesPaths = [
    join(root, '.claude', 'rules', 'everything.md'),
    join(root, 'rules', 'everything.md'),
    join(root, '.claude', 'rules.md'),
    join(root, 'CLAUDE.md'),
  ];
  for (const rp of rulesPaths) {
    if (existsSync(rp)) {
      info.rules.push({ path: rp });
    }
  }

  // 检测 6: hooks 配置
  const hooksJsonPath = join(root, 'hooks', 'hooks.json');
  if (existsSync(hooksJsonPath)) {
    try {
      const hooksConfig = JSON.parse(readFileSync(hooksJsonPath, 'utf8'));
      info.hooks = extractHooksInfo(hooksConfig);
    } catch { /* skip */ }
  }

  return info;
}

/** 查找 everything 配置文件 */
function findEverythingConfig(root) {
  const candidates = [
    join(root, 'everything.json'),
    join(root, '.claude', 'everything.json'),
    join(root, '.everything.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        return { path: p, content: readFileSync(p, 'utf8') };
      } catch { /* skip */ }
    }
  }
  return null;
}

/** 解析 everything 配置 */
function parseEverythingConfig(content, info) {
  try {
    const config = JSON.parse(content);

    // 提取 agents
    if (config.agents && Array.isArray(config.agents)) {
      for (const agent of config.agents) {
        info.agents.push({
          id: agent.id || agent.name || 'unknown',
          name: agent.name || agent.id,
          description: agent.description || '',
          model: agent.model || 'sonnet',
          prompt: agent.prompt || '',
          tools: agent.tools || undefined,
        });
      }
    }

    // 提取 rules
    if (config.rules && Array.isArray(config.rules)) {
      for (const rule of config.rules) {
        info.rules.push({
          id: rule.id || 'rule',
          description: rule.description || rule.pattern || '',
          pattern: rule.pattern,
          action: rule.action,
        });
      }
    }

    // 提取 hooks
    if (config.hooks && Array.isArray(config.hooks)) {
      for (const hook of config.hooks) {
        info.hooks.push({
          event: hook.event || 'unknown',
          matcher: hook.matcher || '.*',
          command: hook.command || '',
          async: hook.async !== false,
        });
      }
    }

    if (config.version) info.version = config.version;
  } catch {
    // JSON 解析失败，尝试从 markdown 格式提取
    tryExtractFromMarkdown(content, info);
  }
}

/** 从 markdown 格式尝试提取信息 */
function tryExtractFromMarkdown(content, info) {
  // 尝试提取 agent 列表（## Agent 格式）
  const agentSections = content.match(/##\s+(?:Agent|Agents?)[:\s]*([^\n]*)/gi);
  if (agentSections) {
    for (const section of agentSections) {
      const name = section.replace(/##\s+(?:Agent|Agents?)[:\s]*/i, '').trim();
      if (name && name.length < 50) {
        info.agents.push({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          description: 'Extracted from markdown config',
          model: 'sonnet',
        });
      }
    }
  }

  // 如果配置中提到了已知 agent 名称，自动添加
  for (const [id, def] of Object.entries(KNOWN_AGENTS)) {
    if (content.toLowerCase().includes(id.replace('-', ' ')) ||
        content.toLowerCase().includes(id)) {
      if (!info.agents.some(a => a.id === id)) {
        info.agents.push({
          id,
          name: def.name,
          description: def.description,
          model: def.recommendedModel,
        });
      }
    }
  }
}

/** 从 hooks.json 提取 hooks 信息 */
function extractHooksInfo(hooksConfig) {
  const hooks = [];
  if (hooksConfig.hooks) {
    for (const [event, matchers] of Object.entries(hooksConfig.hooks)) {
      if (Array.isArray(matchers)) {
        for (const m of matchers) {
          if (m.hooks && Array.isArray(m.hooks)) {
            for (const h of m.hooks) {
              hooks.push({
                event,
                matcher: m.matcher || '.*',
                command: h.command || '',
                async: h.async !== false,
              });
            }
          }
        }
      }
    }
  }
  return hooks;
}

// ─── 能力列表 ──────────────────────────────────────────────────────────────

/**
 * 输出 everything 可用的 agents 列表
 */
export function getCapabilities(root = PROJECT_ROOT) {
  const info = detect(root);

  const capabilities = [];

  // 从配置中发现的 agents
  for (const agent of info.agents) {
    const known = KNOWN_AGENTS[agent.id];
    capabilities.push({
      id: `everything:${agent.id}`,
      name: agent.name,
      description: agent.description || (known ? known.description : `Everything agent: ${agent.id}`),
      category: known ? known.category : 'custom',
      recommendedModel: agent.model || (known ? known.recommendedModel : 'sonnet'),
      models: known ? known.models : [agent.model || 'sonnet'],
      requiresReview: false,
      source: 'everything',
      tools: agent.tools,
    });
  }

  // 如果没有自定义 agents，列出已知的
  if (capabilities.length === 0) {
    for (const [id, def] of Object.entries(KNOWN_AGENTS)) {
      capabilities.push({
        id: `everything:${id}`,
        name: def.name,
        description: def.description,
        category: def.category,
        recommendedModel: def.recommendedModel,
        models: def.models,
        requiresReview: false,
        source: 'everything',
        triggers: def.triggers,
      });
    }
  }

  return {
    source: 'everything-claude-code',
    version: info.version,
    available: info.available,
    agentCount: capabilities.length,
    capabilities,
    rules: info.rules,
    hooks: info.hooks,
  };
}

// ─── 模型选择 ──────────────────────────────────────────────────────────────

export function selectModel(agentId, taskDescription) {
  const known = KNOWN_AGENTS[agentId];
  if (!known) return 'sonnet';

  const task = (taskDescription || '').toLowerCase();
  const complexSignals = ['architect', 'security', 'performance', 'systematic', 'deep'];
  const simpleSignals = ['format', 'lint', 'small', 'quick'];

  if (known.models.includes('opus') && complexSignals.some(s => task.includes(s))) {
    return 'opus';
  }
  if (known.models.includes('haiku') && simpleSignals.some(s => task.includes(s))) {
    return 'haiku';
  }
  if (known.models.includes('sonnet')) return 'sonnet';
  return known.models[0];
}

// ─── Agent 调度 ────────────────────────────────────────────────────────────

/**
 * 调度 everything agent 执行任务
 *
 * 使用 Claude Code 的 Agent tool 模式：
 *   - 构建 agent prompt
 *   - 指定模型
 *   - 传入上下文
 *
 * @param {string} agentId - Agent ID
 * @param {string} taskDescription - 任务描述
 * @param {object} options - 可选参数
 * @param {string} options.model - 指定模型
 * @param {object} options.context - 额外上下文（文件路径、错误信息等）
 * @param {string} root - 项目根目录
 */
export function dispatch(agentId, taskDescription, options = {}, root = PROJECT_ROOT) {
  const info = detect(root);
  const known = KNOWN_AGENTS[agentId];

  if (!info.available && !known) {
    return {
      success: false,
      error: `Agent "${agentId}" not found in everything config or known agents.`,
      availableAgents: info.agents.map(a => a.id),
      knownAgents: Object.keys(KNOWN_AGENTS),
      suggestion: 'Add the agent to your everything.json config or use a known agent ID.',
    };
  }

  const model = options.model || selectModel(agentId, taskDescription);
  const agentConfig = info.agents.find(a => a.id === agentId);

  // 构建 Agent tool 调用指令
  const systemPrompt = buildAgentPrompt(agentId, agentConfig, known, taskDescription, options);

  const dispatchPayload = {
    agent: agentId,
    task: taskDescription,
    model,
    systemPrompt,
    context: {
      projectRoot: root,
      timestamp: new Date().toISOString(),
      ...options.context,
    },
    // Claude Code Agent tool 调用格式
    agentToolCall: {
      tool: 'Agent',
      input: {
        prompt: systemPrompt,
        model,
        ...(agentConfig?.tools ? { allowedTools: agentConfig.tools } : {}),
      },
    },
  };

  return {
    success: true,
    dispatched: dispatchPayload,
    note: 'To execute, pass agentToolCall.input to Claude Code Agent tool.',
  };
}

/** 构建 agent 系统提示 */
function buildAgentPrompt(agentId, agentConfig, knownDef, taskDescription, options) {
  const parts = [];

  // Agent 角色定义
  const name = agentConfig?.name || knownDef?.name || agentId;
  const description = agentConfig?.description || knownDef?.description || '';

  parts.push(`You are ${name}.`);
  parts.push(description);
  parts.push('');

  // 任务描述
  parts.push(`## Task`);
  parts.push(taskDescription);
  parts.push('');

  // 上下文
  if (options.context) {
    parts.push('## Context');
    if (options.context.filePaths) {
      parts.push(`### Files`);
      for (const fp of options.context.filePaths) {
        parts.push(`- ${fp}`);
      }
      parts.push('');
    }
    if (options.context.diff) {
      parts.push(`### Diff`);
      parts.push('```diff');
      parts.push(options.context.diff);
      parts.push('```');
      parts.push('');
    }
    if (options.context.error) {
      parts.push(`### Error`);
      parts.push('```');
      parts.push(options.context.error);
      parts.push('```');
      parts.push('');
    }
  }

  // Agent 自定义 prompt（如果有）
  if (agentConfig?.prompt) {
    parts.push('## Instructions');
    parts.push(agentConfig.prompt);
    parts.push('');
  }

  // 通用约束
  parts.push('## Rules');
  parts.push('- Follow the project conventions and coding standards');
  parts.push('- Be thorough but concise');
  parts.push('- Report findings clearly with actionable items');
  parts.push('');

  return parts.join('\n');
}

/**
 * 智能匹配 agent — 根据任务描述自动选择最合适的 agent
 */
export function matchAgent(taskDescription, root = PROJECT_ROOT) {
  const capabilities = getCapabilities(root);
  const task = taskDescription.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const cap of capabilities.capabilities) {
    let score = 0;

    // 匹配 triggers
    const triggers = cap.triggers || [];
    for (const t of triggers) {
      if (task.includes(t.toLowerCase())) score += 5;
    }

    // 匹配描述关键词
    const desc = (cap.description || '').toLowerCase();
    const name = (cap.name || '').toLowerCase();
    const keywords = task.split(/\s+/).filter(w => w.length > 3);
    for (const kw of keywords) {
      if (desc.includes(kw)) score += 2;
      if (name.includes(kw)) score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = cap;
    }
  }

  if (bestMatch && bestScore > 0) {
    return {
      matched: true,
      agent: bestMatch,
      confidence: Math.min(bestScore / 10, 1),
      score: bestScore,
    };
  }

  return {
    matched: false,
    suggestion: capabilities.capabilities[0] || null,
    reason: `No agent matched "${taskDescription}" with sufficient confidence.`,
  };
}

/**
 * 加载 rules 配置
 */
export function getRules(root = PROJECT_ROOT) {
  const info = detect(root);
  const rules = [];

  for (const rule of info.rules) {
    if (rule.path && existsSync(rule.path)) {
      try {
        rules.push({
          path: rule.path,
          content: readFileSync(rule.path, 'utf8'),
          size: statSync(rule.path).size,
        });
      } catch { /* skip unreadable files */ }
    } else if (rule.id) {
      rules.push(rule);
    }
  }

  return {
    source: 'everything',
    ruleCount: rules.length,
    rules,
  };
}

/**
 * 加载 hooks 配置
 */
export function getHooks(root = PROJECT_ROOT) {
  const info = detect(root);
  return {
    source: 'everything',
    hookCount: info.hooks.length,
    hooks: info.hooks,
  };
}

// ─── CLI 入口 ──────────────────────────────────────────────────────────────

function main() {
  const command = process.argv[2] || 'detect';
  const root = process.argv[3] || PROJECT_ROOT;

  switch (command) {
    case 'detect':
      console.log(JSON.stringify(detect(root), null, 2));
      break;

    case 'capabilities':
      console.log(JSON.stringify(getCapabilities(root), null, 2));
      break;

    case 'rules':
      console.log(JSON.stringify(getRules(root), null, 2));
      break;

    case 'hooks':
      console.log(JSON.stringify(getHooks(root), null, 2));
      break;

    case 'dispatch': {
      const agentId = process.argv[4];
      const taskDesc = process.argv[5];
      if (!agentId || !taskDesc) {
        console.error('Usage: adapter.mjs dispatch <agent-id> <task-description> [projectRoot]');
        process.exit(1);
      }
      const options = {};
      for (let i = 6; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg.startsWith('--model=')) options.model = arg.split('=')[1];
      }
      console.log(JSON.stringify(dispatch(agentId, taskDesc, options, root), null, 2));
      break;
    }

    case 'match': {
      const taskDesc = process.argv[4];
      if (!taskDesc) {
        console.error('Usage: adapter.mjs match <task-description> [projectRoot]');
        process.exit(1);
      }
      console.log(JSON.stringify(matchAgent(taskDesc, root), null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: adapter.mjs [detect|capabilities|rules|hooks|dispatch|match] [projectRoot]');
      process.exit(1);
  }
}

if (process.argv[1] && /everything[\\/]adapter/.test(process.argv[1])) {
  main();
}

export default { detect, getCapabilities, dispatch, matchAgent, selectModel, getRules, getHooks };
