/**
 * v1.3.3 集成测试 — 项目知识图谱 + 影响分析 + 上下文建议 + Gate 增强验证
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TEST_ROOT = join(process.cwd(), '.test-project-v133');

function setupTestProject() {
  if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true });
  mkdirSync(TEST_ROOT, { recursive: true });
  mkdirSync(join(TEST_ROOT, 'src', 'controller'), { recursive: true });
  mkdirSync(join(TEST_ROOT, 'src', 'service'), { recursive: true });
  mkdirSync(join(TEST_ROOT, 'src', 'model'), { recursive: true });
  mkdirSync(join(TEST_ROOT, 'tests'), { recursive: true });
  mkdirSync(join(TEST_ROOT, '.chaos-harness'), { recursive: true });

  writeFileSync(join(TEST_ROOT, 'package.json'), JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    dependencies: { express: '^4.18.0', 'easyexcel': '^1.0.0' },
    devDependencies: { vitest: '^1.0.0' },
    engines: { node: '>=18' },
  }, null, 2));

  writeFileSync(join(TEST_ROOT, 'src', 'controller', 'UserController.java'), `
package com.example.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class UserController {
  private static final Logger log = LoggerFactory.getLogger(UserController.class);

  public void getUser() {
    log.info("Getting user");
  }
}
`);

  writeFileSync(join(TEST_ROOT, 'src', 'service', 'UserService.java'), `
package com.example.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserService {
  private static final Logger log = LoggerFactory.getLogger(UserService.class);

  public void exportUsers() {
    // TODO: implement
  }
}
`);

  writeFileSync(join(TEST_ROOT, 'src', 'model', 'User.java'), `
package com.example.model;

import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.Column;

@Entity
@Table(name = "t_user")
public class User {
  @Column
  private Long id;
  @Column
  private String name;
  @Column
  private String email;
}
`);

  writeFileSync(join(TEST_ROOT, 'tests', 'UserServiceTest.java'), `
package com.example.service;

import org.junit.jupiter.api.Test;

public class UserServiceTest {
  @Test
  public void testExportUsers() {}
}
`);

  writeFileSync(join(TEST_ROOT, 'src', 'index.mjs'), `
import express from 'express';
const app = express();
app.listen(3000);
`);
}

function cleanupTestProject() {
  if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true });
}

describe('Phase 1.1: Project Knowledge Engine', () => {
  before(() => setupTestProject());

  it('should scan project and generate knowledge graph', async () => {
    const { scanProject } = await import('../scripts/project-knowledge-engine.mjs');
    const knowledge = scanProject(TEST_ROOT);

    assert.ok(knowledge, 'knowledge should be defined');
    assert.equal(knowledge.version, '1.0.0');
    assert.ok(knowledge.layers, 'layers should be defined');
    assert.ok(knowledge.layers.code, 'code layer should be defined');
    assert.ok(knowledge.layers.code.sourceFiles > 0, 'should have source files');
    assert.ok(knowledge.layers.code.languages, 'languages should be defined');
  });

  it('should detect modules', async () => {
    const { loadKnowledge } = await import('../scripts/project-knowledge-engine.mjs');
    const knowledge = loadKnowledge(TEST_ROOT);

    assert.ok(knowledge.layers.code.modules, 'modules should be defined');
    assert.ok(knowledge.layers.code.modules.length > 0, 'should have modules');
    const srcModule = knowledge.layers.code.modules.find(m => m.name === 'src');
    assert.ok(srcModule, 'src module should exist');
  });

  it('should detect entry points', async () => {
    const { loadKnowledge } = await import('../scripts/project-knowledge-engine.mjs');
    const knowledge = loadKnowledge(TEST_ROOT);

    assert.ok(knowledge.layers.code.entryPoints, 'entryPoints should be defined');
    const hasController = knowledge.layers.code.entryPoints.some(e => e.includes('Controller'));
    const hasIndex = knowledge.layers.code.entryPoints.some(e => e.includes('index'));
    assert.ok(hasController || hasIndex, 'should detect Controller or index entry point');
  });

  it('should detect dependencies from package.json', async () => {
    const { loadKnowledge } = await import('../scripts/project-knowledge-engine.mjs');
    const knowledge = loadKnowledge(TEST_ROOT);

    const deps = knowledge.layers.dependencies;
    assert.ok(deps, 'dependencies layer should be defined');
    assert.ok(deps.external.length > 0, 'should have external deps');
    const express = deps.external.find(d => d.name === 'express');
    assert.ok(express, 'express dep should exist');
    assert.equal(express.version, '^4.18.0');
  });

  it('should detect engine constraints', async () => {
    const { loadKnowledge } = await import('../scripts/project-knowledge-engine.mjs');
    const knowledge = loadKnowledge(TEST_ROOT);

    const constraints = knowledge.layers.dependencies.constraints;
    assert.ok(constraints.length > 0, 'should have constraints');
    const nodeConstraint = constraints.find(c => c.type === 'engine-node');
    assert.ok(nodeConstraint, 'node engine constraint should exist');
    assert.equal(nodeConstraint.value, '>=18');
  });

  it('should detect JPA entities', async () => {
    const { loadKnowledge } = await import('../scripts/project-knowledge-engine.mjs');
    const knowledge = loadKnowledge(TEST_ROOT);

    const entities = knowledge.layers.data?.entities || [];
    assert.ok(entities.length > 0, 'should have entities');
    const userEntity = entities.find(e => e.name === 'User');
    assert.ok(userEntity, 'User entity should exist');
    assert.equal(userEntity.table, 't_user');
  });

  it('should generate report', async () => {
    const { generateReport, getKnowledgePaths } = await import('../scripts/project-knowledge-engine.mjs');
    const report = generateReport(TEST_ROOT);

    assert.ok(report, 'report should be defined');
    assert.ok(report.includes('# 项目知识图谱报告'), 'report should have title');
    assert.ok(report.includes('源文件数'), 'report should include source file count');
    assert.ok(report.includes('外部依赖'), 'report should include external deps');

    const paths = getKnowledgePaths(TEST_ROOT);
    assert.ok(existsSync(paths.report), 'report file should exist on disk');
  });

  it('should query knowledge by key', async () => {
    const { queryKnowledge } = await import('../scripts/project-knowledge-engine.mjs');

    const languages = queryKnowledge(TEST_ROOT, 'code.languages');
    assert.ok(languages, 'languages should be defined');
    assert.ok(languages.java > 0, 'should have java files');

    const deps = queryKnowledge(TEST_ROOT, 'dependencies');
    assert.ok(deps, 'deps should be defined');
    assert.ok(deps.external.length > 0, 'should have external deps');
  });
});

describe('Phase 2.1: Impact Analyzer', () => {
  it('should analyze requirement impact', async () => {
    const { analyzeImpact } = await import('../scripts/impact-analyzer.mjs');
    const result = analyzeImpact(TEST_ROOT, '添加用户导出 Excel 功能');

    assert.ok(result, 'result should be defined');
    assert.equal(result.requirement, '添加用户导出 Excel 功能');
    assert.ok(result.keywords, 'keywords should be defined');
    assert.ok(result.impactScope, 'impactScope should be defined');
    assert.ok(result.reusability, 'reusability should be defined');
    assert.ok(result.constraints, 'constraints should be defined');
    assert.ok(result.risks, 'risks should be defined');
    assert.ok(result.effort, 'effort should be defined');
  });

  it('should detect export-related keywords', async () => {
    const { analyzeImpact } = await import('../scripts/impact-analyzer.mjs');
    const result = analyzeImpact(TEST_ROOT, '用户导出 Excel');

    assert.ok(result.keywords.export, 'export keywords should be defined');
    assert.ok(result.keywords.export.includes('excel'), 'should detect excel keyword');
  });

  it('should find reusable dependencies', async () => {
    const { analyzeImpact } = await import('../scripts/impact-analyzer.mjs');
    const result = analyzeImpact(TEST_ROOT, '导出 Excel 报表');

    const excelDep = result.reusability.find(r => r.name?.includes('easyexcel'));
    assert.ok(excelDep, 'easyexcel dep should be found as reusable');
  });

  it('should estimate effort', async () => {
    const { analyzeImpact } = await import('../scripts/impact-analyzer.mjs');
    const result = analyzeImpact(TEST_ROOT, '添加缓存层');

    assert.ok(result.effort.optimistic > 0, 'optimistic estimate should be positive');
    assert.ok(result.effort.likely > 0, 'likely estimate should be positive');
    assert.ok(result.effort.pessimistic > result.effort.optimistic, 'pessimistic should exceed optimistic');
  });

  it('should format report', async () => {
    const { analyzeImpact, formatReport } = await import('../scripts/impact-analyzer.mjs');
    const result = analyzeImpact(TEST_ROOT, '添加用户导出 Excel');
    const report = formatReport(result);

    assert.ok(report.includes('# 需求影响分析报告'), 'should have title');
    assert.ok(report.includes('影响范围'), 'should include impact scope');
    assert.ok(report.includes('复用建议'), 'should include reuse suggestions');
    assert.ok(report.includes('约束提醒'), 'should include constraints');
    assert.ok(report.includes('风险预警'), 'should include risks');
    assert.ok(report.includes('工作量估算'), 'should include effort estimate');
  });
});

describe('Phase 2.2: Context Advisor', () => {
  it('should generate advice', async () => {
    const { generateAdvice } = await import('../scripts/context-advisor.mjs');
    const result = generateAdvice(TEST_ROOT, '创建 UserExportService');

    assert.ok(result, 'result should be defined');
    assert.ok(result.advice, 'advice should be defined');
    assert.ok(Array.isArray(result.advice), 'advice should be an array');
  });

  it('should include constraint advice', async () => {
    const { generateAdvice } = await import('../scripts/context-advisor.mjs');
    const result = generateAdvice(TEST_ROOT, '创建新服务');

    const constraintAdvice = result.advice.find(a => a.category === 'constraints');
    assert.ok(constraintAdvice, 'constraint advice should be present');
  });

  it('should format advice', async () => {
    const { generateAdvice, formatAdvice } = await import('../scripts/context-advisor.mjs');
    const result = generateAdvice(TEST_ROOT, '创建 UserExportService');
    const formatted = formatAdvice(result);

    assert.ok(formatted.includes('## 上下文建议'), 'formatted advice should have header');
  });
});

describe('Phase 3: Gate Validator V2', () => {
  it('should validate context compliance', async () => {
    const { validateContextCompliance } = await import('../scripts/gate-validator-v2.mjs');
    const filePath = join(TEST_ROOT, 'src', 'controller', 'UserController.java');
    const result = validateContextCompliance(TEST_ROOT, filePath);

    assert.ok(result, 'result should be defined');
    assert.equal(typeof result.pass, 'boolean', 'pass should be boolean');
  });

  it('should validate reuse check', async () => {
    const { validateReuseCheck } = await import('../scripts/gate-validator-v2.mjs');
    const result = validateReuseCheck(TEST_ROOT, '导出 Excel');

    assert.ok(result, 'result should be defined');
    assert.equal(result.pass, true, 'reuse check should pass');
  });

  it('should validate constraint check', async () => {
    const { validateConstraintCheck } = await import('../scripts/gate-validator-v2.mjs');
    const result = validateConstraintCheck(TEST_ROOT);

    assert.ok(result, 'result should be defined');
    assert.ok(result.constraints, 'constraints should be defined');
  });

  it('should validate impact check', async () => {
    const { validateImpactCheck } = await import('../scripts/gate-validator-v2.mjs');
    const result = validateImpactCheck(TEST_ROOT, '添加功能');

    assert.ok(result, 'result should be defined');
    assert.equal(typeof result.pass, 'boolean', 'pass should be boolean');
  });

  it('should use unified validate function', async () => {
    const { validate } = await import('../scripts/gate-validator-v2.mjs');

    const r1 = validate(TEST_ROOT, 'constraint-check');
    assert.ok(r1, 'constraint-check result should be defined');

    const r2 = validate(TEST_ROOT, 'reuse-check', { requirement: 'Excel' });
    assert.ok(r2, 'reuse-check result should be defined');
  });
});

after(() => cleanupTestProject());
