#!/usr/bin/env node
/**
 * gate-enforcer — Gate 执行层
 * 根据验证结果决定 exit 1（硬阻断）还是 exit 0（软警告）
 *
 * 调用: node gate-enforcer.mjs <gate-id> [--root <project-root>]
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolvePluginRoot, resolveProjectRoot } from './path-utils.mjs';
import { readJson, writeJson, ensureDir, computeFileHash } from './hook-utils.mjs';
import { validateGate, loadRegistry, loadGateState, isCacheValid } from './gate-validator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolvePluginRoot();

/**
 * 保存 Gate 状态
 */
function saveGateState(gateId, state, dir) {
  ensureDir(dir);
  const statePath = join(dir, `${gateId}.json`);
  writeJson(statePath, state);
}

/**
 * 获取验证器失败的诊断建议
 */
function getDiagnosticAdvice(validatorType, reason, details) {
  const advice = {
    'coverage-threshold': {
      icon: '📊',
      suggestion: '运行测试并生成覆盖率报告',
      commands: [
        'npm test -- --coverage',
        'mvn test jacoco:report',
        'pytest --cov=src --cov-report=html',
      ],
      docs: '覆盖率报告路径: coverage/coverage-summary.json 或 coverage/lcov.info',
    },
    'no-todo-critical': {
      icon: '📝',
      suggestion: '解决代码中的关键 TODO 标记',
      commands: [
        'grep -r "TODO(critical)" src/',
        'grep -r "FIXME" src/',
      ],
      docs: '建议：在提交前解决所有 FIXME 和 TODO(critical)',
    },
    'security-audit': {
      icon: '🔒',
      suggestion: '修复安全漏洞',
      commands: [
        'npm audit fix',
        'npm audit fix --force  # 强制更新（可能破坏兼容性）',
      ],
      docs: '查看详细报告: npm audit --json',
    },
    'architecture-layer': {
      icon: '🏗️',
      suggestion: '修复架构分层违规',
      commands: [],
      docs: '建议：Controller → Service → Repository，避免跨层调用',
    },
    'branch-naming': {
      icon: '🌿',
      suggestion: '重命名分支以符合团队规范',
      commands: [
        'git branch -m <new-branch-name>',
        'git push origin -u <new-branch-name>',
      ],
      docs: '推荐格式: feature/xxx, fix/xxx, chore/xxx',
    },
    'commit-message': {
      icon: '💬',
      suggestion: '修改最近的 commit 信息',
      commands: [
        'git commit --amend -m "feat: your message"',
        'git rebase -i HEAD~3  # 修改最近 3 条',
      ],
      docs: '推荐格式: feat/fix/chore/docs/refactor/test: description',
    },
    'no-syntax-errors': {
      icon: '🔧',
      suggestion: '修复语法错误',
      commands: [
        'npm run lint',
        'mvn compile',
      ],
      docs: '运行编译/lint 工具查看详细错误',
    },
    'test-suite-pass': {
      icon: '🧪',
      suggestion: '修复失败的测试',
      commands: [
        'npm test',
        'mvn test',
        'pytest',
      ],
      docs: '查看测试输出，定位失败原因',
    },
    'prd-quality-check': {
      icon: '📋',
      suggestion: '完善 PRD 文档',
      commands: [],
      docs: '必须包含: 验收标准、性能指标、数据模型、错误处理',
    },
  };

  return advice[validatorType] || {
    icon: '💡',
    suggestion: '查看详细错误信息',
    commands: [],
    docs: '',
  };
}

/**
 * 输出 Gate 失败信息（增强版：包含诊断建议）
 */
