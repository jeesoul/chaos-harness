#!/usr/bin/env node
/**
 * coding-convention-extractor — 项目编码规范提取器
 *
 * 从现有代码中自动提取：
 * - 命名规范（类/方法/变量/常量/文件）
 * - 日志规范（框架/格式/级别使用）
 * - 异常处理规范（自定义异常/全局处理）
 * - 注释风格（语言/格式/密度）
 * - 导入规范（排序/分组）
 * - 格式化规范（缩进/行宽/括号风格）
 */

import { readFileSync } from 'node:fs';
import { extname, basename } from 'node:path';

const MAX_SAMPLE_FILES = 30;
const MAX_FILE_SIZE = 50000;

// ---- 命名模式检测 ----

const NAMING_PATTERNS = {
  camelCase: /^[a-z][a-zA-Z0-9]*$/,
  PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
  snake_case: /^[a-z][a-z0-9_]*$/,
  UPPER_SNAKE: /^[A-Z][A-Z0-9_]*$/,
  kebabCase: /^[a-z][a-z0-9-]*$/,
};

function detectNamingPattern(name) {
  for (const [pattern, regex] of Object.entries(NAMING_PATTERNS)) {
    if (regex.test(name)) return pattern;
  }
  return 'other';
}

// ---- Java 规范提取 ----

