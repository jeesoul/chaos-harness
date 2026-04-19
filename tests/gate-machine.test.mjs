#!/usr/bin/env node
/**
 * tests/gate-machine.test.mjs
 *
 * Gate State Machine 核心测试
 * 使用 spawnSync 以正确捕获 stderr
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const HARNESS_DIR = join(PROJECT_ROOT, '.chaos-harness');
const STATE_FILE = join(HARNESS_DIR, 'gate-state.json');
const GATES_DIR = join(HARNESS_DIR, 'gates');

function resetState() {
  if (existsSync(GATES_DIR)) rmSync(GATES_DIR, { recursive: true });
  if (existsSync(STATE_FILE)) rmSync(STATE_FILE);
  mkdirSync(HARNESS_DIR, { recursive: true });
}

function runGate(args) {
  const result = spawnSync('node', ['scripts/gate-machine.mjs', ...args], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 5000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { exitCode: result.status, stderr: result.stderr || '', stdout: result.stdout || '' };
}

function parseMarker(stderr) {
  if (!stderr || stderr.length < 20) return null;
  const match = stderr.match(/<HARNESS_GATE>(.*?)<\/HARNESS_GATE>/s);
  if (match) {
    try { return JSON.parse(match[1]); } catch { return null; }
  }
  return null;
}

function ensureGatesDir() {
  mkdirSync(GATES_DIR, { recursive: true });
}

const PROBLEM_CONTENT = '# Problem\n\n## 问题描述\nTest problem description\n## 影响范围\nImpact scope\n## 预期行为\nExpected behavior\n## 复现步骤\n1. Step one\n2. Step two\n';

// === Tests ===

test('status shows uninitialized when no state', () => {
  resetState();
  const r = runGate(['status']);
  const m = parseMarker(r.stderr);
  assert.ok(m, 'no marker: ' + r.stderr.slice(0, 200));
  assert.equal(m.type, 'gate_status');
  assert.equal(m.currentGate, null);
});

test('init creates state with currentGate=0', () => {
  resetState();
  const r = runGate(['init', 'test problem']);
  const m = parseMarker(r.stderr);
  assert.ok(m, 'no marker: ' + r.stderr.slice(0, 200));
  assert.equal(m.type, 'gate_init');
  assert.equal(m.currentGate, 0);
  assert.equal(m.problem, 'test problem');
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  assert.equal(state.currentGate, 0);
});

test('init fails if gate flow already running', () => {
  resetState();
  runGate(['init', 'first problem']);
  const r = runGate(['init', 'second problem']);
  const m = parseMarker(r.stderr);
  assert.equal(m?.type, 'gate_error');
});

test('advance only to next gate', () => {
  resetState();
  runGate(['init', 'test problem']);
  const r = runGate(['advance', '2']);
  const m = parseMarker(r.stderr);
  assert.equal(m?.type, 'gate_error');
  assert.equal(m?.blocked, true);
});

test('advance blocked when previous gate not passed', () => {
  resetState();
  runGate(['init', 'test problem']);
  const r = runGate(['advance', '1']);
  const m = parseMarker(r.stderr);
  assert.equal(m?.type, 'gate_error');
  assert.equal(m?.blocked, true);
});

test('submit + verify passes gate', () => {
  resetState();
  runGate(['init', 'test problem']);
  ensureGatesDir();
  writeFileSync(join(GATES_DIR, 'problem.md'), PROBLEM_CONTENT, 'utf8');
  const r = runGate(['verify', '0']);
  const m = parseMarker(r.stderr);
  assert.ok(m, 'no marker: ' + r.stderr.slice(0, 200));
  assert.equal(m.type, 'gate_verify_passed');
  assert.equal(m.gateId, 0);
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  assert.equal(state.gates[0].status, 'passed');
});

test('advance after gate passed', () => {
  resetState();
  runGate(['init', 'test problem']);
  ensureGatesDir();
  writeFileSync(join(GATES_DIR, 'problem.md'), PROBLEM_CONTENT, 'utf8');
  runGate(['verify', '0']);
  const r = runGate(['advance', '1']);
  const m = parseMarker(r.stderr);
  assert.ok(m, 'no marker: ' + r.stderr.slice(0, 200));
  assert.equal(m.type, 'gate_advance');
  assert.equal(m.from, 0);
  assert.equal(m.to, 1);
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  assert.equal(state.currentGate, 1);
});

test('verify fails if file missing', () => {
  resetState();
  runGate(['init', 'test problem']);
  const r = runGate(['verify', '0']);
  const m = parseMarker(r.stderr);
  assert.equal(m?.type, 'gate_verify_failed');
});

test('verify fails if content too short', () => {
  resetState();
  runGate(['init', 'test problem']);
  ensureGatesDir();
  writeFileSync(join(GATES_DIR, 'problem.md'), 'short', 'utf8');
  const r = runGate(['verify', '0']);
  const m = parseMarker(r.stderr);
  assert.equal(m?.type, 'gate_verify_failed');
});

test('verify fails if required fields missing', () => {
  resetState();
  runGate(['init', 'test problem']);
  ensureGatesDir();
  writeFileSync(join(GATES_DIR, 'problem.md'), '# Problem\nNo fields.\n', 'utf8');
  const r = runGate(['verify', '0']);
  const m = parseMarker(r.stderr);
  assert.equal(m?.type, 'gate_verify_failed');
  assert.ok(m?.missingFields?.length > 0);
});

test('checksum mismatch detection', () => {
  resetState();
  runGate(['init', 'test problem']);
  ensureGatesDir();
  writeFileSync(join(GATES_DIR, 'problem.md'), PROBLEM_CONTENT, 'utf8');
  runGate(['verify', '0']);
  writeFileSync(join(GATES_DIR, 'problem.md'), PROBLEM_CONTENT + '\ntampered', 'utf8');
  const r = runGate(['verify', '0']);
  const m = parseMarker(r.stderr);
  assert.equal(m?.type, 'gate_verify_failed');
  assert.ok(m?.expected);
  assert.ok(m?.actual);
  assert.notEqual(m?.expected, m?.actual);
});

test('recovery detects failure', () => {
  resetState();
  runGate(['init', 'test problem']);
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  state.gates[0].status = 'failed';
  state.gates[0].lastError = 'test error';
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  const r = runGate(['recover']);
  const m = parseMarker(r.stderr);
  assert.ok(m, 'no marker: ' + r.stderr.slice(0, 200));
  assert.equal(m.type, 'gate_recovery');
  assert.equal(m.failedGate?.id, 0);
});

test('recovery with no failures is ok', () => {
  resetState();
  runGate(['init', 'test problem']);
  const r = runGate(['recover']);
  const m = parseMarker(r.stderr);
  assert.ok(m, 'no marker: ' + r.stderr.slice(0, 200));
  assert.equal(m.type, 'gate_status');
});

test('history tracks all gate operations', () => {
  resetState();
  runGate(['init', 'test problem']);
  ensureGatesDir();
  writeFileSync(join(GATES_DIR, 'problem.md'), PROBLEM_CONTENT, 'utf8');
  runGate(['verify', '0']);
  runGate(['advance', '1']);
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  assert.ok(state.history.length >= 2);
  assert.equal(state.history[0].event, 'gate_verify_passed');
  assert.equal(state.history[1].event, 'gate_advance');
});
