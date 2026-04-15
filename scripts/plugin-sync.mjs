#!/usr/bin/env node
/**
 * plugin-sync — 外部插件版本检查与同步
 * 检查 GitHub 上的插件最新版本，提示更新
 *
 * 调用:
 *   node scripts/plugin-sync.mjs                  # 检查所有插件
 *   node scripts/plugin-sync.mjs web-access        # 检查特定插件
 *   node scripts/plugin-sync.mjs web-access --sync # 同步（合并上游变更）
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  cpSync,
} from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const PROJECT_ROOT = process.cwd();
const SKILLS_DIR = join(PROJECT_ROOT, 'skills');

// 内置外部插件注册表 — key 为 skill 目录名
const BUILTIN_PLUGINS = {
  'web-access': { owner: 'eze-is', repo: 'web-access' },
};

function extractVersion(skillPath) {
  try {
    const content = readFileSync(skillPath, 'utf-8');
    const match = content.match(/version:\s*["']([^"']+)["']/);
    return match ? match[1] : null;
  } catch { return null; }
}

async function httpGetText(url, headers = {}, timeoutMs = 5000) {
  // Node.js 18+ 内置 fetch，跨平台兼容，替代 curl
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
    return res.ok ? res.text() : null;
  } catch { return null; }
}

async function getRemoteVersion(owner, repo) {
  // 方式1: 读取远程 SKILL.md 的 version 字段（raw.githubusercontent.com）
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/SKILL.md`;
  const rawContent = await httpGetText(rawUrl);
  if (rawContent) {
    const match = rawContent.match(/version:\s*["']([^"']+)["']/);
    if (match) return match[1];
  }

  // 方式2: 通过 GitHub API releases
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const apiContent = await httpGetText(apiUrl, { Accept: 'application/vnd.github+json' });
  if (apiContent) {
    try {
      const data = JSON.parse(apiContent);
      if (data.tag_name) return data.tag_name.replace(/^v/, '');
    } catch { /* ignore */ }
  }

  // 方式3: 如果本地有克隆的副本，用 git fetch 检查
  const skillDir = join(SKILLS_DIR, repo);
  if (existsSync(join(skillDir, '.git'))) {
    const fetchResult = spawnSync('git', ['-C', skillDir, 'fetch', '--quiet'], { encoding: 'utf-8' });
    if (fetchResult.status === 0) {
      const logResult = spawnSync('git', ['-C', skillDir, 'log', '--oneline', 'HEAD..origin/main', '-1'], { encoding: 'utf-8' });
      if (logResult.stdout.trim()) {
        const showResult = spawnSync('git', ['-C', skillDir, 'show', 'origin/main:SKILL.md'], { encoding: 'utf-8', timeout: 5000 });
        if (showResult.stdout) {
          const match = showResult.stdout.match(/version:\s*["']([^"']+)["']/);
          if (match) return match[1];
        }
      }
    }
  }

  return null;
}

function compareVersions(local, remote) {
  if (!local || !remote) return 'unknown';
  const toNums = v => v.split('.').map(Number);
  const [l, r] = [toNums(local), toNums(remote)];
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    const a = l[i] || 0, b = r[i] || 0;
    if (a < b) return 'outdated';
    if (a > b) return 'ahead';
  }
  return 'latest';
}

function syncPlugin(skillName, owner, repo) {
  const skillDir = join(SKILLS_DIR, skillName);
  const tmpDir = join(PROJECT_ROOT, '.tmp-plugin-sync');

  // fs.rmSync 跨平台替代 rm -rf
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });

  const cloneResult = spawnSync('git', ['clone', '--depth', '1', `https://github.com/${owner}/${repo}.git`, tmpDir], {
    encoding: 'utf-8',
  });
  if (cloneResult.status !== 0) {
    console.log(`  ❌ 克隆失败: ${cloneResult.stderr}`);
    return false;
  }

  // 只同步 scripts/ 和 references/（上游核心逻辑），不同步 SKILL.md（保留本地适配）
  const dirsToSync = ['scripts', 'references'];
  for (const dir of dirsToSync) {
    const srcDir = join(tmpDir, dir);
    const dstDir = join(skillDir, dir);
    if (existsSync(srcDir)) {
      // fs.rmSync + fs.cpSync 跨平台替代 rm -rf && cp -r
      if (existsSync(dstDir)) rmSync(dstDir, { recursive: true, force: true });
      cpSync(srcDir, dstDir, { recursive: true });
      console.log(`  → ${dir}/ 已同步`);
    }
  }

  // 更新 VERSION 文件
  const srcVer = join(tmpDir, 'VERSION');
  if (existsSync(srcVer)) {
    const dstVer = join(skillDir, 'VERSION');
    writeFileSync(dstVer, readFileSync(srcVer, 'utf-8'), 'utf-8');
  }

  rmSync(tmpDir, { recursive: true, force: true });
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const targetPlugin = args.find(a => !a.startsWith('--'));
  const doSync = args.includes('--sync') || args.includes('-s');

  const pluginsToCheck = targetPlugin
    ? { [targetPlugin]: BUILTIN_PLUGINS[targetPlugin] }
    : BUILTIN_PLUGINS;

  if (!Object.keys(pluginsToCheck).length) {
    console.log(`未知插件: ${targetPlugin || '(无)'}`);
    console.log('可用内置插件:', Object.keys(BUILTIN_PLUGINS).join(', '));
    process.exit(1);
  }

  if (!doSync) console.log('🔍 检查外部插件更新...\n');

  let hasOutdated = false;

  for (const [name, { owner, repo }] of Object.entries(pluginsToCheck)) {
    const skillMd = join(SKILLS_DIR, name, 'SKILL.md');
    if (!existsSync(skillMd)) {
      console.log(`⚠️  ${name}: SKILL.md 不存在`);
      continue;
    }

    const localVersion = extractVersion(skillMd);
    const remoteVersion = await getRemoteVersion(owner, repo);
    const status = compareVersions(localVersion, remoteVersion);

    if (status === 'outdated') hasOutdated = true;

    if (!doSync) {
      const icon = status === 'latest' ? '✅' : status === 'outdated' ? '🔄' : status === 'ahead' ? '⚡' : '❓';
      const text = status === 'latest' ? '最新' : status === 'outdated' ? `可更新 → v${remoteVersion}` : status === 'ahead' ? '超前 (本地修改)' : '未知';
      console.log(`${icon} ${name}: v${localVersion} → GitHub: v${remoteVersion || '?'} [${text}]`);
    } else if (status === 'outdated') {
      console.log(`🔄 同步 ${name} v${localVersion} → v${remoteVersion}...`);
      const success = syncPlugin(name, owner, repo);
      if (success) console.log(`  ✅ ${name} 已更新（SKILL.md 保留本地适配，仅同步 scripts/ references/）`);
    }
  }

  if (!doSync && hasOutdated) {
    console.log('\n💡 使用 --sync 自动同步: node scripts/plugin-sync.mjs --sync');
  }
}

main().catch(err => {
  console.error('错误:', err.message);
  process.exit(1);
});
