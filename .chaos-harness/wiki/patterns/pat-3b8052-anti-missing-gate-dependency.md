---
id: pat-3b8052
type: pattern
title: [anti] missing-gate-dependency
tags: [anti-pattern, gate, high]
links: []
sources: []
created: "2026-06-29T03:24:24.280Z"
updated: "2026-06-29T03:24:24.280Z"
confidence: 0.8
status: promoted
---

**Category:** gate
**Signal:** Gate runs before prerequisite gate
**Severity:** high
- ✅ Do: 遵循 Gate 依赖顺序
- ❌ Don't: 不要跳过前置 Gate
- 🔧 Fix: add dependsOn to gate definition

**Example:** `gate-w10-testing 在 gate-w09-code-review 之前`
