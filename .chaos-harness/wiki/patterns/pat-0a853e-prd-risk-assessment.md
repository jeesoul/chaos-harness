---
id: pat-0a853e
type: pattern
title: "PRD: risk-assessment"
tags: [prd, quality, hard]
links: []
sources: []
created: "2026-06-29T03:24:24.294Z"
updated: "2026-06-29T03:24:24.294Z"
confidence: 0.8
status: promoted
---

**Rule:** risk-assessment
**Keywords:** 高风险 high-risk 回滚 rollback
**Level:** hard
**Check:** 高风险功能有回滚方案
- ❌ Fail: 支付功能变更无回滚方案
- ✅ Pass: 高风险功能包含 ## 回滚方案
