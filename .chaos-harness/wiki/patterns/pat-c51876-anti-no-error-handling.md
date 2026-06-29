---
id: pat-c51876
type: pattern
title: [anti] no-error-handling
tags: [anti-pattern, general, high]
links: []
sources: []
created: "2026-06-29T03:24:24.283Z"
updated: "2026-06-29T03:24:24.283Z"
confidence: 0.8
status: promoted
---

**Category:** general
**Signal:** API endpoint without try-catch
**Severity:** high
- ✅ Do: API 必须有错误处理
- ❌ Don't: 不要忽略异常情况
- 🔧 Fix: add error handler middleware

**Example:** `async function handler() { return data; }`