function printFailure(gateDef, result) {
  process.stderr.write(`\n${'═'.repeat(70)}\n`);
  process.stderr.write(`❌ GATE FAILED: ${gateDef.id}\n`);
  process.stderr.write(`${'═'.repeat(70)}\n`);
  process.stderr.write(`描述: ${gateDef.description}\n`);
  process.stderr.write(`级别: ${gateDef.level.toUpperCase()} (阻断)\n`);
  process.stderr.write(`\n`);

  const failedValidators = result.results.filter(r => r.status === 'failed');

  // 输出失败详情
  process.stderr.write(`失败的验证器 (${failedValidators.length}):\n`);
  process.stderr.write(`${'─'.repeat(70)}\n`);

  for (const r of failedValidators) {
    process.stderr.write(`\n  ❌ ${r.type}\n`);
    process.stderr.write(`     原因: ${r.reason}\n`);

    // 输出详细信息（前 5 条）
    if (r.details && Array.isArray(r.details) && r.details.length > 0) {
      process.stderr.write(`     详情:\n`);
      for (const d of r.details.slice(0, 5)) {
        if (typeof d === 'object') {
          if (d.file) {
            process.stderr.write(`       • ${d.file}${d.line ? `:${d.line}` : ''}`);
            if (d.error || d.pattern) {
              process.stderr.write(` — ${d.error || d.pattern}`);
            }
            process.stderr.write('\n');
          } else {
            process.stderr.write(`       • ${JSON.stringify(d).slice(0, 80)}\n`);
          }
        } else {
          process.stderr.write(`       • ${String(d).slice(0, 100)}\n`);
        }
      }
      if (r.details.length > 5) {
        process.stderr.write(`       ... 还有 ${r.details.length - 5} 条\n`);
      }
    }

    // 诊断建议
    const advice = getDiagnosticAdvice(r.type, r.reason, r.details);
    process.stderr.write(`\n     ${advice.icon} 修复建议: ${advice.suggestion}\n`);

    if (advice.commands && advice.commands.length > 0) {
      process.stderr.write(`     命令:\n`);
      for (const cmd of advice.commands) {
        process.stderr.write(`       $ ${cmd}\n`);
      }
    }

    if (advice.docs) {
      process.stderr.write(`     说明: ${advice.docs}\n`);
    }
  }

  process.stderr.write(`\n${'═'.repeat(70)}\n`);
  process.stderr.write(`💡 提示: 修复后运行 /gate-manager recheck ${gateDef.id}\n`);
  process.stderr.write(`${'═'.repeat(70)}\n\n`);
}

/**
 * 输出 Gate 警告信息（soft）
 */
function printWarning(gateDef, result) {
  process.stderr.write(`\n[GATE WARNING] ${gateDef.id}: ${gateDef.description}\n`);
  for (const r of result.results) {
    if (r.status === 'failed') {
      process.stderr.write(`  WARN ${r.type}: ${r.reason}\n`);
    }
  }
  process.stderr.write('\n');
}

/**
 * 主入口
 */
function main() {
  const args = process.argv.slice(2);
  const gateId = args.find(a => !a.startsWith('--'));
  const rootIdx = args.indexOf('--root');
  const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : resolveProjectRoot() || process.cwd();

  if (!gateId) {
    process.stderr.write('Usage: node gate-enforcer.mjs <gate-id> [--root <project-root>]\n');
    process.exit(1);
  }

  const registry = loadRegistry();
  const gateDef = registry.gates.find(g => g.id === gateId);
  if (!gateDef) {
    process.stderr.write(`Gate not found: ${gateId}\n`);
    process.exit(1);
  }

  // 检查缓存 — 使用项目级的 .chaos-harness/gates/ 而非插件级的
  const projectGatesDir = join(projectRoot, '.chaos-harness', 'gates');
  const state = readJson(join(projectGatesDir, `${gateId}.json`), null);
  if (isCacheValid(gateDef, state)) {
    process.exit(0);
  }

  // 执行验证
  const result = validateGate(gateDef, projectRoot);

  if (result.allPassed) {
    // 计算 fileHashes（仅对非 glob 路径）
    const fileHashes = {};
    for (const v of gateDef.validators) {
      if (v.path && !v.path.includes('*')) {
        const hash = computeFileHash(v.path);
        if (hash) fileHashes[v.path] = hash;
      }
    }

    saveGateState(gateId, {
      id: gateId,
      status: 'passed',
      lastChecked: new Date().toISOString(),
      projectRoot,
      fileHashes,
      result: { results: result.results },
    }, projectGatesDir);
    process.exit(0);
  }

  // 验证失败
  if (gateDef.level === 'hard') {
    printFailure(gateDef, result);
    process.exit(1);
  } else {
    printWarning(gateDef, result);
    // soft Gate 失败仍然记录状态
    saveGateState(gateId, {
      id: gateId,
      status: 'soft-fail',
      lastChecked: new Date().toISOString(),
      projectRoot,
      result: { results: result.results },
    }, projectGatesDir);
    process.exit(0);
  }
}

// CLI 模式
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
