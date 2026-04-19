#!/usr/bin/env node
/**
 * openspec adapter — chaos-harness 对 OpenSpec schema-driven artifact DAG 的能力桥接
 *
 * 检测 OpenSpec 是否安装，提供变更提案(propose)、变更应用(apply)、
 * 状态查询(status)以及 OpenSpec artifact 到 chaos-harness Gate 状态机的映射。
 *
 * OpenSpec 核心概念：
 *   - spec: 项目规格定义，存放在 openspec/specs/
 *   - change: 变更提案，存放在 openspec/changes/<name>/
 *   - artifact: 变更产物（proposal.md, design.md, tasks.md 等）
 *   - DAG: artifact 之间的依赖关系图
 *
 * CLI 接口：
 *   openspec status --json              # 查询当前状态
 *   openspec instructions <id> --json   # 获取变更指令
 *   openspec propose <idea>             # 创建变更提案
 *
 * 调用:
 *   node integrations/openspec/adapter.mjs detect [projectRoot]
 *   node integrations/openspec/adapter.mjs capabilities [projectRoot]
 *   node integrations/openspec/adapter.mjs propose "<idea>" [projectRoot]
 *   node integrations/openspec/adapter.mjs apply <changeName> [projectRoot]
 *   node integrations/openspec/adapter.mjs status [projectRoot]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(dirname(__dirname));

// ─── OpenSpec 目录和文件约定 ──────────────────────────────────────────────

const OPSPEC_DIR = 'openspec';
const CHANGES_DIR = join(OPSPEC_DIR, 'changes');
const SPECS_DIR = join(OPSPEC_DIR, 'specs');

/** 变更提案的标准 artifact 文件 */
const ARTIFACT_FILES = {
  proposal: 'proposal.md',
  design: 'design.md',
  tasks: 'tasks.md',
};

/** Gate 状态机映射表 */
const GATE_MAP = {
  'proposal.md': { gate: 'G0', name: '问题定义', description: '明确问题是什么，为什么需要解决' },
  'design.md': { gate: 'G1', name: '方案设计', description: '确定怎么解决，技术方案设计' },
  'tasks.md': { gate: 'G2', name: '任务拆分', description: '拆解为可执行的具体任务' },
};

// ─── 工具函数 ──────────────────────────────────────────────────────────────

/** 将字符串转为 kebab-case */
function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

/** 安全执行 shell 命令，返回 stdout 或 null */
function safeExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

