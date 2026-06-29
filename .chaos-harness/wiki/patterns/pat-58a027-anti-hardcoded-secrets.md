---
id: pat-58a027
type: pattern
title: [anti] hardcoded-secrets
tags: [anti-pattern, general, critical]
links: []
sources: []
created: "2026-06-29T03:24:24.284Z"
updated: "2026-06-29T03:24:24.284Z"
confidence: 0.8
status: promoted
---

**Category:** general
**Signal:** Secret key in source code
**Severity:** critical
- ✅ Do: 使用环境变量
- ❌ Don't: 不要硬编码密钥
- 🔧 Fix: move to .env or secrets manager

**Example:** `API_KEY = 'sk-abc123'`
