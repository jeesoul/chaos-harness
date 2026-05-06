#!/usr/bin/env node
/**
 * task-contract — 任务契约管理 CLI
 * 在 AI 开始写代码前声明意图和验收标准
 *
 * 用法:
 *   node task-contract.mjs declare --desc "..." --scope "a.js,b.js" --criteria "file-exists:a.js,no-new-fixme"
 *   node task-contract.mjs status
 *   node task-contract.mjs complete
 *   node task-contract.mjs clear
 */

import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  detectProjectRoot,
  readJson,
  writeJsonAtomic,
  ensureDir,
  utcTimestamp,
  epochMs,
  GLOBAL_DATA_DIR,
  hookPrint,
} from './hook-utils.mjs';

const CONTRACT_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 小时

function getContractPath(projectRoot) {
  return join(projectRoot, '.chaos-harness', 'task-contract.json');
}

function loadContract(projectRoot) {
  return readJson(getContractPath(projectRoot), null);
}

function saveContract(projectRoot, contract) {
  ensureDir(join(projectRoot, '.chaos-harness'));
  writeJsonAtomic(getContractPath(projectRoot), contract);
}

function isExpired(contract) {
  if (!contract || contract.status !== 'active') return false;
  const age = Date.now() - new Date(contract.created_at).getTime();
  return age > CONTRACT_EXPIRY_MS;
}

function writeContractLog(entry) {
  try {
    ensureDir(GLOBAL_DATA_DIR);
    const logPath = join(GLOBAL_DATA_DIR, 'contract-log.jsonl');
    appendFileSync(logPath, JSON.stringify({ ...entry, timestamp: utcTimestamp() }) + '\n', 'utf-8');
  } catch { /* non-critical */ }
}

// ---- 子命令 ----

function cmdDeclare(args) {
  const projectRoot = detectProjectRoot();

  const descIdx = args.indexOf('--desc');
  const scopeIdx = args.indexOf('--scope');
  const assumeIdx = args.indexOf('--assume');
  const criteriaIdx = args.indexOf('--criteria');

  const description = descIdx >= 0 ? args[descIdx + 1] : null;
  const scope = scopeIdx >= 0 ? args[scopeIdx + 1].split(',').map(s => s.trim()).filter(Boolean) : [];
  const assumptions = assumeIdx >= 0 ? args[assumeIdx + 1].split(',').map(s => s.trim()).filter(Boolean) : [];
  const successCriteria = criteriaIdx >= 0 ? args[criteriaIdx + 1].split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!description) {
    hookPrint(
      '❌ 缺少任务描述',
      '',
      '用法:',
      '  node task-contract.mjs declare \\',
      '    --desc "实现用户登录功能" \\',
      '    --scope "src/auth/LoginService.java,src/auth/LoginController.java" \\',
      '    --assume "数据库已连接,JWT 密钥已配置" \\',
      '    --criteria "file-exists:src/auth/LoginService.java,no-new-fixme"',
      '',
      '验收标准格式:',
      '  file-exists:<path>   — 检查文件是否存在',
      '  no-new-fixme         — 新增文件中无 FIXME 标记',
      '  custom:<description> — 人工确认项'
    );
    process.exit(1);
  }

  const existing = loadContract(projectRoot);
  if (existing && existing.status === 'active' && !isExpired(existing)) {
    hookPrint(
      `⚠️  已有 active 契约: ${existing.id}`,
      `   任务: ${existing.task.description}`,
      '',
      '请先完成或清除当前契约:',
      '  node task-contract.mjs complete  — 标记完成',
      '  node task-contract.mjs clear     — 放弃当前契约'
    );
    process.exit(1);
  }

  const contract = {
    id: `contract-${epochMs()}`,
    created_at: utcTimestamp(),
    status: 'active',
    task: { description, scope, assumptions, success_criteria: successCriteria },
    verification: { checked_at: null, passed: null, evidence: [] },
  };

  saveContract(projectRoot, contract);
  writeContractLog({ event: 'contract_declared', id: contract.id, description, criteria_count: successCriteria.length });

  const lines = [
    '✅ 任务契约已声明',
    '',
    `📋 契约 ID: ${contract.id}`,
    `📝 任务: ${description}`,
  ];
  if (scope.length > 0) lines.push(`📁 影响范围: ${scope.join(', ')}`);
  if (assumptions.length > 0) lines.push(`💭 假设前提: ${assumptions.join(', ')}`);
  if (successCriteria.length > 0) {
    lines.push('✔️  验收标准:');
    successCriteria.forEach(c => lines.push(`   • ${c}`));
  } else {
    lines.push('⚠️  未设置验收标准（建议添加 --criteria）');
  }
  lines.push('', '现在可以开始写代码了。完成后运行:', '  node task-contract.mjs status   — 查看验证结果', '  node task-contract.mjs complete — 标记完成');
  hookPrint(...lines);
  process.exit(0);
}

