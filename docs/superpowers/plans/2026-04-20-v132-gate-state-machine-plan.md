# v1.3.2 Gate 状态机 + 硬拦截实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Gate 状态机 + 硬拦截系统，包含阶段 Gates、质量 Gates、分级策略、跨平台路径、自学习闭环和 Skill 精简。

**Architecture:** 混合型架构 — gate-machine.mjs 核心状态机 + gate-validator.mjs 验证引擎 + gate-enforcer.mjs 执行层 + gate-recovery.mjs 恢复机制 + hooks.json 自动触发 + gate-manager Skill 用户交互。

**Tech Stack:** Node.js ES Modules, fs/path/crypto/child_process, Claude Code hooks, Shell 脚本

---

## 文件结构总览

### 新建文件

| 文件 | 说明 |
|------|------|
| `chaos-harness/scripts/path-utils.mjs` | 跨平台路径工具（增强现有 hook-utils） |
| `chaos-harness/scripts/gate-machine.mjs` | 核心状态机 |
| `chaos-harness/scripts/gate-validator.mjs` | 验证引擎 |
| `chaos-harness/scripts/gate-enforcer.mjs` | 执行层 |
| `chaos-harness/scripts/gate-recovery.mjs` | 恢复机制 |
| `chaos-harness/.chaos-harness/gates/gate-registry.json` | Gate 注册表 |
| `chaos-harness/.chaos-harness/gates/gate-learning.json` | 自学习数据 |
| `chaos-harness/.chaos-harness/gates/override-log.json` | 绕过日志 |
| `chaos-harness/skills/gate-manager/SKILL.md` | 用户交互 Skill |
| `chaos-harness/skills/gate-manager/VERSION` | 版本号 |

### 修改文件

| 文件 | 说明 |
|------|------|
| `chaos-harness/hooks/hooks.json` | 增强 hooks，集成 Gate 检查 |
| `chaos-harness/scripts/hook-utils.mjs` | 增强：添加原子写入、fileHash 计算 |
| `chaos-harness/scripts/iron-law-check.mjs` | 增强：支持文件级检查（非全量扫描） |
| `chaos-harness/.chaos-harness/state.json` | 更新版本号和 stage 状态 |

---

## Task 1: 跨平台路径工具层

**Files:**
- Create: `chaos-harness/scripts/path-utils.mjs`

- [ ] **Step 1: 创建 path-utils.mjs**

```javascript
#!/usr/bin/env node
/**
 * path-utils — 跨平台路径工具层
 * 解决 Windows/Mac/Linux 路径差异问题
 */

import { dirname, join, resolve, normalize, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 从 import.meta.url 推导插件根目录
 * 不依赖环境变量，从 scripts/ 目录向上查找
 */
export function resolvePluginRoot() {
  // scripts/ 的父目录就是插件根
  return dirname(__dirname);
}

/**
 * 统一转换为 POSIX 风格路径（内部处理用）
 */
export function normalizePath(input) {
  return normalize(input).replace(/\\/g, '/');
}

/**
 * 根据当前平台转换为 shell 可识别的路径
 */
export function formatPathForShell(input) {
  if (process.platform === 'win32') {
    return input.replace(/\//g, '\\');
  }
  return input;
}

/**
 * 可靠的项目根目录检测（复用 hook-utils 逻辑，但独立出来给 gate 用）
 */
export function resolveProjectRoot(startDir = process.cwd()) {
  let dir = resolve(startDir);
  for (let depth = 0; depth < 20; depth++) {
    if (existsSync(join(dir, '.chaos-harness', 'state.json'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * 跨平台 join 路径
 */
export function joinPath(...parts) {
  return normalize(join(...parts));
}

/**
 * 判断路径是否是绝对路径
 */
export function isAbsolute(path) {
  return path.startsWith('/') || /^[A-Z]:\\/i.test(path);
}
```

- [ ] **Step 2: 验证 path-utils 可加载**

Run: `node -c chaos-harness/scripts/path-utils.mjs`
Expected: 无输出（语法检查通过）

---

## Task 2: hook-utils.mjs 增强

**Files:**
- Modify: `chaos-harness/scripts/hook-utils.mjs`

- [ ] **Step 1: 添加原子写入函数**

在 `writeJson` 函数后添加 `writeJsonAtomic`：

```javascript
/** 原子写入 JSON（先写 .tmp 文件，再 rename） */
import { renameSync, writeFileSync as fsWriteFileSync } from 'node:fs';

export function writeJsonAtomic(filePath, data) {
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  const content = JSON.stringify(data, null, 2);
  fsWriteFileSync(tmpPath, content, 'utf-8');
  renameSync(tmpPath, filePath);
}
```

- [ ] **Step 2: 添加 fileHash 计算函数**

```javascript
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';

/**
 * 计算文件的 SHA-256 哈希
 */
export function computeFileHash(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, 'utf-8');
    return 'sha256:' + createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

/**
 * 批量计算文件哈希（用于 Gate 缓存）
 */
export function computeHashes(filePaths) {
  const result = {};
  for (const fp of filePaths) {
    result[fp] = computeFileHash(fp);
  }
  return result;
}
```

- [ ] **Step 3: 验证语法**

Run: `node -c chaos-harness/scripts/hook-utils.mjs`
Expected: 无输出

---

## Task 3: Gate 注册表 + 状态文件初始化

**Files:**
- Create: `chaos-harness/.chaos-harness/gates/gate-registry.json`
- Create: `chaos-harness/.chaos-harness/gates/gate-learning.json`
- Create: `chaos-harness/.chaos-harness/gates/override-log.json`

