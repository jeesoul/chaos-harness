#!/usr/bin/env node
/**
 * path-utils — 跨平台路径工具层
 * 解决 Windows/Mac/Linux 路径差异问题
 */

import { dirname, join, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

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
 * 判断目录是否是 chaos-harness 插件根目录
 * 通过 package.json name 字段判断，比目录特征更可靠
 */
function isPluginRoot(dir) {
  try {
    const pkgPath = join(dir, 'package.json');
    if (!existsSync(pkgPath)) return false;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.name === 'chaos-harness';
  } catch {
    return false;
  }
}

/**
 * 可靠的项目根目录检测（查找 .chaos-harness/state.json）
 * 优先级：显式参数 > CHAOS_PROJECT_ROOT 环境变量 > 向上遍历查找
 * 跳过 chaos-harness 插件自身目录，返回真实用户项目路径
 */
export function resolveProjectRoot(startDir = null) {
  // 1. 显式传入路径
  if (startDir) {
    const dir = resolve(startDir);
    if (existsSync(join(dir, '.chaos-harness', 'state.json'))) return dir;
    // 传入路径没有 state.json 也接受（用于新项目初始化场景）
    if (existsSync(dir)) return dir;
  }

  // 2. 环境变量
  const envRoot = process.env.CHAOS_PROJECT_ROOT;
  if (envRoot) {
    const dir = resolve(envRoot);
    if (existsSync(dir)) return dir;
  }

  // 3. 向上遍历查找 .chaos-harness/state.json，跳过插件自身
  let dir = resolve(process.cwd());
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
