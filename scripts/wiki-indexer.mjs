#!/usr/bin/env node
/**
 * wiki-indexer — Karpathy 式 Wiki 索引器
 * v1.4.0
 *
 * 扫描 .chaos-harness/wiki/ 下所有 .md，提取 YAML frontmatter，
 * 生成 index.md，并自动维护双向链接。
 *
 * Frontmatter schema:
 *   id: 短 id（全 wiki 唯一）
 *   type: pattern|decision|incident|session
 *   title: 可读标题
 *   tags: [...]
 *   links: [id1, id2, ...]        # 单向声明，indexer 自动补全反向
 *   sources: [...]
 *   created/updated: ISO8601
 *   confidence: 0-1
 *   status: draft|promoted|archived
 *
 * 用法：
 *   node wiki-indexer.mjs build         # 全量重建 index.md，补全反向链接
 *   node wiki-indexer.mjs validate      # 校验所有 frontmatter
 *   node wiki-indexer.mjs add --type pattern --title "..." --tags "a,b"
 *   node wiki-indexer.mjs list [--type pattern]
 *   node wiki-indexer.mjs corpus        # 导出搜索语料（供 wiki-search 用）
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

import { resolvePluginRoot } from './path-utils.mjs';
import { ensureDir, utcTimestamp } from './hook-utils.mjs';

const PLUGIN_ROOT = resolvePluginRoot();
const WIKI_DIR = join(PLUGIN_ROOT, '.chaos-harness', 'wiki');
const INDEX_PATH = join(WIKI_DIR, 'index.md');

const TYPES = ['pattern', 'decision', 'incident', 'session'];
const TYPE_DIR = {
  pattern: 'patterns',
  decision: 'decisions',
  incident: 'incidents',
  session: 'sessions',
};

const TYPE_PREFIX = { pattern: 'pat', decision: 'dec', incident: 'inc', session: 'ses' };

// ---- frontmatter 解析 / 序列化 ----

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: null, body: content };
  const fmText = m[1];
  const body = m[2];
  const fm = {};
  let curKey = null;
  for (const rawLine of fmText.split(/\r?\n/)) {
    const line = rawLine.replace(/\r$/, '');
    if (!line.trim()) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      curKey = kv[1];
      const val = kv[2].trim();
      if (val === '' ) { fm[curKey] = []; continue; }
      if (val.startsWith('[') && val.endsWith(']')) {
        fm[curKey] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
      } else {
        fm[curKey] = val.replace(/^"(.*)"$/, '$1');
      }
    } else if (line.startsWith('  - ') && curKey && Array.isArray(fm[curKey])) {
      fm[curKey].push(line.slice(4).trim());
    }
  }
  return { frontmatter: fm, body };
}

function serializeFrontmatter(fm) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.join(', ')}]`);
    } else if (typeof v === 'string' && /[:#"]|^\s|\s$/.test(v)) {
      lines.push(`${k}: "${v.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ---- 扫描 ----

export function scanWiki() {
  ensureDir(WIKI_DIR);
  const entries = [];
  for (const type of TYPES) {
    const dir = join(WIKI_DIR, TYPE_DIR[type]);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      // 跳过 last.md：它是最新 session 的硬复制，不是独立条目
      if (type === 'session' && f === 'last.md') continue;
      const p = join(dir, f);
      try {
        const content = readFileSync(p, 'utf8');
        const parsed = parseFrontmatter(content);
        if (!parsed.frontmatter || !parsed.frontmatter.id) continue;
        entries.push({
          path: p,
          relative: relative(WIKI_DIR, p).replace(/\\/g, '/'),
          frontmatter: parsed.frontmatter,
          body: parsed.body,
          mtime: statSync(p).mtimeMs,
        });
      } catch { /* skip */ }
    }
  }
  return entries;
}

// ---- 双向链接补全 ----

export function reconcileLinks(entries) {
  const byId = new Map();
  for (const e of entries) byId.set(e.frontmatter.id, e);

  let added = 0;
  for (const e of entries) {
    const links = e.frontmatter.links || [];
    for (const linkedId of links) {
      const other = byId.get(linkedId);
      if (!other) continue;
      other.frontmatter.links = other.frontmatter.links || [];
      if (!other.frontmatter.links.includes(e.frontmatter.id)) {
        other.frontmatter.links.push(e.frontmatter.id);
        other._dirty = true;
        added++;
      }
    }
  }

  for (const e of entries) {
    if (e._dirty) {
      e.frontmatter.updated = utcTimestamp();
      const content = serializeFrontmatter(e.frontmatter) + '\n' + (e.body || '');
      writeFileSync(e.path, content, 'utf8');
    }
  }
  return added;
}

// ---- index.md 生成 ----

