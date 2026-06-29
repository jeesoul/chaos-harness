---
id: pat-007e91
type: pattern
title: [anti] no-risk-assessment
tags: [anti-pattern, prd, high]
links: []
sources: []
created: "2026-06-29T03:24:24.280Z"
updated: "2026-06-29T03:24:24.280Z"
confidence: 0.8
status: promoted
---

**Category:** prd
**Signal:** High-risk feature without rollback plan
**Severity:** high
- ✅ Do: 高风险功能必须有回滚方案
- ❌ Don't: 不要忽略风险评估
- 🔧 Fix: add rollback section to PRD

**Example:** `支付功能变更无回滚方案`
