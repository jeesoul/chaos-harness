#!/usr/bin/env node
/**
 * openspec adapter — chaos-harness 对 fission-ai/openspec 的能力桥接
 *
 * 检测 OpenSpec 是否安装，输出可调度能力列表，提供 propose/apply/archive 调度。
 *
 * 检测方式：
 *   1. openspec/ 目录是否存在（项目内）
 *   2. @fission-ai/openspec npm 包是否安装
 *   3. openspec CLI 是否全局可用
 *
 * 调用:
 *   node integrations/openspec/adapter.mjs detect [projectRoot]
 *   node integrations/openspec/adapter.mjs capabilities [projectRoot]
 *   node integrations/openspec/adapter.mjs status [projectRoot]
 *   node integrations/openspec/adapter.mjs propose <title> [projectRoot]
 *   node integrations/openspec/adapter.mjs apply <spec-id> [projectRoot]
 *   node integrations/openspec/adapter.mjs archive <spec-id> [projectRoot]
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.argv[3] || dirname(dirname(__dirname));

// ─── 检测 ──────────────────────────────────────────────────────────────────

/**
 * 检测 OpenSpec 是否可用
 */
export function detect(root = PROJECT_ROOT) {
  const openspecDir = join(root, 'openspec');
  const cliAvailable = checkCliAvailable();
  const npmInstalled = checkNpmPackage(root);

  const info = {
    name: 'openspec',
    available: false,
    locations: [],
    version: 'unknown',
    specCount: 0,
    specs: [],
    proposals: [],
    archived: [],
  };

  // 检测 1: openspec/ 目录
  if (existsSync(openspecDir) && statSync(openspecDir).isDirectory()) {
    info.locations.push({ type: 'directory', path: openspecDir });
    info.available = true;
    scanSpecs(openspecDir, info);
  }

  // 检测 2: npm 包
  if (npmInstalled) {
    info.locations.push({ type: 'npm-package', path: npmInstalled });
    if (!info.available) info.available = true;
    info.version = npmInstalled.version || info.version;
  }

  // 检测 3: CLI
  if (cliAvailable) {
    info.locations.push({ type: 'cli', command: 'openspec' });
    if (!info.available) info.available = true;
    const cliVersion = getCliVersion();
    if (cliVersion) info.version = cliVersion;
    // CLI 可以补充 spec 信息
    if (info.specs.length === 0) {
      try {
        const statusJson = getCliStatus(root);
        if (statusJson) {
          info.specs = statusJson.specs || [];
          info.proposals = statusJson.proposals || [];
          info.archived = statusJson.archived || [];
          info.specCount = info.specs.length;
        }
      } catch { /* CLI status not available */ }
    }
  }

  return info;
}

