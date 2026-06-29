---
id: pat-4b6024
type: pattern
title: [anti] flaky-tests
tags: [anti-pattern, testing, medium]
links: []
sources: []
created: "2026-06-29T03:24:24.278Z"
updated: "2026-06-29T03:24:24.278Z"
confidence: 0.8
status: promoted
---

**Category:** testing
**Signal:** Test passes intermittently
**Severity:** medium
- ✅ Do: 修复不稳定测试
- ❌ Don't: 不要忽略间歇失败
- 🔧 Fix: identify root cause and fix

**Example:** `setTimeout-based test that fails randomly`
