#!/usr/bin/env node
/**
 * path-sanity — 安装路径合规性检查
 * v1.4.0 — 解决 Windows 下中文/空格/长路径问题
 *
 * 规则：
 *  - 含非 ASCII：error（Windows 下 child_process 调用易乱码）
 *  - 含空格：warning（Git 路径含空格本身没问题，但部分工具不友好）
 *  - 路径长度 > 200：warning（Windows MAX_PATH 风险）
 *  - 以 `~` 开头：error（未展开的 home 占位）
 *
 * 用法：
 *   node path-sanity.mjs check <path>
 *   node path-sanity.mjs check-cwd
 *
 * 返回：
 *   exit 0：通过（可能有 warning）
 *   exit 1：发现 error
 */

import { resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_PATH_LEN = 200;

/**
 * 检查路径合规性
 * @returns {Object} {ok, errors, warnings, normalized}
 */
export function checkPath(input) {
  const result = { ok: true, errors: [], warnings: [], normalized: '' };

  if (!input || typeof input !== 'string') {
    result.ok = false;
    result.errors.push({ code: 'EMPTY_PATH', msg: 'Path is empty or invalid' });
    return result;
  }

  if (input.startsWith('~')) {
    result.ok = false;
    result.errors.push({
      code: 'UNEXPANDED_HOME',
      msg: 'Path starts with "~" but is not expanded. Use $HOME or absolute path.',
    });
    return result;
  }

  let abs;
  try {
    abs = resolve(input);
    result.normalized = normalize(abs);
  } catch (e) {
    result.ok = false;
    result.errors.push({ code: 'RESOLVE_FAILED', msg: e.message });
    return result;
  }

  if (/[^\x00-\x7F]/.test(abs)) {
    result.ok = false;
    const offending = [...abs].filter(c => c.charCodeAt(0) > 127).slice(0, 5).join('');
    result.errors.push({
      code: 'NON_ASCII',
      msg: `Path contains non-ASCII characters ("${offending}..."). Windows child_process calls may corrupt encoding. Move chaos-harness to an ASCII-only path.`,
    });
  }

  if (/\s/.test(abs)) {
    result.warnings.push({
      code: 'CONTAINS_WHITESPACE',
      msg: `Path contains whitespace. Ensure shell commands quote it properly.`,
    });
  }

  if (abs.length > MAX_PATH_LEN) {
    result.warnings.push({
      code: 'PATH_TOO_LONG',
      msg: `Path length ${abs.length} > ${MAX_PATH_LEN}. Windows MAX_PATH (260) risk. Consider moving to a shorter path.`,
    });
  }

  if (process.platform === 'win32' && /[<>:"|?*]/.test(input.replace(/^[A-Z]:/i, ''))) {
    result.ok = false;
    result.errors.push({
      code: 'INVALID_WIN_CHARS',
      msg: 'Path contains characters invalid on Windows (<>:"|?*)',
    });
  }

  return result;
}

/**
 * 格式化输出检查结果
 */
export function formatReport(report, label = 'Path') {
  const lines = [];
  lines.push(`\n[path-sanity] ${label}: ${report.normalized || '(unresolved)'}`);

  if (report.errors.length === 0 && report.warnings.length === 0) {
    lines.push('  ✓ OK');
  }

  for (const e of report.errors) {
    lines.push(`  ✗ ERROR [${e.code}]: ${e.msg}`);
  }
  for (const w of report.warnings) {
    lines.push(`  ⚠ WARN  [${w.code}]: ${w.msg}`);
  }

  return lines.join('\n');
}

function main() {
  const [, , cmd, arg] = process.argv;

  let target;
  if (cmd === 'check-cwd' || !cmd) {
    target = process.cwd();
  } else if (cmd === 'check') {
    if (!arg) {
      console.error('Usage: path-sanity check <path>');
      process.exit(2);
    }
    target = arg;
  } else {
    console.error(`Unknown command: ${cmd}`);
    console.error('Usage: path-sanity {check <path>|check-cwd}');
    process.exit(2);
  }

  const report = checkPath(target);
  console.log(formatReport(report, target));
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
