---
id: pat-e481af
type: pattern
title: [anti] no-assertion
tags: [anti-pattern, ui, medium]
links: []
sources: []
created: "2026-06-29T03:24:24.283Z"
updated: "2026-06-29T03:24:24.283Z"
confidence: 0.8
status: promoted
---

**Category:** ui
**Signal:** UI test without assertion
**Severity:** medium
- ✅ Do: 每步操作后验证元素状态
- ❌ Don't: 不要只截图不验证
- 🔧 Fix: add visible/enabled assertions

**Example:** `screenshot after click without check`
