#!/usr/bin/env node
/**
 * project-knowledge-engine — 项目知识图谱核心引擎
 *
 * 职责：
 * 1. 编排各分析器（规范提取、依赖约束、数据模型）
 * 2. 生成/更新统一的项目知识图谱
 * 3. 提供查询接口供其他模块使用
 *
 * 调用:
 *   node project-knowledge-engine.mjs --scan          # 全量扫描生成知识图谱
 *   node project-knowledge-engine.mjs --update        # 增量更新
 *   node project-knowledge-engine.mjs --query <key>   # 查询知识图谱
 *   node project-knowledge-engine.mjs --report        # 生成分析报告
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';
import { resolveProjectRoot } from './path-utils.mjs';
import { readJson, writeJsonAtomic, ensureDir, utcTimestamp } from './hook-utils.mjs';

const KNOWLEDGE_VERSION = '1.0.0';

// ---- 知识图谱路径 ----

export function getKnowledgePaths(projectRoot) {
  const dir = join(projectRoot, '.chaos-harness');
  return {
    knowledge: join(dir, 'project-knowledge.json'),
    report: join(dir, 'knowledge-report.md'),
  };
}

// ---- 空知识图谱模板 ----

function createEmptyKnowledge(projectRoot) {
  return {
    version: KNOWLEDGE_VERSION,
    projectRoot,
    lastUpdated: utcTimestamp(),
    layers: {
      code: { modules: [], languages: {}, sourceFiles: 0, testFiles: 0, entryPoints: [], testCoverage: {} },
      convention: { naming: {}, logging: {}, errorHandling: {}, imports: {}, formatting: {} },
      dependencies: { external: [], constraints: [] },
      data: { entities: [], relationships: [] },
    },
  };
}

// ---- 文件遍历 ----

const LANG_EXTENSIONS = {
  java: ['.java'],
  javascript: ['.js', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx'],
  python: ['.py'],
  vue: ['.vue'],
  kotlin: ['.kt', '.kts'],
  go: ['.go'],
  rust: ['.rs'],
};

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'target',
  '.chaos-harness', 'graphify-out', '.idea', '.vscode',
  '__pycache__', '.gradle', '.mvn', 'vendor', 'out',
]);

function walkDir(dir, maxDepth = 10, depth = 0) {
  if (depth > maxDepth) return [];
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.') && entry.isDirectory()) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(fullPath, maxDepth, depth + 1));
      } else {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

function detectLanguage(filePath) {
  const ext = extname(filePath).toLowerCase();
  for (const [lang, exts] of Object.entries(LANG_EXTENSIONS)) {
    if (exts.includes(ext)) return lang;
  }
  return null;
}

function isTestFile(filePath) {
  const name = basename(filePath).toLowerCase();
  const normalized = filePath.replace(/\\/g, '/');
  return name.includes('test') || name.includes('spec') ||
    normalized.includes('/test/') || normalized.includes('/tests/') ||
    normalized.includes('/__tests__/') || normalized.includes('/src/test/');
}

// ---- 代码层分析 ----

function analyzeCodeLayer(projectRoot) {
  const allFiles = walkDir(projectRoot);
  const srcFiles = [];
  const tstFiles = [];
  const langStats = {};
  const modules = new Map();

  for (const file of allFiles) {
    const lang = detectLanguage(file);
    if (!lang) continue;
    langStats[lang] = (langStats[lang] || 0) + 1;
    const relPath = relative(projectRoot, file).replace(/\\/g, '/');

    if (isTestFile(file)) {
      tstFiles.push(relPath);
    } else {
      srcFiles.push(relPath);
    }

    const parts = relPath.split('/');
    if (parts.length > 1) {
      const moduleName = parts[0];
      if (!modules.has(moduleName)) {
        modules.set(moduleName, { name: moduleName, files: 0, languages: new Set() });
      }
      const mod = modules.get(moduleName);
      mod.files++;
      mod.languages.add(lang);
    }
  }

  const entryPoints = srcFiles.filter(f => {
    const name = basename(f).toLowerCase();
    return name.includes('controller') || name.includes('router') ||
      name.includes('main') || name.includes('app') ||
      name.includes('index') || name.includes('server');
  }).slice(0, 20);

  return {
    modules: [...modules.values()].map(m => ({
      name: m.name, files: m.files, languages: [...m.languages],
    })),
    sourceFiles: srcFiles.length,
    testFiles: tstFiles.length,
    languages: langStats,
    entryPoints,
    sourceFileList: srcFiles,
    testCoverage: {
      ratio: srcFiles.length > 0 ? tstFiles.length / srcFiles.length : 0,
      testFiles: tstFiles.length,
      sourceFiles: srcFiles.length,
    },
  };
}

// ---- 依赖层分析 ----

function analyzeDependencies(projectRoot) {
  const deps = { external: [], constraints: [] };

  // Maven
  const pomPath = join(projectRoot, 'pom.xml');
  if (existsSync(pomPath)) {
    try {
      const pom = readFileSync(pomPath, 'utf-8');
      for (const m of pom.matchAll(/<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>(?:\s*<version>([^<]*)<\/version>)?/g)) {
        deps.external.push({ name: `${m[1]}:${m[2]}`, version: m[3] || 'managed', type: 'maven' });
      }
      const jv = pom.match(/<java\.version>([^<]+)<\/java\.version>/);
      if (jv) deps.constraints.push({ type: 'java-version', value: jv[1] });
      const sv = pom.match(/<parent>[\s\S]*?<version>([^<]+)<\/version>[\s\S]*?<\/parent>/);
      if (sv) deps.constraints.push({ type: 'spring-boot-version', value: sv[1] });
    } catch {}
  }

  // Gradle
  for (const gf of ['build.gradle', 'build.gradle.kts']) {
    const gp = join(projectRoot, gf);
    if (existsSync(gp)) {
      try {
        const g = readFileSync(gp, 'utf-8');
        for (const m of g.matchAll(/implementation\s*[("']([^"')]+)[)"']/g)) {
          deps.external.push({ name: m[1], version: 'gradle', type: 'gradle' });
        }
      } catch {}
    }
  }

  // Node.js
  const pkgPath = join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = readJson(pkgPath, {});
      for (const [n, v] of Object.entries(pkg.dependencies || {})) {
        deps.external.push({ name: n, version: v, type: 'npm' });
      }
      for (const [n, v] of Object.entries(pkg.devDependencies || {})) {
        deps.external.push({ name: n, version: v, type: 'npm-dev' });
      }
      if (pkg.engines) {
        for (const [e, v] of Object.entries(pkg.engines)) {
          deps.constraints.push({ type: `engine-${e}`, value: v });
        }
      }
    } catch {}
  }

  // Python
  const reqPath = join(projectRoot, 'requirements.txt');
  if (existsSync(reqPath)) {
    try {
      for (const line of readFileSync(reqPath, 'utf-8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const m = t.match(/^([a-zA-Z0-9_-]+)([><=!~]+.+)?$/);
        if (m) deps.external.push({ name: m[1], version: m[2] || '*', type: 'pip' });
      }
    } catch {}
  }

  return deps;
}

// ---- 数据模型分析 ----

function analyzeDataModels(projectRoot, sourceFileList) {
  const entities = [];
  const relationships = [];

  for (const relPath of sourceFileList.slice(0, 100)) {
    const fullPath = join(projectRoot, relPath);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      if (content.length > 100000) continue;

      // JPA Entity
      if (content.includes('@Entity') || content.includes('@Table')) {
        const className = content.match(/class\s+(\w+)/)?.[1];
        const tableName = content.match(/@Table\s*\(\s*name\s*=\s*"([^"]+)"/)?.[1];
        if (className) {
          const fields = [];
          for (const m of content.matchAll(/@Column[^)]*\)\s*(?:private|protected)\s+(\w+)\s+(\w+)/g)) {
            fields.push({ type: m[1], name: m[2] });
          }
          entities.push({ name: className, table: tableName || className, fields, file: relPath });

          // 关联关系
          for (const m of content.matchAll(/@(OneToMany|ManyToOne|OneToOne|ManyToMany)[^)]*\)\s*(?:private|protected)\s+\w+(?:<(\w+)>)?\s+(\w+)/g)) {
            relationships.push({ from: className, to: m[2] || m[3], type: m[1] });
          }
        }
      }

      // Django Model
      if (content.includes('models.Model')) {
        const className = content.match(/class\s+(\w+)\s*\(\s*models\.Model\s*\)/)?.[1];
        if (className) {
          entities.push({ name: className, file: relPath, fields: [] });
          for (const m of content.matchAll(/(\w+)\s*=\s*models\.ForeignKey\s*\(\s*['"]?(\w+)/g)) {
            relationships.push({ from: className, to: m[2], type: 'ForeignKey' });
          }
        }
      }

      // SQLAlchemy
      if (content.includes('__tablename__')) {
        const className = content.match(/class\s+(\w+)/)?.[1];
        const tableName = content.match(/__tablename__\s*=\s*['"](\w+)['"]/)?.[1];
        if (className) {
          entities.push({ name: className, table: tableName, file: relPath, fields: [] });
        }
      }
    } catch {}
  }

  return { entities, relationships };
}

// ---- 主流程 ----

export function scanProject(projectRoot) {
  const knowledge = createEmptyKnowledge(projectRoot);
  const paths = getKnowledgePaths(projectRoot);

  const codeResult = analyzeCodeLayer(projectRoot);
  knowledge.layers.code = {
    modules: codeResult.modules,
    sourceFiles: codeResult.sourceFiles,
    testFiles: codeResult.testFiles,
    languages: codeResult.languages,
    entryPoints: codeResult.entryPoints,
    testCoverage: codeResult.testCoverage,
  };

  knowledge.layers.dependencies = analyzeDependencies(projectRoot);
  knowledge.layers.data = analyzeDataModels(projectRoot, codeResult.sourceFileList);
  knowledge.layers.convention = { naming: {}, logging: {}, errorHandling: {}, imports: {}, formatting: {} };

  ensureDir(join(projectRoot, '.chaos-harness'));
  writeJsonAtomic(paths.knowledge, knowledge);
  return knowledge;
}

export function loadKnowledge(projectRoot) {
  const paths = getKnowledgePaths(projectRoot);
  if (!existsSync(paths.knowledge)) return null;
  return readJson(paths.knowledge, null);
}

export function queryKnowledge(projectRoot, key) {
  const knowledge = loadKnowledge(projectRoot);
  if (!knowledge) return null;
  const parts = key.split('.');
  let current = knowledge;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return null;
    current = current[part] || current.layers?.[part];
  }
  return current;
}

export function generateReport(projectRoot) {
  const knowledge = loadKnowledge(projectRoot);
  if (!knowledge) return null;

  const code = knowledge.layers.code;
  const deps = knowledge.layers.dependencies || {};
  const data = knowledge.layers.data || {};

  const lines = [
    '# 项目知识图谱报告', '',
    `> 生成时间: ${knowledge.lastUpdated}`, '',
    '## 代码结构', '',
    '| 指标 | 值 |', '|------|-----|',
    `| 源文件数 | ${code.sourceFiles} |`,
    `| 测试文件数 | ${code.testFiles} |`,
    `| 测试覆盖率 | ${(code.testCoverage.ratio * 100).toFixed(1)}% |`,
    `| 模块数 | ${code.modules?.length || 0} |`,
    `| 入口点数 | ${code.entryPoints?.length || 0} |`,
    '', '### 语言分布', '',
  ];

  for (const [lang, count] of Object.entries(code.languages || {})) {
    lines.push(`- ${lang}: ${count} 文件`);
  }

  if (code.modules?.length > 0) {
    lines.push('', '### 模块', '', '| 模块 | 文件数 | 语言 |', '|------|--------|------|');
    for (const mod of code.modules.slice(0, 20)) {
      lines.push(`| ${mod.name} | ${mod.files} | ${mod.languages.join(', ')} |`);
    }
  }

  if (deps.external?.length > 0) {
    lines.push('', '## 外部依赖', '', '| 依赖 | 版本 | 类型 |', '|------|------|------|');
    for (const dep of deps.external.slice(0, 30)) {
      lines.push(`| ${dep.name} | ${dep.version} | ${dep.type} |`);
    }
  }

  if (deps.constraints?.length > 0) {
    lines.push('', '## 约束条件', '', '| 类型 | 值 |', '|------|-----|');
    for (const c of deps.constraints) lines.push(`| ${c.type} | ${c.value} |`);
  }

  if (data.entities?.length > 0) {
    lines.push('', '## 数据模型', '', '| 实体 | 表名 | 字段数 |', '|------|------|--------|');
    for (const e of data.entities.slice(0, 20)) {
      lines.push(`| ${e.name} | ${e.table || '-'} | ${e.fields?.length || 0} |`);
    }
  }

  const report = lines.join('\n');
  const paths = getKnowledgePaths(projectRoot);
  writeFileSync(paths.report, report, 'utf-8');
  return report;
}

// ---- CLI ----

const args = process.argv.slice(2);
if (args.length === 0) process.exit(0);

const projectRoot = resolveProjectRoot();
if (!projectRoot) {
  console.log('[Knowledge Engine] 未检测到项目根目录，跳过');
  process.exit(0);
}

if (args.includes('--scan') || args.includes('--update')) {
  console.log('[Knowledge Engine] 正在扫描项目...');
  const knowledge = scanProject(projectRoot);
  generateReport(projectRoot);
  console.log(`[Knowledge Engine] 扫描完成`);
  console.log(`  源文件: ${knowledge.layers.code.sourceFiles}`);
  console.log(`  测试文件: ${knowledge.layers.code.testFiles}`);
  console.log(`  模块: ${knowledge.layers.code.modules?.length || 0}`);
  console.log(`  外部依赖: ${knowledge.layers.dependencies?.external?.length || 0}`);
  console.log(`  数据实体: ${knowledge.layers.data?.entities?.length || 0}`);
} else if (args.includes('--query')) {
  const keyIdx = args.indexOf('--query') + 1;
  const key = args[keyIdx];
  if (!key) { console.error('用法: --query <key>'); process.exit(1); }
  const result = queryKnowledge(projectRoot, key);
  if (result) console.log(JSON.stringify(result, null, 2));
  else console.log(`未找到: ${key}`);
} else if (args.includes('--report')) {
  const report = generateReport(projectRoot);
  if (report) console.log(report);
  else console.log('[Knowledge Engine] 知识图谱不存在，请先运行 --scan');
}
