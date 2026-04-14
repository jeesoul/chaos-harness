#!/usr/bin/env node
/**
 * learning-analyzer — 自学习分析引擎
 * 读取所有日志，分析失败模式，生成 analysis-report.md
 *
 * 调用: node learning-analyzer.mjs
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  readJson,
  appendLog,
  detectProjectRoot,
  utcTimestamp,
  hookPrint,
} from './hook-utils.mjs';

import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

ensureDir(GLOBAL_DATA_DIR);

const IRON_LAW_LOG = join(GLOBAL_DATA_DIR, 'iron-law-log.json');
const LAZINESS_LOG = join(GLOBAL_DATA_DIR, 'laziness-log.json');
const LEARNING_LOG = join(GLOBAL_DATA_DIR, 'learning-log.json');

const ironLogs = readJson(IRON_LAW_LOG);
const lazyLogs = readJson(LAZINESS_LOG);
const learnLogs = readJson(LEARNING_LOG);

// ---- 分析 ----

// 1. 铁律触发统计
const ironLawCounts = {};
const ironLawContexts = {};
for (const log of ironLogs) {
  const law = log.iron_law || log.iron_law_id || 'unknown';
  ironLawCounts[law] = (ironLawCounts[law] || 0) + 1;
  if (!ironLawContexts[law]) ironLawContexts[law] = [];
  if (log.context) ironLawContexts[law].push(log.context);
}

// 2. 偷懒模式统计
const lazyCounts = {};
for (const log of lazyLogs) {
  const pattern = log.pattern_id || log.pattern || log.event || 'unknown';
  lazyCounts[pattern] = (lazyCounts[pattern] || 0) + 1;
}

// 3. 操作类型统计
const toolCounts = {};
const fileTypeCounts = {};
for (const log of learnLogs) {
  if (log.tool) toolCounts[log.tool] = (toolCounts[log.tool] || 0) + 1;
  if (log.file_type) fileTypeCounts[log.file_type] = (fileTypeCounts[log.file_type] || 0) + 1;
}

// 4. 识别重复违规（铁律触发 3+ 次）
const repeatViolations = Object.entries(ironLawCounts)
  .filter(([, count]) => count >= 3)
  .map(([law, count]) => ({ law, count }));

// 5. 识别系统性问题（同一文件类型频繁触发）
const systemicIssues = Object.entries(fileTypeCounts)
  .filter(([, count]) => count >= 10)
  .map(([type, count]) => ({ type, count }));

// ---- 生成建议 ----

const suggestions = [];

// 铁律频繁违规 → 强化铁律
for (const { law, count } of repeatViolations) {
  const contexts = ironLawContexts[law] || [];
  const topContext = contexts.length > 0 ? contexts[0] : '';
  suggestions.push({
    priority: 'high',
    type: 'iron_law_reinforce',
    law,
    violation_count: count,
    top_context: topContext,
    action: '强化 Hook 拦截规则，增加提示文案',
  });
}

// 偷懒模式频繁 → 新增检测
for (const [pattern, count] of Object.entries(lazyCounts)) {
  if (count >= 2) {
    suggestions.push({
      priority: 'medium',
      type: 'laziness_detect',
      pattern,
      count,
      action: '新增对应检测规则到 laziness-detect hook',
    });
  }
}

// 特定文件类型高频操作 → 项目经验积累
for (const { type, count } of systemicIssues) {
  suggestions.push({
    priority: 'low',
    type: 'project_pattern',
    file_type: type,
    count,
    action: '积累该类型文件的操作经验到 project-patterns',
  });
}

// ---- 输出报告 ----

const reportLines = [
  `# 自学习分析报告`,
  ``,
  `生成时间: ${utcTimestamp()}`,
  ``,
  `## 数据概览`,
  ``,
  `- 铁律触发记录: ${ironLogs.length} 条`,
  `- 偷懒检测记录: ${lazyLogs.length} 条`,
  `- 学习操作记录: ${learnLogs.length} 条`,
  ``,
  `## 铁律触发统计`,
  ``,
];

for (const [law, count] of Object.entries(ironLawCounts).sort((a, b) => b[1] - a[1])) {
  const contexts = ironLawContexts[law] || [];
  reportLines.push(`- **${law}**: ${count} 次 — 典型上下文: ${contexts[0] || '无'}`);
}

reportLines.push('', '## 偷懒模式统计', '');
for (const [pattern, count] of Object.entries(lazyCounts).sort((a, b) => b[1] - a[1])) {
  reportLines.push(`- **${pattern}**: ${count} 次`);
}

reportLines.push('', '## 操作类型分布', '');
for (const [tool, count] of Object.entries(toolCounts).sort((a, b) => b[1] - a[1])) {
  reportLines.push(`- **${tool}**: ${count} 次`);
}

reportLines.push('', '## 文件类型分布', '');
for (const [type, count] of Object.entries(fileTypeCounts).sort((a, b) => b[1] - a[1])) {
  reportLines.push(`- **${type}**: ${count} 次`);
}

reportLines.push('', '## 优化建议', '');
if (suggestions.length === 0) {
  reportLines.push('暂无建议。数据积累中。');
} else {
  for (const s of suggestions) {
    const icon = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
    reportLines.push(`${icon} **[${s.priority}]** ${s.type}: ${s.action}`);
    if (s.law) reportLines.push(`   铁律: ${s.law} (违规 ${s.violation_count} 次)`);
    if (s.pattern) reportLines.push(`   模式: ${s.pattern} (检测 ${s.count} 次)`);
    if (s.file_type) reportLines.push(`   类型: ${s.file_type} (操作 ${s.count} 次)`);
    reportLines.push('');
  }
}

reportLines.push('');

const reportContent = reportLines.join('\n');

// 写入全局 analysis-report.md
const reportPath = join(GLOBAL_DATA_DIR, 'analysis-report.md');
writeFileSync(reportPath, reportContent, 'utf-8');

// 同时尝试写入项目版本目录
const projectRoot = detectProjectRoot();
const statePath = join(projectRoot, '.chaos-harness', 'state.json');
const state = readJson(statePath, null);
if (state && state.current_version) {
  const versionDir = join(projectRoot, 'output', state.current_version);
  mkdirSync(versionDir, { recursive: true });
  const versionReportPath = join(versionDir, 'analysis-report.md');
  writeFileSync(versionReportPath, reportContent, 'utf-8');
}

// 输出摘要
hookPrint('');
hookPrint('<CHAOS_HARNESS_ANALYSIS>');
hookPrint('📊 自学习分析完成');
hookPrint(`   铁律触发: ${ironLogs.length} 条 | 偷懒检测: ${lazyLogs.length} 条 | 学习记录: ${learnLogs.length} 条`);
hookPrint(`   优化建议: ${suggestions.length} 条`);
if (repeatViolations.length > 0) {
  hookPrint(`   ⚠️ 重复违规: ${repeatViolations.map(v => `${v.law}(${v.count}次)`).join(', ')}`);
}
hookPrint(`   报告已写入: ${reportPath}`);
hookPrint('</CHAOS_HARNESS_ANALYSIS>');

// 记录分析事件
appendLog(LEARNING_LOG, {
  event: 'analysis_completed',
  records_analyzed: learnLogs.length,
  iron_law_triggers: ironLogs.length,
  laziness_detections: lazyLogs.length,
  suggestions_count: suggestions.length,
  report_path: reportPath,
  timestamp: utcTimestamp(),
});

process.exit(0);
