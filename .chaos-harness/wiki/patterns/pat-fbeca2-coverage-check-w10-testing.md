---
id: pat-fbeca2
type: pattern
title: coverage-check (W10_testing)
tags: [gate, W10_testing, generic, soft]
links: []
sources: []
created: "2026-06-29T03:24:24.274Z"
updated: "2026-06-29T03:24:24.274Z"
confidence: 0.8
status: promoted
---

**Stage:** W10_testing
**Validators:** script:coverage-checker
**Level:** soft
**Stack:** generic
**Dependencies:** none
覆盖率不低于阈值
- ✅ Do: 设置合理阈值 60%
- ❌ Don't: 不要设 100% 阻塞开发
