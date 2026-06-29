---
id: pat-96d020
type: pattern
title: [anti] mocking-everything
tags: [anti-pattern, testing, medium]
links: []
sources: []
created: "2026-06-29T03:24:24.279Z"
updated: "2026-06-29T03:24:24.279Z"
confidence: 0.8
status: promoted
---

**Category:** testing
**Signal:** All dependencies mocked
**Severity:** medium
- ✅ Do: 只 mock 外部依赖
- ❌ Don't: 不要 mock 内部逻辑
- 🔧 Fix: use real implementation where possible

**Example:** `过度使用 jest.mock()`
