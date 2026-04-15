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
import { basename } from 'node:path';

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

  // P03 阶段智能提示
  const currentStage = state.workflow?.current_stage || '';
  const stagesCompleted = state.workflow?.stages_completed || [];
  const hasP02 = stagesCompleted.some(s => s.stage && (s.stage.includes('P02') || s.stage.includes('W02')));
  if (currentStage === 'P03' && hasP02) {
    hookPrint('');
    hookPrint('**P03 原型设计阶段已就绪:**');
    hookPrint("说 '生成界面' 启动 UI 生成（从 PRD 自动生成可运行的前端代码）");
    hookPrint("说 '查看工作流' 了解当前阶段详情");
  }

  // P03 设计完成 → 推荐 Multi-Agent 设计评审
  if (PROJECT_ROOT && currentStage === 'P03') {
    const p03MemoryPath = join(PROJECT_ROOT, 'output', 'v1', 'memory', 'P03-memory.yaml');
    if (existsSync(p03MemoryPath)) {
      const p03Content = readFileSync(p03MemoryPath, 'utf-8');
      if (p03Content.includes('ui_generated: true')) {
        // 检查是否已有评审通过记录
        if (!p03Content.includes('design_review_passed: true')) {
          hookPrint('');
          hookPrint('<CHAOS_HARNESS_DESIGN_REVIEW_READY>');
          hookPrint('📋 P03 设计产出物已就绪，建议启动 Multi-Agent 设计评审：');
          hookPrint('   - 产品经理: 需求覆盖率、用户故事完整性');
          hookPrint('   - 用户倡导者: 用户体验、可访问性');
          hookPrint('   - 设计师: 设计规范一致性、技术可行性');
          hookPrint("说 '启动设计评审' 自动分配 3 个评审 Agent");
          hookPrint('</CHAOS_HARNESS_DESIGN_REVIEW_READY>');
        }
      }
    }
  }

  // P04 技术完成 → 推荐 Multi-Agent 技术评审
  if (PROJECT_ROOT && currentStage === 'P04') {
    const techDir = join(PROJECT_ROOT, 'output', 'v1', 'tech');
    const hasArch = existsSync(join(techDir, 'architecture.md'));
    const hasApi = existsSync(join(techDir, 'api-design.md'));
    if (hasArch && hasApi) {
      // 检查是否已有评审通过记录
      const p04MemoryPath = join(PROJECT_ROOT, 'output', 'v1', 'memory', 'P04-memory.yaml');
      let reviewed = false;
      if (existsSync(p04MemoryPath)) {
        const p04Content = readFileSync(p04MemoryPath, 'utf-8');
        reviewed = p04Content.includes('tech_review_passed: true');
      }
      if (!reviewed) {
        hookPrint('');
        hookPrint('<CHAOS_HARNESS_TECH_REVIEW_READY>');
        hookPrint('📋 P04 技术产出物已就绪，建议启动 Multi-Agent 技术评审：');
        hookPrint('   - 架构师: 架构合理性、可扩展性');
        hookPrint('   - 安全专家: 安全风险、数据泄露');
        hookPrint('   - 高级开发: 实现可行性、技术债务');
        hookPrint("说 '启动技术评审' 自动分配 3 个评审 Agent");
        hookPrint('</CHAOS_HARNESS_TECH_REVIEW_READY>');
      }
    }
  }

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

// ---- 超频模式状态恢复 ----
const OVERDRIVE_STATE = join(GLOBAL_DATA_DIR, 'overdrive-state.json');
if (existsSync(OVERDRIVE_STATE)) {
  const odState = readJson(OVERDRIVE_STATE);
  if (odState && odState.active) {
    hookPrint('');
    hookPrint('<HARNESS_OVERDRIVE_RESUME>');
    hookPrint('⚡ 超频模式持续激活中（自 ' + odState.activated_at + '）');
    hookPrint('说 "退出超频" 或 "overdrive off" 关闭');
    hookPrint('</HARNESS_OVERDRIVE_RESUME>');
  }
}

process.exit(0);
