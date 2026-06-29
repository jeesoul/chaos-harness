---
id: pat-45c3be
type: pattern
title: "UI: button"
tags: [ui, button]
links: []
sources: []
created: "2026-06-29T03:24:24.289Z"
updated: "2026-06-29T03:24:24.289Z"
confidence: 0.8
status: promoted
---

**Component:** button
**Selector strategy:** text data-testid
**Assertion type:** element-visible text-contains
**Wait strategy:** waitForElement
按钮点击策略：优先 text 匹配，fallback 到 data-testid