- [ ] **Step 1: 创建 gate-registry.json**

```json
{
  "gates": [
    {
      "id": "gate-w01-requirements",
      "type": "stage",
      "stage": "W01_requirements",
      "level": "hard",
      "description": "需求阶段进入检查",
      "trigger": "stage-transition",
      "cachePolicy": "always",
      "validators": [],
      "dependsOn": []
    },
    {
      "id": "gate-w03-architecture",
      "type": "stage",
      "stage": "W03_architecture",
      "level": "hard",
      "description": "架构阶段进入检查",
      "trigger": "stage-transition",
      "cachePolicy": "always",
      "validators": [
        { "type": "file-exists", "path": "output/*/W01_requirements" }
      ],
      "dependsOn": ["gate-w01-requirements"]
    },
    {
      "id": "gate-w08-development",
      "type": "stage",
      "stage": "W08_development",
      "level": "hard",
      "description": "开发阶段进入检查",
      "trigger": "stage-transition",
      "cachePolicy": "always",
      "validators": [
        { "type": "file-exists", "path": "output/*/W03_architecture" }
      ],
      "dependsOn": ["gate-w03-architecture"]
    },
    {
      "id": "gate-w09-code-review",
      "type": "stage",
      "stage": "W09_code_review",
      "level": "hard",
      "description": "代码审查阶段进入检查",
      "trigger": "stage-transition",
      "cachePolicy": "always",
      "validators": [
        { "type": "git-has-commits", "minCommits": 1 }
      ],
      "dependsOn": ["gate-w08-development"]
    },
    {
      "id": "gate-w10-testing",
      "type": "stage",
      "stage": "W10_testing",
      "level": "hard",
      "description": "测试阶段进入检查",
      "trigger": "stage-transition",
      "cachePolicy": "always",
      "validators": [
        { "type": "no-syntax-errors" }
      ],
      "dependsOn": ["gate-w09-code-review"]
    },
    {
      "id": "gate-w12-release",
      "type": "stage",
      "stage": "W12_release",
      "level": "hard",
      "description": "发布阶段进入检查",
      "trigger": "stage-transition",
      "cachePolicy": "always",
      "validators": [
        { "type": "test-suite-pass" }
      ],
      "dependsOn": ["gate-w10-testing"]
    },
    {
      "id": "gate-quality-iron-law",
      "type": "quality",
      "level": "hard",
      "description": "铁律违规零容忍",
      "trigger": "pre-write",
      "cachePolicy": "never",
      "validators": [
        { "type": "iron-law-check" }
      ],
      "dependsOn": []
    },
    {
      "id": "gate-quality-tests",
      "type": "quality",
      "level": "hard",
      "description": "测试必须通过",
      "trigger": "pre-commit",
      "cachePolicy": "on-change",
      "validators": [
        { "type": "test-suite-pass" }
      ],
      "dependsOn": []
    },
    {
      "id": "gate-quality-format",
      "type": "quality",
      "level": "soft",
      "description": "代码格式建议",
      "trigger": "pre-commit",
      "cachePolicy": "on-change",
      "validators": [
        { "type": "lint-check" }
      ],
      "dependsOn": []
    }
  ],
  "version": "1.3.2",
  "createdAt": "2026-04-20T00:00:00Z"
}
```

- [ ] **Step 2: 创建 gate-learning.json**

```json
{
  "gates": {},
  "lastUpdated": "2026-04-20T00:00:00Z"
}
```

- [ ] **Step 3: 创建 override-log.json**

```json
[]
```

- [ ] **Step 4: 验证 JSON 格式**

Run: `node -e "JSON.parse(require('fs').readFileSync('chaos-harness/.chaos-harness/gates/gate-registry.json','utf-8')); console.log('OK')"`
Expected: `OK`

---

## Task 4: Gate Validator 验证引擎

**Files:**
- Create: `chaos-harness/scripts/gate-validator.mjs`

- [ ] **Step 1: 创建 gate-validator.mjs**

