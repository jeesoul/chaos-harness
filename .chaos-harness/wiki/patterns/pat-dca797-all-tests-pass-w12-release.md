---
id: pat-dca797
type: pattern
title: all-tests-pass (W12_release)
tags: [gate, W12_release, generic, hard]
links: []
sources: []
created: "2026-06-29T03:24:24.276Z"
updated: "2026-06-29T03:24:24.276Z"
confidence: 0.8
status: promoted
---

**Stage:** W12_release
**Validators:** test-suite-pass
**Level:** hard
**Stack:** generic
**Dependencies:** none
发布前所有测试通过
- ✅ Do: 确保 CI 绿色
- ❌ Don't: 不要带着失败测试发布
