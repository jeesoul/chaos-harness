#!/usr/bin/env node
/**
 * test-ui-quality.mjs — UI Quality Validator 测试
 * 测试对比度、触摸目标、语义 HTML、焦点环、表单标签
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VALIDATOR = join(ROOT, 'scripts', 'ui-quality-validator.mjs');

function runValidator(filePath) {
  try {
    const output = execSync(`node "${VALIDATOR}" --file "${filePath}"`, { cwd: ROOT, encoding: 'utf-8' });
    return { ...JSON.parse(output), exitCode: 0 };
  } catch (e) {
    const output = e.stdout?.toString() || '';
    try { return { ...JSON.parse(output), exitCode: e.status || 1 }; } catch {
      return { exitCode: e.status || 1, error: output.slice(-300) };
    }
  }
}

const GOOD_HTML = `<!DOCTYPE html>
<html><head><title>Test</title></head><body>
<nav><a href="/home">Home</a></nav>
<main>
  <button type="button" style="min-height:44px; padding: 12px;">Click</button>
  <form><label for="email">Email</label><input id="email" type="email" /></form>
  <div style="color: #333333; background: #ffffff;">Good contrast</div>
</main></body></html>`;

const BAD_HTML = `<html><body>
<div><div><div><div><div><div><div><div><div><div>
<div><div><div><div><div><div><div><div><div><div>
<div><div><div><div><div>
<button>Click</button>
<input placeholder="Email only" />
<div style="color: #cccccc; background: #dddddd;">Bad contrast</div>
</div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></body></html>`;

describe('UI Quality Validator', () => {
  test('good HTML passes all checks', () => {
    const tmp = join(ROOT, 'test-ui-good.html');
    writeFileSync(tmp, GOOD_HTML);
    const result = runValidator(tmp);
    rmSync(tmp);
    assert.equal(result.exitCode, 0, 'Good HTML should pass');
    assert.ok(result.failed === 0, 'No failures expected');
    assert.ok(result.passed >= 5, 'All 5 checks should pass');
  });

  test('bad HTML fails with specific violations', () => {
    const tmp = join(ROOT, 'test-ui-bad.html');
    writeFileSync(tmp, BAD_HTML);
    const result = runValidator(tmp);
    rmSync(tmp);
    assert.equal(result.exitCode, 1, 'Bad HTML should fail');
    assert.ok(result.failed >= 3, 'Multiple violations expected');
    // Check contrast violation
    assert.ok(result.results.some(r => r.check === 'contrast' && r.status === 'failed'),
      'Should detect low contrast');
    // Check touch target violation
    assert.ok(result.results.some(r => r.check === 'touch-targets' && r.status === 'failed'),
      'Should detect small touch targets');
    // Check semantic HTML violation
    assert.ok(result.results.some(r => r.check === 'semantic-html' && r.status === 'failed'),
      'Should detect semantic HTML issues');
  });
});
