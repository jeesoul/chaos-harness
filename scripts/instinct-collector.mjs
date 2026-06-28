#!/usr/bin/env node
// instinct-collector.mjs — PostToolUse Hook：直觉观测采集器
// 触发工具：Write / Edit / Bash
// 100% 确定性观测，记录行为模式

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { join, dirname, sep } from 'path';
import { fileURLToPath } from 'url';
import { createInstinct, updateInstinct, getInstinctsByType, INSTINCT_TYPES } from './instinct-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OBSERVATIONS_LOG = join(PROJECT_ROOT, 'instincts', 'observations.jsonl');

mkdirSync(join(PROJECT_ROOT, 'instincts'), { recursive: true });

// 从环境变量读取 Hook 上下文
const toolName = process.env.CLAUDE_TOOL_NAME || 'unknown';
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';

async function main() {
  logObservation({
    tool: toolName,
    input: truncate(toolInput, 500),
    timestamp: new Date().toISOString()
  });

  detectIronLawViolations();
  detectWorkflowOptimizations();
  detectCodePatterns();
}

function logObservation(obs) {
  try {
    appendFileSync(OBSERVATIONS_LOG, JSON.stringify(obs) + '\n');
  } catch (e) {
    // 文件系统只读时静默失败
  }
}

function truncate(str, max) {
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function extractFilePath(input) {
  const match = input.match(/"file_path"\s*:\s*"([^"]+)"/);
  return match ? match[1] : null;
}

function readObservationsLog() {
  if (!existsSync(OBSERVATIONS_LOG)) return [];
  try {
    return readFileSync(OBSERVATIONS_LOG, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  } catch (e) {
    return [];
  }
}

function detectIronLawViolations() {
  const patterns = [
    {
      type: INSTINCT_TYPES.IRON_LAW_VIOLATION,
      condition: () => {
        if (toolName === 'Write' || toolName === 'Edit') {
          const filePath = extractFilePath(toolInput);
          if (filePath && !filePath.includes('output/v') && !filePath.includes('.chaos-harness') && !filePath.includes('instincts/') && !filePath.includes('evals/') && !filePath.includes('schemas/') && !filePath.includes('skills/') && !filePath.includes('scripts/') && !filePath.includes('commands/') && !filePath.includes('hooks/') && !filePath.includes('templates/')) {
            return { file_pattern: filePath, violation: 'IL001' };
          }
        }
        return null;
      },
      pattern: '写入非版本目录文件'
    },
    {
      type: INSTINCT_TYPES.IRON_LAW_VIOLATION,
      condition: () => {
        if ((toolName === 'Write' || toolName === 'Edit') && toolInput.includes('hooks.json')) {
          return { file_pattern: 'hooks.json', violation: 'IL005' };
        }
        return null;
      },
      pattern: '修改 hooks 配置'
    }
  ];

  for (const p of patterns) {
    const context = p.condition();
    if (context) {
      const existing = getInstinctsByType(p.type, 0).find(i =>
        i.context.violation === context.violation && i.status === 'active'
      );

      if (existing) {
        updateInstinct(existing.id, {
          evidence: `${new Date().toISOString()}: ${toolName} → ${context.file_pattern || 'unknown'}`
        });
      } else {
        createInstinct({
          type: p.type,
          pattern: p.pattern,
          context,
          confidence: 0.3
        });
      }
    }
  }
}

function detectWorkflowOptimizations() {
  if (toolName === 'Bash') {
    const log = readObservationsLog();
    const recentSame = log.filter(o =>
      o.tool === 'Bash' &&
      o.input === truncate(toolInput, 500) &&
      new Date(o.timestamp) > new Date(Date.now() - 300000)
    );
    if (recentSame.length >= 2) {
      createInstinct({
        type: INSTINCT_TYPES.WORKFLOW_OPTIMIZATION,
        pattern: '重复执行相同命令',
        context: { command: truncate(toolInput, 100), repeat_count: recentSame.length },
        confidence: 0.3
      });
    }
  }
}

function detectCodePatterns() {
  if (toolName === 'Write') {
    const filePath = extractFilePath(toolInput);
    if (filePath) {
      const normalizedPath = filePath.replace(/\\/g, '/');
      const ext = normalizedPath.split('.').pop();
      const dir = normalizedPath.split('/').slice(0, -1).join('/');
      const existing = getInstinctsByType(INSTINCT_TYPES.CODE_PATTERN, 0).find(i =>
        i.context.file_pattern === `*.${ext}` && i.status === 'active'
      );

      if (existing) {
        updateInstinct(existing.id, {
          evidence: `${new Date().toISOString()}: Created ${dir}/*.${ext}`
        });
      } else {
        createInstinct({
          type: INSTINCT_TYPES.CODE_PATTERN,
          pattern: '文件创建模式',
          context: { file_pattern: `*.${ext}`, directory: dir },
          confidence: 0.3
        });
      }
    }
  }
}

main().catch(console.error);
