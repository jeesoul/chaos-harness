#!/usr/bin/env node
// instinct-utils.mjs — 直觉系统 CRUD 工具库
import { readFileSync, writeFileSync, existsSync, cpSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const INSTINCTS_FILE = join(PROJECT_ROOT, 'instincts', 'instincts.json');
const CLUSTERS_DIR = join(PROJECT_ROOT, 'instincts', 'clusters');
const BACKUP_FILE = join(PROJECT_ROOT, 'instincts', 'instincts.json.bak');

// 直觉类型定义
export const INSTINCT_TYPES = {
  IRON_LAW_VIOLATION: 'iron_law_violation',
  WORKFLOW_OPTIMIZATION: 'workflow_optimization',
  CODE_PATTERN: 'code_pattern',
  AGENT_COORDINATION: 'agent_coordination'
};

// 混合演进策略配置
const EVOLUTION_CONFIG = {
  [INSTINCT_TYPES.IRON_LAW_VIOLATION]: {
    suggestThreshold: 0.5,
    confirmThreshold: 0.7,
    autoBlockThreshold: 0.9,
    requiresConfirmation: true
  },
  [INSTINCT_TYPES.WORKFLOW_OPTIMIZATION]: {
    suggestThreshold: 0.5,
    autoApplyThreshold: 0.7,
    requiresConfirmation: false
  },
  [INSTINCT_TYPES.CODE_PATTERN]: {
    suggestThreshold: 0.6,
    autoApplyThreshold: 0.8,
    requiresConfirmation: false
  },
  [INSTINCT_TYPES.AGENT_COORDINATION]: {
    suggestThreshold: 0.5,
    confirmThreshold: 0.7,
    requiresConfirmation: true
  }
};

// 读取 instincts 数据
export function loadInstincts() {
  if (!existsSync(INSTINCTS_FILE)) {
    return { version: '2.0', instincts: [], clusters: [], metadata: defaultMetadata() };
  }
  try {
    return JSON.parse(readFileSync(INSTINCTS_FILE, 'utf8'));
  } catch (e) {
    if (existsSync(BACKUP_FILE)) {
      console.error(`[instinct-utils] instincts.json corrupted, restoring from backup`);
      return JSON.parse(readFileSync(BACKUP_FILE, 'utf8'));
    }
    return { version: '2.0', instincts: [], clusters: [], metadata: defaultMetadata() };
  }
}

// 保存 instincts 数据（自动备份）
export function saveInstincts(data) {
  if (existsSync(INSTINCTS_FILE)) {
    cpSync(INSTINCTS_FILE, BACKUP_FILE);
  }
  validateInstincts(data);
  writeFileSync(INSTINCTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 数据验证
function validateInstincts(data) {
  if (!data.version || data.version !== '2.0') {
    throw new Error('Invalid instincts version');
  }
  if (!Array.isArray(data.instincts) || !Array.isArray(data.clusters)) {
    throw new Error('Invalid instincts structure');
  }
  for (const instinct of data.instincts) {
    if (instinct.confidence !== null && (instinct.confidence < 0 || instinct.confidence > 1)) {
      console.error(`[instinct-utils] Fixing invalid confidence ${instinct.confidence} for ${instinct.id}`);
      instinct.confidence = 0.5;
    }
  }
  const ids = data.instincts.map(i => i.id);
  const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  if (duplicates.length > 0) {
    console.error(`[instinct-utils] Removing duplicate instincts: ${duplicates.join(', ')}`);
    data.instincts = data.instincts.filter(i => !duplicates.includes(i.id));
  }
}

function defaultMetadata() {
  return {
    total_instincts: 0,
    active_clusters: 0,
    last_evolution: null,
    export_count: 0,
    created_at: new Date().toISOString()
  };
}

// 生成唯一 ID
export function generateId() {
  const data = loadInstincts();
  const count = data.instincts.length + 1;
  return `inst_${String(count).padStart(3, '0')}`;
}

// 创建新直觉
export function createInstinct({ type, pattern, context, confidence = 0.3 }) {
  const data = loadInstincts();
  const id = generateId();
  const instinct = {
    id,
    type,
    pattern,
    context,
    confidence,
    occurrences: 1,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    status: 'active',
    evolution_path: null,
    evidence: []
  };
  data.instincts.push(instinct);
  data.metadata.total_instincts = data.instincts.length;
  saveInstincts(data);
  return instinct;
}

// 更新直觉（增加出现次数和置信度）
export function updateInstinct(id, { evidence, confidenceDelta = 0.05 }) {
  const data = loadInstincts();
  const instinct = data.instincts.find(i => i.id === id);
  if (!instinct) return null;

  instinct.occurrences++;
  instinct.last_seen = new Date().toISOString();
  if (evidence) instinct.evidence.push(evidence);
  instinct.confidence = Math.min(0.95, instinct.confidence + confidenceDelta);

  saveInstincts(data);
  return instinct;
}

// 查询直觉
export function getInstinct(id) {
  const data = loadInstincts();
  return data.instincts.find(i => i.id === id) || null;
}

// 按类型查询
export function getInstinctsByType(type, minConfidence = 0) {
  const data = loadInstincts();
  return data.instincts.filter(i =>
    i.type === type && i.confidence >= minConfidence && i.status === 'active'
  );
}

// 获取所有本能
export function getAllInstincts(minConfidence = 0) {
  const data = loadInstincts();
  return data.instincts.filter(i =>
    i.confidence >= minConfidence && i.status === 'active'
  );
}

// 导出本能
export function exportInstincts(options = {}) {
  const data = loadInstincts();
  let instincts = data.instincts;

  if (options.type) {
    instincts = instincts.filter(i => i.type === options.type);
  }
  if (options.minConfidence) {
    instincts = instincts.filter(i => i.confidence >= options.minConfidence);
  }

  if (options.sanitize !== false) {
    instincts = instincts.map(i => ({
      ...i,
      evidence: i.evidence.map(e => e.replace(/\/[^\s]+\//g, '[PATH]/')),
      context: sanitizeContext(i.context)
    }));
  }

  return {
    version: data.version,
    exported_at: new Date().toISOString(),
    count: instincts.length,
    instincts,
    clusters: data.clusters
  };
}

function sanitizeContext(ctx) {
  if (!ctx) return ctx;
  const sanitized = { ...ctx };
  if (sanitized.file) sanitized.file = '[FILE]';
  if (sanitized.file_pattern) sanitized.file_pattern = '[PATTERN]';
  return sanitized;
}

// 导入本能（合并模式）
export function importInstincts(importData, mode = 'merge') {
  const data = loadInstincts();

  if (mode === 'overwrite') {
    data.instincts = importData.instincts || [];
    data.clusters = importData.clusters || [];
  } else {
    const existingIds = new Set(data.instincts.map(i => i.id));
    for (const imported of (importData.instincts || [])) {
      if (!existingIds.has(imported.id)) {
        data.instincts.push(imported);
        existingIds.add(imported.id);
      } else {
        const existing = data.instincts.find(i => i.id === imported.id);
        if (imported.confidence > existing.confidence) {
          existing.confidence = imported.confidence;
          existing.occurrences = Math.max(existing.occurrences, imported.occurrences);
        }
      }
    }
  }

  data.metadata.total_instincts = data.instincts.length;
  data.metadata.export_count++;
  saveInstincts(data);
  return data;
}

// 获取演进配置
export function getEvolutionConfig(type) {
  return EVOLUTION_CONFIG[type] || EVOLUTION_CONFIG[INSTINCT_TYPES.CODE_PATTERN];
}

// 判断是否需要用户确认
export function requiresConfirmation(type) {
  const config = getEvolutionConfig(type);
  return config.requiresConfirmation;
}

// 判断是否达到自动应用阈值
export function canAutoApply(type, confidence) {
  const config = getEvolutionConfig(type);
  return confidence >= (config.autoApplyThreshold || config.confirmThreshold || 0.7);
}

// 聚类分析
export function clusterInstincts() {
  const data = loadInstincts();
  const clusters = [];
  const grouped = {};

  for (const instinct of data.instincts) {
    if (!grouped[instinct.type]) grouped[instinct.type] = [];
    grouped[instinct.type].push(instinct);
  }

  let clusterIdx = 0;
  for (const [type, instincts] of Object.entries(grouped)) {
    if (instincts.length < 2) continue;

    clusterIdx++;
    const avgConfidence = instincts.reduce((sum, i) => sum + i.confidence, 0) / instincts.length;

    clusters.push({
      id: `cluster_${String(clusterIdx).padStart(3, '0')}`,
      theme: `${type} patterns`,
      instinct_ids: instincts.map(i => i.id),
      confidence: Math.round(avgConfidence * 100) / 100,
      recommendation: avgConfidence >= 0.7 ? '升级为 Skill 增强建议' : '继续观测',
      created_at: new Date().toISOString()
    });
  }

  data.clusters = clusters;
  data.metadata.active_clusters = clusters.length;
  saveInstincts(data);
  return clusters;
}

// CLI 入口
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      const data = loadInstincts();
      console.log(`Instincts: ${data.metadata.total_instincts}`);
      console.log(`Clusters: ${data.metadata.active_clusters}`);
      console.log(`Exports: ${data.metadata.export_count}`);
      break;
    case 'list':
      const type = args[1];
      const minConf = parseFloat(args[2] || '0');
      const instincts = type ? getInstinctsByType(type, minConf) : getAllInstincts(minConf);
      console.log(JSON.stringify(instincts, null, 2));
      break;
    case 'export':
      const outputFile = args[1] || 'instincts-export.json';
      const exported = exportInstincts({ sanitize: true });
      writeFileSync(outputFile, JSON.stringify(exported, null, 2));
      console.log(`Exported ${exported.count} instincts to ${outputFile}`);
      break;
    case 'import':
      const inputFile = args[1];
      const mode = args.includes('--overwrite') ? 'overwrite' : 'merge';
      if (!existsSync(inputFile)) {
        console.error(`File not found: ${inputFile}`);
        process.exit(1);
      }
      const importData = JSON.parse(readFileSync(inputFile, 'utf8'));
      const result = importInstincts(importData, mode);
      console.log(`Imported. Total instincts: ${result.metadata.total_instincts}`);
      break;
    case 'cluster':
      const clusters = clusterInstincts();
      console.log(`Created ${clusters.length} clusters`);
      console.log(JSON.stringify(clusters, null, 2));
      break;
    case 'repair':
      if (existsSync(BACKUP_FILE)) {
        cpSync(BACKUP_FILE, INSTINCTS_FILE);
        console.log('Restored from backup');
      } else {
        console.log('No backup available');
      }
      break;
    default:
      console.log('Usage: instinct-utils.mjs [status|list|export|import|cluster|repair]');
  }
}