export function buildIndex(entries) {
  ensureDir(WIKI_DIR);
  const grouped = { pattern: [], decision: [], incident: [], session: [] };
  for (const e of entries) {
    const t = e.frontmatter.type;
    if (grouped[t]) grouped[t].push(e);
  }
  for (const g of Object.values(grouped)) {
    g.sort((a, b) => (a.frontmatter.id || '').localeCompare(b.frontmatter.id || ''));
  }

  const lines = [];
  lines.push('# Chaos Harness Wiki');
  lines.push('');
  lines.push(`> Auto-generated by wiki-indexer. Last update: ${utcTimestamp()}`);
  lines.push('');
  lines.push(`Total: ${entries.length} entries`);
  lines.push('');

  for (const type of TYPES) {
    const group = grouped[type];
    lines.push(`## ${type[0].toUpperCase()}${type.slice(1)}s (${group.length})`);
    lines.push('');
    if (group.length === 0) {
      lines.push('_None yet._');
    } else {
      lines.push('| ID | Title | Tags | Status | Updated |');
      lines.push('|----|-------|------|--------|---------|');
      for (const e of group) {
        const fm = e.frontmatter;
        const tags = (fm.tags || []).join(', ');
        lines.push(`| [\`${fm.id}\`](${e.relative}) | ${fm.title || ''} | ${tags} | ${fm.status || ''} | ${fm.updated || fm.created || ''} |`);
      }
    }
    lines.push('');
  }

  writeFileSync(INDEX_PATH, lines.join('\n'), 'utf8');
  return INDEX_PATH;
}

// ---- 校验 ----

export function validate(entries) {
  const errors = [];
  const ids = new Set();
  for (const e of entries) {
    const fm = e.frontmatter;
    if (!fm.id) errors.push({ file: e.relative, msg: 'missing id' });
    else if (ids.has(fm.id)) errors.push({ file: e.relative, msg: `duplicate id: ${fm.id}` });
    else ids.add(fm.id);
    if (!TYPES.includes(fm.type)) errors.push({ file: e.relative, msg: `invalid type: ${fm.type}` });
    if (!fm.title) errors.push({ file: e.relative, msg: 'missing title' });
    if (!fm.created) errors.push({ file: e.relative, msg: 'missing created' });
  }
  return errors;
}

// ---- 新增条目 ----

function genId(type) {
  const prefix = TYPE_PREFIX[type] || 'wiki';
  const rand = randomBytes(3).toString('hex');
  return `${prefix}-${rand}`;
}

export function addEntry({ type, title, tags = [], body = '', confidence = 0.5, status = 'draft', links = [], sources = [] }) {
  if (!TYPES.includes(type)) throw new Error(`Invalid type: ${type}`);
  const id = genId(type);
  const dir = join(WIKI_DIR, TYPE_DIR[type]);
  ensureDir(dir);
  const slug = (title || id).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || id;
  const filename = `${id}-${slug}.md`;
  const path = join(dir, filename);
  const fm = {
    id,
    type,
    title,
    tags: Array.isArray(tags) ? tags : [tags],
    links,
    sources,
    created: utcTimestamp(),
    updated: utcTimestamp(),
    confidence,
    status,
  };
  const content = serializeFrontmatter(fm) + '\n\n' + body + '\n';
  writeFileSync(path, content, 'utf8');
  return { path, id };
}

// ---- 语料导出（给 wiki-search 用） ----

export function exportCorpus() {
  const entries = scanWiki();
  return entries.map(e => ({
    id: e.frontmatter.id,
    type: e.frontmatter.type,
    title: e.frontmatter.title,
    tags: e.frontmatter.tags || [],
    text: `${e.frontmatter.title || ''} ${(e.frontmatter.tags || []).join(' ')} ${e.body || ''}`.replace(/\s+/g, ' ').trim(),
    path: e.relative,
  }));
}

function cli() {
  const [, , cmd, ...rest] = process.argv;

  if (!cmd || cmd === 'build') {
    const entries = scanWiki();
    const added = reconcileLinks(entries);
    const fresh = scanWiki();
    buildIndex(fresh);
    console.log(JSON.stringify({ ok: true, entries: fresh.length, reverse_links_added: added, index: INDEX_PATH }, null, 2));
    return;
  }

  if (cmd === 'validate') {
    const entries = scanWiki();
    const errs = validate(entries);
    console.log(JSON.stringify({ ok: errs.length === 0, errors: errs }, null, 2));
    process.exit(errs.length === 0 ? 0 : 1);
  }

  if (cmd === 'list') {
    const ti = rest.indexOf('--type');
    const type = ti >= 0 ? rest[ti + 1] : null;
    const all = scanWiki();
    const filtered = type ? all.filter(e => e.frontmatter.type === type) : all;
    console.log(JSON.stringify(filtered.map(e => ({ id: e.frontmatter.id, title: e.frontmatter.title, type: e.frontmatter.type, path: e.relative })), null, 2));
    return;
  }

  if (cmd === 'add') {
    const get = (flag) => { const i = rest.indexOf(flag); return i >= 0 ? rest[i + 1] : null; };
    const type = get('--type');
    const title = get('--title');
    const tagsStr = get('--tags');
    if (!type || !title) {
      console.error('Usage: wiki-indexer add --type <pattern|decision|incident|session> --title "..." [--tags "a,b"]');
      process.exit(2);
    }
    const tags = tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    const r = addEntry({ type, title, tags });
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === 'corpus') {
    console.log(JSON.stringify(exportCorpus(), null, 2));
    return;
  }

  console.error('Usage: wiki-indexer {build|validate|list|add|corpus}');
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli();
}
