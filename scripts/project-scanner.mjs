#!/usr/bin/env node
/**
 * project-scanner — 项目扫描与分析
 * 识别项目类型、技术栈、目录结构、依赖、测试框架、代码质量基线
 *
 * 调用:
 *   node project-scanner.mjs                     # 扫描当前目录
 *   node project-scanner.mjs --root /path/to/proj # 扫描指定目录
 *   node project-scanner.mjs --verbose            # 输出详细报告
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = join(__dirname, '..');

// ---- CLI ----

const args = process.argv.slice(2);
const rootIdx = args.indexOf('--root');
const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : process.cwd();
const verbose = args.includes('--verbose');

// ---- 主扫描流程 ----

const result = scanProject(projectRoot);

// 写入 scan-result.json
const chaosDir = join(projectRoot, '.chaos-harness');
if (!existsSync(chaosDir)) mkdirSync(chaosDir, { recursive: true });
const scanResultPath = join(chaosDir, 'scan-result.json');
writeFileSync(scanResultPath, JSON.stringify(result, null, 2), 'utf-8');

// 同步更新 state.json 的 scan_result
const statePath = join(chaosDir, 'state.json');
if (existsSync(statePath)) {
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));
    state.scan_result = {
      project_type: result.project_type,
      language: result.language,
      framework: result.framework,
      build_tool: result.build_tool,
      test_framework: result.test_framework,
      scanned_at: result.scanned_at,
    };
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch { /* ignore state update errors */ }
}

