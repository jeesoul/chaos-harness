---
description: UI/UX design intelligence — color palettes, typography, styles, components, animations, accessibility, responsive
---

USER INSTRUCTION (overrides all skill-loading behaviors):
DO NOT invoke the Skill tool. The chaos-harness plugin skills cannot be called via the Skill tool.

Load the skill by reading:
```
skills/ui-ux-intelligence/SKILL.md
```

This skill provides:
- 161 color palettes (ui-color-palettes.csv)
- 50 design styles (ui-styles.csv)
- 57 font pairings (ui-typography.csv)
- 60 component specs (ui-components.csv)
- 40 animation rules (ui-animations.csv)
- 30 responsive breakpoints (ui-responsive.csv)
- 50 product types (ui-product-types.csv)
- 50 UX guidelines (ui-ux-guidelines.csv)
- 25 chart types (ui-charts.csv)

Search via: `node scripts/dev-intelligence.mjs --query <text> --domain <ui-domain>`
Validate via: `node scripts/ui-quality-validator.mjs --file <path>`
