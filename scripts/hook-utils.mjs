/**
 * Chaos Harness — Hook 共享工具函数
 * 零依赖 Node.js ES 模块，跨平台兼容
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- 路径常量 ----

export const GLOBAL_DATA_DIR = join(homedir(), '.claude', 'harness');

// ---- 插件根目录检测（解决 CLAUDE_PLUGIN_ROOT 路径解析错误） ----

/**
 * 可靠的插件根目录检测。
 *
 * 问题：某些 Windows 环境下 CLAUDE_PLUGIN_ROOT 会被错误解析为
 * 如 C:\c\Users\xydong18\chaos-harness-main\ 而不是 C:\Users\xydong18\chaos-harness-main\
 *
 * 解决策略：
 *   1. 优先使用 CLAUDE_PLUGIN_ROOT（如果路径存在）
 *   2. 否则基于当前脚本 __dirname 向上查找 plugin.json
 *   3. 兜底返回 __dirname 的父目录
 */
export function detectPluginRoot() {
  const envRoot = process.env.CLAUDE_PLUGIN_ROOT;

  // 1. 环境变量有效 — 路径确实存在
  if (envRoot && existsSync(envRoot)) {
    return envRoot;
  }

  // 2. 基于 __dirname 向上查找 .claude-plugin/plugin.json
  let dir = __dirname;
  for (let depth = 0; depth < 10; depth++) {
    if (existsSync(join(dir, '.claude-plugin', 'plugin.json')) ||
        existsSync(join(dir, '.claude-plugin', 'marketplace.json'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // 3. 兜底：scripts 目录的父目录
  return dirname(__dirname);
}

// ---- 文件操作 ----

/** 确保目录存在 */
export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** 安全读取 JSON 文件，不存在返回默认值 */
export function readJson(filePath, fallback = []) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

/** 安全写入 JSON 文件（原子写入，避免损坏） */
export function writeJson(filePath, data) {
  const content = JSON.stringify(data, null, 2);
  writeFileSync(filePath, content, 'utf-8');
}

/** 原子写入 JSON（先写 .tmp 文件，再 rename） */
export function writeJsonAtomic(filePath, data) {
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  const content = JSON.stringify(data, null, 2);
  writeFileSync(tmpPath, content, 'utf-8');
  renameSync(tmpPath, filePath);
}

/** 计算文件的 SHA-256 哈希 */
export function computeFileHash(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, 'utf-8');
    return 'sha256:' + createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

/** 批量计算文件哈希（用于 Gate 缓存） */
export function computeHashes(filePaths) {
  const result = {};
  for (const fp of filePaths) {
    result[fp] = computeFileHash(fp);
  }
  return result;
}

/** 追加日志条目到 JSON 数组文件 */
export function appendLog(filePath, entry) {
  ensureDir(dirname(filePath));
  const logs = readJson(filePath);
  logs.push(entry);
  writeJson(filePath, logs);
}

// ---- 项目检测 ----

/**
 * 从当前目录向上查找项目根目录
 * 匹配条件：.chaos-harness/state.json, .git, pom.xml, package.json
 */
export function detectProjectRoot(startDir = process.cwd()) {
  let dir = resolve(startDir);
  const maxDepth = 20;
  let depth = 0;

  while (depth < maxDepth) {
    if (
      existsSync(join(dir, '.chaos-harness', 'state.json')) ||
      existsSync(join(dir, '.git')) ||
      existsSync(join(dir, 'pom.xml')) ||
      existsSync(join(dir, 'package.json')) ||
      existsSync(join(dir, 'requirements.txt'))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break; // 到达根
    dir = parent;
    depth++;
  }
  return resolve(startDir);
}

// ---- 状态操作 ----

/** 读取项目状态 */
export function readProjectState(projectRoot) {
  const statePath = join(projectRoot, '.chaos-harness', 'state.json');
  return readJson(statePath, null);
}

/** 更新项目状态字段 */
export function updateProjectState(projectRoot, updates) {
  const statePath = join(projectRoot, '.chaos-harness', 'state.json');
  const state = readJson(statePath, null);
  if (!state) return false;
  Object.assign(state, updates);
  writeJson(statePath, state);
  return true;
}

// ---- 时间 ----

export function utcTimestamp() {
  return new Date().toISOString();
}

export function epochMs() {
  return Date.now();
}

// ---- 输出 ----

/** 向 stdout 输出 hook 消息（Claude Code 可读取） */
export function hookPrint(...lines) {
  for (const line of lines) {
    process.stdout.write(line + '\n');
  }
}

/** 输出格式化铁律上下文 */
export function printIronLawsContext() {
  hookPrint(
    '<CHAOS_HARNESS_CONTEXT>',
    '**Iron Laws Active (不可协商):**',
    '',
    '| ID | 铁律 | 说明 |',
    '|----|------|------|',
    '| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | 所有输出必须在版本目录下 |',
    '| IL002 | NO HARNESS WITHOUT SCAN RESULTS | Harness需要项目扫描数据 |',
    '| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | 完成声明需要实际验证 |',
    '| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT | 版本变更需要用户确认 |',
    '| IL005 | NO HIGH-RISK CONFIG MODS WITHOUT APPROVAL | 敏感配置修改需要批准 |',
    '',
    '**Laziness Patterns Detected (偷懒模式):**',
    '',
    '| ID | 模式 | 严重程度 |',
    '|----|------|---------|',
    '| LP001 | 声称完成但无验证证据 | critical |',
    '| LP002 | 跳过根因分析直接修复 | critical |',
    '| LP003 | 长时间无产出 (timeout) | warning |',
    '| LP004 | 试图跳过测试 | critical |',
    '| LP005 | 擅自更改版本号 | critical |',
    '| LP006 | 自动处理高风险配置 | critical |',
    '',
    '**Bypass Detection Keywords:**',
    '- "简单修复" / "simple fix"',
    '- "跳过测试" / "skip test"',
    '- "就这一次" / "just this once"',
    '- "快速处理" / "quick fix"',
    '',
    '如果检测到上述模式，必须反驳并提供正确路径。',
    '</CHAOS_HARNESS_CONTEXT>'
  );
}