/** 检查 openspec CLI 是否可用 */
function checkCliAvailable() {
  try {
    execSync('openspec --version', { stdio: 'pipe', encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

/** 获取 CLI 版本 */
function getCliVersion() {
  try {
    return execSync('openspec --version', { stdio: 'pipe', encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/** 通过 CLI 获取状态 */
function getCliStatus(root) {
  try {
    const json = execSync(`openspec status --json 2>/dev/null || openspec status --json 2>nul`, {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 10000,
    });
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** 检查 npm 包是否安装 */
function checkNpmPackage(root) {
  const pkgPaths = [
    join(root, 'node_modules', '@fission-ai', 'openspec', 'package.json'),
    join(root, 'node_modules', 'openspec', 'package.json'),
  ];
  for (const p of pkgPaths) {
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, 'utf8'));
      } catch { /* skip */ }
    }
  }
  return null;
}

/** 扫描 openspec/ 目录中的 spec 文件 */
function scanSpecs(openspecDir, info) {
  const scanDir = (subdir, target) => {
    const dir = join(openspecDir, subdir);
    if (!existsSync(dir)) return;
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const entryPath = join(dir, entry);
        if (statSync(entryPath).isDirectory()) {
          const yamlPath = join(entryPath, 'spec.yaml');
          const mdPath = join(entryPath, 'spec.md');
          if (existsSync(yamlPath) || existsSync(mdPath)) {
            target.push({
              id: entry,
              name: entry,
              path: existsSync(yamlPath) ? yamlPath : mdPath,
              format: existsSync(yamlPath) ? 'yaml' : 'markdown',
            });
          }
        }
      }
    } catch { /* skip unreadable dirs */ }
  };

  scanDir('specs', info.specs);
  scanDir('proposals', info.proposals);
  scanDir('archived', info.archived);
  info.specCount = info.specs.length;
}

// ─── 能力列表 ──────────────────────────────────────────────────────────────

/**
 * OpenSpec 核心能力是 propose/apply/archive 三阶段工作流
 */
export function getCapabilities(root = PROJECT_ROOT) {
  const info = detect(root);

  const capabilities = [
    {
      id: 'openspec:propose',
      name: 'Propose',
      description: '创建新的规格提案 — 定义需求、约束和验收标准',
      category: 'specification',
      phase: 'propose',
      recommendedModel: 'opus',
      models: ['opus', 'sonnet'],
      cliCommand: 'openspec propose <title>',
      requiresReview: true,
      input: {
        title: '规格标题',
        description: '详细描述',
        requirements: '需求列表',
        acceptanceCriteria: '验收标准',
        constraints: '约束条件',
      },
    },
    {
      id: 'openspec:apply',
      name: 'Apply',
      description: '执行规格 — 按照已批准的规格实现代码',
      category: 'implementation',
      phase: 'apply',
      recommendedModel: 'sonnet',
      models: ['sonnet', 'opus'],
      cliCommand: 'openspec apply <spec-id>',
      requiresReview: false,
      input: {
        specId: '规格 ID',
        scope: '实现范围（可选）',
      },
    },
    {
      id: 'openspec:archive',
      name: 'Archive',
      description: '归档已完成的规格 — 标记完成并存档',
      category: 'lifecycle',
      phase: 'archive',
      recommendedModel: 'haiku',
      models: ['haiku', 'sonnet'],
      cliCommand: 'openspec archive <spec-id>',
      requiresReview: false,
      input: {
        specId: '规格 ID',
        notes: '归档备注（可选）',
      },
    },
    {
      id: 'openspec:status',
      name: 'Status',
      description: '查询所有规格状态 — 查看提案、进行中、已归档',
      category: 'monitoring',
      phase: 'query',
      recommendedModel: 'haiku',
      models: ['haiku'],
      cliCommand: 'openspec status --json',
      requiresReview: false,
      input: {},
    },
    {
      id: 'openspec:validate',
      name: 'Validate',
      description: '验证规格完整性 — 检查格式和引用关系',
      category: 'quality',
      phase: 'validate',
      recommendedModel: 'haiku',
      models: ['haiku', 'sonnet'],
      cliCommand: 'openspec validate <spec-id>',
      requiresReview: false,
      input: {
        specId: '规格 ID',
      },
    },
  ];

  // 附加检测到的 spec 信息
  for (const spec of info.specs) {
    capabilities.push({
      id: `openspec:spec:${spec.id}`,
      name: `Spec: ${spec.name}`,
      description: `已有规格: ${spec.id}`,
      category: 'existing-spec',
      phase: 'existing',
      recommendedModel: 'sonnet',
      models: ['sonnet'],
      path: spec.path,
      format: spec.format,
    });
  }

  return {
    source: 'openspec',
    version: info.version,
    available: info.available,
    capabilityCount: capabilities.length,
    specCount: info.specCount,
    capabilities,
    specs: info.specs,
    proposals: info.proposals,
    archived: info.archived,
  };
}

// ─── 调度函数 ──────────────────────────────────────────────────────────────

/**
 * 调度 OpenSpec propose 流程
 *
 * @param {string} title - 规格标题
 * @param {object} details - 规格详情
 * @param {string} root - 项目根目录
 */
export function propose(title, details = {}, root = PROJECT_ROOT) {
  const info = detect(root);

  if (!info.available) {
    return {
      success: false,
      error: 'OpenSpec not detected. Create openspec/ directory or install @fission-ai/openspec.',
      suggestion: 'Run `openspec init` in your project root.',
    };
  }

  const cliAvailable = checkCliAvailable();

  const specContent = buildSpecMarkdown(title, details);

  return {
    success: true,
    action: 'propose',
    title,
    method: cliAvailable ? 'cli' : 'manual',
    cliCommand: `openspec propose "${title}"`,
    specContent,
    instruction: cliAvailable
      ? `Run: openspec propose "${title}"`
      : `Create a new spec file in openspec/proposals/${sanitizeFilename(title)}/spec.md with the following content:\n\n${specContent}`,
  };
}

/**
 * 调度 OpenSpec apply 流程
 *
 * @param {string} specId - 规格 ID
 * @param {object} options - 可选参数
 * @param {string} root - 项目根目录
 */
export function apply(specId, options = {}, root = PROJECT_ROOT) {
  const info = detect(root);

  if (!info.available) {
    return {
      success: false,
      error: 'OpenSpec not detected.',
    };
  }

  // 验证 spec 是否存在
  const specExists = info.specs.some(s => s.id === specId)
    || info.proposals.some(s => s.id === specId);

  if (!specExists && !checkCliAvailable()) {
    return {
      success: false,
      error: `Spec "${specId}" not found in proposals or specs.`,
      availableSpecs: [
        ...info.proposals.map(s => s.id),
        ...info.specs.map(s => s.id),
      ],
    };
  }

  const cliAvailable = checkCliAvailable();

  return {
    success: true,
    action: 'apply',
    specId,
    method: cliAvailable ? 'cli' : 'manual',
    cliCommand: `openspec apply "${specId}"`,
    instruction: cliAvailable
      ? `Run: openspec apply "${specId}"`
      : `Load the spec from openspec/proposals/${specId}/ and implement according to its requirements.`,
    options,
  };
}

/**
 * 调度 OpenSpec archive 流程
 *
 * @param {string} specId - 规格 ID
 * @param {object} options - 可选参数
 * @param {string} root - 项目根目录
 */
export function archive(specId, options = {}, root = PROJECT_ROOT) {
  const info = detect(root);

  if (!info.available) {
    return {
      success: false,
      error: 'OpenSpec not detected.',
    };
  }

  const cliAvailable = checkCliAvailable();

  return {
    success: true,
    action: 'archive',
    specId,
    method: cliAvailable ? 'cli' : 'manual',
    cliCommand: `openspec archive "${specId}"`,
    instruction: cliAvailable
      ? `Run: openspec archive "${specId}"`
      : `Move openspec/proposals/${specId}/ to openspec/archived/${specId}/ and update status.`,
    options,
  };
}

/**
 * 通用调度入口 — 根据 action 分发到对应函数
 */
export function dispatch(action, params = {}, root = PROJECT_ROOT) {
  switch (action) {
    case 'propose':
      return propose(params.title || 'Untitled', params, root);
    case 'apply':
      return apply(params.specId || '', params, root);
    case 'archive':
      return archive(params.specId || '', params, root);
    case 'status':
      return {
        success: true,
        action: 'status',
        data: detect(root),
      };
    default:
      return {
        success: false,
        error: `Unknown OpenSpec action: "${action}". Available: propose, apply, archive, status.`,
      };
  }
}

// ─── 辅助函数 ──────────────────────────────────────────────────────────────

function buildSpecMarkdown(title, details) {
  const lines = [
    `# ${title}`,
    '',
    `## Description`,
    details.description || 'TODO: Add description',
    '',
    `## Requirements`,
  ];

  if (details.requirements && Array.isArray(details.requirements)) {
    for (const req of details.requirements) {
      lines.push(`- ${req}`);
    }
  } else {
    lines.push('- TODO: Add requirements');
  }

  lines.push('');
  lines.push('## Acceptance Criteria');

  if (details.acceptanceCriteria && Array.isArray(details.acceptanceCriteria)) {
    for (const c of details.acceptanceCriteria) {
      lines.push(`- [ ] ${c}`);
    }
  } else {
    lines.push('- [ ] TODO: Add acceptance criteria');
  }

  if (details.constraints) {
    lines.push('');
    lines.push('## Constraints');
    if (Array.isArray(details.constraints)) {
      for (const c of details.constraints) {
        lines.push(`- ${c}`);
      }
    } else {
      lines.push(details.constraints);
    }
  }

  return lines.join('\n');
}

function sanitizeFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

    case 'status': {
      const status = detect(root);
      console.log(JSON.stringify({
        available: status.available,
        version: status.version,
        specCount: status.specCount,
        specs: status.specs,
        proposals: status.proposals,
        archived: status.archived,
      }, null, 2));
      break;
    }

    case 'propose': {
      const title = process.argv[4];
      if (!title) {
        console.error('Usage: adapter.mjs propose <title> [projectRoot]');
        process.exit(1);
      }
      console.log(JSON.stringify(propose(title, {}, root), null, 2));
      break;
    }

    case 'apply': {
      const specId = process.argv[4];
      if (!specId) {
        console.error('Usage: adapter.mjs apply <spec-id> [projectRoot]');
        process.exit(1);
      }
      console.log(JSON.stringify(apply(specId, {}, root), null, 2));
      break;
    }

    case 'archive': {
      const specId = process.argv[4];
      if (!specId) {
        console.error('Usage: adapter.mjs archive <spec-id> [projectRoot]');
        process.exit(1);
      }
      console.log(JSON.stringify(archive(specId, {}, root), null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: adapter.mjs [detect|capabilities|status|propose|apply|archive] [projectRoot]');
      process.exit(1);
  }
}

if (process.argv[1] && /openspec[\\/]adapter/.test(process.argv[1])) {
  main();
}

export default { detect, getCapabilities, dispatch, propose, apply, archive };
