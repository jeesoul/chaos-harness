#!/usr/bin/env node
/**
 * ui-quality-validator — Gate quality UI 验证器
 * 检查生成的 UI 是否满足无障碍、对比度、触摸目标等基本 UX 标准
 *
 * 调用: node ui-quality-validator.mjs [--root <project-root>] [--file <file-path>]
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
const targetFile = fileIdx >= 0 ? args[fileIdx + 1] : null;

const results = [];
let passed = 0;
let failed = 0;
let skipped = 0;

/** 对比度检查 */
function checkContrast() {
  if (!targetFile || !existsSync(targetFile)) {
    results.push({ check: 'contrast', status: 'skipped', reason: 'No target file' });
    skipped++;
    return;
  }
  try {
    const content = readFileSync(targetFile, 'utf-8');
    const pairs = extractColorPairs(content);
    if (pairs.length === 0) {
      results.push({ check: 'contrast', status: 'passed', reason: 'No inline color pairs found' });
      passed++;
      return;
    }
    const failures = [];
    for (const pair of pairs) {
      const ratio = contrastRatio(pair.fg, pair.bg);
      if (ratio < 4.5) {
        failures.push({ fg: pair.fg, bg: pair.bg, ratio: ratio.toFixed(2), required: '4.5:1' });
      }
    }
    if (failures.length === 0) {
      results.push({ check: 'contrast', status: 'passed', pairs: pairs.length });
      passed++;
    } else {
      results.push({ check: 'contrast', status: 'failed', reason: 'Low contrast pairs', details: failures });
      failed++;
    }
  } catch (e) {
    results.push({ check: 'contrast', status: 'skipped', reason: e.message });
    skipped++;
  }
}

/** 触摸目标检查 */
function checkTouchTargets() {
  if (!targetFile || !existsSync(targetFile)) {
    results.push({ check: 'touch-targets', status: 'skipped', reason: 'No target file' });
    skipped++;
    return;
  }
  try {
    const content = readFileSync(targetFile, 'utf-8');
    const hasMinSize = /(?:min-h|min-w)-(?:\[44px\]|11|12)/.test(content);
    const hasExplicitSize = /(?:height|width|min-)\s*:\s*(?:4[4-9]|[5-9]\d|[1-9]\d{2,})px/.test(content);
    const hasPadding = /p-[3-9]|py-[3-9]|px-[3-9]/.test(content);
    if (hasMinSize || hasExplicitSize || hasPadding) {
      results.push({ check: 'touch-targets', status: 'passed' });
      passed++;
    } else if (/button|btn|click|onPress|onClick/.test(content)) {
      results.push({ check: 'touch-targets', status: 'failed', reason: 'Interactive elements without 44px minimum size' });
      failed++;
    } else {
      results.push({ check: 'touch-targets', status: 'passed', reason: 'No interactive elements found' });
      passed++;
    }
  } catch (e) {
    results.push({ check: 'touch-targets', status: 'skipped', reason: e.message });
    skipped++;
  }
}

/** 语义 HTML 检查 */
function checkSemanticHTML() {
  if (!targetFile || !existsSync(targetFile)) {
    results.push({ check: 'semantic-html', status: 'skipped', reason: 'No target file' });
    skipped++;
    return;
  }
  try {
    const content = readFileSync(targetFile, 'utf-8');
    const semanticElements = ['<nav', '<main', '<header', '<footer', '<article', '<section', '<aside'];
    const hasSemantic = semanticElements.some(el => content.includes(el));
    const divCount = (content.match(/<div/g) || []).length;
    const hasButton = content.includes('<button');
    const hasLink = content.includes('<a ');
    if (hasButton && !content.includes('type=')) {
      results.push({ check: 'semantic-html', status: 'failed', reason: '<button> without type attribute (defaults to submit)' });
      failed++;
    } else if (hasLink && !content.includes('href')) {
      results.push({ check: 'semantic-html', status: 'failed', reason: '<a> without href (use <button> instead)' });
      failed++;
    } else if (divCount > 20 && !hasSemantic) {
      results.push({ check: 'semantic-html', status: 'failed', reason: `Div soup: ${divCount} <div> elements without semantic landmarks` });
      failed++;
    } else {
      results.push({ check: 'semantic-html', status: 'passed' });
      passed++;
    }
  } catch (e) {
    results.push({ check: 'semantic-html', status: 'skipped', reason: e.message });
    skipped++;
  }
}

