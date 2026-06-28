#!/usr/bin/env node
// schema-utils.mjs — Schema 工作流工具库
import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const SCHEMAS_DIR = join(PROJECT_ROOT, 'schemas');
const STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'workflow-state.json');
const BACKUP_FILE = join(PROJECT_ROOT, '.chaos-harness', 'workflow-state.json.bak');

// 简单 YAML 解析器（递归下降，支持基本结构，无需外部依赖）
export function parseYaml(content) {
  const lines = content.split('\n');
  const nonEmptyLines = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.startsWith('#')) {
      nonEmptyLines.push({ text: lines[i], indent: lines[i].search(/\S/), lineNum: i });
    }
  }

  function parseBlock(startIdx, parentIndent) {
    const result = {};
    let i = startIdx;

    while (i < nonEmptyLines.length) {
      const { text, indent, lineNum } = nonEmptyLines[i];
      const trimmed = text.trim();

      if (indent < parentIndent) break;
      if (indent > parentIndent && i > startIdx) break;

      // key: value
      if (trimmed.includes(':')) {
        const colonIdx = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIdx).trim();
        const value = trimmed.substring(colonIdx + 1).trim();

        if (value !== '') {
          result[key] = parseYamlValue(value);
          i++;
        } else {
          // Check if next line is a deeper indent (array or nested object)
          if (i + 1 < nonEmptyLines.length && nonEmptyLines[i + 1].indent > indent) {
            const nextIndent = nonEmptyLines[i + 1].indent;
            const nextTrimmed = nonEmptyLines[i + 1].text.trim();
            if (nextTrimmed.startsWith('- ')) {
              const { arr, nextIdx } = parseArray(i + 1, nextIndent);
              result[key] = arr;
              i = nextIdx;
            } else {
              const { obj, nextIdx } = parseBlock(i + 1, nextIndent);
              result[key] = obj;
              i = nextIdx;
            }
          } else {
            result[key] = null;
            i++;
          }
        }
      } else {
        i++;
      }
    }

    return { obj: result, nextIdx: i };
  }

  function parseArray(startIdx, arrayIndent) {
    const arr = [];
    let i = startIdx;

    while (i < nonEmptyLines.length) {
      const { text, indent } = nonEmptyLines[i];
      const trimmed = text.trim();

      if (indent < arrayIndent) break;
      if (indent === arrayIndent && !trimmed.startsWith('- ')) break;

      if (trimmed.startsWith('- ')) {
        const itemContent = trimmed.substring(2);
        if (itemContent.includes(':')) {
          // Object item: - key: value
          const colonIdx = itemContent.indexOf(':');
          const key = itemContent.substring(0, colonIdx).trim();
          const value = itemContent.substring(colonIdx + 1).trim();
          const obj = {};
          obj[key] = value !== '' ? parseYamlValue(value) : null;

          i++;
          // Parse remaining properties of this object
          while (i < nonEmptyLines.length) {
            const propIndent = nonEmptyLines[i].indent;
            if (propIndent <= arrayIndent) break;
            const propTrimmed = nonEmptyLines[i].text.trim();

            if (propTrimmed.startsWith('- ') && propIndent === arrayIndent + 2) {
              // Nested array property - check if we have a pending null key
              // This happens when the previous property had no value
              const lastKey = Object.keys(obj).pop();
              if (obj[lastKey] === null) {
                const { arr: nestedArr, nextIdx } = parseArray(i, propIndent);
                obj[lastKey] = nestedArr;
                i = nextIdx;
                continue;
              }
              break;
            }

            if (propTrimmed.includes(':')) {
              const pColonIdx = propTrimmed.indexOf(':');
              const pKey = propTrimmed.substring(0, pColonIdx).trim();
              const pValue = propTrimmed.substring(pColonIdx + 1).trim();

              if (pValue !== '') {
                obj[pKey] = parseYamlValue(pValue);
                i++;
              } else {
                // Check deeper for array or object
                if (i + 1 < nonEmptyLines.length && nonEmptyLines[i + 1].indent > propIndent) {
                  const deeperIndent = nonEmptyLines[i + 1].indent;
                  const deeperTrimmed = nonEmptyLines[i + 1].text.trim();
                  if (deeperTrimmed.startsWith('- ')) {
                    const { arr: nestedArr, nextIdx } = parseArray(i + 1, deeperIndent);
                    obj[pKey] = nestedArr;
                    i = nextIdx;
                  } else {
                    const { obj: nestedObj, nextIdx } = parseBlock(i + 1, deeperIndent);
                    obj[pKey] = nestedObj;
                    i = nextIdx;
                  }
                } else {
                  obj[pKey] = null;
                  i++;
                }
              }
            } else {
              i++;
            }
          }
          arr.push(obj);
        } else {
          arr.push(parseYamlValue(itemContent));
          i++;
        }
      } else {
        i++;
      }
    }

    return { arr, nextIdx: i };
  }

  const { obj } = parseBlock(0, 0);
  return obj;
}

