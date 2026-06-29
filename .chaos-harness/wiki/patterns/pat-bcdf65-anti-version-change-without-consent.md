---
id: pat-bcdf65
type: pattern
title: [anti] version-change-without-consent
tags: [anti-pattern, iron-law, critical]
links: []
sources: []
created: "2026-06-29T03:24:24.281Z"
updated: "2026-06-29T03:24:24.281Z"
confidence: 0.8
status: promoted
---

**Category:** iron-law
**Signal:** Version number changed without user approval
**Severity:** critical
- ✅ Do: 版本变更需要用户确认
- ❌ Don't: 不要擅自修改版本号
- 🔧 Fix: ask user before version change

**Example:** `package.json version 从 1.3.1 改为 1.4.0`
