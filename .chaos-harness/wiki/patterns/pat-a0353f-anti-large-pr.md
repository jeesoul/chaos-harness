---
id: pat-a0353f
type: pattern
title: [anti] large-pr
tags: [anti-pattern, general, medium]
links: []
sources: []
created: "2026-06-29T03:24:24.283Z"
updated: "2026-06-29T03:24:24.283Z"
confidence: 0.8
status: promoted
---

**Category:** general
**Signal:** PR with >500 lines changed
**Severity:** medium
- ✅ Do: 拆分为小 PR
- ❌ Don't: 不要一次性提交大量代码
- 🔧 Fix: split into logical units

**Example:** `git diff --stat 显示 +600 -200`
