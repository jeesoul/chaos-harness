#!/usr/bin/env node
/**
 * resume — Session Resume Engine
 * v1.4.0
 *
 * SessionStart 时调用：检测上次会话是否中断，输出可读的 resume 提示。
 * 不修改任何状态，纯只读 + stdout 提示。
 *
 * 用法：
 *   node resume.mjs                # 默认：检测并输出可读提示（exit 10=需恢复，供 CLI 判断）
 *   node resume.mjs --json         # JSON 输出
 *   node resume.mjs --silent       # 不输出，但 exit code 反映是否需要 resume (0=no, 10=yes)
 *   node resume.mjs --hook         # SessionStart hook 模式：始终 exit 0（避免 hook error）
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot } from './path-utils.mjs';
import { readCursor, isInProgress } from './loop-cursor.mjs';
import { readTail } from './loop-journal.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const LAST_PATH = join(PLUGIN_ROOT, '.chaos-harness', 'wiki', 'sessions', 'last.md');

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return fm;
}

export function checkResume() {
  const cursor = readCursor();
  const needsResume = isInProgress(cursor);

  let lastSnapshot = null;
  if (existsSync(LAST_PATH)) {
    try {
      const content = readFileSync(LAST_PATH, 'utf8');
      lastSnapshot = {
        path: LAST_PATH,
        frontmatter: parseFrontmatter(content),
        content_size: content.length,
      };
    } catch {}
  }

  const recentFrames = readTail(5);

  return {
    needs_resume: needsResume,
    cursor,
    last_snapshot: lastSnapshot,
    recent_frames: recentFrames,
  };
}

function formatHuman(r) {
  const lines = [];
  if (!r.needs_resume) {
    lines.push('[chaos-harness:resume] Previous session was clean. No resume needed.');
    return lines.join('\n');
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(' 🔄 chaos-harness: previous session was interrupted');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  if (r.cursor) {
    lines.push(`  Session id: ${r.cursor.session_id || 'unknown'}`);
    lines.push(`  Last tick:  ${r.cursor.tick}`);
    lines.push(`  Last frame: ${r.cursor.last_frame || 'none'} at ${r.cursor.last_frame_at || ''}`);
    if (r.cursor.current_task) {
      lines.push(`  Open task:  ${JSON.stringify(r.cursor.current_task)}`);
    }
    if ((r.cursor.open_loops || []).length > 0) {
      lines.push(`  Open loops: ${r.cursor.open_loops.length}`);
    }
  }
  if (r.last_snapshot) {
    lines.push(`  Snapshot:   ${r.last_snapshot.path}`);
    const fm = r.last_snapshot.frontmatter;
    if (fm.title) lines.push(`  Title:      ${fm.title}`);
    if (fm.status) lines.push(`  Status:     ${fm.status}`);
  }
  if (r.recent_frames.length > 0) {
    lines.push('');
    lines.push('  Recent frames:');
    for (const f of r.recent_frames) {
      const detail = f.tool ? `tool=${f.tool}` : (f.gate ? `gate=${f.gate}` : '');
      lines.push(`    tick ${f.tick || '?'}: ${f.frame} ${detail}`);
    }
  }
  lines.push('');
  lines.push('  ▶ Read snapshot: node scripts/snapshot.mjs read');
  lines.push('  ▶ Continue from where it stopped, or run: /resume');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  return lines.join('\n');
}

function cli() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const silent = args.includes('--silent');
  const hookMode = args.includes('--hook');

  const r = checkResume();

  if (json) {
    console.log(JSON.stringify(r, null, 2));
  } else if (!silent) {
    console.log(formatHuman(r));
  }

  // hook 模式恒 exit 0，避免 SessionStart hook 把"需恢复"误判为错误
  if (hookMode) process.exit(0);
  process.exit(r.needs_resume ? 10 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli();
}
