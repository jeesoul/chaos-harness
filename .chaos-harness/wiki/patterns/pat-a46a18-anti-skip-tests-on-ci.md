---
id: pat-a46a18
type: pattern
title: [anti] skip-tests-on-ci
tags: [anti-pattern, testing, critical]
links: []
sources: []
created: "2026-06-29T03:24:24.278Z"
updated: "2026-06-29T03:24:24.278Z"
confidence: 0.8
status: promoted
---

**Category:** testing
**Signal:** CI config excludes tests
**Severity:** critical
- ✅ Do: 修复 CI 配置启用测试
- ❌ Don't: 不要静默跳过测试
- 🔧 Fix: enable test step in CI pipeline

**Example:** `CI 配置中跳过测试`
