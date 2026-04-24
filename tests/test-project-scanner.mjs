#!/usr/bin/env node
/**
 * test-project-scanner.mjs — Project Scanner 测试
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCANNER = join(ROOT, 'scripts', 'project-scanner.mjs');

function runScanner(projectRoot) {
  try {
    execSync(`node "${SCANNER}" --root "${projectRoot}"`, { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const scanPath = join(projectRoot, '.chaos-harness', 'scan-result.json');
    if (existsSync(scanPath)) {
      return { ...JSON.parse(readFileSync(scanPath, 'utf-8')), exitCode: 0 };
    }
    return { exitCode: 1, error: 'No scan-result.json generated' };
  } catch (e) {
    return { exitCode: e.status || 1, error: (e.stderr?.toString() || e.stdout?.toString() || '').slice(-300) };
  }
}

describe('Project Scanner', () => {
  test('detects Java Spring Boot project', () => {
    const tmp = join(ROOT, 'test-project-spring');
    mkdirSync(join(tmp, 'src', 'main', 'java'), { recursive: true });
    writeFileSync(join(tmp, 'pom.xml'), '<project></project>');
    writeFileSync(join(tmp, 'src', 'main', 'java', 'App.java'), 'public class App {}');

    const result = runScanner(tmp);
    assert.equal(result.exitCode, 0);
    assert.ok(['java-spring', 'java-maven'].includes(result.project_type));

    rmSync(tmp, { recursive: true, force: true });
  });

  test('detects Vue3 project', () => {
    const tmp = join(ROOT, 'test-project-vue');
    mkdirSync(tmp, { recursive: true });
    writeFileSync(join(tmp, 'package.json'), JSON.stringify({ dependencies: { vue: '^3.0.0', vite: '^5.0.0' } }));
    mkdirSync(join(tmp, 'src'), { recursive: true });

    const result = runScanner(tmp);
    assert.equal(result.exitCode, 0);
    assert.ok(['vue3', 'vue2'].includes(result.project_type));

    rmSync(tmp, { recursive: true, force: true });
  });

  test('detects Python FastAPI project', () => {
    const tmp = join(ROOT, 'test-project-fastapi');
    mkdirSync(tmp, { recursive: true });
    writeFileSync(join(tmp, 'requirements.txt'), 'fastapi\nuvicorn');
    mkdirSync(join(tmp, 'app'), { recursive: true });
    writeFileSync(join(tmp, 'app', 'main.py'), 'from fastapi import FastAPI');

    const result = runScanner(tmp);
    assert.equal(result.exitCode, 0);
    assert.equal(result.project_type, 'python-fastapi');

    rmSync(tmp, { recursive: true, force: true });
  });

  test('handles empty directory gracefully', () => {
    const tmp = join(ROOT, 'test-project-empty');
    mkdirSync(tmp, { recursive: true });

    const result = runScanner(tmp);
    assert.equal(result.exitCode, 0);
    assert.equal(result.project_type, 'unknown');

    rmSync(tmp, { recursive: true, force: true });
  });
});
