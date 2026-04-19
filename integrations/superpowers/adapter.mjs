#!/usr/bin/env node
/**
 * superpowers adapter — chaos-harness 对 obra/superpowers 的能力桥接
 *
 * 检测 superpowers 是否安装，输出可调度能力列表，提供 subagent dispatch。
 *
 * 模型选择策略（按任务复杂度）：
 *   - haiku：简单任务（格式化、lint、小范围重构、文档补全）
 *   - sonnet：中等任务（功能开发、Bug 修复、代码评审）
 *   - opus：复杂任务（架构设计、系统性调试、跨模块重构）
 *
 * 调用:
 *   node integrations/superpowers/adapter.mjs detect [projectRoot]
 *   node integrations/superpowers/adapter.mjs capabilities [projectRoot]
 *   node integrations/superpowers/adapter.mjs dispatch <task-desc> [projectRoot]
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.argv[3] || dirname(dirname(__dirname));

// ─── 检测 ──────────────────────────────────────────────────────────────────

/**
 * 检测 superpowers 是否可用
 * 检查路径优先级：
 *   1. skills/subagent-driven-development/SKILL.md（本地项目内安装）
 *   2. ~/.claude/skills/superpowers（全局 Claude Code 插件安装）
 *   3. git submodule 或独立仓库
 */
export function detect(root = PROJECT_ROOT) {
  const checks = [
    {
      name: 'local-skills',
      path: join(root, 'skills', 'subagent-driven-development', 'SKILL.md'),
    },
    {
      name: 'global-skills',
      path: join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'skills', 'superpowers', 'subagent-driven-development', 'SKILL.md'),
    },
    {
      name: 'node_modules',
      path: join(root, 'node_modules', 'superpowers', 'skills', 'subagent-driven-development', 'SKILL.md'),
    },
  ];

  const results = [];
  for (const check of checks) {
    if (existsSync(check.path)) {
      results.push({ location: check.name, path: check.path, available: true });
    }
  }

  // 额外检测：列出所有可用的 superpowers skills
  const skillDirs = findSuperpowersSkills(root);

  return {
    name: 'superpowers',
    version: detectVersion(root),
    available: results.length > 0,
    locations: results,
    skillCount: skillDirs.length,
    skills: skillDirs,
  };
}

/** 递归扫描所有 superpowers 相关的 SKILL.md */
function findSuperpowersSkills(root) {
  const skills = [];
  const searchDirs = [
    join(root, 'skills'),
    join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'skills', 'superpowers'),
  ];

  for (const dir of searchDirs) {
    if (!existsSync(dir)) continue;
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const skillPath = join(dir, entry, 'SKILL.md');
        if (existsSync(skillPath)) {
          const content = readFileSync(skillPath, 'utf8');
          // 尝试从头部提取 skill 名称和描述
          const nameMatch = content.match(/^#\s+(.+)$/m);
          const descMatch = content.match(/^>\s+(.+)$/m);
          skills.push({
            id: entry,
            name: nameMatch ? nameMatch[1].trim() : entry,
            description: descMatch ? descMatch[1].trim() : '',
            path: skillPath,
          });
        }
      }
    } catch { /* skip unreadable dirs */ }
  }

  return skills;
}

/** 尝试检测 superpowers 版本 */
function detectVersion(root) {
  // 尝试从 package.json 读取
  const pkgPath = join(root, 'node_modules', 'superpowers', 'package.json');
  if (existsSync(pkgPath)) {
    try {
      return JSON.parse(readFileSync(pkgPath, 'utf8')).version || 'unknown';
    } catch { /* fall through */ }
  }

  // 尝试 git describe
  const spDirs = [
    join(root, 'node_modules', 'superpowers'),
    join(root, 'node_modules', '@obra', 'superpowers'),
  ];
  for (const dir of spDirs) {
    if (existsSync(join(dir, '.git'))) {
      try {
        return execSync('git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD', {
          cwd: dir,
          encoding: 'utf8',
        }).trim();
      } catch { /* fall through */ }
    }
  }

  return 'unknown';
}

// ─── 能力列表 ──────────────────────────────────────────────────────────────

/**
 * 输出 superpowers 可调度能力
 * 基于检测到的 SKILL.md 文件动态生成
 */
