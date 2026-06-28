#!/usr/bin/env node
// eval-collector.mjs — PostToolUse Hook：评测结果采集器
// 触发工具：Bash
// 追踪测试命令执行结果，自动更新 eval 状态

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { recordResult, getAllEvals } from './eval-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const EVAL_LOG = join(PROJECT_ROOT, 'evals', 'results', 'eval-log.jsonl');

mkdirSync(join(PROJECT_ROOT, 'evals', 'results'), { recursive: true });

const toolName = process.env.CLAUDE_TOOL_NAME || 'unknown';
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
const toolOutput = process.env.CLAUDE_TOOL_OUTPUT || '';

async function main() {
  if (toolName !== 'Bash') return;

  const isTestCommand = detectTestCommand(toolInput);
  if (!isTestCommand) return;

  const result = parseTestResult(toolOutput);

  logEvalEvent({
    command: truncate(toolInput, 200),
    result,
    timestamp: new Date().toISOString()
  });

  tryAutoMatchEval(toolInput, result);
}

function detectTestCommand(input) {
  const patterns = [
    /npm test/i,
    /yarn test/i,
    /pnpm test/i,
    /pytest/i,
    /go test/i,
    /mocha/i,
    /jest/i,
    /vitest/i,
    /mvn test/i,
    /gradle test/i,
    /node --test/i,
    /test:/i
  ];
  return patterns.some(p => p.test(input));
}

function parseTestResult(output) {
  if (!output) return { status: 'unknown', details: 'no output' };

  const passMatch = output.match(/(\d+)\s*passed/);
  const failMatch = output.match(/(\d+)\s*failed/);

  if (failMatch && parseInt(failMatch[1]) > 0) {
    return { status: 'FAIL', pass_count: passMatch ? parseInt(passMatch[1]) : 0, fail_count: parseInt(failMatch[1]) };
  }
  if (passMatch) {
    return { status: 'PASS', pass_count: parseInt(passMatch[1]) };
  }

  if (output.includes('FAIL') || output.includes('FAILED') || output.includes('Error:')) {
    return { status: 'FAIL', details: truncate(output, 500) };
  }
  if (output.includes('PASS') || output.includes('OK') || output.includes('All tests passed')) {
    return { status: 'PASS', details: truncate(output, 200) };
  }

  return { status: 'unknown', details: truncate(output, 500) };
}

function logEvalEvent(event) {
  try {
    appendFileSync(EVAL_LOG, JSON.stringify(event) + '\n');
  } catch (e) {
    // 文件系统只读时静默失败
  }
}

function truncate(str, max) {
  return str?.length > max ? str.substring(0, max) + '...' : (str || '');
}

function tryAutoMatchEval(command, result) {
  const evals = getAllEvals().filter(e => e.status !== 'passed');
  if (evals.length === 0) return;

  // 简单匹配：如果命令中包含评测名称的关键词
  for (const evalEntry of evals) {
    const nameKeywords = evalEntry.name.toLowerCase().split(/[-_]/);
    const commandLower = command.toLowerCase();
    const match = nameKeywords.some(k => k.length > 3 && commandLower.includes(k));

    if (match) {
      recordResult(evalEntry.id, {
        scorer_type: 'auto',
        result: result.status === 'PASS' ? 'PASS' : 'FAIL',
        score: result.status === 'PASS' ? 1.0 : 0.0,
        details: `Auto-detected from command: ${truncate(command, 100)}`
      });
    }
  }
}

main().catch(console.error);
