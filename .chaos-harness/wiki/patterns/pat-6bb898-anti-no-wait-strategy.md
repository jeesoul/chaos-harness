---
id: pat-6bb898
type: pattern
title: [anti] no-wait-strategy
tags: [anti-pattern, ui, high]
links: []
sources: []
created: "2026-06-29T03:24:24.282Z"
updated: "2026-06-29T03:24:24.282Z"
confidence: 0.8
status: promoted
---

**Category:** ui
**Signal:** UI test without element wait
**Severity:** high
- ✅ Do: 使用 waitForElement 或 polling
- ❌ Don't: 不要假设元素立即可见
- 🔧 Fix: add wait before interaction

**Example:** `click('.modal') 后直接 expect`