export function getCapabilities(root = PROJECT_ROOT) {
  const info = detect(root);

  // 已知 superpowers skills 及其能力分类
  const KNOWN_SKILLS = {
    'subagent-driven-development': {
      category: 'orchestration',
      description: 'Subagent 驱动开发 — 将复杂任务分解为并行子任务',
      models: ['sonnet', 'opus'],
      requiresReview: false,
    },
    'dispatching-parallel-agents': {
      category: 'orchestration',
      description: '并行 Agent 调度 — 同时运行多个独立 Agent',
      models: ['sonnet', 'opus'],
      requiresReview: false,
    },
    'systematic-debugging': {
      category: 'debugging',
      description: '系统性调试 — 科学化的 Bug 定位与修复流程',
      models: ['opus'],
      requiresReview: true,
    },
    'test-driven-development': {
      category: 'development',
      description: 'TDD 开发 — 测试驱动的红-绿-重构循环',
      models: ['sonnet'],
      requiresReview: false,
    },
    'verification-before-completion': {
      category: 'quality',
      description: '完成前验证 — 确保输出质量的最终检查',
      models: ['sonnet', 'haiku'],
      requiresReview: false,
    },
    'using-git-worktrees': {
      category: 'workflow',
      description: 'Git Worktree 工作流 — 并行分支管理',
      models: ['sonnet'],
      requiresReview: false,
    },
    'writing-plans': {
      category: 'planning',
      description: '计划编写 — 结构化任务规划',
      models: ['sonnet', 'opus'],
      requiresReview: false,
    },
    'executing-plans': {
      category: 'development',
      description: '计划执行 — 按步骤执行已确认的计划',
      models: ['sonnet', 'haiku'],
      requiresReview: false,
    },
    'requesting-code-review': {
      category: 'review',
      description: '代码评审请求 — 结构化评审流程',
      models: ['sonnet'],
      requiresReview: false,
    },
    'receiving-code-review': {
      category: 'review',
      description: '代码评审接收 — 处理评审反馈',
      models: ['sonnet'],
      requiresReview: false,
    },
    'finishing-a-development-branch': {
      category: 'workflow',
      description: '完成开发分支 — 清理、合并、推送流程',
      models: ['haiku', 'sonnet'],
      requiresReview: false,
    },
    'writing-skills': {
      category: 'meta',
      description: 'Skill 编写 — 创建和迭代 SKILL.md',
      models: ['sonnet'],
      requiresReview: false,
    },
    'brainstorming': {
      category: 'planning',
      description: '头脑风暴 — 创意生成和方案探索',
      models: ['opus'],
      requiresReview: false,
    },
    'using-superpowers': {
      category: 'meta',
      description: 'Superpowers 使用指南 — 元技能',
      models: ['haiku'],
      requiresReview: false,
    },
  };

  const capabilities = [];
  for (const skill of info.skills) {
    const known = KNOWN_SKILLS[skill.id];
    if (known) {
      capabilities.push({
        id: `superpowers:${skill.id}`,
        name: skill.name,
        description: known.description,
        category: known.category,
        recommendedModel: selectModel(known.models, skill.id),
        models: known.models,
        requiresReview: known.requiresReview,
        source: 'superpowers',
        skillPath: skill.path,
      });
    } else {
      // 未知 skill，使用默认配置
      capabilities.push({
        id: `superpowers:${skill.id}`,
        name: skill.name,
        description: skill.description || `Superpowers skill: ${skill.id}`,
        category: 'unknown',
        recommendedModel: 'sonnet',
        models: ['sonnet'],
        requiresReview: false,
        source: 'superpowers',
        skillPath: skill.path,
      });
    }
  }

  return {
    source: 'superpowers',
    version: info.version,
    available: info.available,
    capabilityCount: capabilities.length,
    capabilities,
  };
}

// ─── 模型选择 ──────────────────────────────────────────────────────────────

/**
 * 按任务复杂度选择模型
 *
 * 复杂度判断依据：
 *   - 关键词匹配（简单/中等/复杂信号词）
 *   - 推荐的模型列表
 */
