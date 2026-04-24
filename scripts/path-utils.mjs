#!/usr/bin/env node
/**
 * path-utils — 跨平台路径工具层
 * 解决 Windows/Mac/Linux 路径差异问题
 */

import { dirname, join, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 从 import.meta.url 推导插件根目录
 * 不依赖环境变量，从 scripts/ 目录向上查找
 */
export function resolvePluginRoot() {
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
 * 判断目录是否是插件根目录（有 scripts/ + data/ 特征）
 */
function isPluginRoot(dir) {
  try {
    return existsSync(join(dir, 'scripts')) && existsSync(join(dir, 'data'));
  } catch {
    return false;
  }
}

/**
 * 可靠的项目根目录检测（查找 .chaos-harness/state.json）
 * 跳过插件根目录，返回真实用户项目路径
 */
export function resolveProjectRoot(startDir = process.cwd()) {
  let dir = resolve(startDir);
  for (let depth = 0; depth < 20; depth++) {
    if (existsSync(join(dir, '.chaos-harness', 'state.json')) && !isPluginRoot(dir)) {
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
