#!/usr/bin/env node
/**
 * adaptive-harness — 自适应 Harness 优化引擎
 * 读取 analysis-suggestions.json，自动应用高优先级建议
 *
 * 调用: node adaptive-harness.mjs
 *   node adaptive-harness.mjs              # 检查并应用自适应建议
 *   node adaptive-harness.mjs --dry-run   # 仅预览，不应用
 */

import {
  GLOBAL_DATA_DIR,
  ensureDir,
  readJson,
  detectProjectRoot,
  readProjectState,
  utcTimestamp,
  hookPrint,
  appendLog,
} from './hook-utils.mjs';

import { join } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

ensureDir(GLOBAL_DATA_DIR);

const SUGGESTIONS_PATH = join(GLOBAL_DATA_DIR, 'analysis-suggestions.json');
const IRON_LAWS_PATH = join(GLOBAL_DATA_DIR, 'iron-laws.yaml');
const LEARNING_LOG = join(GLOBAL_DATA_DIR, 'learning-log.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// ---- 读取建议 ----

const suggestions = readJson(SUGGESTIONS_PATH, []);
if (suggestions.length === 0) {
  hookPrint('');
  hookPrint('<CHAOS_HARNESS_ADAPTIVE>');
  hookPrint('🔍 自适应模式：无可用建议。继续积累学习数据。');
  hookPrint(`   学习记录: ${readJson(LEARNING_LOG, []).length} 条`);
  hookPrint('   阈值：learning-log ≥ 5 条触发分析，分析有建议时触发优化');
  hookPrint('</CHAOS_HARNESS_ADAPTIVE>');
  process.exit(0);
}

// 按优先级分组
const highPriority = suggestions.filter(s => s.priority === 'high');
const mediumPriority = suggestions.filter(s => s.priority === 'medium');
const lowPriority = suggestions.filter(s => s.priority === 'low');

hookPrint('');
hookPrint('<CHAOS_HARNESS_ADAPTIVE>');
hookPrint(`📦 自适应模式：发现 ${suggestions.length} 条优化建议`);
hookPrint(`   🔴 高优先级: ${highPriority.length} 条（自动应用）`);
hookPrint(`   🟡 中优先级: ${mediumPriority.length} 条（提示确认）`);
hookPrint(`   🟢 低优先级: ${lowPriority.length} 条（记录观察）`);
hookPrint('');

const applied = [];
const pending = [];
const notes = [];

// ---- 应用高优先级建议：铁律强化 ----

for (const suggestion of highPriority) {
  if (suggestion.type === 'iron_law_reinforce') {
    const law = suggestion.law;
    const count = suggestion.violation_count;
    const context = suggestion.top_context;

    hookPrint(`🔴 [high] 强化铁律: ${law}（违规 ${count} 次）`);
    hookPrint(`   典型上下文: ${context || '无'}`);

    if (dryRun) {
      hookPrint(`   [dry-run] 将更新 ${IRON_LAWS_PATH}`);
      applied.push({ law, action: '强化（dry-run）', reason: `${count} 次违规` });
      continue;
    }

    // 读取或初始化 iron-laws.yaml
    let ironLawsContent = '';
    if (existsSync(IRON_LAWS_PATH)) {
      ironLawsContent = readFileSync(IRON_LAWS_PATH, 'utf-8');
    } else {
      ironLawsContent = `# Chaos Harness 自定义铁律\n# 由 adaptive-harness 自动生成\n\ncustom_iron_laws:\n`;
    }

    // 检查是否已有该铁律的自适应记录
    const existingKey = `adaptive_reinforce_${law}`;
    if (ironLawsContent.includes(existingKey)) {
      hookPrint(`   ⚠️ 该铁律已被强化过，跳过`);
      notes.push(`${law}: 已强化，跳过`);
      continue;
    }

    // 追加自适应强化规则
    const newRule = [
      `  - id: ${existingKey}`,
      `    iron_law: ${law}`,
      `    violation_count: ${count}`,
      `    context: ${context || '未指定'}`,
      `    action: "强化 Hook 拦截规则，增加提示文案"`,
      `    adaptive_added: true`,
      `    added_at: ${utcTimestamp()}`,
      `    status: "reinforced"`,
    ].join('\n');

    ironLawsContent += '\n' + newRule + '\n';
    writeFileSync(IRON_LAWS_PATH, ironLawsContent, 'utf-8');

    hookPrint(`   ✅ 已写入 ${IRON_LAWS_PATH}`);
    applied.push({
      law,
      action: '已强化',
      reason: `${count} 次违规 - 典型上下文: ${context}`,
      yaml_id: existingKey,
    });
  }
}

// ---- 中优先级建议：提示确认 ----

for (const suggestion of mediumPriority) {
  if (suggestion.type === 'laziness_detect') {
    hookPrint(`🟡 [medium] 新增偷懒检测: ${suggestion.pattern}（检测 ${suggestion.count} 次）`);
    hookPrint(`   建议: ${suggestion.action}`);
    pending.push({
      pattern: suggestion.pattern,
      action: suggestion.action,
      reason: `${suggestion.count} 次检测`,
    });
  }
}

// ---- 低优先级建议：记录观察 ----

for (const suggestion of lowPriority) {
  if (suggestion.type === 'project_pattern') {
    hookPrint(`🟢 [low] 项目经验: ${suggestion.file_type}（操作 ${suggestion.count} 次）`);
    hookPrint(`   建议: ${suggestion.action}`);
    notes.push(`${suggestion.file_type}: 已标记为观察项`);
  }
}

// ---- 生成优化报告 ----

const reportPath = join(GLOBAL_DATA_DIR, 'adaptive-report.md');
const reportLines = [
  `# 自适应优化报告`,
  ``,
  `生成时间: ${utcTimestamp()}`,
  ``,
  `## 已应用（${applied.length} 条）`,
  ``,
];

if (applied.length === 0) {
  reportLines.push('无新增优化。');
} else {
  for (const a of applied) {
    reportLines.push(`- **${a.law}**: ${a.action} — 原因: ${a.reason}`);
  }
}

reportLines.push('', `## 待确认（${pending.length} 条）`, '');
if (pending.length === 0) {
  reportLines.push('无待确认项。');
} else {
  for (const p of pending) {
    reportLines.push(`- **${p.pattern}**: ${p.action} — 原因: ${p.reason}`);
  }
}

reportLines.push('', `## 观察记录（${notes.length} 条）`, '');
if (notes.length === 0) {
  reportLines.push('无观察记录。');
} else {
  for (const n of notes) {
    reportLines.push(`- ${n}`);
  }
}

reportLines.push('');

writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');

// 同时写入项目版本目录
const projectRoot = detectProjectRoot();
const state = readProjectState(projectRoot);
if (state && state.current_version) {
  const versionDir = join(projectRoot, 'output', state.current_version);
  mkdirSync(versionDir, { recursive: true });
  const versionReportPath = join(versionDir, 'adaptive-report.md');
  writeFileSync(versionReportPath, reportLines.join('\n'), 'utf-8');
}

// 输出摘要
if (dryRun) {
  hookPrint('');
  hookPrint('🔍 dry-run 模式：未实际修改任何文件');
}

hookPrint(`✅ 自适应优化完成: ${applied.length} 条已应用`);
if (pending.length > 0) hookPrint(`⏳ ${pending.length} 条待确认`);
hookPrint(`📝 报告: ${reportPath}`);
hookPrint('</CHAOS_HARNESS_ADAPTIVE>');

// 记录自适应事件
appendLog(LEARNING_LOG, {
  event: 'adaptive_applied',
  applied_count: applied.length,
  pending_count: pending.length,
  report_path: reportPath,
  details: applied,
  timestamp: utcTimestamp(),
});

process.exit(0);
