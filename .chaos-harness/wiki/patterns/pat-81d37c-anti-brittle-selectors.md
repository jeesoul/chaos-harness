---
id: pat-81d37c
type: pattern
title: [anti] brittle-selectors
tags: [anti-pattern, ui, medium]
links: []
sources: []
created: "2026-06-29T03:24:24.282Z"
updated: "2026-06-29T03:24:24.282Z"
confidence: 0.8
status: promoted
---

**Category:** ui
**Signal:** UI tests using CSS class selectors
**Severity:** medium
- ✅ Do: 使用 data-testid 或 aria-label
- ❌ Don't: 不要依赖 CSS 类名做选择
- 🔧 Fix: change selector strategy

**Example:** `expect('.btn-primary').toBeVisible()`