function parseYamlValue(value) {
  if (!value || value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;

  // 数字
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  // 内联数组 [a, b, c]
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map(s => parseYamlValue(s.trim()));
  }

  // 去除引号
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

// 加载 Schema
export function loadSchema(name) {
  const schemaFile = join(SCHEMAS_DIR, `${name}.yaml`);
  if (!existsSync(schemaFile)) {
    throw new Error(`Schema not found: ${name}. Available: ${listSchemas().join(', ')}`);
  }
  const content = readFileSync(schemaFile, 'utf8');
  return parseYaml(content);
}

// 列出所有可用 Schema
export function listSchemas() {
  if (!existsSync(SCHEMAS_DIR)) return [];
  return readdirSync(SCHEMAS_DIR)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''));
}

// 依赖图解析（Kahn 拓扑排序）
export function resolveDependencies(stages) {
  // 构建邻接表
  const graph = {};
  const inDegree = {};

  for (const stage of stages) {
    graph[stage.id] = [];
    inDegree[stage.id] = 0;
  }

  for (const stage of stages) {
    const deps = stage.dependencies || [];
    for (const dep of (Array.isArray(deps) ? deps : parseInlineArray(deps))) {
      if (graph[dep]) {
        graph[dep].push(stage.id);
        inDegree[stage.id] = (inDegree[stage.id] || 0) + 1;
      }
    }
  }

  // 拓扑排序
  const queue = Object.keys(inDegree).filter(id => inDegree[id] === 0);
  const result = [];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);

    for (const neighbor of (graph[node] || [])) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (result.length !== stages.length) {
    throw new Error(`循环依赖检测失败: 无法解析 ${stages.length - result.length} 个阶段`);
  }

  return result;
}

function parseInlineArray(value) {
  if (typeof value === 'string' && value.startsWith('[')) {
    return value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
  }
  return Array.isArray(value) ? value : [value].filter(Boolean);
}

// 加载工作流状态
export function loadWorkflowState() {
  if (!existsSync(STATE_FILE)) {
    return {
      current_schema: null,
      current_stage: null,
      completed_stages: [],
      stage_artifacts: {},
      history: []
    };
  }
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    if (existsSync(BACKUP_FILE)) {
      console.error('[schema-utils] workflow-state corrupted, restoring from backup');
      return JSON.parse(readFileSync(BACKUP_FILE, 'utf8'));
    }
    return { current_schema: null, current_stage: null, completed_stages: [], stage_artifacts: {}, history: [] };
  }
}

