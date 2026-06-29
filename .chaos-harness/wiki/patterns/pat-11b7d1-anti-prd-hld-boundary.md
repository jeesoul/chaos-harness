---
id: pat-11b7d1
type: pattern
title: [anti] prd-hld-boundary
tags: [anti-pattern, prd, high]
links: []
sources: []
created: "2026-06-29T03:24:24.280Z"
updated: "2026-06-29T03:24:24.280Z"
confidence: 0.8
status: promoted
---

**Category:** prd
**Signal:** PRD contains API paths or DB schemas
**Severity:** high
- ✅ Do: PRD 只描述 What 和 Why
- ❌ Don't: 不要在 PRD 中规定技术实现
- 🔧 Fix: move technical details to HLD

**Example:** `PRD 中定义 POST /api/users`
