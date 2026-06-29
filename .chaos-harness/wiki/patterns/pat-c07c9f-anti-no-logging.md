---
id: pat-c07c9f
type: pattern
title: [anti] no-logging
tags: [anti-pattern, general, medium]
links: []
sources: []
created: "2026-06-29T03:24:24.284Z"
updated: "2026-06-29T03:24:24.284Z"
confidence: 0.8
status: promoted
---

**Category:** general
**Signal:** Operation without logging
**Severity:** medium
- ✅ Do: 关键操作加日志
- ❌ Don't: 不要静默执行重要操作
- 🔧 Fix: add info/error logging

**Example:** `数据库删除操作无日志记录`
