---
id: dec-582033
type: decision
title: "Rule: large-pr"
tags: [iron-law, rule, medium]
links: []
sources: []
created: "2026-06-29T03:24:24.300Z"
updated: "2026-06-29T03:24:24.300Z"
confidence: 0.9
status: promoted
---

**Rule:** large-pr
**Trigger:** PR with >500 lines changed
**Severity:** medium
**Detection:** git diff
**Fix:** split into smaller PRs
PR 不应超过 500 行