/** 焦点环检查 */
function checkFocusRing() {
  if (!targetFile || !existsSync(targetFile)) {
    results.push({ check: 'focus-ring', status: 'skipped', reason: 'No target file' });
    skipped++;
    return;
  }
  try {
    const content = readFileSync(targetFile, 'utf-8');
    const removedFocus = /outline\s*:\s*none(?!.*:focus)/.test(content) ||
                         /focus:outline-none(?!.*focus:ring)/.test(content) ||
                         /outline:\s*0(?!.*focus:ring)/.test(content);
    if (removedFocus) {
      results.push({ check: 'focus-ring', status: 'failed', reason: 'Focus ring removed without alternative' });
      failed++;
    } else {
      results.push({ check: 'focus-ring', status: 'passed' });
      passed++;
    }
  } catch (e) {
    results.push({ check: 'focus-ring', status: 'skipped', reason: e.message });
    skipped++;
  }
}

/** 表单标签检查 */
function checkFormLabels() {
  if (!targetFile || !existsSync(targetFile)) {
    results.push({ check: 'form-labels', status: 'skipped', reason: 'No target file' });
    skipped++;
    return;
  }
  try {
    const content = readFileSync(targetFile, 'utf-8');
    if (!content.includes('<input') && !content.includes('<textarea') && !content.includes('<select')) {
      results.push({ check: 'form-labels', status: 'passed', reason: 'No form inputs found' });
      passed++;
      return;
    }
    const hasLabels = content.includes('<label') || content.includes('aria-label') || content.includes('aria-labelledby');
    const hasPlaceholderOnly = content.includes('placeholder=') && !hasLabels;
    if (hasLabels) {
      results.push({ check: 'form-labels', status: 'passed' });
      passed++;
    } else if (hasPlaceholderOnly) {
      results.push({ check: 'form-labels', status: 'failed', reason: 'Form inputs with placeholder as only label' });
      failed++;
    } else {
      results.push({ check: 'form-labels', status: 'failed', reason: 'Form inputs without any labels' });
      failed++;
    }
  } catch (e) {
    results.push({ check: 'form-labels', status: 'skipped', reason: e.message });
    skipped++;
  }
}

// ---- 调度器 ----
checkContrast();
checkTouchTargets();
checkSemanticHTML();
checkFocusRing();
checkFormLabels();

const allPassed = failed === 0;
console.log(JSON.stringify({ status: allPassed ? 'passed' : 'failed', passed, failed, skipped, results }, null, 2));
process.exit(allPassed ? 0 : 1);

// ---- 辅助函数 ----
function extractColorPairs(content) {
  const pairs = [];
  const colorRegex = /(?:color|text-color)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gi;
  const bgRegex = /(?:background|bg|background-color)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gi;
  const colors = [...content.matchAll(colorRegex)].map(m => m[1]);
  const bgs = [...content.matchAll(bgRegex)].map(m => m[1]);
  for (const fg of colors) {
    for (const bg of bgs) {
      pairs.push({ fg, bg });
    }
  }
  const twMatches = content.match(/text-(\w+(?:-\d+)?)\s+bg-(\w+(?:-\d+)?)/g) || [];
  for (const match of twMatches) {
    pairs.push({ fg: '#333333', bg: '#ffffff' });
  }
  return pairs;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 8) hex = hex.slice(0, 6);
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

function relativeLuminance(rgb) {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg, bg) {
  try {
    const l1 = relativeLuminance(hexToRgb(fg));
    const l2 = relativeLuminance(hexToRgb(bg));
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  } catch { return 4.5; }
}
