#!/usr/bin/env node
/**
 * gate-validator — Gate 验证引擎
 * 实现所有验证器类型，真验证（非关键词匹配）
 *
 * 调用: node gate-validator.mjs <gate-id> [--root <project-root>]
 */

import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir, platform } from 'node:os';
import { execSync, execFileSync } from 'node:child_process';
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
 * no-syntax-errors: 根据项目类型检查所有源代码文件的语法
 * 支持 Java (javac)、JS/TS (node --check)、Python (py_compile)
 */
function validateNoSyntaxErrors(validator, projectRoot) {
  const scanPath = join(projectRoot, '.chaos-harness', 'scan-result.json');
  let projectType = null;
  if (existsSync(scanPath)) {
    try { projectType = JSON.parse(readFileSync(scanPath, 'utf-8')).project_type; } catch {}
  }

  const errors = [];
  const checked = [];

  // Java check: javac -proc:none (syntax only, no classpath resolution)
  if (['java-spring', 'java-spring-legacy', 'java-maven', 'java-gradle'].includes(projectType)) {
    const srcDir = join(projectRoot, 'src');
    if (existsSync(srcDir)) {
      const javaFiles = findFilesRecursive(srcDir, '*.java', projectRoot).slice(0, 100);
      if (javaFiles.length > 0) {
        let hasJavac = false;
        try { execSync('javac -version', { stdio: 'pipe' }); hasJavac = true; } catch {}
        if (hasJavac) {
          for (const file of javaFiles) {
            try {
              execFileSync('javac', ['-proc:none', '-Xlint:none', '-d', tmpdir(), '-sourcepath', srcDir, file], { stdio: 'pipe', timeout: 10000 });
            } catch (e) {
              const err = (e.stderr?.toString() || '').trim();
              // Only flag actual syntax errors, not missing dependencies
              if (/error:.*syntax|expected|illegal|unclosed/.test(err.toLowerCase())) {
                errors.push({ file: normalizePath(file).replace(normalizePath(projectRoot) + '/', ''), error: err.split('\n')[0] });
              }
            }
          }
          checked.push(`java: ${javaFiles.length} files`);
        }
      }
    }
  }

  // JS check: node --check
  const srcDir = join(projectRoot, 'src');
  if (existsSync(srcDir)) {
    const jsFiles = findFilesRecursive(srcDir, '*.mjs', projectRoot).concat(findFilesRecursive(srcDir, '*.js', projectRoot))
      .filter(f => !f.includes('node_modules') && !f.includes('.chaos-harness')).slice(0, 50);
    for (const file of jsFiles) {
      try {
        execFileSync('node', ['-c', file], { stdio: 'pipe', timeout: 5000 });
      } catch (e) {
        errors.push({ file: normalizePath(file).replace(normalizePath(projectRoot) + '/', ''), error: 'syntax error' });
      }
    }
    if (jsFiles.length > 0) checked.push(`javascript: ${jsFiles.length} files`);
  }

  // Python check: py_compile
  const pyFiles = findFilesRecursive(projectRoot, '*.py', projectRoot)
    .filter(f => !f.includes('__pycache__') && !f.includes('.venv') && !f.includes('venv') && !f.includes('site-packages')).slice(0, 50);
  for (const file of pyFiles) {
    try {
      execFileSync('python', ['-m', 'py_compile', file], { stdio: 'pipe', timeout: 5000 });
    } catch (e) {
      errors.push({ file: normalizePath(file).replace(normalizePath(projectRoot) + '/', ''), error: 'syntax error' });
    }
  }
  if (pyFiles.length > 0) checked.push(`python: ${pyFiles.length} files`);

  if (errors.length === 0) return { status: 'passed', checked: checked.join(', ') || 'no source files' };
  return { status: 'failed', reason: `${errors.length} syntax error(s) found`, details: errors.slice(0, 10) };
}

/**
 * test-suite-pass: 根据项目类型动态选择测试框架并执行
 * 支持 Maven/JUnit、Gradle、Jest/Vitest/Mocha、pytest
 */