export function selectModel(allowedModels, taskDescription) {
  if (!Array.isArray(allowedModels) || allowedModels.length === 0) {
    return 'sonnet'; // 默认
  }

  const task = typeof taskDescription === 'string' ? taskDescription.toLowerCase() : '';

  // 复杂度信号词
  const complexSignals = [
    'architect', 'refactor', 'migrate', 'redesign', 'systematic',
    'cross-module', 'performance', 'scalability', 'security audit',
    'investigate', 'root cause', 'debug',
  ];

  const simpleSignals = [
    'format', 'lint', 'rename', 'typo', 'comment', 'document',
    'small fix', 'minor', 'cleanup', 'whitespace',
  ];

  const hasSignal = (signals) => signals.some(s => task.includes(s));

  if (allowedModels.includes('opus') && hasSignal(complexSignals)) {
    return 'opus';
  }
  if (allowedModels.includes('haiku') && hasSignal(simpleSignals)) {
    return 'haiku';
  }
  // 首选 sonnet（平衡质量和速度）
  if (allowedModels.includes('sonnet')) {
    return 'sonnet';
  }
  // 回退到允许列表中的第一个
  return allowedModels[0];
}

// ─── Dispatch ──────────────────────────────────────────────────────────────

/**
 * 调度 superpowers subagent 执行任务
 *
 * @param {string} taskDescription - 任务描述
 * @param {object} options - 可选参数
 * @param {string} options.model - 指定模型（默认自动选择）
 * @param {string} options.skill - 指定 skill ID
 * @param {string} options.category - 按类别匹配 skill
 * @param {object} options.context - 额外上下文
 * @param {string} root - 项目根目录
 *
 * @returns {object} dispatch 结果
 */
export function dispatch(taskDescription, options = {}, root = PROJECT_ROOT) {
  const capabilities = getCapabilities(root);

  if (!capabilities.available) {
    return {
      success: false,
      error: 'superpowers not detected. Run `npm install superpowers` or add skills to your project.',
      suggestion: 'https://github.com/obra/superpowers',
    };
  }

  // 匹配最佳 skill
  let matchedSkill;
  if (options.skill) {
    matchedSkill = capabilities.capabilities.find(c => c.id === `superpowers:${options.skill}`);
  } else if (options.category) {
    matchedSkill = capabilities.capabilities.find(c => c.category === options.category);
  } else {
    // 按关键词匹配
    const task = taskDescription.toLowerCase();
    const scored = capabilities.capabilities.map(c => {
      let score = 0;
      const id = c.id.toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const name = (c.name || '').toLowerCase();

      // 完全匹配加分
      if (id.includes(task) || task.includes(id.split(':').pop())) score += 10;
      // 描述关键词匹配
      const keywords = task.split(/\s+/).filter(w => w.length > 3);
      for (const kw of keywords) {
        if (desc.includes(kw)) score += 2;
        if (name.includes(kw)) score += 3;
      }
      return { ...c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    matchedSkill = scored[0];
  }

  if (!matchedSkill) {
    return {
      success: false,
      error: `No matching superpowers skill found for: "${taskDescription}"`,
      availableCapabilities: capabilities.capabilities.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
    };
  }

  // 模型选择
  const model = options.model || selectModel(
    matchedSkill.models,
    `${matchedSkill.id} ${taskDescription}`
  );

  // 构建 dispatch 指令
  const dispatchPayload = {
    skill: matchedSkill.id.split(':').pop(),
    task: taskDescription,
    model,
    category: matchedSkill.category,
    requiresReview: matchedSkill.requiresReview,
    context: {
      projectRoot: root,
      timestamp: new Date().toISOString(),
      ...options.context,
    },
    // Claude Code Agent tool 调用指令
    agentInstruction: `Invoke the superpowers skill "${matchedSkill.id.split(':').pop()}" with the following task:

Task: ${taskDescription}
Model: ${model}
Project: ${root}

Follow the skill's instructions from ${matchedSkill.skillPath}`,
  };

  return {
    success: true,
    dispatched: dispatchPayload,
    note: 'To execute, pass agentInstruction to Claude Code Agent tool or run manually.',
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

    case 'dispatch': {
      const taskDesc = process.argv[4];
      if (!taskDesc) {
        console.error('Usage: adapter.mjs dispatch <task-description> [projectRoot]');
        process.exit(1);
      }
      const options = {};
      for (let i = 5; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg.startsWith('--model=')) options.model = arg.split('=')[1];
        if (arg.startsWith('--skill=')) options.skill = arg.split('=')[1];
        if (arg.startsWith('--category=')) options.category = arg.split('=')[1];
      }
      console.log(JSON.stringify(dispatch(taskDesc, options, root), null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: adapter.mjs [detect|capabilities|dispatch] [projectRoot]');
      process.exit(1);
  }
}

// CLI mode: run when executed directly
if (process.argv[1] && process.argv[1].includes('superpowers/adapter')) {
  main();
}

// Export for programmatic use
export default { detect, getCapabilities, dispatch, selectModel };