/** 读取文件内容，不存在返回 null */
function safeRead(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/** 解析 markdown 中的 task 列表项: - [ ] / - [x] */
function parseTasks(content) {
  if (!content) return [];
  const lines = content.split('\n');
  const tasks = [];
  for (const line of lines) {
    const match = line.match(/^\s*-\s*\[([ xX])\]\s+(.+)$/);
    if (match) {
      tasks.push({
        done: match[1].toLowerCase() === 'x',
        text: match[2].trim(),
      });
    }
  }
  return tasks;
}

/** 解析 tasks.md 中的任务分组（标题 + 任务列表） */
function parseTaskGroups(content) {
  if (!content) return [];
  const groups = [];
  const lines = content.split('\n');
  let currentGroup = null;

  for (const line of lines) {
    const groupMatch = line.match(/^(#{2,4})\s+(.+)$/);
    const taskMatch = line.match(/^\s*-\s*\[([ xX])\]\s+(.+)$/);

    if (groupMatch) {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = {
        title: groupMatch[2].trim(),
        level: groupMatch[1].length,
        tasks: [],
      };
    } else if (taskMatch && currentGroup) {
      currentGroup.tasks.push({
        done: taskMatch[1].toLowerCase() === 'x',
        text: taskMatch[2].trim(),
      });
    }
  }
  if (currentGroup) groups.push(currentGroup);
  return groups;
}

/** 确保目录存在 */
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

// ─── 1. 检测 ───────────────────────────────────────────────────────────────

/**
 * 检测 OpenSpec 是否已安装并可用
 *
 * 检测路径：
 *   1. openspec/ 项目内目录（本地安装）
 *   2. @fission-ai/openspec npm 包
 *   3. .claude/skills/openspec-* skill 文件
 *   4. openspec CLI 全局安装
 *
 * @param {string} root - 项目根目录
 * @returns {{ detected: boolean, version: string, installPath: string, locations: object[] }}
 */
export function detect(root = PROJECT_ROOT) {
  const locations = [];

  // 检测 1: openspec/ 目录
  const openspecDir = join(root, OPSPEC_DIR);
  if (existsSync(openspecDir) && statSync(openspecDir).isDirectory()) {
    const hasChanges = existsSync(join(openspecDir, 'changes'));
    const hasSpecs = existsSync(join(openspecDir, 'specs'));
    const hasSchema = existsSync(join(openspecDir, 'schema.yaml'))
      || existsSync(join(openspecDir, 'schema.json'));

    locations.push({
      type: 'project-directory',
      path: openspecDir,
      available: true,
      details: { hasChangesDir: hasChanges, hasSpecsDir: hasSpecs, hasSchema },
    });
  }

  // 检测 2: @fission-ai/openspec npm 包
  const npmPkgPaths = [
    join(root, 'node_modules', '@fission-ai', 'openspec', 'package.json'),
    join(root, 'node_modules', 'openspec', 'package.json'),
  ];
  let npmVersion = null;
  let npmInstallPath = '';
  for (const pkgPath of npmPkgPaths) {
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        npmVersion = pkg.version || 'unknown';
        npmInstallPath = dirname(pkgPath);
        locations.push({
          type: 'npm-package',
          path: npmInstallPath,
          available: true,
          details: { packageName: pkg.name, version: npmVersion },
        });
        break;
      } catch { /* skip */ }
    }
  }

  // 检测 3: .claude/skills/openspec-* skill 文件
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const skillSearchDirs = [
    join(root, '.claude', 'skills'),
    join(homeDir, '.claude', 'skills'),
    join(homeDir, '.config', 'claude', 'skills'),
  ];
  const skillFiles = [];
  for (const skillDir of skillSearchDirs) {
    if (!existsSync(skillDir)) continue;
    try {
      const entries = readdirSync(skillDir);
      for (const entry of entries) {
        if (entry.startsWith('openspec')) {
          const skillMd = join(skillDir, entry, 'SKILL.md');
          if (existsSync(skillMd)) {
            skillFiles.push({ path: skillMd, name: entry });
          }
        }
      }
    } catch { /* skip */ }
  }
  if (skillFiles.length > 0) {
    locations.push({
      type: 'claude-skills',
      available: true,
      details: { skillCount: skillFiles.length, skills: skillFiles.map(s => s.name) },
    });
  }

  // 检测 4: openspec CLI 全局安装
  const cliVersion = safeExec('openspec --version', root);
  if (cliVersion) {
    locations.push({
      type: 'cli',
      available: true,
      details: { version: cliVersion, command: 'openspec' },
    });
  }

  const detected = locations.some(l => l.available);
  const version = npmVersion || cliVersion || (detected ? 'local' : 'not-installed');
  const installPath = npmInstallPath || locations.find(l => l.available)?.path || '';

  // Built-in fallback: chaos-harness always provides change proposal capability
  // via .chaos-harness/gates/ directory even without external openspec
  const harnessGatesDir = join(root, '.chaos-harness', 'gates');
  const hasBuiltInProposal = existsSync(harnessGatesDir);
  if (hasBuiltInProposal && !detected) {
    locations.push({
      type: 'built-in-fallback',
      path: harnessGatesDir,
      available: true,
      details: { note: 'Built-in change proposal via chaos-harness gate system' },
    });
  }

  return {
    name: 'openspec',
    detected: detected || hasBuiltInProposal,
    version: hasBuiltInProposal && !detected ? 'built-in' : version,
    installPath,
    locations,
    cliAvailable: !!cliVersion,
    skillCount: skillFiles.length,
  };
}

// ─── 2. 能力列表 ───────────────────────────────────────────────────────────

/**
 * 返回 OpenSpec 可用能力
 *
 * 核心能力：
 *   - propose: 创建变更提案
 *   - apply: 实现变更任务
 *   - archive: 归档已完成的变更
 *
 * @param {string} root - 项目根目录
 * @returns {{ source: string, capabilities: object[], artifactTypes: string[] }}
 */
export function getCapabilities(root = PROJECT_ROOT) {
  const info = detect(root);

  const capabilities = [
    {
      id: 'openspec:propose',
      name: '变更提案',
      description: '创建变更提案，生成 proposal.md、design.md、tasks.md 骨架',
      category: 'planning',
      requires: info.detected,
      artifactTypes: ['proposal.md', 'design.md', 'tasks.md'],
    },
    {
      id: 'openspec:apply',
      name: '变更应用',
      description: '读取变更任务的 tasks.md，解析任务列表并跟踪执行状态',
      category: 'execution',
      requires: info.detected,
      artifactTypes: ['tasks.md'],
    },
    {
      id: 'openspec:archive',
      name: '变更归档',
      description: '将已完成的变更移动到 openspec/changes/archive/ 目录',
      category: 'lifecycle',
      requires: info.detected,
      artifactTypes: [],
    },
    {
      id: 'openspec:status',
      name: '状态查询',
      description: '查询 openspec/changes/ 目录下所有变更的状态',
      category: 'monitoring',
      requires: info.detected,
      artifactTypes: [],
    },
    {
      id: 'openspec:mapToGates',
      name: 'Gate 映射',
      description: '将 OpenSpec artifact 映射到 chaos-harness Gate 状态机（G0-G2）',
      category: 'integration',
      requires: info.detected,
      artifactTypes: ['proposal.md', 'design.md', 'tasks.md'],
    },
    {
      id: 'openspec:spec',
      name: '规格管理',
      description: '读取和管理 openspec/specs/ 目录下的项目规格定义',
      category: 'specification',
      requires: info.detected && existsSync(join(root, SPECS_DIR)),
      artifactTypes: ['spec.md'],
    },
  ];

  // 如果 CLI 可用，增加 CLI 相关能力
  if (info.cliAvailable) {
    capabilities.push({
      id: 'openspec:cli-status',
      name: 'CLI 状态查询',
      description: '通过 openspec status --json 获取机器可读的状态信息',
      category: 'cli',
      requires: true,
      artifactTypes: [],
    });
    capabilities.push({
      id: 'openspec:cli-instructions',
      name: 'CLI 指令获取',
      description: '通过 openspec instructions <id> --json 获取变更指令',
      category: 'cli',
      requires: true,
      artifactTypes: [],
    });
  }

  return {
    source: 'openspec',
    version: info.version,
    detected: info.detected,
    capabilityCount: capabilities.length,
    capabilities,
    artifactTypes: ['proposal.md', 'design.md', 'tasks.md'],
    gateMapping: GATE_MAP,
  };
}

// ─── 3. 提案 ───────────────────────────────────────────────────────────────

/**
 * 创建变更提案
 *
 * 流程：
 *   1. 将 idea 转为 kebab-case 名称
 *   2. 创建 openspec/changes/<name>/ 目录
 *   3. 生成 proposal.md、design.md、tasks.md 骨架
 *   4. 返回变更路径和生成的文件列表
 *
 * @param {string} root - 项目根目录
 * @param {string} idea - 变更想法（自然语言描述）
 * @param {object} options - 可选参数
 *   @param {string} options.name - 自定义变更名称
 *   @param {string} options.author - 作者
 *   @param {string} options.priority - 优先级 (high/medium/low)
 * @returns {{ success: boolean, changeName: string, changePath: string, files: string[] }}
 */
export function propose(root = PROJECT_ROOT, idea, options = {}) {
  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return {
      success: false,
      error: 'idea is required — provide a natural language description of the change',
      example: 'Add user authentication with OAuth2',
    };
  }

  const changeName = options.name || toKebabCase(idea) || toKebabCase(idea.trim().substring(0, 30)) || 'unnamed-change';
  const changePath = join(root, CHANGES_DIR, changeName);

  // 检查是否已存在
  if (existsSync(changePath)) {
    return {
      success: false,
      error: `Change "${changeName}" already exists at ${changePath}`,
      suggestion: 'Use a different name or apply to the existing change.',
    };
  }

  // 创建目录
  ensureDir(changePath);

  const author = options.author || 'chaos-harness';
  const priority = options.priority || 'medium';
  const timestamp = new Date().toISOString();

  // 生成 proposal.md → G0 问题定义
  const proposalContent = `# Proposal: ${idea.trim()}

> **Status**: proposed
> **Author**: ${author}
> **Created**: ${timestamp}
> **Priority**: ${priority}

## Problem

<!-- Describe the problem this change addresses. What is broken, missing, or suboptimal? -->

## Proposed Solution

<!-- Describe the high-level approach. Why is this the right solution? -->

## Scope

### In Scope

<!-- What will this change cover? -->

### Out of Scope

<!-- What is explicitly not covered by this change? -->

## Impact

<!-- Which systems, modules, or teams will be affected? -->

## Risks

<!-- What could go wrong? How will we mitigate? -->

## Alternatives Considered

<!-- What other approaches were evaluated and why were they rejected? -->
`;
  writeFileSync(join(changePath, ARTIFACT_FILES.proposal), proposalContent, 'utf8');

  // 生成 design.md → G1 方案设计
  const designContent = `# Design: ${idea.trim()}

> **Status**: draft
> **Change**: ${changeName}
> **Last Updated**: ${timestamp}

## Architecture

<!-- Describe the architectural approach. Include diagrams if helpful. -->

## Technical Decisions

| Decision | Rationale | Alternatives |
|----------|-----------|--------------|
|          |           |              |

## Data Model

<!-- Describe any data model changes, new tables, schema modifications -->

## API Changes

<!-- Describe any API additions, modifications, or deprecations -->

## Security Considerations

<!-- Describe security implications and mitigations -->

## Performance Impact

<!-- Estimate performance impact and any optimization plans -->

## Testing Strategy

<!-- How will this change be tested? -->

## Rollback Plan

<!-- How to revert this change if needed? -->
`;
  writeFileSync(join(changePath, ARTIFACT_FILES.design), designContent, 'utf8');

  // 生成 tasks.md → G2 任务拆分
  const tasksContent = `# Tasks: ${idea.trim()}

> **Change**: ${changeName}
> **Last Updated**: ${timestamp}

## Phase 1: Foundation

- [ ] Set up project structure and dependencies
- [ ] Create initial implementation skeleton
- [ ] Write unit test scaffolds

## Phase 2: Implementation

- [ ] Implement core functionality
- [ ] Add error handling and edge cases
- [ ] Write integration tests

## Phase 3: Verification

- [ ] Run full test suite
- [ ] Manual testing and review
- [ ] Update documentation

## Phase 4: Delivery

- [ ] Code review and approval
- [ ] Merge to target branch
- [ ] Update changelog
`;
  writeFileSync(join(changePath, ARTIFACT_FILES.tasks), tasksContent, 'utf8');

  const files = Object.values(ARTIFACT_FILES).map(f => join(changePath, f));

  return {
    success: true,
    changeName,
    changePath,
    files,
    note: 'Change proposal created. Fill in the markdown templates with specific details.',
  };
}