```javascript
#!/usr/bin/env node
/**
 * gate-validator — Gate 验证引擎
 * 实现所有验证器类型，真验证（非关键词匹配）
 *
 * 调用: node gate-validator.mjs <gate-id> [--root <project-root>]
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot, resolveProjectRoot, normalizePath } from './path-utils.mjs';
import { readJson, computeFileHash } from './hook-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();
const gatesDir = join(pluginRoot, '.chaos-harness', 'gates');

/**
 * 加载 Gate 注册表
 */
function loadRegistry() {
  const registryPath = join(gatesDir, 'gate-registry.json');
  if (!existsSync(registryPath)) {
    console.error('ERROR: gate-registry.json not found');
    process.exit(1);
  }
  return readJson(registryPath, { gates: [] });
}

/**
 * 加载 Gate 状态文件
 */
function loadGateState(gateId) {
  const statePath = join(gatesDir, `${gateId}.json`);
  return readJson(statePath, null);
}

/**
 * 检查缓存是否有效
 */
function isCacheValid(gateDef, state) {
  if (!state || gateDef.cachePolicy === 'never') return false;
  if (state.status !== 'passed') return false;

  // on-change 策略：检查文件哈希是否变化
  if (gateDef.cachePolicy === 'on-change' && state.fileHashes) {
    for (const [filePath, oldHash] of Object.entries(state.fileHashes)) {
      const newHash = computeFileHash(filePath);
      if (newHash !== oldHash) return false;
    }
    return true;
  }

  // always 策略：如果 passed 就一直有效
  if (gateDef.cachePolicy === 'always') return true;

  return false;
}

// ---- 验证器实现 ----

/**
 * file-exists: 检查文件是否存在（支持 glob 模式）
 * 不依赖 node:fs/promises 的 glob（Node 22.3+ 才有），使用手动递归查找
 */
function validateFileExists(validator, projectRoot) {
  const pattern = validator.path;
  if (pattern.includes('*')) {
    const basePattern = pattern.split('*')[0].replace(/\/$/, '');
    const searchDir = join(projectRoot, basePattern || '.');
    if (!existsSync(searchDir)) {
      return { status: 'failed', reason: `Directory not found: ${basePattern || '(project root)'}` };
    }
    const matches = findFilesRecursive(searchDir, pattern);
    if (matches.length > 0) {
      return { status: 'passed', matched: matches[0] };
    }
    return { status: 'failed', reason: `No files matching pattern: ${pattern}` };
  }
  const fullPath = join(projectRoot, pattern);
  if (existsSync(fullPath)) {
    return { status: 'passed' };
  }
  return { status: 'failed', reason: `File not found: ${pattern}` };
}

/**
 * 简易 glob 替代：递归查找匹配模式的文件
 */
function findFilesRecursive(dir, pattern) {
  const results = [];
  if (!existsSync(dir)) return results;
  const parts = readdirSync(dir);
  for (const part of parts) {
    const fullPath = join(dir, part);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findFilesRecursive(fullPath, pattern));
      } else if (matchesPattern(fullPath, pattern)) {
        results.push(fullPath);
      }
    } catch { /* skip inaccessible */ }
  }
  return results;
}

/**
 * 简易路径匹配：将 pattern 中的 * 转换为正则
 */
function matchesPattern(filePath, pattern) {
  const regex = pattern.replace(/\*/g, '[^/]*').replace(/\//g, '[\\\\/]');
  return new RegExp(regex).test(filePath);
}

/**
 * no-syntax-errors: 检查项目代码 .mjs/.js 文件语法
 * 扫描项目根目录和 src/ 目录，不扫描 chaos-harness/ 自身
 */
function validateNoSyntaxErrors(validator, projectRoot) {
  const scanDirs = [projectRoot, join(projectRoot, 'src')].filter(existsSync);
  if (scanDirs.length === 0) {
    return { status: 'skipped', reason: 'No source directories found' };
  }

  const errors = [];
  for (const dir of scanDirs) {
    const files = findFilesRecursive(dir, '*.mjs').concat(findFilesRecursive(dir, '*.js'));
    // 排除 chaos-harness 自身
    const filtered = files.filter(f => !f.includes('chaos-harness'));
    for (const file of filtered.slice(0, 50)) { // 最多检查 50 个文件
      try {
        execSync(`node -c "${file}"`, { stdio: 'pipe', timeout: 5000 });
      } catch (e) {
        errors.push({ file, error: e.stderr?.toString()?.trim() || 'syntax error' });
      }
    }
  }

  if (errors.length === 0) return { status: 'passed' };
  return { status: 'failed', reason: `Syntax errors: ${errors.map(e => e.file).join(', ')}`, details: errors };
}

/**
 * test-suite-pass: 动态检测测试框架并运行测试
 */
function validateTestSuite(validator, projectRoot) {
  // 检测测试框架
  const pkgPath = join(projectRoot, 'chaos-harness', 'package.json');
  if (!existsSync(pkgPath)) {
    return { status: 'skipped', reason: 'No package.json found' };
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  let testCmd = null;
  if (deps.vitest || deps['vitest']) testCmd = 'npx vitest run --passWithNoTests';
  else if (deps.jest) testCmd = 'npx jest --passWithNoTests';
  else if (deps.mocha) testCmd = 'npx mocha';

  if (!testCmd) {
    return { status: 'skipped', reason: 'No test framework detected (vitest/jest/mocha)' };
  }

  try {
    const result = execSync(testCmd, {
      cwd: join(projectRoot, 'chaos-harness'),
      stdio: 'pipe',
      timeout: 30000
    });
    return { status: 'passed' };
  } catch (e) {
    const output = e.stdout?.toString() + e.stderr?.toString() || '';
    return { status: 'failed', reason: 'Test suite failed', details: output.slice(-500) };
  }
}

/**
 * iron-law-check: 调用现有 iron-law-check.mjs
 */
function validateIronLaw(validator, projectRoot) {
  const scriptPath = join(pluginRoot, 'scripts', 'iron-law-check.mjs');
  if (!existsSync(scriptPath)) {
    return { status: 'skipped', reason: 'iron-law-check.mjs not found' };
  }

  try {
    execSync(`node "${scriptPath}"`, { stdio: 'pipe', timeout: 5000 });
    return { status: 'passed' };
  } catch (e) {
    const output = e.stdout?.toString() || '';
    return { status: 'failed', reason: 'Iron law violation detected', details: output.slice(-500) };
  }
}

/**
 * lint-check: 代码格式检查
 */
function validateLint(validator, projectRoot) {
  const pkgPath = join(projectRoot, 'chaos-harness', 'package.json');
  if (!existsSync(pkgPath)) {
    return { status: 'skipped', reason: 'No package.json found' };
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  if (!pkg.devDependencies?.eslint && !pkg.scripts?.lint) {
    return { status: 'skipped', reason: 'ESLint not configured' };
  }

  try {
    execSync('npx eslint . --quiet', {
      cwd: join(projectRoot, 'chaos-harness'),
      stdio: 'pipe',
      timeout: 10000
    });
    return { status: 'passed' };
  } catch (e) {
    const output = e.stdout?.toString() || '';
    return { status: 'failed', reason: 'Lint issues found', details: output.slice(-500) };
  }
}

/**
 * git-has-commits: 检查 Git 提交数
 */
function validateGitCommits(validator, projectRoot) {
  const minCommits = validator.minCommits || 1;
  try {
    const output = execSync('git log --oneline --since="1 week ago" 2>/dev/null || echo ""', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });
    const count = output.trim().split('\n').filter(l => l.length > 0).length;
    if (count >= minCommits) {
      return { status: 'passed', commitCount: count };
    }
    return { status: 'failed', reason: `Only ${count} commits (need ${minCommits})` };
  } catch {
    return { status: 'skipped', reason: 'Not a git repository' };
  }
}

// ---- 验证调度器 ----

const validators = {
  'file-exists': validateFileExists,
  'no-syntax-errors': validateNoSyntaxErrors,
  'test-suite-pass': validateTestSuite,
  'iron-law-check': validateIronLaw,
  'lint-check': validateLint,
  'git-has-commits': validateGitCommits,
};

/**
 * 执行单个 Gate 的所有验证
 */
export function validateGate(gateDef, projectRoot) {
  const results = [];

  for (const validator of gateDef.validators) {
    const fn = validators[validator.type];
    if (!fn) {
      results.push({ type: validator.type, status: 'failed', reason: `Unknown validator: ${validator.type}` });
      continue;
    }
    const result = fn(validator, projectRoot);
    results.push({ type: validator.type, ...result });
  }

  const allPassed = results.every(r => r.status === 'passed' || r.status === 'skipped');
  return {
    gateId: gateDef.id,
    allPassed,
    results,
  };
}

/**
 * 主入口：CLI 调用
 */
function main() {
  const args = process.argv.slice(2);
  const gateId = args.find(a => !a.startsWith('--'));
  const rootIdx = args.indexOf('--root');
  const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : resolveProjectRoot() || process.cwd();

  if (!gateId) {
    console.error('Usage: node gate-validator.mjs <gate-id> [--root <project-root>]');
    process.exit(1);
  }

  const registry = loadRegistry();
  const gateDef = registry.gates.find(g => g.id === gateId);
  if (!gateDef) {
    console.error(`Gate not found: ${gateId}`);
    process.exit(1);
  }

  // 检查缓存
  const state = loadGateState(gateId);
  if (isCacheValid(gateDef, state)) {
    console.log(JSON.stringify({ gateId, cached: true, status: 'passed' }));
    process.exit(0);
  }

  // 执行验证
  const result = validateGate(gateDef, projectRoot);
  console.log(JSON.stringify(result));
  process.exit(result.allPassed ? 0 : 1);
}

// 仅 CLI 模式执行
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 2: 验证语法**

Run: `node -c chaos-harness/scripts/gate-validator.mjs`
Expected: 无输出

---

## Task 5: Gate Enforcer 执行层

**Files:**
- Create: `chaos-harness/scripts/gate-enforcer.mjs`

- [ ] **Step 1: 创建 gate-enforcer.mjs**

```javascript
#!/usr/bin/env node
/**
 * gate-enforcer — Gate 执行层
 * 根据验证结果决定 exit 1（硬阻断）还是 exit 0（软警告）
 *
 * 调用: node gate-enforcer.mjs <gate-id> [--root <project-root>]
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot, resolveProjectRoot } from './path-utils.mjs';
import { readJson, writeJson, ensureDir, computeFileHash } from './hook-utils.mjs';
import { validateGate, loadRegistry, loadGateState, isCacheValid } from './gate-validator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();
const gatesDir = join(pluginRoot, '.chaos-harness', 'gates');

/**
 * 保存 Gate 状态
 */