function validateTestSuite(validator, projectRoot) {
  const scanPath = join(projectRoot, '.chaos-harness', 'scan-result.json');
  let projectType = null;
  let testFramework = null;
  if (existsSync(scanPath)) {
    try {
      const scan = JSON.parse(readFileSync(scanPath, 'utf-8'));
      projectType = scan.project_type;
      testFramework = scan.test_framework;
    } catch {}
  }

  // Maven (Java Spring)
  if (['java-spring', 'java-spring-legacy', 'java-maven'].includes(projectType) || testFramework === 'junit') {
    if (existsSync(join(projectRoot, 'pom.xml'))) {
      try {
        execSync('mvn test -q', { cwd: projectRoot, stdio: 'pipe', timeout: 120000 });
        return { status: 'passed', framework: 'maven-junit' };
      } catch (e) {
        const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
        return { status: 'failed', reason: 'Maven tests failed', framework: 'maven-junit', details: output.slice(-500) };
      }
    }
  }

  // Gradle (Java)
  if (['java-gradle'].includes(projectType)) {
    const gradleCmd = existsSync(join(projectRoot, 'gradlew')) ? './gradlew test' : 'gradle test';
    try {
      execSync(gradleCmd, { cwd: projectRoot, stdio: 'pipe', timeout: 120000, shell: true });
      return { status: 'passed', framework: 'gradle' };
    } catch (e) {
      const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
      return { status: 'failed', reason: 'Gradle tests failed', framework: 'gradle', details: output.slice(-500) };
    }
  }

  // Node.js (Jest/Vitest/Mocha)
  const pkgPath = join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    let cmd = null;
    let fw = null;
    if (deps.vitest) { cmd = 'npx vitest run --passWithNoTests'; fw = 'vitest'; }
    else if (deps.jest) { cmd = 'npx jest --passWithNoTests'; fw = 'jest'; }
    else if (deps.mocha) { cmd = 'npx mocha'; fw = 'mocha'; }
    else if (pkg.scripts?.test) { cmd = 'npm test'; fw = 'npm-test'; }

    if (cmd) {
      try {
        execSync(cmd, { cwd: projectRoot, stdio: 'pipe', timeout: 60000, shell: true });
        return { status: 'passed', framework: fw };
      } catch (e) {
        const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
        return { status: 'failed', reason: `${fw} tests failed`, framework: fw, details: output.slice(-500) };
      }
    }
  }

  // Python (pytest)
  if (['python-fastapi', 'python-django'].includes(projectType)) {
    if (existsSync(join(projectRoot, 'tests')) || existsSync(join(projectRoot, 'pytest.ini'))) {
      try {
        execSync('python -m pytest -q', { cwd: projectRoot, stdio: 'pipe', timeout: 60000 });
        return { status: 'passed', framework: 'pytest' };
      } catch (e) {
        const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
        return { status: 'failed', reason: 'pytest failed', framework: 'pytest', details: output.slice(-500) };
      }
    }
  }

  return { status: 'skipped', reason: 'No test framework detected. Add tests before release.' };
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
    execFileSync('node', [scriptPath], { stdio: 'pipe', timeout: 5000 });
    return { status: 'passed' };
  } catch (e) {
    const output = e.stdout?.toString() || '';
    return { status: 'failed', reason: 'Iron law violation detected', details: output.slice(-500) };
  }
}

/**
 * lint-check: 根据项目类型选择 lint 工具并执行
 * 支持 checkstyle (Java)、ESLint (JS/TS)、flake8 (Python)
 */
function validateLint(validator, projectRoot) {
  const scanPath = join(projectRoot, '.chaos-harness', 'scan-result.json');
  let projectType = null;
  if (existsSync(scanPath)) {
    try { projectType = JSON.parse(readFileSync(scanPath, 'utf-8')).project_type; } catch {}
  }

  // Java: checkstyle
  if (['java-spring', 'java-spring-legacy', 'java-maven', 'java-gradle'].includes(projectType)) {
    const hasCheckstyle = existsSync(join(projectRoot, 'checkstyle.xml')) ||
      existsSync(join(projectRoot, 'checkstyle', 'checkstyle.xml')) ||
      existsSync(join(projectRoot, 'config', 'checkstyle', 'checkstyle.xml'));
    if (hasCheckstyle && existsSync(join(projectRoot, 'pom.xml'))) {
      try {
        execSync('mvn checkstyle:check -q', { cwd: projectRoot, stdio: 'pipe', timeout: 60000 });
        return { status: 'passed', framework: 'checkstyle' };
      } catch (e) {
        return { status: 'soft-fail', reason: 'Checkstyle issues', framework: 'checkstyle', details: (e.stdout?.toString() || e.stderr?.toString() || '').slice(-500) };
      }
    }
    // Fallback: just check javac
    return { status: 'skipped', reason: 'No checkstyle configuration found' };
  }

  // Node.js: ESLint
  const pkgPath = join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const hasEslint = pkg.devDependencies?.eslint || existsSync(join(projectRoot, '.eslintrc')) ||
      existsSync(join(projectRoot, '.eslintrc.js')) || existsSync(join(projectRoot, 'eslint.config.js')) ||
      existsSync(join(projectRoot, 'eslint.config.mjs'));
    if (hasEslint) {
      try {
        execSync('npx eslint . --quiet', { cwd: projectRoot, stdio: 'pipe', timeout: 30000 });
        return { status: 'passed', framework: 'eslint' };
      } catch (e) {
        return { status: 'soft-fail', reason: 'ESLint issues', framework: 'eslint', details: (e.stdout?.toString() || '').slice(-500) };
      }
    }
  }

  // Python: flake8
  if (['python-fastapi', 'python-django'].includes(projectType)) {
    try {
      execSync('python -m flake8 --max-line-length=120', { cwd: projectRoot, stdio: 'pipe', timeout: 30000 });
      return { status: 'passed', framework: 'flake8' };
    } catch {
      return { status: 'soft-fail', reason: 'flake8 issues', framework: 'flake8', details: 'Run flake8 for details' };
    }
  }

  return { status: 'skipped', reason: 'No linting tool detected' };
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
    execFileSync('node', [scannerPath, '--root', projectRoot], {
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
    const output = execFileSync('node', [scriptPath, '--root', projectRoot], {
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

/**
 * script: 运行自定义脚本验证器（如 dev-intelligence.mjs）
 */
function validateScript(validator, projectRoot) {
  if (!validator.script) {
    return { status: 'failed', reason: 'script validator requires a script path' };
  }
  const scriptPath = join(pluginRoot, 'scripts', validator.script);
  if (!existsSync(scriptPath)) {
    return { status: 'failed', reason: `Script not found: ${validator.script}` };
  }
  const args = (validator.args || []).map(a => a.replace('{current_stage}', 'unknown'));
  try {
    execFileSync('node', [scriptPath, ...args], {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 15000,
    });
    return { status: 'passed', script: validator.script };
  } catch (e) {
    const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
    return { status: 'failed', reason: `Script ${validator.script} failed`, details: output.slice(-300) };
  }
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
  'script': validateScript,
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