// ─── 4. 应用 ───────────────────────────────────────────────────────────────

/**
 * 应用变更 — 读取并解析变更任务
 *
 * 流程：
 *   1. 定位 openspec/changes/<changeName>/ 目录
 *   2. 读取 tasks.md
 *   3. 解析任务列表，计算完成状态
 *   4. 读取 proposal.md 和 design.md 摘要
 *   5. 返回结构化任务数据
 *
 * @param {string} root - 项目根目录
 * @param {string} changeName - 变更名称（kebab-case）
 * @returns {{ success: boolean, changeName: string, tasks: object[], progress: object }}
 */
export function apply(root = PROJECT_ROOT, changeName) {
  if (!changeName || typeof changeName !== 'string') {
    return {
      success: false,
      error: 'changeName is required — provide the kebab-case name of the change',
    };
  }

  const changePath = join(root, CHANGES_DIR, changeName);

  if (!existsSync(changePath)) {
    // 尝试模糊匹配
    const changesDir = join(root, CHANGES_DIR);
    if (existsSync(changesDir)) {
      const allChanges = readdirSync(changesDir).filter(n => {
        const fullPath = join(changesDir, n);
        return statSync(fullPath).isDirectory() && n !== 'archive';
      });
      const match = allChanges.find(n => n.includes(changeName) || changeName.includes(n));
      if (match) {
        return apply(root, match);
      }
    }
    return {
      success: false,
      error: `Change "${changeName}" not found at ${changePath}`,
      availableChanges: listChanges(root),
    };
  }

  // 读取 tasks.md
  const tasksContent = safeRead(join(changePath, ARTIFACT_FILES.tasks));
  const tasks = parseTasks(tasksContent);
  const taskGroups = parseTaskGroups(tasksContent);

  // 读取 proposal.md 摘要
  const proposalContent = safeRead(join(changePath, ARTIFACT_FILES.proposal));
  const proposalTitle = proposalContent?.match(/^#\s+Proposal:\s+(.+)$/m)?.[1]?.trim() || changeName;

  // 读取 design.md 摘要
  const designContent = safeRead(join(changePath, ARTIFACT_FILES.design));
  const designTitle = designContent?.match(/^#\s+Design:\s+(.+)$/m)?.[1]?.trim() || '';

  // 计算进度
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 读取每个 artifact 的 Gate 映射状态
  const gateStatus = {};
  for (const [artifactFile, gateInfo] of Object.entries(GATE_MAP)) {
    const artifactPath = join(changePath, artifactFile);
    const exists = existsSync(artifactPath);
    const content = exists ? safeRead(artifactPath) : null;
    gateStatus[gateInfo.gate] = {
      gate: gateInfo.gate,
      name: gateInfo.name,
      description: gateInfo.description,
      artifactFile,
      exists,
      size: content ? content.length : 0,
      hasContent: exists && content && content.trim().length > 100,
    };
  }

  return {
    success: true,
    changeName,
    changePath,
    proposalTitle,
    designTitle,
    tasks,
    taskGroups,
    progress: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      percentage: progressPct,
    },
    gateStatus,
  };
}

// ─── 5. 状态 ───────────────────────────────────────────────────────────────

/**
 * 查询当前变更状态
 *
 * 流程：
 *   1. 扫描 openspec/changes/ 目录
 *   2. 对每个变更，解析其 artifact 存在情况和任务进度
 *   3. 如果 CLI 可用，尝试执行 openspec status --json
 *   4. 返回结构化的状态信息
 *
 * @param {string} root - 项目根目录
 * @returns {{ changes: object[], total: number, active: number, archived: number }}
 */
export function status(root = PROJECT_ROOT) {
  const changesDir = join(root, CHANGES_DIR);
  const activeChanges = [];
  const archivedChanges = [];

  // 扫描活跃变更
  if (existsSync(changesDir)) {
    const entries = readdirSync(changesDir);
    for (const entry of entries) {
      const entryPath = join(changesDir, entry);
      if (!statSync(entryPath).isDirectory()) continue;

      if (entry === 'archive') {
        // 扫描归档变更
        try {
          const archivedEntries = readdirSync(entryPath);
          for (const archived of archivedEntries) {
            const archivedPath = join(entryPath, archived);
            if (statSync(archivedPath).isDirectory()) {
              archivedChanges.push(parseChangeSummary(archivedPath, archived, true));
            }
          }
        } catch { /* skip */ }
        continue;
      }

      activeChanges.push(parseChangeSummary(entryPath, entry, false));
    }
  }

  // 如果 CLI 可用，尝试获取 openspec status --json
  let cliStatus = null;
  const info = detect(root);
  if (info.cliAvailable) {
    const rawStatus = safeExec('openspec status --json', root);
    if (rawStatus) {
      try {
        cliStatus = JSON.parse(rawStatus);
      } catch {
        cliStatus = { raw: rawStatus };
      }
    }
  }

  // 扫描 specs
  const specs = [];
  const specsDir = join(root, SPECS_DIR);
  if (existsSync(specsDir)) {
    try {
      const specEntries = readdirSync(specsDir);
      for (const entry of specEntries) {
        const specPath = join(specsDir, entry);
        if (statSync(specPath).isDirectory()) {
          const specMd = join(specPath, 'spec.md');
          if (existsSync(specMd)) {
            specs.push({ name: entry, path: specPath });
          }
        }
      }
    } catch { /* skip */ }
  }

  return {
    source: 'openspec',
    projectRoot: root,
    changes: {
      active: activeChanges,
      archived: archivedChanges,
      total: activeChanges.length + archivedChanges.length,
      activeCount: activeChanges.length,
      archivedCount: archivedChanges.length,
    },
    specs: {
      count: specs.length,
      list: specs,
    },
    cli: cliStatus,
    timestamp: new Date().toISOString(),
  };
}

/** 解析单个变更的摘要信息 */
function parseChangeSummary(changePath, name, isArchived) {
  const proposalContent = safeRead(join(changePath, ARTIFACT_FILES.proposal));
  const tasksContent = safeRead(join(changePath, ARTIFACT_FILES.tasks));

  const tasks = parseTasks(tasksContent);
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 提取 proposal 中的元数据
  const status = proposalContent?.match(/> \*\*Status\*\*:\s*(.+)$/m)?.[1]?.trim() || 'unknown';
  const priority = proposalContent?.match(/> \*\*Priority\*\*:\s*(.+)$/m)?.[1]?.trim() || 'unknown';
  const author = proposalContent?.match(/> \*\*Author\*\*:\s*(.+)$/m)?.[1]?.trim() || 'unknown';

  // 检查哪些 artifact 存在
  const artifacts = {};
  for (const key of Object.keys(ARTIFACT_FILES)) {
    artifacts[key] = existsSync(join(changePath, ARTIFACT_FILES[key]));
  }

  return {
    name,
    path: changePath,
    isArchived,
    status,
    priority,
    author,
    artifacts,
    progress: {
      total,
      completed,
      pending: total - completed,
      percentage,
    },
    gateMapping: computeGateMapping(artifacts),
  };
}

/** 计算 artifact 到 Gate 的映射状态 */
function computeGateMapping(artifacts) {
  const gates = {};
  for (const [artifactFile, gateInfo] of Object.entries(GATE_MAP)) {
    const artifactKey = Object.keys(ARTIFACT_FILES).find(
      k => ARTIFACT_FILES[k] === artifactFile
    );
    const exists = artifactKey ? (artifacts[artifactKey] || false) : false;
    gates[gateInfo.gate] = {
      gate: gateInfo.gate,
      name: gateInfo.name,
      passed: exists,
      artifactFile,
    };
  }
  return gates;
}

/** 列出所有活跃变更名称 */
function listChanges(root) {
  const changesDir = join(root, CHANGES_DIR);
  if (!existsSync(changesDir)) return [];
  return readdirSync(changesDir).filter(n => {
    const fullPath = join(changesDir, n);
    return statSync(fullPath).isDirectory() && n !== 'archive';
  });
}

// ─── 6. Gate 映射 ──────────────────────────────────────────────────────────

/**
 * 将 OpenSpec artifact 映射到 chaos-harness Gate 状态机
 *
 * Gate 状态机：
 *   G0 — 问题定义（proposal.md）
 *   G1 — 方案设计（design.md）
 *   G2 — 任务拆分（tasks.md）
 *
 * @param {object} changeArtifacts - 变更 artifact 对象
 *   @param {string} changeArtifacts.proposal - proposal.md 内容
 *   @param {string} changeArtifacts.design - design.md 内容
 *   @param {string} changeArtifacts.tasks - tasks.md 内容
 * @returns {{ gates: object[], allPassed: boolean, blockedGates: string[], nextGate: string }}
 */
export function mapToGates(changeArtifacts) {
  if (!changeArtifacts || typeof changeArtifacts !== 'object') {
    return {
      success: false,
      error: 'changeArtifacts is required — provide an object with artifact content keys',
      example: { proposal: '...', design: '...', tasks: '...' },
    };
  }

  const gates = [];
  const blockedGates = [];
  let nextGate = null;

  for (const [artifactFile, gateInfo] of Object.entries(GATE_MAP)) {
    // 支持两种 key 方式：文件名或 artifact key
    let content = changeArtifacts[artifactFile];
    if (!content) {
      const artifactKey = Object.keys(ARTIFACT_FILES).find(k => ARTIFACT_FILES[k] === artifactFile);
      if (artifactKey) content = changeArtifacts[artifactKey];
    }
    const hasContent = typeof content === 'string' && content.trim().length > 100;
    const hasSubstantiveContent = hasContent && !isTemplateOnly(content, artifactFile);

    const gate = {
      id: gateInfo.gate,
      name: gateInfo.name,
      description: gateInfo.description,
      artifactFile,
      present: !!content,
      hasContent,
      hasSubstantiveContent,
      passed: hasSubstantiveContent,
      checks: runGateChecks(content, artifactFile),
    };

    gates.push(gate);

    if (!gate.passed) {
      blockedGates.push(gateInfo.gate);
      if (!nextGate) {
        nextGate = gateInfo.gate;
      }
    }
  }

  const allPassed = blockedGates.length === 0;

  return {
    success: true,
    gates,
    allPassed,
    blockedGates,
    nextGate: allPassed ? null : nextGate,
    gateSummary: {
      total: gates.length,
      passed: gates.filter(g => g.passed).length,
      blocked: blockedGates.length,
    },
  };
}

/** 检查内容是否只是模板（没有填充实质内容） */
function isTemplateOnly(content, artifactFile) {
  if (!content) return true;

  const lines = content.split('\n');
  const templateSignals = [
    '<!-- ',
    'TODO',
    'Describe ',
    'Enter ',
    'Replace ',
    'Fill in ',
  ];

  let templateLineCount = 0;
  for (const line of lines) {
    if (templateSignals.some(s => line.includes(s))) {
      templateLineCount++;
    }
  }

  const meaningfulLines = lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('#'));
  if (meaningfulLines.length === 0) return true;

  const templateRatio = templateLineCount / Math.max(meaningfulLines.length, 1);
  return templateRatio > 0.5;
}

