---
id: pat-215ccb
type: pattern
title: [anti] docs-without-version
tags: [anti-pattern, iron-law, critical]
links: []
sources: []
created: "2026-06-29T03:24:24.281Z"
updated: "2026-06-29T03:24:24.281Z"
confidence: 0.8
status: promoted
---

**Category:** iron-law
**Signal:** Document written outside version directory
**Severity:** critical
- ✅ Do: 文档必须在版本目录下
- ❌ Don't: 不要直接写到 output/根目录
- 🔧 Fix: move to output/{version}/docs/

**Example:** `output/PRD.md 应该在 output/v1.0/PRD.md`
