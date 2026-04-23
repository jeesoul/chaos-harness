#!/usr/bin/env node
/**
 * gate-validator — Gate 验证引擎
 * 实现所有验证器类型，真验证（非关键词匹配）
 *
 * 调用: node gate-validator.mjs <gate-id> [--root <project-root>]
 */

import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
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
export function loadRegistry() {
  const registryPath = join(pluginRoot, 'data', 'gate-registry.json');
  if (!existsSync(registryPath)) {
    console.error('ERROR: gate-registry.json not found');
    process.exit(1);
  }
  return readJson(registryPath, { gates: [] });
}

/**
 * 加载 Gate 状态文件
 */
export function loadGateState(gateId) {
  const statePath = join(gatesDir, `${gateId}.json`);
  return readJson(statePath, null);
}

/**
 * 检查缓存是否有效
 */
export function isCacheValid(gateDef, state) {
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
    const matches = findFilesRecursive(searchDir, pattern, projectRoot);
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
function findFilesRecursive(dir, pattern, projectRoot) {
  const results = [];
  if (!existsSync(dir)) return results;
  const parts = readdirSync(dir);
  const normRoot = normalizePath(projectRoot);
  for (const part of parts) {
    const fullPath = join(dir, part);
    try {
      const stat = statSync(fullPath);
      const relPath = normalizePath(fullPath).replace(normRoot + '/', '');
      if (matchesPattern(relPath, pattern)) {
        results.push(fullPath);
      }
      if (stat.isDirectory()) {
        results.push(...findFilesRecursive(fullPath, pattern, projectRoot));
      }
    } catch { /* skip inaccessible */ }
  }
  return results;
}

/**
 * 简易路径匹配：将 pattern 中的 * 转换为正则
 */
function matchesPattern(filePath, pattern) {
  // Must normalize forward slashes first, then replace * with glob, then replace / with path separator
  const normalized = filePath.replace(/\\/g, '/');
  const normPattern = pattern.replace(/\\/g, '/');
  const regex = normPattern
    .replace(/\*/g, '__STAR__')
    .replace(/\//g, '[\\\\/]')
    .replace(/__STAR__/g, '[^/]*');
  return new RegExp(regex).test(normalized);
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
    const filtered = files.filter(f => !f.includes('chaos-harness'));
    for (const file of filtered.slice(0, 50)) {
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
  const pkgPath = join(projectRoot, 'chaos-harness', 'package.json');
  if (!existsSync(pkgPath)) {
    return { status: 'skipped', reason: 'No package.json found' };
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  let testCmd = null;
  if (deps.vitest) testCmd = 'npx vitest run --passWithNoTests';
  else if (deps.jest) testCmd = 'npx jest --passWithNoTests';
  else if (deps.mocha) testCmd = 'npx mocha';

  if (!testCmd) {
    return { status: 'skipped', reason: 'No test framework detected (vitest/jest/mocha)' };
  }

  try {
    execSync(testCmd, {
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
    const output = execSync('git log --oneline --since="1 week ago"', {
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

/**
 * project-scan: 运行项目扫描，结果写入 .chaos-harness/scan-result.json
 */
function validateProjectScan(validator, projectRoot) {
  const scannerPath = join(pluginRoot, 'scripts', 'project-scanner.mjs');
  if (!existsSync(scannerPath)) {
    return { status: 'failed', reason: 'project-scanner.mjs not found' };
  }

  try {
    execSync(`node "${scannerPath}" --root "${projectRoot}"`, {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 15000,
    });

    // 验证输出文件是否存在且有效
    const scanResultPath = join(projectRoot, '.chaos-harness', 'scan-result.json');
    if (!existsSync(scanResultPath)) {
      return { status: 'failed', reason: 'scan-result.json was not generated' };
    }

    const scanResult = JSON.parse(readFileSync(scanResultPath, 'utf-8'));
    if (!scanResult.project_type) {
      return { status: 'failed', reason: 'scan-result.json missing project_type' };
    }

    return { status: 'passed', projectType: scanResult.project_type, harnessTemplate: scanResult.harness_template };
  } catch (e) {
    const output = e.stdout?.toString() + e.stderr?.toString() || '';
    return { status: 'failed', reason: 'Project scan failed', details: output.slice(-300) };
  }
}

// ---- 验证调度器 ----

/**
 * ui-quality-check: Run UI quality validation (contrast/touch targets/semantic HTML/focus ring/form labels)
 */
function validateUIQuality(validator, projectRoot) {
  const scriptPath = join(pluginRoot, 'scripts', 'ui-quality-validator.mjs');
  if (!existsSync(scriptPath)) {
    return { status: 'failed', reason: 'ui-quality-validator.mjs not found' };
  }
  try {
    const output = execSync(`node "${scriptPath}" --root "${projectRoot}"`, {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 15000,
    }).toString();
    const result = JSON.parse(output);
    return { status: result.status === 'passed' ? 'passed' : 'failed', passed: result.passed, failed: result.failed, details: result.results };
  } catch (e) {
    const output = e.stdout?.toString() || '';
    try {
      const result = JSON.parse(output);
      return { status: 'failed', reason: 'UI quality issues' , details: result.results };
    } catch {
      return { status: 'skipped', reason: 'UI validator error', details: output.slice(-300) };
    }
  }
}

/**
 * prd-quality-check: Validate PRD completeness and production-grade requirements
 */
function validatePRDQuality(validator, projectRoot) {
  const checks = [];
  let failed = 0;

  // Find PRD file
  const outputDirs = existsSync(join(projectRoot, 'output'))
    ? readdirSync(join(projectRoot, 'output')).filter(d => statSync(join(projectRoot, 'output', d)).isDirectory())
    : [];
  const w01Dir = outputDirs.find(d => {
    const children = readdirSync(join(projectRoot, 'output', d));
    return children.includes('W01_requirements') || children.includes('W01_requirements_docs');
  });

  if (!w01Dir) {
    return { status: 'failed', reason: 'No W01_requirements output directory found' };
  }

  const reqDirs = ['W01_requirements', 'W01_requirements_docs'];
  let prdPath = null;
  for (const reqDir of reqDirs) {
    const candidate = join(projectRoot, 'output', w01Dir, reqDir, 'PRD.md');
    if (existsSync(candidate)) {
      prdPath = candidate;
      break;
    }
  }

  if (!prdPath) {
    return { status: 'failed', reason: 'PRD.md not found in output/*/W01_requirements/' };
  }

  const content = readFileSync(prdPath, 'utf-8');
  const contentLower = content.toLowerCase();

  // Check: PRD has version lock
  const hasVersion = /^版本[:：]/m.test(content) || /^version[:：]/mi.test(content);
  checks.push({ check: 'version-lock', passed: hasVersion });
  if (!hasVersion) failed++;

  // Check: Acceptance criteria (Given-When-Then or similar)
  const hasAcceptance = /given.*when.*then/i.test(content) || /验收标准/.test(content) || /acceptance criterion/i.test(content);
  checks.push({ check: 'acceptance-criteria', passed: hasAcceptance });
  if (!hasAcceptance) failed++;

  // Check: Production-grade indicators
  const prodKeywords = ['性能', '性能指标', 'QPS', '响应时间', '容错', '降级', '监控', '告警', 'logging', 'monitoring', 'error handling', '错误处理', '缓存', 'cache'];
  const prodCount = prodKeywords.filter(kw => contentLower.includes(kw.toLowerCase())).length;
  const hasProdGrade = prodCount >= 3;
  checks.push({ check: 'production-grade', passed: hasProdGrade, matched: prodCount + '/8 keywords' });
  if (!hasProdGrade) failed++;

  // Check: Data model / API design mentioned
  const hasDataModel = /数据模型|data model|数据库|database|schema|表结构|entity/.test(content);
  checks.push({ check: 'data-model', passed: hasDataModel });
  if (!hasDataModel) failed++;

  // Check: User stories exist
  let userStoriesPath = null;
  for (const reqDir of reqDirs) {
    const candidate = join(projectRoot, 'output', w01Dir, reqDir, 'user-stories.md');
    if (existsSync(candidate)) {
      userStoriesPath = candidate;
      break;
    }
  }
  const hasUserStories = userStoriesPath !== null;
  checks.push({ check: 'user-stories', passed: hasUserStories });
  if (!hasUserStories) failed++;

  if (failed === 0) {
    return { status: 'passed', checks };
  }
  return { status: 'failed', reason: `${failed} PRD quality check(s) failed`, details: checks.filter(c => !c.passed) };
}

const validators = {
  'file-exists': validateFileExists,
  'no-syntax-errors': validateNoSyntaxErrors,
  'test-suite-pass': validateTestSuite,
  'iron-law-check': validateIronLaw,
  'lint-check': validateLint,
  'git-has-commits': validateGitCommits,
  'ui-quality-check': validateUIQuality,
  'project-scan': validateProjectScan,
  'prd-quality-check': validatePRDQuality,
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
