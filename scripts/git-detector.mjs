#!/usr/bin/env node
/**
 * git-detector — 跨平台 git 二进制定位
 * v1.4.0 — 解决 Windows 下 git 装在 "Program Files\Git\" 含空格路径的识别问题
 *
 * 探测顺序：
 *   1. PATH 中（which/where）
 *   2. C:\Program Files\Git\bin\git.exe
 *   3. C:\Program Files (x86)\Git\bin\git.exe
 *   4. %USERPROFILE%\scoop\apps\git\current\bin\git.exe
 *   5. %ProgramData%\chocolatey\bin\git.exe
 *   6. WSL：wsl which git
 *
 * 用法：
 *   node git-detector.mjs              # 探测并输出 JSON
 *   node git-detector.mjs --save       # 探测并写入 .chaos-harness/config.json
 *   node git-detector.mjs --quiet      # 静默，只 exit 0/1
 */

import { execFileSync, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';
import { readJson, writeJsonAtomic, ensureDir } from './hook-utils.mjs';

/**
 * 探测候选路径
 */
function getCandidates() {
  const candidates = [];

  if (process.platform === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const home = homedir();
    const programData = process.env['ProgramData'] || 'C:\\ProgramData';

    candidates.push({ via: 'program-files', path: join(pf, 'Git', 'bin', 'git.exe') });
    candidates.push({ via: 'program-files', path: join(pf, 'Git', 'cmd', 'git.exe') });
    candidates.push({ via: 'program-files-x86', path: join(pf86, 'Git', 'bin', 'git.exe') });
    candidates.push({ via: 'scoop', path: join(home, 'scoop', 'apps', 'git', 'current', 'bin', 'git.exe') });
    candidates.push({ via: 'chocolatey', path: join(programData, 'chocolatey', 'bin', 'git.exe') });
    candidates.push({ via: 'github-desktop', path: join(home, 'AppData', 'Local', 'GitHubDesktop') });
  } else {
    candidates.push({ via: 'system', path: '/usr/bin/git' });
    candidates.push({ via: 'local', path: '/usr/local/bin/git' });
    candidates.push({ via: 'homebrew-arm', path: '/opt/homebrew/bin/git' });
    candidates.push({ via: 'homebrew-intel', path: '/usr/local/opt/git/bin/git' });
  }

  return candidates;
}

/**
 * 从 PATH 中查找 git
 */
function findFromPath() {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  try {
    const out = execFileSync(cmd, ['git'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const first = out.split(/\r?\n/).find(l => l.trim());
    if (first && existsSync(first.trim())) {
      return { via: 'path', path: first.trim() };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * 从 WSL 查找 git（仅 Windows）
 */
function findFromWsl() {
  if (process.platform !== 'win32') return null;
  try {
    const out = execFileSync('wsl', ['which', 'git'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 });
    const path = out.trim();
    if (path) return { via: 'wsl', path: `wsl:${path}` };
  } catch {
    return null;
  }
  return null;
}

/**
 * 获取 git 版本
 */
function getGitVersion(binary) {
  if (!binary) return null;
  try {
    if (binary.startsWith('wsl:')) {
      const inner = binary.slice(4);
      const out = execFileSync('wsl', [inner, '--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 });
      const m = out.match(/git version (\d+\.\d+(?:\.\d+)?)/);
      return m ? m[1] : null;
    }
    const out = execFileSync(binary, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 });
    const m = out.match(/git version (\d+\.\d+(?:\.\d+)?)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * 主探测函数
 */
export function detectGit() {
  const pathResult = findFromPath();
  if (pathResult) {
    const version = getGitVersion(pathResult.path);
    if (version) return { ...pathResult, version, found: true };
  }

  for (const cand of getCandidates()) {
    if (existsSync(cand.path)) {
      const version = getGitVersion(cand.path);
      if (version) return { ...cand, version, found: true };
    }
  }

  const wslResult = findFromWsl();
  if (wslResult) {
    const version = getGitVersion(wslResult.path);
    if (version) return { ...wslResult, version, found: true };
  }

  return { found: false, version: null, path: null, via: null };
}

/**
 * 解析可用的 git 调用方式。
 * 优先读 .chaos-harness/config.json 缓存（安装时 install.mjs 已写入），
 * 缓存缺失/失效再实时探测。返回 { cmd, args, found }，供 execFileSync 使用。
 *
 * - 普通二进制：{ cmd: 'C:\\...\\git.exe', prefix: [] }
 * - WSL：{ cmd: 'wsl', prefix: ['<git-path>'] }
 * - 未找到：{ found: false }
 *
 * 这样 Windows 上 git 不在 PATH 时也能工作，且不会因 `git` 命令缺失而抛错。
 */
export function resolveGitBinary() {
  // 1. 读 config 缓存
  try {
    const configPath = join(resolvePluginRoot(), '.chaos-harness', 'config.json');
    const cfg = readJson(configPath, {});
    if (cfg.git && cfg.git.binary) {
      const bin = cfg.git.binary;
      if (bin.startsWith('wsl:')) {
        return { found: true, cmd: 'wsl', prefix: [bin.slice(4)], via: 'config-wsl' };
      }
      if (existsSync(bin)) {
        return { found: true, cmd: bin, prefix: [], via: 'config' };
      }
    }
  } catch { /* fall through to detect */ }

  // 2. 实时探测
  const r = detectGit();
  if (!r.found) return { found: false };
  if (r.path && r.path.startsWith('wsl:')) {
    return { found: true, cmd: 'wsl', prefix: [r.path.slice(4)], via: r.via };
  }
  return { found: true, cmd: r.path, prefix: [], via: r.via };
}

/**
 * 保存到配置文件
 */
function saveToConfig(result) {
  const pluginRoot = resolvePluginRoot();
  const configDir = join(pluginRoot, '.chaos-harness');
  ensureDir(configDir);
  const configPath = join(configDir, 'config.json');
  const existing = readJson(configPath, {});
  existing.git = {
    binary: result.path,
    version: result.version,
    detected_via: result.via,
    detected_at: new Date().toISOString(),
  };
  writeJsonAtomic(configPath, existing);
  return configPath;
}

function main() {
  const args = process.argv.slice(2);
  const save = args.includes('--save');
  const quiet = args.includes('--quiet');

  const result = detectGit();

  if (!quiet) {
    if (result.found) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('git not found. Checked: PATH, Program Files, scoop, chocolatey, WSL.');
      console.error('Install git: https://git-scm.com/download');
    }
  }

  if (save && result.found) {
    const configPath = saveToConfig(result);
    if (!quiet) console.log(`\nSaved to: ${configPath}`);
  }

  process.exit(result.found ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
