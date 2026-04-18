#!/usr/bin/env node
// strategic-compact.mjs — 逻辑边界压缩 + 工具调用计数阈值检测

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const STATE_FILE = join(PROJECT_ROOT, '.chaos-harness', 'call-counter.json');

mkdirSync(join(PROJECT_ROOT, '.chaos-harness'), { recursive: true });

// 阈值配置
const THRESHOLDS = {
  WARNING: 50,
  FORCE_COMPACT: 100,
  PRE_COMPACT_HOOK: 150
};

// 加载调用计数
function loadCounter() {
  if (!existsSync(STATE_FILE)) {
    return { total_calls: 0, session_start: new Date().toISOString(), snapshots: [] };
  }
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return { total_calls: 0, session_start: new Date().toISOString(), snapshots: [] };
  }
}

// 保存调用计数
function saveCounter(data) {
  writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 增加调用计数
function incrementCall(toolName) {
  const data = loadCounter();
  data.total_calls++;

  // 保存当前工具类型用于分析
  if (!data.last_tool) data.last_tool = [];
  data.last_tool.push({ tool: toolName, timestamp: new Date().toISOString() });
  // 只保留最近 10 次
  if (data.last_tool.length > 10) data.last_tool = data.last_tool.slice(-10);

  saveCounter(data);
  return data;
}

// 检查阈值
function checkThresholds(counter) {
  const actions = [];

  if (counter.total_calls >= THRESHOLDS.WARNING && counter.total_calls < THRESHOLDS.FORCE_COMPACT) {
    actions.push({
      type: 'warning',
      threshold: THRESHOLDS.WARNING,
      message: `已使用 ${counter.total_calls} 次工具调用，建议压缩上下文`
    });
  }

  if (counter.total_calls >= THRESHOLDS.FORCE_COMPACT && counter.total_calls < THRESHOLDS.PRE_COMPACT_HOOK) {
    actions.push({
      type: 'force_compact',
      threshold: THRESHOLDS.FORCE_COMPACT,
      message: `已达到 ${THRESHOLDS.FORCE_COMPACT} 次调用阈值，触发强制压缩`,
      snapshot: createSnapshot()
    });
  }

  if (counter.total_calls >= THRESHOLDS.PRE_COMPACT_HOOK) {
    actions.push({
      type: 'pre_compact_hook',
      threshold: THRESHOLDS.PRE_COMPACT_HOOK,
      message: `已达到 ${THRESHOLDS.PRE_COMPACT_HOOK} 次调用，触发 PreCompact Hook`
    });
  }

  return actions;
}

// 创建状态快照
function createSnapshot() {
  return {
    snapshot_at: new Date().toISOString(),
    total_calls: loadCounter().total_calls,
    message: '状态快照已保存，用于逻辑边界压缩'
  };
}

// 重置计数器
function resetCounter() {
  saveCounter({ total_calls: 0, session_start: new Date().toISOString(), snapshots: [] });
  console.log('调用计数器已重置');
}

// 显示状态
function showStatus() {
  const data = loadCounter();
  const actions = checkThresholds(data);

  console.log(`工具调用计数: ${data.total_calls}`);
  console.log(`会话开始: ${data.session_start}`);

  if (actions.length > 0) {
    console.log('');
    for (const action of actions) {
      const icon = action.type === 'warning' ? '⚠️' : '🔴';
      console.log(`${icon} ${action.message}`);
      if (action.snapshot) {
        console.log(`   快照: ${JSON.stringify(action.snapshot)}`);
      }
    }
  }
}

// CLI 入口
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      showStatus();
      break;
    case 'increment':
      const data = incrementCall(args[1] || 'unknown');
      const actions = checkThresholds(data);
      if (actions.length > 0) {
        for (const a of actions) console.log(a.message);
      }
      break;
    case 'reset':
      resetCounter();
      break;
    default:
      console.log('Usage: strategic-compact.mjs [status|increment|reset]');
  }
}

export { incrementCall, checkThresholds, createSnapshot, THRESHOLDS };