// 保存工作流状态（自动备份）
export function saveWorkflowState(state) {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  if (existsSync(STATE_FILE)) {
    cpSync(STATE_FILE, BACKUP_FILE);
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// 获取阶段信息
export function getStageInfo(schema, stageId) {
  return schema.stages?.find(s => s.id === stageId) || null;
}

// 检查阶段依赖是否满足
export function canEnterStage(schema, stageId, state) {
  const stage = getStageInfo(schema, stageId);
  if (!stage) return { canEnter: false, reason: '阶段不存在' };

  const deps = stage.dependencies || [];
  const depList = Array.isArray(deps) ? deps : parseInlineArray(deps);

  for (const dep of depList) {
    if (!state.completed_stages.includes(dep)) {
      return { canEnter: false, reason: `依赖阶段 ${dep} 未完成` };
    }
  }

  return { canEnter: true, reason: '依赖已满足' };
}

// 标记阶段完成
export function completeStage(schema, stageId, state, artifacts = {}) {
  const result = canEnterStage(schema, stageId, state);
  if (!result.canEnter) {
    return { success: false, reason: result.reason };
  }

  state.completed_stages.push(stageId);
  state.current_stage = stageId;
  state.stage_artifacts[stageId] = artifacts;
  state.history.push({
    stage: stageId,
    action: 'completed',
    timestamp: new Date().toISOString(),
    artifacts: Object.keys(artifacts)
  });

  saveWorkflowState(state);

  // 获取下一阶段
  const ordered = resolveDependencies(schema.stages);
  const currentIdx = ordered.indexOf(stageId);
  const nextStage = ordered[currentIdx + 1] || null;

  return {
    success: true,
    next_stage: nextStage,
    completed_stages: state.completed_stages,
    remaining: ordered.length - state.completed_stages.length
  };
}

// 获取工作流进度
export function getProgress(schema, state) {
  if (!schema || !schema.stages) return { total: 0, completed: 0, percentage: 0 };

  const total = schema.stages.length;
  const completed = state.completed_stages.filter(id =>
    schema.stages.some(s => s.id === id)
  ).length;

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    current_stage: state.current_stage,
    completed_stages: state.completed_stages,
    remaining_stages: schema.stages
      .filter(s => !state.completed_stages.includes(s.id))
      .map(s => ({ id: s.id, name: s.name }))
  };
}

// 导出工作流状态
export function exportWorkflowState() {
  const state = loadWorkflowState();
  return {
    exported_at: new Date().toISOString(),
    state
  };
}

// 导入工作流状态
export function importWorkflowState(importData, mode = 'merge') {
  if (mode === 'overwrite') {
    saveWorkflowState(importData.state);
    return importData.state;
  }

  const existing = loadWorkflowState();
  // 合并：保留已有的完成阶段
  if (importData.state.completed_stages) {
    const merged = [...new Set([...existing.completed_stages, ...importData.state.completed_stages])];
    existing.completed_stages = merged;
  }
  saveWorkflowState(existing);
  return existing;
}

// CLI 入口
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      console.log('Available schemas:', listSchemas().join(', '));
      break;
    case 'show':
      const schema = loadSchema(args[1]);
      console.log(`Schema: ${schema.name} v${schema.version}`);
      console.log(`Stages: ${schema.stages?.length || 0}`);
      for (const stage of (schema.stages || [])) {
        const deps = stage.dependencies || [];
        const depStr = Array.isArray(deps) ? deps.join(', ') : (deps || 'none');
        console.log(`  ${stage.id}: ${stage.name} (deps: ${depStr})`);
      }
      break;
    case 'resolve':
      const schema2 = loadSchema(args[1]);
      const ordered = resolveDependencies(schema2.stages);
      console.log('Execution order:', ordered.join(' -> '));
      break;
    case 'status':
      const state = loadWorkflowState();
      const schema3 = state.current_schema ? loadSchema(state.current_schema) : null;
      const progress = getProgress(schema3, state);
      console.log(`Schema: ${state.current_schema || 'none'}`);
      console.log(`Current: ${state.current_stage || 'not started'}`);
      console.log(`Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
      console.log(`Completed: ${state.completed_stages.join(', ') || 'none'}`);
      break;
    case 'complete':
      const state2 = loadWorkflowState();
      const schema4 = loadSchema(state2.current_schema);
      const result = completeStage(schema4, args[1], state2, {});
      console.log(result.success ? `Stage ${args[1]} completed` : `Failed: ${result.reason}`);
      if (result.next_stage) console.log(`Next: ${result.next_stage}`);
      break;
    case 'reset':
      saveWorkflowState({ current_schema: null, current_stage: null, completed_stages: [], stage_artifacts: {}, history: [] });
      console.log('Workflow state reset');
      break;
    default:
      console.log('Usage: schema-utils.mjs [list|show|resolve|status|complete|reset]');
  }
}

export default { parseYaml, loadSchema, listSchemas, resolveDependencies, loadWorkflowState, saveWorkflowState, getStageInfo, canEnterStage, completeStage, getProgress, exportWorkflowState, importWorkflowState };
