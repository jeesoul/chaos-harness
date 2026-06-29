---
id: pat-cf408c
type: pattern
title: [anti] high-risk-config-mod
tags: [anti-pattern, iron-law, critical]
links: []
sources: []
created: "2026-06-29T03:24:24.282Z"
updated: "2026-06-29T03:24:24.282Z"
confidence: 0.8
status: promoted
---

**Category:** iron-law
**Signal:** Sensitive config changed without approval
**Severity:** critical
- ✅ Do: 敏感配置修改需要批准
- ❌ Don't: 不要自动修改敏感配置
- 🔧 Fix: add approval workflow

**Example:** `修改数据库连接字符串`
