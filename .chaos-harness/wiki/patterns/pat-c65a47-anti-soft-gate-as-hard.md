---
id: pat-c65a47
type: pattern
title: [anti] soft-gate-as-hard
tags: [anti-pattern, gate, medium]
links: []
sources: []
created: "2026-06-29T03:24:24.280Z"
updated: "2026-06-29T03:24:24.280Z"
confidence: 0.8
status: promoted
---

**Category:** gate
**Signal:** Treating soft gate as hard block
**Severity:** medium
- ✅ Do: soft gate 只输出建议
- ❌ Don't: 不要用 soft gate 阻塞流程
- 🔧 Fix: change gate level to soft if blocking

**Example:** `gate-quality-format 导致 CI 失败`
