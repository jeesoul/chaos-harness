---
id: pat-d19e8f
type: pattern
title: pr-size-check (W09_code_review)
tags: [gate, W09_code_review, generic, soft]
links: []
sources: []
created: "2026-06-29T03:24:24.277Z"
updated: "2026-06-29T03:24:24.277Z"
confidence: 0.8
status: promoted
---

**Stage:** W09_code_review
**Validators:** git-diff-size
**Level:** soft
**Stack:** generic
**Dependencies:** none
PR 不超过 500 行
- ✅ Do: 拆分为小 PR
- ❌ Don't: 不要一次性提交大量代码