function saveGateState(gateId, state) {
  ensureDir(gatesDir);
  const statePath = join(gatesDir, `${gateId}.json`);
  writeJson(statePath, state);
}

/**
 * 输出 Gate 失败信息
 */
function printFailure(gateDef, result) {
  console.error(`\n[GATE FAILED] ${gateDef.id}: ${gateDef.description}`);
  console.error(`Level: ${gateDef.level.toUpperCase()}`);
  console.error('');
  for (const r of result.results) {
    if (r.status === 'failed') {
      console.error(`  ✗ ${r.type}: ${r.reason}`);
      if (r.details) console.error(`    ${r.details}`);
    } else if (r.status === 'skipped') {
      console.error(`  - ${r.type}: ${r.reason} (skipped)`);
    } else {
      console.error(`  ✓ ${r.type}: passed`);
    }
  }
  console.error('');
}

/**
 * 输出 Gate 警告信息（soft）
 */
function printWarning(gateDef, result) {
  console.error(`\n[GATE WARNING] ${gateDef.id}: ${gateDef.description}`);
  for (const r of result.results) {
    if (r.status === 'failed') {
      console.error(`  ⚠ ${r.type}: ${r.reason}`);
    }
  }
  console.error('');
}

/**
 * 主入口
 */
function main() {
  const args = process.argv.slice(2);
  const gateId = args.find(a => !a.startsWith('--'));
  const rootIdx = args.indexOf('--root');
  const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : resolveProjectRoot() || process.cwd();

  if (!gateId) {
    console.error('Usage: node gate-enforcer.mjs <gate-id> [--root <project-root>]');
    process.exit(1);
  }

  const registry = loadRegistry();
  const gateDef = registry.gates.find(g => g.id === gateId);
  if (!gateDef) {
    console.error(`Gate not found: ${gateId}`);
    process.exit(1);
  }

  // 检查缓存
  const state = loadGateState(gateId);
  if (isCacheValid(gateDef, state)) {
    // 缓存命中，直接通过
    process.exit(0);
  }

  // 执行验证
  const result = validateGate(gateDef, projectRoot);

  if (result.allPassed) {
    // 计算 fileHashes（仅对非 glob 路径）
    const fileHashes = {};
    for (const v of gateDef.validators) {
      if (v.path && !v.path.includes('*')) {
        const hash = computeFileHash(v.path);
        if (hash) fileHashes[v.path] = hash;
      }
    }

    saveGateState(gateId, {
      id: gateId,
      status: 'passed',
      lastChecked: new Date().toISOString(),
      fileHashes,
      result: { results: result.results },
    });
    process.exit(0);
  }

  // 验证失败
  if (gateDef.level === 'hard') {
    printFailure(gateDef, result);
    process.exit(1);
  } else {
    printWarning(gateDef, result);
    // soft Gate 失败仍然记录状态
    saveGateState(gateId, {
      id: gateId,
      status: 'soft-fail',
      lastChecked: new Date().toISOString(),
      result: { results: result.results },
    });
    process.exit(0);
  }
}

