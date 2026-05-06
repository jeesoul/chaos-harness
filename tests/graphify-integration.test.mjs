#!/usr/bin/env node
/**
 * Graphify 集成测试
 * 测试配置加载、图谱检测、路径解析等核心功能
 */

import { strict as assert } from 'node:assert';
import { join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  loadGraphifyConfig,
  saveGraphifyConfig,
  isGraphifyInstalled,
  hasKnowledgeGraph,
  getGraphPaths,
  shouldUseGraphify,
} from '../scripts/graphify-wrapper.mjs';

const testRoot = join(tmpdir(), `graphify-test-${Date.now()}`);

function setup() {
  mkdirSync(testRoot, { recursive: true });
  mkdirSync(join(testRoot, '.chaos-harness'), { recursive: true });
}

function teardown() {
  if (existsSync(testRoot)) {
    rmSync(testRoot, { recursive: true, force: true });
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }
}

// ---- 测试 ----

setup();

test('loadGraphifyConfig - 默认配置', () => {
  const cfg = loadGraphifyConfig(testRoot);
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.auto_generate, true);
  assert.equal(cfg.auto_update, true);
  assert.equal(cfg.token_budget, 2000);
});

test('saveGraphifyConfig - 保存项目配置', () => {
  saveGraphifyConfig(testRoot, { enabled: true, token_budget: 5000 });
  const cfg = loadGraphifyConfig(testRoot);
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.token_budget, 5000);
});

test('hasKnowledgeGraph - 图谱不存在', () => {
  assert.equal(hasKnowledgeGraph(testRoot), false);
});

test('hasKnowledgeGraph - 图谱存在', () => {
  const outDir = join(testRoot, 'graphify-out');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'graph.json'), '{}', 'utf-8');
  assert.equal(hasKnowledgeGraph(testRoot), true);
});

test('getGraphPaths - 路径解析', () => {
  const paths = getGraphPaths(testRoot);
  assert.equal(paths.graph, join(testRoot, 'graphify-out', 'graph.json'));
  assert.equal(paths.report, join(testRoot, 'graphify-out', 'GRAPH_REPORT.md'));
  assert.equal(paths.html, join(testRoot, 'graphify-out', 'graph.html'));
});

test('shouldUseGraphify - enabled=false + auto', () => {
  saveGraphifyConfig(testRoot, { enabled: false });
  assert.equal(shouldUseGraphify(testRoot, 'auto'), false);
});

test('shouldUseGraphify - enabled=false + manual', () => {
  saveGraphifyConfig(testRoot, { enabled: false });
  assert.equal(shouldUseGraphify(testRoot, 'manual'), true);
});

test('shouldUseGraphify - enabled=true + auto', () => {
  saveGraphifyConfig(testRoot, { enabled: true });
  assert.equal(shouldUseGraphify(testRoot, 'auto'), true);
});

teardown();

console.log('\n所有测试通过 ✓');
