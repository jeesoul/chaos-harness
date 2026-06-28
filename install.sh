#!/usr/bin/env bash
# Chaos Harness v1.3.2 安装验证脚本
# 插件系统自动加载 skills 和 hooks.json，无需手动配置 settings.json

set -e

echo "========================================="
echo " Chaos Harness v1.3.2 Gate 安装验证"
echo "========================================="
echo ""

node -e "
const fs = require('fs');
const path = require('path');
const dir = process.cwd();
let errors = 0;

// 1. Node.js
console.log('[1/6] 检查 Node.js...');
console.log('  OK: ' + process.version);
console.log('');

// 2. hooks.json
console.log('[2/6] 检查 hooks.json...');
const hooksPath = path.join(dir, 'hooks', 'hooks.json');
if (fs.existsSync(hooksPath)) {
  const h = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  let c = 0;
  for (const m of Object.values(h.hooks)) c += m.length;
  console.log('  OK: ' + c + ' 个 hook matcher');
} else {
  console.log('  FAIL: hooks/hooks.json 不存在');
  errors++;
}
console.log('');

// 3. Skills
console.log('[3/6] 检查 Skills...');
const { execSync } = require('child_process');
try {
  const skills = execSync('find \"' + dir.replace(/\\\\/g, '/') + '/skills\" -name \"SKILL.md\"', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  if (skills.length > 0) {
    console.log('  OK: ' + skills.length + ' 个 Skills');
  } else {
    console.log('  FAIL: skills/ 目录下无 SKILL.md 文件');
    errors++;
  }
} catch(e) {
  console.log('  FAIL: ' + e.message);
  errors++;
}
console.log('');

// 4. Scripts
console.log('[4/6] 检查脚本语法...');
const scriptsDir = path.join(dir, 'scripts');
if (fs.existsSync(scriptsDir)) {
  const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.mjs'));
  let failCount = 0;
  for (const s of scripts) {
    try {
      const { execSync: es } = require('child_process');
      es('node --check \"' + path.join(scriptsDir, s) + '\"', { stdio: 'ignore' });
    } catch(e) {
      failCount++;
    }
  }
  if (failCount === 0) {
    console.log('  OK: ' + scripts.length + ' 个脚本语法通过');
  } else {
    console.log('  FAIL: ' + failCount + ' 个脚本语法错误');
    errors++;
  }
} else {
  console.log('  FAIL: scripts/ 目录不存在');
  errors++;
}
console.log('');

// 5. 数据目录
console.log('[5/6] 检查数据目录...');
const dirs = ['instincts', 'evals/capability', 'evals/regression', 'evals/results', 'schemas'];
for (const d of dirs) {
  if (fs.existsSync(path.join(dir, d))) {
    console.log('  OK: ' + d + '/');
  } else {
    console.log('  WARN: ' + d + '/ 不存在（运行时自动创建）');
  }
}
console.log('');

// 6. 版本一致性
console.log('[6/6] 检查版本一致性...');
try {
  const pluginVer = JSON.parse(fs.readFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const pkgVer = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
  console.log('  plugin.json: ' + pluginVer);
  console.log('  package.json: ' + pkgVer);
  if (pluginVer === pkgVer) {
    console.log('  OK: 版本一致');
  } else {
    console.log('  WARN: 版本不一致');
  }
} catch(e) {
  console.log('  WARN: 无法读取版本信息');
}
console.log('');

// 总结
console.log('=========================================');
if (errors === 0) {
  console.log(' 验证通过！所有组件正常');
} else {
  console.log(' 发现 ' + errors + ' 个错误，请修复后重试');
}
console.log('=========================================');
console.log('');
console.log('安装方式（无需额外配置 settings.json）：');
console.log('  1. claude plugins marketplace add \"/path/to/chaos-harness\"');
console.log('  2. claude plugins install chaos-harness@chaos-harness');
console.log('  3. 重启 Claude Code');
console.log('');
console.log('验证：在 Claude Code 中运行 /chaos-harness:overview');
console.log('');

process.exit(errors);
"