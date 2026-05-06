#!/usr/bin/env node
/**
 * graphify-init — SessionStart Hook
 *
 * 职责：
 * 1. 检查 Graphify 配置
 * 2. 按需生成知识图谱（首次使用）
 * 3. 提示用户图谱状态
 */

import { resolveProjectRoot } from './path-utils.mjs';
import {
  isGraphifyInstalled,
  hasKnowledgeGraph,
  loadGraphifyConfig,
  generateGraph,
  getGraphPaths,
} from './graphify-wrapper.mjs';

const projectRoot = resolveProjectRoot();

if (!projectRoot) {
  console.log('[Graphify] 未检测到项目根目录（.chaos-harness/state.json 不存在），跳过');
  process.exit(0);
}

const cfg = loadGraphifyConfig(projectRoot);

// 1. 检查 Graphify 是否安装
if (!isGraphifyInstalled()) {
  if (cfg.enabled) {
    console.error('\n[Graphify] ❌ 配置已开启但 graphify 未安装');
    console.error('[Graphify] 请运行: pip install graphifyy');
    console.error('[Graphify] 或关闭配置: 修改 .chaos-harness/graphify-config.json 中 enabled=false\n');
  }
  process.exit(0);
}

// 2. 检查知识图谱是否存在
if (hasKnowledgeGraph(projectRoot)) {
  const paths = getGraphPaths(projectRoot);
  if (cfg.enabled) {
    console.log('[Graphify] ✅ 知识图谱已就绪（enabled=true，所有 AI 交互都将查询图谱）');
  } else {
    console.log('[Graphify] 📊 知识图谱已存在（enabled=false，仅手动调用时使用）');
  }
  console.log(`[Graphify] 📄 报告: ${paths.report}`);
  console.log(`[Graphify] 🌐 可视化: open ${paths.html}\n`);
  process.exit(0);
}

// 3. 首次使用，按需生成
if (!cfg.auto_generate) {
  console.log('[Graphify] 知识图谱不存在，auto_generate=false，跳过生成');
  console.log('[Graphify] 手动生成: /graphify 或运行 graphify .\n');
  process.exit(0);
}

console.log('\n[Graphify] 首次使用，正在生成项目知识图谱...');
console.log('[Graphify] 这可能需要几分钟，取决于项目大小');
console.log('[Graphify] 生成后会缓存，后续启动会很快\n');

const result = generateGraph(projectRoot);

if (result.success) {
  console.log('\n[Graphify] ✅ 项目知识图谱已生成！');
  console.log(`[Graphify] 📊 可视化：open ${result.paths.html}`);
  console.log(`[Graphify] 📄 报告：${result.paths.report}`);
  if (cfg.enabled) {
    console.log('[Graphify] 🚀 enabled=true，所有 AI 交互都将查询图谱\n');
  } else {
    console.log('[Graphify] 💡 提示：修改 .chaos-harness/graphify-config.json 中 enabled=true 开启强制模式\n');
  }
} else {
  console.error(`\n[Graphify] ❌ 生成失败: ${result.error}`);
  console.error('[Graphify] 请检查 graphify 是否正确安装: pip install graphifyy\n');
  process.exit(1);
}