/** 运行 Gate 级别的检查规则 */
function runGateChecks(content, artifactFile) {
  const checks = [];

  if (artifactFile === ARTIFACT_FILES.proposal) {
    checks.push({
      name: 'has-problem-section',
      passed: /##\s*Problem/i.test(content) && content.split('## Problem')[1]?.split('##')[0]?.trim().length > 20,
      message: 'Problem section must exist and have substantive content',
    });
    checks.push({
      name: 'has-solution-section',
      passed: /##\s*Proposed Solution/i.test(content) && content.split('## Proposed Solution')[1]?.split('##')[0]?.trim().length > 20,
      message: 'Proposed Solution section must exist and have substantive content',
    });
    checks.push({
      name: 'has-scope',
      passed: /##\s*Scope/i.test(content),
      message: 'Scope section must exist',
    });
    checks.push({
      name: 'has-impact',
      passed: /##\s*Impact/i.test(content),
      message: 'Impact section must exist',
    });
  } else if (artifactFile === ARTIFACT_FILES.design) {
    checks.push({
      name: 'has-architecture',
      passed: /##\s*Architecture/i.test(content) && content.split('## Architecture')[1]?.split('##')[0]?.trim().length > 20,
      message: 'Architecture section must exist and have substantive content',
    });
    checks.push({
      name: 'has-decisions',
      passed: /##\s*Technical Decisions/i.test(content),
      message: 'Technical Decisions section must exist',
    });
    checks.push({
      name: 'has-testing-strategy',
      passed: /##\s*Testing Strategy/i.test(content),
      message: 'Testing Strategy section must exist',
    });
    checks.push({
      name: 'has-rollback-plan',
      passed: /##\s*Rollback Plan/i.test(content),
      message: 'Rollback Plan section must exist',
    });
  } else if (artifactFile === ARTIFACT_FILES.tasks) {
    const tasks = parseTasks(content);
    checks.push({
      name: 'has-tasks',
      passed: tasks.length > 0,
      message: 'Must have at least one task',
    });
    checks.push({
      name: 'has-phases',
      passed: /##\s*Phase/i.test(content),
      message: 'Must have task phases',
    });
    checks.push({
      name: 'has-multiple-tasks',
      passed: tasks.length >= 3,
      message: 'Should have at least 3 tasks',
    });
  }

  return checks;
}