function extractJavaConventions(content, filePath) {
  const result = { naming: {}, logging: {}, errorHandling: {}, imports: {} };

  // 类名
  const classMatch = content.match(/(?:public|private|protected)?\s*(?:abstract|final)?\s*class\s+(\w+)/g);
  if (classMatch) {
    result.naming.classStyle = 'PascalCase';
  }

  // 方法名
  const methods = content.match(/(?:public|private|protected)\s+\w+\s+(\w+)\s*\(/g);
  if (methods) {
    const methodNames = methods.map(m => m.match(/(\w+)\s*\(/)?.[1]).filter(Boolean);
    const styles = methodNames.map(detectNamingPattern);
    result.naming.methodStyle = mostCommon(styles);
  }

  // 常量
  const constants = content.match(/(?:static\s+final|final\s+static)\s+\w+\s+(\w+)/g);
  if (constants) {
    result.naming.constantStyle = 'UPPER_SNAKE';
  }

  // 日志框架
  if (content.includes('org.slf4j')) result.logging.framework = 'SLF4J';
  else if (content.includes('java.util.logging')) result.logging.framework = 'JUL';
  else if (content.includes('org.apache.log4j')) result.logging.framework = 'Log4j';
  else if (content.includes('org.apache.logging.log4j')) result.logging.framework = 'Log4j2';

  // 日志变量名
  const logVar = content.match(/(?:private\s+static\s+final\s+Logger|Logger)\s+(\w+)/);
  if (logVar) result.logging.variableName = logVar[1];

  // 异常处理
  if (content.includes('throws')) result.errorHandling.usesCheckedExceptions = true;
  if (content.match(/catch\s*\(\s*Exception\s/)) result.errorHandling.catchesGenericException = true;
  const customExceptions = content.match(/class\s+\w+Exception\s+extends/g);
  if (customExceptions) result.errorHandling.hasCustomExceptions = true;

  // 导入分组
  const imports = content.match(/^import\s+.+;$/gm) || [];
  if (imports.length > 0) {
    const hasStaticImports = imports.some(i => i.includes('import static'));
    const groups = new Set(imports.map(i => i.replace(/^import\s+(static\s+)?/, '').split('.')[0]));
    result.imports.hasStaticImports = hasStaticImports;
    result.imports.topLevelGroups = [...groups];
  }

  return result;
}

// ---- JavaScript/TypeScript 规范提取 ----

function extractJsConventions(content, filePath) {
  const result = { naming: {}, logging: {}, errorHandling: {}, imports: {}, formatting: {} };

  // 函数命名
  const funcNames = content.match(/(?:function|const|let|var)\s+(\w+)/g);
  if (funcNames) {
    const names = funcNames.map(f => f.split(/\s+/).pop()).filter(n => n.length > 2);
    const styles = names.map(detectNamingPattern);
    result.naming.functionStyle = mostCommon(styles);
  }

  // 组件命名（React/Vue）
  const components = content.match(/(?:export\s+(?:default\s+)?(?:function|class)\s+)(\w+)/g);
  if (components) {
    result.naming.componentStyle = 'PascalCase';
  }

  // 日志
  if (content.includes('console.log')) result.logging.framework = 'console';
  if (content.includes('winston')) result.logging.framework = 'winston';
  if (content.includes('pino')) result.logging.framework = 'pino';

  // 异常处理
  if (content.match(/catch\s*\(\s*\w*\s*\)/)) result.errorHandling.usesTryCatch = true;
  if (content.includes('.catch(')) result.errorHandling.usesPromiseCatch = true;

  // 导入风格
  const esImports = content.match(/^import\s+/gm) || [];
  const cjsRequires = content.match(/require\s*\(/gm) || [];
  result.imports.style = esImports.length > cjsRequires.length ? 'ESM' : 'CJS';

  // 缩进检测
  const lines = content.split('\n').filter(l => l.match(/^\s+\S/));
  if (lines.length > 0) {
    const indents = lines.map(l => l.match(/^(\s+)/)?.[1] || '');
    const tabCount = indents.filter(i => i.includes('\t')).length;
    const spaceCount = indents.filter(i => !i.includes('\t')).length;
    result.formatting.indentStyle = tabCount > spaceCount ? 'tabs' : 'spaces';
    if (result.formatting.indentStyle === 'spaces') {
      const sizes = indents.filter(i => !i.includes('\t')).map(i => i.length);
      const minIndent = Math.min(...sizes.filter(s => s > 0));
      result.formatting.indentSize = minIndent <= 4 ? minIndent : 2;
    }
  }

  // 分号使用
  const semiLines = content.split('\n').filter(l => l.trim().endsWith(';')).length;
  const totalLines = content.split('\n').filter(l => l.trim().length > 0).length;
  result.formatting.semicolons = semiLines / totalLines > 0.3;

  // 引号风格
  const singleQuotes = (content.match(/'/g) || []).length;
  const doubleQuotes = (content.match(/"/g) || []).length;
  result.formatting.quoteStyle = singleQuotes > doubleQuotes ? 'single' : 'double';

  return result;
}

// ---- Python 规范提取 ----

function extractPythonConventions(content, filePath) {
  const result = { naming: {}, logging: {}, errorHandling: {}, imports: {} };

  // 函数命名
  const funcNames = content.match(/def\s+(\w+)/g);
  if (funcNames) {
    const names = funcNames.map(f => f.replace('def ', '')).filter(n => !n.startsWith('_'));
    const styles = names.map(detectNamingPattern);
    result.naming.functionStyle = mostCommon(styles);
  }

  // 类命名
  const classNames = content.match(/class\s+(\w+)/g);
  if (classNames) {
    result.naming.classStyle = 'PascalCase';
  }

  // 日志
  if (content.includes('import logging')) result.logging.framework = 'logging';
  if (content.includes('from loguru')) result.logging.framework = 'loguru';
  if (content.includes('structlog')) result.logging.framework = 'structlog';

  // 异常处理
  if (content.match(/except\s+Exception/)) result.errorHandling.catchesGenericException = true;
  if (content.match(/raise\s+\w+Error/)) result.errorHandling.raisesCustomErrors = true;

  // 导入风格
  const fromImports = (content.match(/^from\s+/gm) || []).length;
  const directImports = (content.match(/^import\s+/gm) || []).length;
  result.imports.preferFrom = fromImports > directImports;

  // Type hints
  if (content.match(/def\s+\w+\([^)]*:\s*\w+/)) result.naming.usesTypeHints = true;

  return result;
}

// ---- 工具函数 ----

function mostCommon(arr) {
  const counts = {};
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
  }
  let max = 0;
  let result = null;
  for (const [key, count] of Object.entries(counts)) {
    if (count > max) { max = count; result = key; }
  }
  return result;
}

function mergeConventions(conventions) {
  const merged = { naming: {}, logging: {}, errorHandling: {}, imports: {}, formatting: {} };

  for (const conv of conventions) {
    for (const [category, values] of Object.entries(conv)) {
      if (typeof values === 'object' && values !== null) {
        merged[category] = { ...merged[category], ...values };
      }
    }
  }

  return merged;
}

// ---- 主入口 ----

export async function extractConventions(projectRoot, sourceFiles) {
  const conventions = [];
  const sampled = sourceFiles.slice(0, MAX_SAMPLE_FILES);

  for (const file of sampled) {
    const fullPath = `${projectRoot}/${file.path.replace(/\\/g, '/')}`;
    try {
      const content = readFileSync(fullPath, 'utf-8');
      if (content.length > MAX_FILE_SIZE) continue;

      let conv;
      switch (file.lang) {
        case 'java':
          conv = extractJavaConventions(content, file.path);
          break;
        case 'javascript':
        case 'typescript':
          conv = extractJsConventions(content, file.path);
          break;
        case 'python':
          conv = extractPythonConventions(content, file.path);
          break;
        default:
          continue;
      }
      conventions.push(conv);
    } catch {}
  }

  if (conventions.length === 0) {
    return { naming: {}, logging: {}, errorHandling: {}, imports: {}, formatting: {} };
  }

  return mergeConventions(conventions);
}
