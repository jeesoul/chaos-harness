#!/usr/bin/env node
// intent-analyzer.mjs — PreToolUse Hook：意图分析器
// 触发时机：所有工具使用前
// 功能：分析操作意图，匹配禁止理由表，输出警告（不阻断）

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const INTENT_LOG = join(PROJECT_ROOT, '.chaos-harness', 'intent-log.jsonl');

mkdirSync(join(PROJECT_ROOT, '.chaos-harness'), { recursive: true });

const toolName = process.env.CLAUDE_TOOL_NAME || 'unknown';
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';

// 禁止理由表
const BYPASS_PATTERNS = {
  IL001: [
    {
      excuse: /就这一次|快速处理|临时文件|temporary|just this once|quick fix/i,
      rebuttal: 'IL001 没有例外。如果紧急，使用 /overdrive 激活紧急模式。临时文件也应放在 output/vX.X.X/temp/',
      severity: 'critical'
    },
    {
      excuse: /跳过|绕过|bypass|skip/i,
      rebuttal: 'IL001 不可跳过。所有输出必须在版本目录下。',
      severity: 'critical'
    }
  ],
  IL002: [
    {
      excuse: /我已经了解|不需要扫描|already know/i,
      rebuttal: '主观了解不够，需要扫描数据确认。运行 node scripts/project-scanner.mjs 快速扫描。',
      severity: 'warning'
    }
  ],
  IL004: [
    {
      excuse: /更新版本|升级版本|bump version/i,
      rebuttal: 'IL004: 版本变更需要用户确认。禁止擅自更改版本号。',
      severity: 'critical'
    }
  ],
  IL005: [
    {
      excuse: /修改.*配置|change.*config|modify.*hook/i,
      rebuttal: 'IL005: 敏感配置修改需要批准。包括 hooks.json、harness.yaml 等。',
      severity: 'critical'
    }
  ],
  'IL-TEAM005': [
    {
      excuse: /太简单|不需要.*agent|too simple|no need.*agent/i,
      rebuttal: 'IL-TEAM005: 简单任务也需要并行验证。使用 /agent-team-orchestrator 分配最少 2 个 Agent。',
      severity: 'critical'
    },
    {
      excuse: /子 Agent|直接做|do it myself/i,
      rebuttal: 'LP007 检测已触发。正确做法：重新 spawn / 追加冗余 Agent / 只汇总结果。',
      severity: 'critical'
    }
  ]
};

// 检测意图
function analyzeIntent(tool, input) {
  const violations = [];

  // 检测 IL001: 写入非版本目录文件
  if (tool === 'Write' || tool === 'Edit') {
    const filePath = extractFilePath(input);
    if (filePath && isNonVersionedPath(filePath)) {
      violations.push({
        law: 'IL001',
        description: '尝试写入非版本目录文件',
        file: filePath,
        suggestions: [`将文件放在 output/v1.3.1/ 目录下`]
      });
    }
  }

  // 检测 IL005: 修改高风险配置
  if ((tool === 'Write' || tool === 'Edit') && isHighRiskConfig(input)) {
    violations.push({
      law: 'IL005',
      description: '尝试修改敏感配置',
      file: extractFilePath(input) || 'unknown',
      suggestions: ['此操作需要用户批准']
    });
  }

  // 检测 IL004: 版本号变更
  if ((tool === 'Write' || tool === 'Edit') && input.includes('"version"')) {
    violations.push({
      law: 'IL004',
      description: '尝试修改版本号',
      file: extractFilePath(input) || 'unknown',
      suggestions: ['版本变更需要用户确认']
    });
  }

  // 检测 IL-TEAM005: 单线程退化
  if (tool === 'Agent' && input.includes('subagent_type') && !input.includes('parallel')) {
    violations.push({
      law: 'IL-TEAM005',
      description: '可能单线程执行（未指定并行）',
      suggestions: ['考虑使用并行 Agent 执行']
    });
  }

  // 匹配禁止理由表
  const bypassMatches = [];
  for (const [lawId, patterns] of Object.entries(BYPASS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.excuse.test(input)) {
        bypassMatches.push({
          law: lawId,
          severity: pattern.severity,
          rebuttal: pattern.rebuttal
        });
      }
    }
  }

  return { violations, bypassMatches, tool, timestamp: new Date().toISOString() };
}

function extractFilePath(input) {
  const match = input.match(/"file_path"\s*:\s*"([^"]+)"/);
  return match ? match[1] : null;
}

function isNonVersionedPath(filePath) {
  const excluded = [
    'output/v', '.chaos-harness', 'instincts/', 'evals/',
    'schemas/', 'skills/', 'scripts/', 'commands/', 'hooks/',
    'templates/', 'node_modules/'
  ];
  return !excluded.some(dir => filePath.includes(dir));
}

function isHighRiskConfig(input) {
  return input.includes('hooks.json') ||
         input.includes('harness.yaml') ||
         input.includes('CLAUDE.md') ||
         input.includes('package.json');
}

// 主流程
const result = analyzeIntent(toolName, toolInput);

// 记录意图
try {
  appendFileSync(INTENT_LOG, JSON.stringify(result) + '\n');
} catch (e) {}

// 输出警告
if (result.violations.length > 0 || result.bypassMatches.length > 0) {
  console.log('<INTENT_ANALYZER>');
  console.log(`⚠️ 意图分析: ${toolName} 操作检测到 ${result.violations.length} 个铁律违规风险`);
  console.log('');

  for (const v of result.violations) {
    console.log(`❌ ${v.law}: ${v.description}`);
    if (v.file) console.log(`   文件: ${v.file}`);
    for (const s of (v.suggestions || [])) {
      console.log(`   建议: ${s}`);
    }
    console.log('');
  }

  for (const m of result.bypassMatches) {
    console.log(`🚫 ${m.law} [${m.severity}]: ${m.rebuttal}`);
    console.log('');
  }

  console.log('</INTENT_ANALYZER>');
}

process.exit(0);