function cmdStatus() {
  const projectRoot = detectProjectRoot();
  const contract = loadContract(projectRoot);

  if (!contract) {
    hookPrint('📭 当前无任务契约', '', '声明新契约: node task-contract.mjs declare --desc "..."');
    process.exit(0);
  }

  const expired = isExpired(contract);
  const statusLabel = contract.status === 'active'
    ? (expired ? '⏰ 已过期' : '🔵 进行中')
    : { completed: '✅ 已完成', failed: '❌ 失败', expired: '⏰ 已过期' }[contract.status] || contract.status;

  hookPrint(
    '═══════════════════════════════════════',
    '  任务契约状态',
    '═══════════════════════════════════════',
    `ID:     ${contract.id}`,
    `状态:   ${statusLabel}`,
    `创建:   ${contract.created_at}`,
    '',
    `任务:   ${contract.task.description}`
  );

  if (contract.task.scope.length > 0) hookPrint(`影响:   ${contract.task.scope.join(', ')}`);
  if (contract.task.assumptions.length > 0) hookPrint(`假设:   ${contract.task.assumptions.join(', ')}`);

  if (contract.task.success_criteria.length > 0) {
    hookPrint('', '验收标准:');
    const evidence = contract.verification.evidence || [];
    for (const criterion of contract.task.success_criteria) {
      const ev = evidence.find(e => e.criterion === criterion);
      const icon = ev ? (ev.passed === true ? '  ✅' : ev.passed === false ? '  ❌' : '  ❓') : '  ⏳';
      hookPrint(`${icon} ${criterion}`);
      if (ev && ev.detail) hookPrint(`     → ${ev.detail}`);
    }
  }

  if (contract.verification.checked_at) {
    hookPrint('', `最后验证: ${contract.verification.checked_at}`);
    const vr = contract.verification.passed;
    hookPrint(`验证结果: ${vr === true ? '✅ 通过' : vr === false ? '❌ 未通过' : '❓ 部分待确认'}`);
  }

  hookPrint('═══════════════════════════════════════');
  process.exit(0);
}

function cmdComplete() {
  const projectRoot = detectProjectRoot();
  const contract = loadContract(projectRoot);

  if (!contract || contract.status !== 'active') {
    hookPrint('📭 无 active 契约可完成');
    process.exit(0);
  }

  contract.status = 'completed';
  contract.completed_at = utcTimestamp();
  saveContract(projectRoot, contract);

  writeContractLog({
    event: 'contract_completed',
    id: contract.id,
    description: contract.task.description,
    scope_declared: contract.task.scope.length,
    criteria_count: contract.task.success_criteria.length,
    criteria_passed: (contract.verification.evidence || []).filter(e => e.passed === true).length,
  });

  hookPrint(`✅ 契约 ${contract.id} 已标记完成`);
  process.exit(0);
}

function cmdClear() {
  const projectRoot = detectProjectRoot();
  const contract = loadContract(projectRoot);

  if (!contract) {
    hookPrint('📭 无契约可清除');
    process.exit(0);
  }

  const prevStatus = contract.status;
  contract.status = 'expired';
  contract.cleared_at = utcTimestamp();
  saveContract(projectRoot, contract);

  writeContractLog({ event: 'contract_cleared', id: contract.id, prev_status: prevStatus });
  hookPrint(`🗑️  契约 ${contract.id} 已清除（原状态: ${prevStatus}）`);
  process.exit(0);
}

// ---- 主入口 ----

const args = process.argv.slice(2);
const subcommand = args[0];

switch (subcommand) {
  case 'declare':  cmdDeclare(args.slice(1)); break;
  case 'status':   cmdStatus(); break;
  case 'complete': cmdComplete(); break;
  case 'clear':    cmdClear(); break;
  default:
    hookPrint(
      'task-contract — 任务契约管理',
      '',
      '子命令:',
      '  declare   声明新契约（任务描述 + 验收标准）',
      '  status    查看当前契约状态',
      '  complete  标记契约完成',
      '  clear     清除当前契约'
    );
    process.exit(0);
}
