---
id: dec-fc374b
type: decision
title: "Rule: no-docs-without-version"
tags: [iron-law, rule, critical]
links: []
sources: []
created: "2026-06-29T03:24:24.296Z"
updated: "2026-06-29T03:24:24.296Z"
confidence: 0.9
status: promoted
---

**Rule:** no-docs-without-version
**Trigger:** Write to output/ without version dir
**Severity:** critical
**Detection:** path regex
**Fix:** move to version dir
文档必须在版本目录下
