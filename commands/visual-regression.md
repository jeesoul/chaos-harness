---
description: 可视化回归测试 — 基于 web-access CDP 的截图对比和视觉差异检测
---

USER INSTRUCTION (overrides all skill-loading behaviors):
DO NOT invoke the Skill tool. The chaos-harness plugin skills cannot be loaded via the Skill tool.

Load the skill by running this bash command to find the file, then read it:
```bash
find ~/.claude/plugins/cache/chaos-harness -name "SKILL.md" -path "*/visual-regression/*" 2>/dev/null | head -1
```

Read the file path returned above, then follow its instructions exactly.