// ─── CLI 入口 ──────────────────────────────────────────────────────────────

function main() {
  const command = process.argv[2] || 'detect';

  switch (command) {
    case 'detect': {
      const root = extractRoot(3);
      console.log(JSON.stringify(detect(root), null, 2));
      break;
    }

    case 'capabilities': {
      const root = extractRoot(3);
      console.log(JSON.stringify(getCapabilities(root), null, 2));
      break;
    }

    case 'propose': {
      const idea = process.argv[3];
      if (!idea || idea.startsWith('--')) {
        console.error('Usage: adapter.mjs propose "<idea>" [--name=X] [--author=X] [--priority=X] [projectRoot]');
        process.exit(1);
      }
      const options = {};
      let effectiveRoot = PROJECT_ROOT;
      for (let i = 4; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg.startsWith('--name=')) options.name = arg.split('=')[1];
        else if (arg.startsWith('--author=')) options.author = arg.split('=')[1];
        else if (arg.startsWith('--priority=')) options.priority = arg.split('=')[1];
        else effectiveRoot = arg;
      }
      console.log(JSON.stringify(propose(effectiveRoot, idea, options), null, 2));
      break;
    }

    case 'apply': {
      const changeName = process.argv[3];
      if (!changeName) {
        console.error('Usage: adapter.mjs apply <changeName> [projectRoot]');
        process.exit(1);
      }
      const root = extractRoot(4);
      console.log(JSON.stringify(apply(root, changeName), null, 2));
      break;
    }

    case 'status': {
      const root = extractRoot(3);
      console.log(JSON.stringify(status(root), null, 2));
      break;
    }

    case 'map-to-gates': {
      const artifactFile = process.argv[3];
      if (artifactFile && existsSync(artifactFile)) {
        const content = readFileSync(artifactFile, 'utf8');
        try {
          const artifacts = JSON.parse(content);
          console.log(JSON.stringify(mapToGates(artifacts), null, 2));
        } catch {
          console.error('Failed to parse artifact JSON file');
          process.exit(1);
        }
      } else {
        console.error('Usage: adapter.mjs map-to-gates <artifact-json-file>');
        console.error('  artifact-json-file: JSON file with keys matching artifact filenames');
        process.exit(1);
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: adapter.mjs [detect|capabilities|propose|apply|status|map-to-gates] [projectRoot]');
      process.exit(1);
  }
}

/** Extract projectRoot from argv at given index, fall back to PROJECT_ROOT */
function extractRoot(index) {
  const val = process.argv[index];
  if (val && !val.startsWith('--')) return val;
  return PROJECT_ROOT;
}

// CLI mode: run when executed directly
if (process.argv[1] && /openspec[\\/]adapter/.test(process.argv[1])) {
  main();
}

// Export for programmatic use
export default {
  detect,
  getCapabilities,
  propose,
  apply,
  status,
  mapToGates,
  // Utility exports for testing
  toKebabCase,
  parseTasks,
  parseTaskGroups,
  isTemplateOnly,
  runGateChecks,
};
