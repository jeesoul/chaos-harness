#!/usr/bin/env node
/**
 * session-start — 会话启动 Hook
 * 注入铁律上下文 + 恢复项目状态 + 自动学习分析
 *
 * 调用: node session-start.mjs
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  readJson,
  appendLog,
  detectProjectRoot,
  readProjectState,
  utcTimestamp,
  epochMs,
  hookPrint,
  printIronLawsContext,
} from './hook-utils.mjs';

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// 初始化日志文件
ensureDir(GLOBAL_DATA_DIR);

const IRON_LAW_LOG = join(GLOBAL_DATA_DIR, 'iron-law-log.json');
const PLUGIN_LOG = join(GLOBAL_DATA_DIR, 'plugin-log.json');
const LEARNING_LOG = join(GLOBAL_DATA_DIR, 'learning-log.json');
const ANALYSIS_REPORT = join(GLOBAL_DATA_DIR, 'analysis-report.md');

for (const f of [IRON_LAW_LOG, PLUGIN_LOG, LEARNING_LOG]) {
  if (!readJson(f, null)) {
    writeFileSync(f, '[]', 'utf-8');
  }
}

const PROJECT_ROOT = detectProjectRoot();
const state = readProjectState(PROJECT_ROOT);

// 输出铁律上下文（始终输出）
printIronLawsContext();

if (state) {
  hookPrint('');
  hookPrint('<CHAOS_HARNESS_STATE_RECOVERY>');
  hookPrint(`项目状态文件已检测到: ${join(PROJECT_ROOT, '.chaos-harness', 'state.json')}`);
  hookPrint('');
  hookPrint('**建议操作:**');
  hookPrint("使用 /chaos-harness:project-state 或说 '继续上次进度' 恢复会话。");
  hookPrint('');
  hookPrint('**快速状态:**');
  hookPrint(`- 项目: ${state.project_name || 'Unknown'}`);
  hookPrint(`- 版本: ${state.current_version || '未设置'}`);
  hookPrint(`- 阶段: ${state.workflow?.current_stage || '未开始'}`);
  hookPrint(`- 上次会话: ${state.last_session || 'N/A'}`);
  hookPrint('</CHAOS_HARNESS_STATE_RECOVERY>');
} else {
  hookPrint('');
  hookPrint('<CHAOS_HARNESS_NEW_PROJECT>');
  hookPrint('未检测到项目状态文件。');
  hookPrint('');
  hookPrint('这是一个新项目或首次使用 Chaos Harness。');
  hookPrint('');
  hookPrint('**建议操作:**');
  hookPrint('1. 使用 /chaos-harness:project-scanner 扫描项目');
  hookPrint('2. 使用 /chaos-harness:version-locker 创建版本');
  hookPrint('3. 使用 /chaos-harness:harness-generator 生成约束');
  hookPrint('');
  hookPrint("或说 '开始使用 chaos-harness' 进行初始化。");
  hookPrint('</CHAOS_HARNESS_NEW_PROJECT>');
}

// 记录会话启动
const ts = utcTimestamp();
appendLog(PLUGIN_LOG, {
  event: 'session_start',
  timestamp: ts,
  session_id: epochMs(),
  project_root: PROJECT_ROOT,
});

// ---- 自学习分析 ----
const learningLogs = readJson(LEARNING_LOG);
const ironLogs = readJson(IRON_LAW_LOG);

// 阈值：学习记录 ≥ 5 或 铁律触发 ≥ 3 → 自动分析
const shouldAnalyze = learningLogs.length >= 5 || ironLogs.length >= 3;

if (shouldAnalyze) {
  // 检查是否有已有报告
  const reportExists = existsSync(ANALYSIS_REPORT);
  let existingReport = null;
  if (reportExists) {
    try {
      existingReport = readFileSync(ANALYSIS_REPORT, 'utf-8');
    } catch { /* ignore */ }
  }

  // 运行 learning-analyzer 脚本
  const scriptPath = join(process.cwd(), 'scripts', 'learning-analyzer.mjs');
  const result = spawnSync('node', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 10000,
  });

  if (result.stdout) {
    hookPrint(result.stdout.toString());
  }

  // 输出分析摘要
  const newIronCount = ironLogs.length;
  const newLazyCount = learningLogs.length;

  hookPrint('');
  hookPrint('<CHAOS_HARNESS_LEARNING_ANALYSIS>');
  hookPrint('📊 自学习分析已自动执行');
  hookPrint(`   铁律触发: ${ironLogs.length} 条 | 学习记录: ${learningLogs.length} 条`);

  if (ironLogs.length > 0) {
    // 统计高频铁律
    const counts = {};
    for (const log of ironLogs) {
      const law = log.iron_law || log.iron_law_id || 'unknown';
      counts[law] = (counts[law] || 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    hookPrint(`   高频铁律: ${top.map(([l, c]) => `${l}(${c}次)`).join(', ')}`);
  }

  hookPrint(`   完整报告: ${ANALYSIS_REPORT}`);
  hookPrint('</CHAOS_HARNESS_LEARNING_ANALYSIS>');
}

// ---- 自适应 Harness 优化 ----
const ADAPTIVE_SCRIPT = join(PROJECT_ROOT, 'scripts', 'adaptive-harness.mjs');
const SUGGESTIONS_PATH = join(GLOBAL_DATA_DIR, 'analysis-suggestions.json');
if (existsSync(ADAPTIVE_SCRIPT) && existsSync(SUGGESTIONS_PATH)) {
  const suggestions = readJson(SUGGESTIONS_PATH, []);
  if (suggestions.length > 0) {
    const result = spawnSync('node', [ADAPTIVE_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    });
    if (result.stdout) hookPrint(result.stdout.toString());
  }
}

// ---- 插件版本检查（快速，不阻塞） ----
const pluginSyncScript = join(PROJECT_ROOT, 'scripts', 'plugin-sync.mjs');
if (existsSync(pluginSyncScript)) {
  const result = spawnSync('node', [pluginSyncScript], {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 8000,
  });
  if (result.stdout) {
    const output = result.stdout.toString();
    if (output.includes('🔄') || output.includes('可更新')) {
      hookPrint('');
      hookPrint('<CHAOS_HARNESS_PLUGIN_UPDATE>');
      const updateLines = output.split('\n').filter(l => l.includes('🔄'));
      for (const line of updateLines) hookPrint(line);
      hookPrint('运行以下命令同步更新:');
      hookPrint('   node scripts/plugin-sync.mjs web-access --sync');
      hookPrint('</CHAOS_HARNESS_PLUGIN_UPDATE>');
    }
  }
}

process.exit(0);
