#!/usr/bin/env node
// eval-utils.mjs — 评测系统 CRUD 工具库
import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const REGISTRY_FILE = join(PROJECT_ROOT, 'evals', 'results', 'registry.json');
const CAPABILITY_DIR = join(PROJECT_ROOT, 'evals', 'capability');
const REGRESSION_DIR = join(PROJECT_ROOT, 'evals', 'regression');
const RESULTS_DIR = join(PROJECT_ROOT, 'evals', 'results');
const BACKUP_FILE = join(RESULTS_DIR, 'registry.json.bak');

// 读取 registry
export function loadRegistry() {
  if (!existsSync(REGISTRY_FILE)) {
    return { version: '1.0', evals: [], metadata: defaultMetadata() };
  }
  try {
    return JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
  } catch (e) {
    if (existsSync(BACKUP_FILE)) {
      console.error('[eval-utils] registry.json corrupted, restoring from backup');
      return JSON.parse(readFileSync(BACKUP_FILE, 'utf8'));
    }
    return { version: '1.0', evals: [], metadata: defaultMetadata() };
  }
}

// 保存 registry（自动备份）
export function saveRegistry(data) {
  if (existsSync(REGISTRY_FILE)) {
    cpSync(REGISTRY_FILE, BACKUP_FILE);
  }
  validateRegistry(data);
  writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function validateRegistry(data) {
  if (!data.version || data.version !== '1.0') {
    throw new Error('Invalid eval registry version');
  }
  if (!Array.isArray(data.evals)) {
    throw new Error('Invalid eval registry structure');
  }
}

function defaultMetadata() {
  return {
    total_evals: 0,
    capability_count: 0,
    regression_count: 0,
    last_run: null,
    created_at: new Date().toISOString()
  };
}

// 生成唯一 ID
export function generateEvalId() {
  const data = loadRegistry();
  const count = data.evals.length + 1;
  return `eval_${String(count).padStart(3, '0')}`;
}

// 创建评测
export function createEval({ name, type, task, success_criteria, expected_output, scorers = [] }) {
  const data = loadRegistry();
  const id = generateEvalId();
  const evalEntry = {
    id,
    name,
    type, // 'capability' or 'regression'
    task,
    success_criteria,
    expected_output,
    scorers,
    status: 'pending',
    results: [],
    pass_at_1: null,
    pass_at_3: null,
    pass_caret_3: null,
    created_at: new Date().toISOString(),
    last_run: null
  };
  data.evals.push(evalEntry);
  data.metadata.total_evals = data.evals.length;
  if (type === 'capability') data.metadata.capability_count++;
  else if (type === 'regression') data.metadata.regression_count++;
  saveRegistry(data);

  // 写入评测定义文件
  const defFile = join(type === 'capability' ? CAPABILITY_DIR : REGRESSION_DIR, `${name}.md`);
  const defContent = generateEvalDefinition(evalEntry);
  writeFileSync(defFile, defContent, 'utf8');

  return evalEntry;
}

// 生成评测定义 Markdown
function generateEvalDefinition(evalEntry) {
  const typeLabel = evalEntry.type === 'capability' ? 'CAPABILITY EVAL' : 'REGRESSION EVAL';
  return [
    `# [${typeLabel}: ${evalEntry.name}]`,
    '',
    `任务：${evalEntry.task}`,
    '',
    '成功标准：',
    ...evalEntry.success_criteria.map(c => `  - [ ] ${c}`),
    '',
    `预期输出：${evalEntry.expected_output}`,
    '',
    evalEntry.scorers.length > 0 ? '## 评分器' : '',
    ...evalEntry.scorers.map(s => `- ${s.type}: ${s.command || s.description}`),
    ''
  ].join('\n');
}

// 记录评测结果
export function recordResult(evalId, { scorer_type, result, score, details }) {
  const data = loadRegistry();
  const evalEntry = data.evals.find(e => e.id === evalId);
  if (!evalEntry) return null;

  evalEntry.results.push({
    scorer_type,
    result, // 'PASS' or 'FAIL'
    score,
    details,
    timestamp: new Date().toISOString()
  });

  evalEntry.last_run = new Date().toISOString();
  data.metadata.last_run = evalEntry.last_run;

  // 计算 pass@k 指标
  calculatePassAtK(evalEntry);

  saveRegistry(data);
  return evalEntry;
}

// 计算 pass@k 指标
function calculatePassAtK(evalEntry) {
  const total = evalEntry.results.length;

  // pass@1: 最后一次是否通过
  evalEntry.pass_at_1 = total > 0 && evalEntry.results[total - 1].result === 'PASS' ? 1.0 : 0.0;

  // pass@3: 最近 3 次中至少一次通过
  const recent3 = evalEntry.results.slice(-3);
  evalEntry.pass_at_3 = recent3.some(r => r.result === 'PASS') ? 1.0 : 0.0;

  // pass^3: 最近 3 次全部通过
  if (recent3.length >= 3) {
    evalEntry.pass_caret_3 = recent3.every(r => r.result === 'PASS') ? 1.0 : 0.0;
  } else {
    evalEntry.pass_caret_3 = null;
  }

  evalEntry.status = total > 0 && evalEntry.pass_at_1 === 1.0 ? 'passed' : 'failed';
}

// 评测报告生成
export function generateReport(evalId) {
  const data = loadRegistry();
  const evalEntry = data.evals.find(e => e.id === evalId);
  if (!evalEntry) return null;

  return {
    id: evalEntry.id,
    name: evalEntry.name,
    type: evalEntry.type,
    status: evalEntry.status,
    total_runs: evalEntry.results.length,
    pass_at_1: evalEntry.pass_at_1,
    pass_at_3: evalEntry.pass_at_3,
    pass_caret_3: evalEntry.pass_caret_3,
    results: evalEntry.results,
    last_run: evalEntry.last_run
  };
}

// 按类型查询评测
export function getEvalsByType(type, minPassRate = 0) {
  const data = loadRegistry();
  return data.evals.filter(e => {
    if (e.type !== type) return false;
    if (minPassRate > 0 && e.pass_at_3 !== null && e.pass_at_3 < minPassRate) return false;
    return true;
  });
}

// 获取所有评测
export function getAllEvals() {
  const data = loadRegistry();
  return data.evals;
}

// 导出评测结果
export function exportEvals(options = {}) {
  const data = loadRegistry();
  let evals = data.evals;

  if (options.type) {
    evals = evals.filter(e => e.type === options.type);
  }

  return {
    version: data.version,
    exported_at: new Date().toISOString(),
    count: evals.length,
    evals,
    metadata: data.metadata
  };
}

// 导入评测（合并模式）
export function importEvals(importData, mode = 'merge') {
  const data = loadRegistry();

  if (mode === 'overwrite') {
    data.evals = importData.evals || [];
  } else {
    const existingIds = new Set(data.evals.map(e => e.id));
    for (const imported of (importData.evals || [])) {
      if (!existingIds.has(imported.id)) {
        data.evals.push(imported);
        existingIds.add(imported.id);
      }
    }
  }

  data.metadata.total_evals = data.evals.length;
  saveRegistry(data);
  return data;
}

// CLI 入口
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status': {
      const data = loadRegistry();
      console.log(`Evals: ${data.metadata.total_evals}`);
      console.log(`Capability: ${data.metadata.capability_count}`);
      console.log(`Regression: ${data.metadata.regression_count}`);
      console.log(`Last Run: ${data.metadata.last_run || 'never'}`);
      break;
    }
    case 'list': {
      const type = args[1];
      const evals = type ? getEvalsByType(type) : getAllEvals();
      console.log(JSON.stringify(evals, null, 2));
      break;
    }
    case 'report': {
      const evalId = args[1];
      const report = generateReport(evalId);
      console.log(JSON.stringify(report, null, 2));
      break;
    }
    case 'export': {
      const outputFile = args[1] || 'evals-export.json';
      const exported = exportEvals({ type: args[2] });
      writeFileSync(outputFile, JSON.stringify(exported, null, 2));
      console.log(`Exported ${exported.count} evals to ${outputFile}`);
      break;
    }
    case 'import': {
      const inputFile = args[1];
      const mode = args.includes('--overwrite') ? 'overwrite' : 'merge';
      if (!existsSync(inputFile)) {
        console.error(`File not found: ${inputFile}`);
        process.exit(1);
      }
      const importData = JSON.parse(readFileSync(inputFile, 'utf8'));
      const result = importEvals(importData, mode);
      console.log(`Imported. Total evals: ${result.metadata.total_evals}`);
      break;
    }
    default:
      console.log('Usage: eval-utils.mjs [status|list|report|export|import]');
  }
}
