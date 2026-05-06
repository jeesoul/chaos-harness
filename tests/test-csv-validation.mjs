import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const CSV_FILES = [
  'gate-patterns.csv',
  'iron-law-rules.csv',
  'test-patterns.csv',
  'anti-patterns.csv',
  'ui-patterns.csv',
  'prd-quality-rules.csv',
];

const EXPECTED_HEADERS = {
  'gate-patterns.csv': ['id', 'stage', 'pattern_name', 'validators', 'dependencies', 'level', 'stack', 'description', 'do', 'dont', 'example_gate_json'],
  'iron-law-rules.csv': ['id', 'rule_name', 'trigger_signal', 'severity', 'detection_method', 'fix_command', 'description'],
  'test-patterns.csv': ['id', 'stack', 'test_type', 'framework_detection', 'test_command', 'coverage_threshold', 'ui_strategy', 'description'],
  'anti-patterns.csv': ['id', 'category', 'pattern_name', 'signal', 'severity', 'do', 'dont', 'fix', 'example'],
  'ui-patterns.csv': ['id', 'component_type', 'selector_strategy', 'assertion_type', 'wait_strategy', 'description'],
  'prd-quality-rules.csv': ['id', 'rule_name', 'keywords', 'level', 'check_description', 'example_fail', 'example_pass'],
};

describe('CSV Schema Validation', () => {
  test('all CSV files exist', () => {
    for (const file of CSV_FILES) {
      const filePath = join(DATA_DIR, file);
      assert.ok(existsSync(filePath), `${file} should exist`);
    }
  });

  test('all CSV files have correct headers', () => {
    for (const file of CSV_FILES) {
      const filePath = join(DATA_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      const headers = content.split('\n')[0].split(',').map(h => h.trim());
      const expected = EXPECTED_HEADERS[file];
      if (!expected) continue;
      for (const h of expected) {
        assert.ok(headers.includes(h), `${file} should have header "${h}"`);
      }
    }
  });

  test('no rows with empty id', () => {
    for (const file of CSV_FILES) {
      const filePath = join(DATA_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').slice(1).filter(l => l.trim());
      for (const line of lines) {
        const id = line.split(',')[0]?.trim();
        assert.ok(id.length > 0, `${file} has row with empty id: ${line.slice(0, 50)}`);
      }
    }
  });
});