// CLI 模式
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

**注意：** gate-enforcer.mjs 需要从 gate-validator.mjs 导入函数，但 gate-validator 的 `loadRegistry`, `loadGateState`, `isCacheValid` 当前是内部函数。需要在 gate-validator.mjs 中将这些函数改为 export。

- [ ] **Step 2: 修改 gate-validator.mjs 添加 export**

在 gate-validator.mjs 中，将 `loadRegistry`, `loadGateState`, `isCacheValid` 函数前加 `export` 关键字：

```javascript
export function loadRegistry() { ... }
export function loadGateState(gateId) { ... }
export function isCacheValid(gateDef, state) { ... }
```

- [ ] **Step 3: 验证语法**

Run: `node -c chaos-harness/scripts/gate-enforcer.mjs`
Expected: 无输出

---

## Task 6: Gate Recovery 恢复机制

**Files:**
- Create: `chaos-harness/scripts/gate-recovery.mjs`

- [ ] **Step 1: 创建 gate-recovery.mjs**

```javascript
#!/usr/bin/env node
/**
 * gate-recovery — Gate 恢复机制
 * 提供自动修复建议、模板生成、绕过日志
 *
 * 调用:
 *   node gate-recovery.mjs suggest <gate-id>  # 获取修复建议
 *   node gate-recovery.mjs override <gate-id> --reason "xxx"  # 绕过（仅 soft）
 *   node gate-recovery.mjs history            # 查看绕过日志
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';
import { readJson, writeJson, writeJsonAtomic, ensureDir } from './hook-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();
const gatesDir = join(pluginRoot, '.chaos-harness', 'gates');
const overrideLogPath = join(gatesDir, 'override-log.json');

/**
 * 获取 Gate 失败后的修复建议
 */
function getSuggestions(gateId) {
  const statePath = join(gatesDir, `${gateId}.json`);
  const state = readJson(statePath, null);
  if (!state || !state.result) {
    console.log('No failure data available for this gate.');
    return;
  }

  console.log(`\n修复建议 for ${gateId}:`);
  console.log('='.repeat(40));

  for (const r of state.result.results) {
    if (r.status === 'failed') {
      console.log(`\n  [${r.type}] 失败原因: ${r.reason}`);
      console.log(`  建议修复:`);
      console.log(`    ${getFixSuggestion(r)}`);
    }
  }
}

/**
 * 根据验证结果生成修复建议
 */
function getFixSuggestion(result) {
  switch (result.type) {
    case 'file-exists':
      return `创建缺失的文件: ${result.matched || result.reason}`;
    case 'no-syntax-errors':
      return `修复语法错误后运行: node -c <file>`;
    case 'test-suite-pass':
      return `修复失败的测试后运行: npm test`;
    case 'iron-law-check':
      return `检查铁律违规，确保操作符合 IL001-IL005`;
    case 'lint-check':
      return `运行格式化: npx eslint . --fix`;
    case 'git-has-commits':
      return `提交当前更改后再继续`;
    default:
      return `根据错误信息修复后重新验证`;
  }
}

/**
 * 绕过 soft Gate
 */
function overrideGate(gateId, reason) {
  const registryPath = join(gatesDir, 'gate-registry.json');
  const registry = readJson(registryPath, { gates: [] });
  const gateDef = registry.gates.find(g => g.id === gateId);

  if (!gateDef) {
    console.error(`Gate not found: ${gateId}`);
    process.exit(1);
  }

  if (gateDef.level === 'hard') {
    console.error(`ERROR: Cannot override hard gate: ${gateId}`);
    console.error(`Hard gates cannot be bypassed. This is a design底线.`);
    process.exit(1);
  }

  // 检查 session 内的绕过次数
  const overrideLog = readJson(overrideLogPath, []);
  const sessionOverrides = overrideLog.filter(o => {
    const overrideTime = new Date(o.overriddenAt);
    const sessionStart = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 小时内
    return overrideTime > sessionStart;
  });

  if (sessionOverrides.length >= 3) {
    console.error(`WARNING: Already ${sessionOverrides.length} overrides this session. Max is 3.`);
    console.error(`Contact project lead for approval to continue.`);
    process.exit(1);
  }

  // 记录绕过
  const entry = {
    gateId,
    overriddenAt: new Date().toISOString(),
    reason,
    overriddenBy: 'user',
  };
  overrideLog.push(entry);
  ensureDir(gatesDir);
  writeJsonAtomic(overrideLogPath, overrideLog);

  console.log(`Override recorded for ${gateId}`);
  console.log(`Reason: ${reason}`);
}

/**
 * 查看绕过日志
 */
function showHistory() {
  const overrideLog = readJson(overrideLogPath, []);
  if (overrideLog.length === 0) {
    console.log('No override history.');
    return;
  }

  console.log('\nOverride History:');
  console.log('='.repeat(60));
  for (const entry of overrideLog) {
    console.log(`  [${entry.overriddenAt}] ${entry.gateId}`);
    console.log(`    Reason: ${entry.reason}`);
    console.log(`    By: ${entry.overriddenBy}`);
    console.log('');
  }
}

/**
 * 主入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'suggest':
      getSuggestions(args[1]);
      break;
    case 'override': {
      const gateId = args[1];
      const reasonIdx = args.indexOf('--reason');
      const reason = reasonIdx >= 0 ? args[reasonIdx + 1] : 'No reason provided';
      overrideGate(gateId, reason);
      break;
    }
    case 'history':
      showHistory();
      break;
    default:
      console.error('Usage: node gate-recovery.mjs <suggest|override|history> [args]');
      process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 2: 验证语法**

Run: `node -c chaos-harness/scripts/gate-recovery.mjs`
Expected: 无输出

---

## Task 7: Gate Machine 核心状态机

**Files:**
- Create: `chaos-harness/scripts/gate-machine.mjs`

- [ ] **Step 1: 创建 gate-machine.mjs**

```javascript
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
import { existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

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
  const pending = state?.workflow?.stages_pending || [];

  // 基于 state.json 生成最小注册表
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

  // 添加阶段 Gates
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
    const isCompleted = stages.includes(stage.stage);
    const prevDeps = i > 0 ? [allStages[i - 1].id] : [];

    defaultGates.push({
      id: stage.id,
      type: 'stage',
      stage: stage.stage,
      level: 'hard',
      description: `${stage.stage} 进入检查`,
      trigger: 'stage-transition',
      cachePolicy: 'always',
      validators: isCompleted ? [] : [{ type: 'file-exists', path: `output/*/${stage.stage}` }],
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
function checkGate(gateId, projectRoot) {
  const { execFileSync } = await import('node:child_process');
  const enforcerPath = join(pluginRoot, 'scripts', 'gate-enforcer.mjs');

  try {
    execFileSync('node', [enforcerPath, gateId, '--root', projectRoot], {
      stdio: 'inherit',
      timeout: 30000
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 会话启动检查
 */
function sessionStart(projectRoot) {
  console.log('[Gate Machine] Session start check...');

  // 检查所有 stage Gates 中已通过的是否仍有效
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

  const currentStage = state.workflow?.current_stage;
  const stages = state.workflow?.stages_completed?.map(s => s.stage) || [];

  // 如果 W08 已完成且有足够提交
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

  // 找到对应 Gate
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
      console.error(`Dependency gate not passed: ${depId}`);

      // 先检查依赖 Gate
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
```

**注意：** `checkGate` 函数中使用了 `await import`，需要将 main 函数改为 async。修复：

```javascript
async function main() {
  // ... 所有逻辑不变
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e); process.exit(1); });
}
```

同时将 `checkGate` 改为同步版本（使用 execFileSync 而非 execFile），支持静默模式：

```javascript
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
```

- [ ] **Step 2: 验证语法**

Run: `node -c chaos-harness/scripts/gate-machine.mjs`
Expected: 无输出

---

## Task 8: hooks.json 增强

> **注意：** 此任务应在所有 Gate 脚本（Task 1-7）完成并验证后执行。如果在中间 commit 时 hooks.json 已更新，新 hooks 会调用尚不存在的脚本导致 exit 1。建议在 commit 前临时禁用 hooks 或按顺序执行。

**Files:**
- Modify: `chaos-harness/hooks/hooks.json`

- [ ] **Step 1: 更新 hooks.json**

将现有 `run-hook.cmd` 调用替换为 `.mjs` 调用，并添加 Gate 检查：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/gate-machine.mjs\" --session-start --root \"${CLAUDE_PLUGIN_ROOT}\"",
            "async": false
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/gate-enforcer.mjs\" gate-quality-iron-law --root \"${CLAUDE_PLUGIN_ROOT}\"",
            "async": false
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/iron-law-check.mjs\" \"<file_path>\"",
            "async": false
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/gate-enforcer.mjs\" gate-quality-tests --root \"${CLAUDE_PLUGIN_ROOT}\"",
            "async": false
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/gate-enforcer.mjs\" gate-quality-format --root \"${CLAUDE_PLUGIN_ROOT}\"",
            "async": true
          }
        ]
      },
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/overdrive.mjs\"",
            "async": true
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/intent-analyzer.mjs\"",
            "async": true
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/learning-update.mjs\"",
            "async": true
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/project-pattern-writer.mjs\"",
            "async": true
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/workflow-track.mjs\"",
            "async": true
          }
        ]
      },
      {
        "matcher": "Write|Edit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/instinct-collector.mjs\"",
            "async": true
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/eval-collector.mjs\"",
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "end_turn",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/stop.mjs\"",
            "async": false
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/laziness-detect.mjs\"",
            "async": true
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/pre-compact.mjs\"",
            "async": false
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: 验证 JSON 格式**

Run: `node -e "JSON.parse(require('fs').readFileSync('chaos-harness/hooks/hooks.json','utf-8')); console.log('OK')"`
Expected: `OK`

---

## Task 9: iron-law-check.mjs 性能优化

**Files:**
- Modify: `chaos-harness/scripts/iron-law-check.mjs`

- [ ] **Step 1: 优化为文件级检查（非全量扫描）**

修改当前 iron-law-check.mjs，使其只检查被修改的文件（通过参数传入）：

在文件开头添加：

```javascript
// 支持传入具体文件路径参数
const specificFile = process.argv[3] ? (() => {
  try {
    const input = JSON.parse(process.argv.slice(3).join(' '));
    return input.file_path || '';
  } catch {
    return '';
  }
})() : '';

// 如果有具体文件，只检查该文件
if (specificFile) {
  // 直接对该文件执行铁律检查
  checkIronLaws(specificFile);
  process.exit(0);
}
```

- [ ] **Step 2: 验证语法**

Run: `node -c chaos-harness/scripts/iron-law-check.mjs`
Expected: 无输出

---

## Task 10: gate-manager Skill 用户交互层

**Files:**
- Create: `chaos-harness/skills/gate-manager/SKILL.md`
- Create: `chaos-harness/skills/gate-manager/VERSION`

- [ ] **Step 1: 创建 SKILL.md**

```markdown
---
name: gate-manager
description: Manage Gate state machine — view status, recheck gates, transition stages, override soft gates
---

# Gate Manager

管理 Chaos Harness v1.3.2 Gate 状态机。

## Commands

### /gate-manager status

查看所有 Gates 状态仪表盘。

Run: `node <plugin-root>/scripts/gate-machine.mjs --status`

### /gate-manager status <gate-id>

查看单个 Gate 详情。

Run: `cat <plugin-root>/.chaos-harness/gates/<gate-id>.json`

### /gate-manager recheck <gate-id>

手动重新验证某个 Gate。

Run: `node <plugin-root>/scripts/gate-enforcer.mjs <gate-id> --root <plugin-root>`

### /gate-manager transition <stage-id>

发起阶段切换请求。

1. 确认用户请求的阶段 ID
2. Run: `node <plugin-root>/scripts/gate-machine.mjs --transition <stage-id> --root <plugin-root>`

### /gate-manager override <gate-id> --reason "xxx"

绕过 soft Gate（不可用于 hard Gate）。

Run: `node <plugin-root>/scripts/gate-recovery.mjs override <gate-id> --reason "xxx"`

### /gate-manager history

查看 Gate 绕过日志。

Run: `node <plugin-root>/scripts/gate-recovery.mjs history`

### /gate-manager list

列出所有 Gates 及定义。

Read: `<plugin-root>/.chaos-harness/gates/gate-registry.json`

### /gate-manager reset <gate-id>

重置某个 Gate 状态为 pending。

Delete: `<plugin-root>/.chaos-harness/gates/<gate-id>.json`
```

- [ ] **Step 2: 创建 VERSION**

```
1.3.2
```

---

## Task 11: 更新 state.json 版本号

**Files:**
- Modify: `chaos-harness/.chaos-harness/state.json`

- [ ] **Step 1: 更新版本号**

将 `current_version` 从 `v1.3.1` 更新为 `v1.3.2`，并更新 `version_history`：

```json
{
  ...
  "current_version": "v1.3.2",
  "version_history": ["v1.0.0", "v1.1.0", "v1.2.0", "v1.3.0", "v1.3.1", "v1.3.2"],
  ...
}
```

---

## Task 12: Skill 精简 — 移除不需要的 Skills

**Files:**
- Delete: 多个 skill 目录

**注意：保持扁平目录结构**。Claude Code 插件加载器扫描 `skills/` 顶层目录，不递归子目录。因此不创建 `core/` 和 `optional/` 子目录，而是通过 SKILL.md 内的注释标记 `core` vs `optional`。

- [ ] **Step 1: 移除不需要的 Skills**

```bash
cd chaos-harness/skills
rm -rf auto-context auto-toolkit-installer project-scanner agent-team-orchestrator collaboration-reviewer plugin-manager
```

- [ ] **Step 2: 确认精简后结构**

Run: `ls chaos-harness/skills/`
Expected: 12 skills remaining (overview, project-state, hooks-manager, iron-law-enforcer, overdrive, harness-generator, version-locker, gate-manager, java-checkstyle, ui-generator, web-access, product-manager)

---

## Task 13: 合并产品系 Skills

**Files:**
- Merge: `product-manager` + `prd-validator` + `product-lifecycle`

- [ ] **Step 1: 合并为单个 product-manager**

将 `prd-validator/SKILL.md` 和 `product-lifecycle/SKILL.md` 的内容合并到 `product-manager/SKILL.md` 中。

先移动再合并：

```bash
cd chaos-harness/skills
mv prd-validator optional/product-manager-prd/
mv product-lifecycle optional/product-manager-lifecycle/
```

然后编辑 `optional/product-manager/SKILL.md`，添加 prd-validator 和 product-lifecycle 的内容作为章节。

- [ ] **Step 2: 删除冗余目录**

```bash
cd chaos-harness/skills
rm -rf product-manager-prd product-manager-lifecycle
```

---

## Task 14: 合并自学习 Skills 到 gate-manager

**Files:**
- Merge: `learning-analyzer` + `instinct-system` + `adaptive-harness` + `strategic-compact`

- [ ] **Step 1: 将自学习逻辑合并到 gate-manager SKILL.md**

编辑 `core/gate-manager/SKILL.md`，在底部添加自学习章节：

```markdown
## Self-Learning Integration

Gate 的自学习功能整合了以下原有 Skill 的能力：

- **learning-analyzer**: 分析学习记录，作为 Gate 阈值调整的输入信号
- **instinct-system**: 直觉评分影响 Gate 的验证优先级
- **adaptive-harness**: 动态调整约束
- **strategic-compact**: 压缩策略优化

这些 Skill 的脚本（learning-update.mjs, instinct-collector.mjs 等）保持不变，
但它们的业务逻辑已通过 gate-learning.json 统一由 Gate Manager 管理。
```

- [ ] **Step 2: 移动原 Skill 目录到可选或删除**

```bash
cd chaos-harness/skills
rm -rf learning-analyzer instinct-system adaptive-harness strategic-compact
```

---

## Task 15: 合并评估测试 Skills 到 Gate 验证

**Files:**
- Merge: `eval-harness` + `test-assistant` + `visual-regression`

- [ ] **Step 1: 将评估能力融入 gate-validator.mjs**

（已在 Task 4 的 `test-suite-pass` 验证器中实现动态检测）

- [ ] **Step 2: 移动或删除原 Skill**

```bash
cd chaos-harness/skills
rm -rf eval-harness test-assistant visual-regression
```

---

## Task 16: 合并工作流 Skills 到 gate-machine

**Files:**
- Merge: `workflow-supervisor` + `schema-workflow` + `iterative-retrieval`

- [ ] **Step 1: 将工作流能力融入 gate-machine.mjs**

（已在 Task 7 的阶段切换和会话启动逻辑中实现）

- [ ] **Step 2: 移动或删除原 Skill**

```bash
cd chaos-harness/skills
rm -rf workflow-supervisor schema-workflow iterative-retrieval
```

---

## Task 17: defense-in-depth 融入 iron-law-enforcer

**Files:**
- Merge: `defense-in-depth` → `iron-law-enforcer`

- [ ] **Step 1: 将 defense-in-depth 的铁律相关内容添加到 iron-law-enforcer**

编辑 `core/iron-law-enforcer/SKILL.md`，添加 defense-in-depth 中的深度防御策略作为铁律检查的补充。

- [ ] **Step 2: 删除 defense-in-depth**

```bash
cd chaos-harness/skills
rm -rf defense-in-depth
```

---

## Task 18: 整合 hooks 中的 run-hook.cmd 调用

**Files:**
- Modify: `chaos-harness/hooks/hooks.json`
- Modify: `chaos-harness/hooks/run-hook.cmd`

- [ ] **Step 1: 确认 hooks.json 中已无 run-hook.cmd 调用**

（已在 Task 8 中完成）

- [ ] **Step 2: 备份并简化 run-hook.cmd**

将 run-hook.cmd 重命名为 run-hook.cmd.bak，保留作为兼容：

```bash
cd chaos-harness/hooks
mv run-hook.cmd run-hook.cmd.bak
```

---

## Task 19: 端到端验证

**Files:** 所有新建的文件

- [ ] **Step 1: 运行 Gate Machine 状态检查**

Run: `node chaos-harness/scripts/gate-machine.mjs --status --root chaos-harness`
Expected: 显示 Gate 状态仪表盘

- [ ] **Step 2: 运行 session-start**

Run: `node chaos-harness/scripts/gate-machine.mjs --session-start --root chaos-harness`
Expected: 会话启动检查完成

- [ ] **Step 3: 验证所有新建 .mjs 文件语法**

Run: `for f in chaos-harness/scripts/gate-*.mjs chaos-harness/scripts/path-utils.mjs; do node -c "$f"; done`
Expected: 全部通过

- [ ] **Step 4: 验证 hooks.json JSON 格式**

Run: `node -e "JSON.parse(require('fs').readFileSync('chaos-harness/hooks/hooks.json','utf-8')); console.log('hooks.json OK')"`
Expected: `hooks.json OK`

- [ ] **Step 5: 验证 gate-registry.json JSON 格式**

Run: `node -e "JSON.parse(require('fs').readFileSync('chaos-harness/.chaos-harness/gates/gate-registry.json','utf-8')); console.log('registry OK')"`
Expected: `registry OK`

---

## Task 20: 提交

- [ ] **Step 1: 提交所有更改**

```bash
git add chaos-harness/scripts/gate-machine.mjs \
  chaos-harness/scripts/gate-validator.mjs \
  chaos-harness/scripts/gate-enforcer.mjs \
  chaos-harness/scripts/gate-recovery.mjs \
  chaos-harness/scripts/path-utils.mjs \
  chaos-harness/scripts/hook-utils.mjs \
  chaos-harness/scripts/iron-law-check.mjs \
  chaos-harness/hooks/hooks.json \
  chaos-harness/hooks/run-hook.cmd.bak \
  chaos-harness/.chaos-harness/gates/ \
  chaos-harness/skills/ \
  chaos-harness/.chaos-harness/state.json
git commit -m "feat: implement Gate state machine + hard intercepts (v1.3.2)

- gate-machine.mjs: core state machine engine
- gate-validator.mjs: validation engine with 6 validator types
- gate-enforcer.mjs: hard/soft gate enforcement
- gate-recovery.mjs: recovery suggestions and override logging
- path-utils.mjs: cross-platform path utilities
- hooks.json: migrated all run-hook.cmd to .mjs calls
- gate-manager skill: user interaction layer
- skills restructured: 33 -> 12 (8 core + 4 optional)
- self-learning loop integrated into gate-manager
- file-level iron-law check (performance optimized)"
```