// 输出结果
if (verbose) {
  console.log(formatVerboseReport(result));
} else {
  console.log(`[project-scanner] Scanned: ${projectRoot}`);
  console.log(`  Type:     ${result.project_type}`);
  console.log(`  Language: ${result.language}`);
  console.log(`  Framework: ${result.framework || '(none)'}`);
  console.log(`  Build:    ${result.build_tool || '(none)'}`);
  console.log(`  Tests:    ${result.test_framework || '(none)'} (${result.test_file_count} files)`);
  console.log(`  Sources:  ${result.source_file_count} files`);
  console.log(`  Template: ${result.harness_template}`);
  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.join('; ')}`);
  }
  console.log(`  Result:   ${scanResultPath}`);
}

// ---- 核心扫描函数 ----

function scanProject(root) {
  const scanned_at = new Date().toISOString();
  const warnings = [];

  // 1. 识别项目类型
  const projectType = detectProjectType(root, warnings);
  const harnessTemplate = resolveHarnessTemplate(projectType);

  // 2. 识别语言和框架
  const { language, framework } = detectLanguageAndFramework(root, projectType, warnings);

  // 3. 识别构建工具
  const buildTool = detectBuildTool(root, projectType);

  // 4. 识别测试框架
  const testFramework = detectTestFramework(root, projectType);

  // 5. 目录结构分析
  const directories = analyzeDirectories(root, projectType);

  // 6. 文件计数
  const { source_file_count, test_file_count, key_files, dependency_count } = analyzeFiles(root, directories, projectType, warnings);

  // 7. 代码质量基线
  const test_coverage_estimate = estimateTestCoverage(test_file_count, source_file_count);

  // 8. CI/CD 检测
  const has_ci = detectCI(root);

  return {
    scanned_at,
    project_root: root,
    project_type: projectType,
    language,
    framework,
    build_tool: buildTool,
    test_framework: testFramework,
    has_ci,
    directories,
    dependency_count,
    source_file_count,
    test_file_count,
    test_coverage_estimate,
    key_files,
    warnings,
    harness_template: harnessTemplate,
  };
}

// ---- 项目类型检测 ----

function detectProjectType(root, warnings) {
  // Java 项目
  if (existsSync(join(root, 'pom.xml'))) {
    try {
      const pom = readFileSync(join(root, 'pom.xml'), 'utf-8');
      if (pom.includes('spring-boot')) return 'java-spring';
      if (pom.includes('javax.') || pom.includes('javaee')) return 'java-spring-legacy';
      return 'java-maven';
    } catch { return 'java-maven'; }
  }

  if (existsSync(join(root, 'build.gradle')) || existsSync(join(root, 'build.gradle.kts'))) {
    try {
      const gradle = readFileSync(join(root, 'build.gradle.kts') || join(root, 'build.gradle'), 'utf-8');
      if (gradle.includes('spring-boot')) return 'java-spring';
      return 'java-gradle';
    } catch { return 'java-gradle'; }
  }

  // Node/JS 项目
  if (existsSync(join(root, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const allKeys = Object.keys(deps).join(' ');

      if (deps.next) return 'next-js';
      if (deps.vue) return deps.vue.startsWith('3') ? 'vue3' : 'vue2';
      if (deps.react) return 'react';
      if (deps.express) return 'node-express';

      // Claude Code 插件检测
      if (pkg.name === 'chaos-harness' || allKeys.includes('anthropic')) return 'typescript-plugin';

      return 'node-generic';
    } catch { return 'node-generic'; }
  }

  // Python 项目
  const hasPyProject = existsSync(join(root, 'pyproject.toml')) || existsSync(join(root, 'setup.py')) || existsSync(join(root, 'setup.cfg'));
  const hasRequirements = existsSync(join(root, 'requirements.txt'));
  if (hasPyProject || hasRequirements) {
    const reqFile = hasRequirements ? 'requirements.txt' : 'pyproject.toml';
    try {
      const content = readFileSync(join(root, reqFile), 'utf-8').toLowerCase();
      if (content.includes('fastapi')) return 'python-fastapi';
      if (content.includes('django')) return 'python-django';
      return 'python-generic';
    } catch { return 'python-generic'; }
  }

  warnings.push('Could not identify project type — falling back to generic');
  return 'unknown';
}

// ---- 语言和框架检测 ----

function detectLanguageAndFramework(root, projectType, warnings) {
  const map = {
    'java-spring':          { language: 'Java',   framework: detectSpringVersion(root) },
    'java-spring-legacy':   { language: 'Java',   framework: 'Spring (legacy)' },
    'java-maven':           { language: 'Java',   framework: null },
    'java-gradle':          { language: 'Java',   framework: null },
    'vue3':                 { language: 'TypeScript/JavaScript', framework: 'Vue 3' },
    'vue2':                 { language: 'JavaScript', framework: 'Vue 2' },
    'react':                { language: 'TypeScript/JavaScript', framework: 'React' },
    'next-js':              { language: 'TypeScript/JavaScript', framework: 'Next.js' },
    'node-express':         { language: 'JavaScript', framework: 'Express' },
    'node-generic':         { language: 'JavaScript', framework: null },
    'python-fastapi':       { language: 'Python',  framework: 'FastAPI' },
    'python-django':        { language: 'Python',  framework: 'Django' },
    'python-generic':       { language: 'Python',  framework: null },
    'typescript-plugin':    { language: 'TypeScript', framework: 'Claude Code Plugin' },
    'unknown':              { language: 'Unknown', framework: null },
  };
  return map[projectType] || { language: 'Unknown', framework: null };
}

function detectSpringVersion(root) {
  const pomPath = join(root, 'pom.xml');
  if (!existsSync(pomPath)) return 'Spring Boot';
  try {
    const pom = readFileSync(pomPath, 'utf-8');
    const match = pom.match(/spring-boot-starter-parent[^>]*>\s*([\d.]+)/);
    if (match) return `Spring Boot ${match[1]}`;
    const verMatch = pom.match(/<spring-boot.version>([^<]+)<\//);
    if (verMatch) return `Spring Boot ${verMatch[1]}`;
    return 'Spring Boot';
  } catch { return 'Spring Boot'; }
}

// ---- 构建工具检测 ----

function detectBuildTool(root, projectType) {
  if (projectType.startsWith('java-')) {
    if (existsSync(join(root, 'pom.xml'))) return 'Maven';
    if (existsSync(join(root, 'build.gradle.kts'))) return 'Gradle (Kotlin DSL)';
    if (existsSync(join(root, 'build.gradle'))) return 'Gradle (Groovy DSL)';
  }
  if (projectType.startsWith('node') || projectType === 'typescript-plugin') {
    if (existsSync(join(root, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(join(root, 'yarn.lock'))) return 'Yarn';
    if (existsSync(join(root, 'package-lock.json'))) return 'npm';
    return 'npm (no lockfile)';
  }
  if (projectType.startsWith('python')) {
    if (existsSync(join(root, 'pyproject.toml'))) {
      if (existsSync(join(root, 'poetry.lock'))) return 'Poetry';
      return 'pip (pyproject.toml)';
    }
    if (existsSync(join(root, 'requirements.txt'))) return 'pip';
    if (existsSync(join(root, 'Pipfile.lock'))) return 'Pipenv';
  }
  return null;
}

// ---- 测试框架检测 ----

function detectTestFramework(root, projectType) {
  if (projectType.startsWith('java')) {
    if (existsSync(join(root, 'src', 'test', 'java'))) {
      try {
        // 检查是否有 JUnit 5 注解
        const testDir = join(root, 'src', 'test', 'java');
        const testFiles = findFilesByExt(testDir, '.java').slice(0, 20);
        for (const f of testFiles) {
          const content = readFileSync(f, 'utf-8');
          if (content.includes('@Test') && content.includes('org.junit.jupiter')) return 'JUnit 5';
          if (content.includes('@Test')) return 'JUnit';
          if (content.includes('org.mockito')) return 'JUnit + Mockito';
        }
      } catch { /* ignore */ }
    }
    if (existsSync(join(root, 'src', 'test'))) return 'JUnit (unconfirmed)';
  }

  if (projectType.startsWith('node') || projectType === 'typescript-plugin') {
    const pkgPath = join(root, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.vitest) return 'Vitest';
        if (deps.jest || deps['ts-jest']) return 'Jest';
        if (deps.mocha) return 'Mocha';
        if (deps.tap) return 'TAP';
      } catch { /* ignore */ }
    }
  }

  if (projectType.startsWith('python')) {
    const hasPytest = checkPythonDependency(root, 'pytest');
    if (hasPytest) return 'pytest';
    const hasUnittest = grepPythonImports(root, 'unittest');
    if (hasUnittest) return 'unittest';
  }

  return null;
}

function checkPythonDependency(root, dep) {
  const files = ['requirements.txt', 'pyproject.toml', 'setup.cfg'];
  for (const f of files) {
    const path = join(root, f);
    if (existsSync(path)) {
      try {
        return readFileSync(path, 'utf-8').toLowerCase().includes(dep.toLowerCase());
      } catch { /* ignore */ }
    }
  }
  return false;
}

function grepPythonImports(root, mod) {
  try {
    const pyFiles = findFilesByExt(join(root, 'tests') || join(root, 'test') || root, '.py').slice(0, 20);
    for (const f of pyFiles) {
      if (readFileSync(f, 'utf-8').includes(`import ${mod}`) || readFileSync(f, 'utf-8').includes(`from ${mod}`)) {
        return true;
      }
    }
  } catch { /* ignore */ }
  return false;
}

// ---- 目录分析 ----

function analyzeDirectories(root, projectType) {
  const dirs = {};

  if (projectType.startsWith('java')) {
    if (existsSync(join(root, 'src', 'main', 'java'))) dirs.source = 'src/main/java';
    if (existsSync(join(root, 'src', 'main', 'resources'))) dirs.resources = 'src/main/resources';
    if (existsSync(join(root, 'src', 'test', 'java'))) dirs.test = 'src/test/java';
  }

  if (projectType.startsWith('node') || projectType === 'typescript-plugin') {
    if (existsSync(join(root, 'src'))) dirs.source = 'src';
    if (existsSync(join(root, 'tests'))) dirs.test = 'tests';
    if (existsSync(join(root, 'test'))) dirs.test = 'test';
    if (existsSync(join(root, '__tests__'))) dirs.test = '__tests__';
    if (existsSync(join(root, 'public'))) dirs.public = 'public';
  }

  if (projectType.startsWith('python')) {
    // 查找 Python 源目录
    const candidates = readdirSync(root).filter(d => {
      try { return statSync(join(root, d)).isDirectory() && !d.startsWith('.') && d !== 'tests' && d !== 'test'; } catch { return false; }
    });
    for (const c of candidates) {
      if (existsSync(join(root, c, '__init__.py'))) { dirs.source = c; break; }
    }
    if (existsSync(join(root, 'tests'))) dirs.test = 'tests';
    if (existsSync(join(root, 'test'))) dirs.test = 'test';
  }

  return dirs;
}

// ---- 文件分析 ----

function analyzeFiles(root, directories, projectType, warnings) {
  const keyFiles = [];
  let sourceFileCount = 0;
  let testFileCount = 0;
  let dependencyCount = 0;

  // 关键文件
  const keyCandidates = [
    'pom.xml', 'build.gradle', 'build.gradle.kts',
    'package.json', 'pyproject.toml', 'requirements.txt', 'setup.py',
    'application.yml', 'application.yaml', 'application.properties',
    'Dockerfile', 'docker-compose.yml', '.gitlab-ci.yml', '.github/workflows',
    'README.md', 'CLAUDE.md', '.eslintrc', 'tsconfig.json',
    'settings.gradle', 'gradle.properties',
  ];
  for (const f of keyCandidates) {
    if (existsSync(join(root, f))) keyFiles.push(f);
  }

  // 依赖计数
  const pkgPath = join(root, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      dependencyCount = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
    } catch { /* ignore */ }
  }

  const pomPath = join(root, 'pom.xml');
  if (existsSync(pomPath)) {
    try {
      const pom = readFileSync(pomPath, 'utf-8');
      const deps = pom.match(/<dependency>/g);
      if (deps) dependencyCount = deps.length;
    } catch { /* ignore */ }
  }

  const reqPath = join(root, 'requirements.txt');
  if (existsSync(reqPath)) {
    try {
      const lines = readFileSync(reqPath, 'utf-8').split('\n').filter(l => l.trim() && !l.startsWith('#'));
      dependencyCount = lines.length;
    } catch { /* ignore */ }
  }

  // 源文件和测试文件计数
  const srcDir = directories.source ? join(root, directories.source) : root;
  const testDir = directories.test ? join(root, directories.test) : null;

  const sourceExts = getSourceExtensions(projectType);
  for (const ext of sourceExts) {
    sourceFileCount += findFilesByExt(srcDir, ext).length;
    if (testDir) testFileCount += findFilesByExt(testDir, ext).length;
  }

  // 特殊测试文件模式
  if (projectType.startsWith('node') || projectType === 'typescript-plugin') {
    testFileCount += findFilesByPattern(root, /(\.test|\.spec)\.[jt]sx?$/).length;
    testFileCount += findFilesByPattern(root, /__tests__\/.*\.[jt]sx?$/).length;
  }

  return { source_file_count: sourceFileCount, test_file_count: testFileCount, key_files: keyFiles, dependency_count: dependencyCount };
}

function getSourceExtensions(projectType) {
  if (projectType.startsWith('java')) return ['.java'];
  if (projectType.startsWith('python')) return ['.py'];
  if (projectType.startsWith('node') || projectType === 'typescript-plugin') return ['.ts', '.js', '.tsx', '.jsx'];
  return ['.java', '.py', '.ts', '.js', '.go', '.rs', '.kt'];
}

function findFilesByExt(dir, ext) {
  const results = [];
  if (!existsSync(dir)) return results;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'target' && entry.name !== 'build' && entry.name !== 'dist') {
        results.push(...findFilesByExt(fullPath, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch { /* skip */ }
  return results;
}

function findFilesByPattern(dir, pattern) {
  const results = [];
  if (!existsSync(dir)) return results;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.git') {
        results.push(...findFilesByPattern(fullPath, pattern));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch { /* skip */ }
  return results;
}

// ---- 代码质量估计 ----

function estimateTestCoverage(testCount, sourceCount) {
  if (sourceCount === 0) return 'unknown';
  const ratio = testCount / sourceCount;
  if (ratio >= 0.5) return 'high';
  if (ratio >= 0.2) return 'medium';
  if (ratio > 0) return 'low';
  return 'none';
}

// ---- CI/CD 检测 ----

function detectCI(root) {
  const ciIndicators = [
    '.github/workflows',
    '.gitlab-ci.yml',
    'Jenkinsfile',
    '.circleci/config.yml',
    'azure-pipelines.yml',
    '.drone.yml',
  ];
  return ciIndicators.some(p => existsSync(join(root, p)));
}

// ---- Harness 模板映射 ----

function resolveHarnessTemplate(projectType) {
  const map = {
    'java-spring': 'java-spring',
    'java-spring-legacy': 'java-spring-legacy',
    'java-maven': 'generic',
    'java-gradle': 'generic',
    'vue3': 'vue3',
    'vue2': 'vue2',
    'react': 'react',
    'next-js': 'react',
    'node-express': 'node-express',
    'node-generic': 'generic',
    'python-fastapi': 'python-fastapi',
    'python-django': 'python-django',
    'python-generic': 'generic',
    'typescript-plugin': 'generic',
    'unknown': 'generic',
  };
  return map[projectType] || 'generic';
}

// ---- 格式化输出 ----

function formatVerboseReport(result) {
  const lines = [
    `===== Project Scan Report =====`,
    ``,
    `Project Root: ${result.project_root}`,
    `Scanned At:   ${result.scanned_at}`,
    ``,
    `Project Type: ${result.project_type}`,
    `Language:     ${result.language}`,
    `Framework:    ${result.framework || '(none)'}`,
    `Build Tool:   ${result.build_tool || '(none)'}`,
    ``,
    `Test Framework: ${result.test_framework || '(none)'}`,
    `Source Files:   ${result.source_file_count}`,
    `Test Files:     ${result.test_file_count}`,
    `Dependencies:   ${result.dependency_count}`,
    `Coverage Est.:  ${result.test_coverage_estimate}`,
    ``,
    `Directories:`,
  ];

  for (const [key, val] of Object.entries(result.directories)) {
    lines.push(`  ${key}: ${val}`);
  }

  lines.push(``, `Key Files:`);
  for (const f of result.key_files) {
    lines.push(`  ${f}`);
  }

  lines.push(``, `CI/CD: ${result.has_ci ? 'Yes' : 'No'}`);
  lines.push(`Harness Template: ${result.harness_template}`);

  if (result.warnings.length > 0) {
    lines.push(``, `Warnings:`);
    for (const w of result.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
  }

  lines.push(``, `Result written to: .chaos-harness/scan-result.json`);
  return lines.join('\n');
}
