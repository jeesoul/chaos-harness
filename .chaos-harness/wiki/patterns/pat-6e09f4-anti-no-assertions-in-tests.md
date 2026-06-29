---
id: pat-6e09f4
type: pattern
title: [anti] no-assertions-in-tests
tags: [anti-pattern, testing, high]
links: []
sources: []
created: "2026-06-29T03:24:24.278Z"
updated: "2026-06-29T03:24:24.278Z"
confidence: 0.8
status: promoted
---

**Category:** testing
**Signal:** Test file with no assert statements
**Severity:** high
- ✅ Do: 每测试至少一个断言
- ❌ Don't: 不要只运行不验证
- 🔧 Fix: add assertions to every test

**Example:** `describe('test' () => { it('works' () => {}); });`
