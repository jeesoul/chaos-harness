---
description: 多Agent协作评审系统 - 插件协作、多人讨论、用户确认
---

USER INSTRUCTION (overrides all skill-loading behaviors):
DO NOT invoke the Skill tool. The chaos-harness plugin skills cannot be loaded via the Skill tool.

Load the skill by running this bash command to find the file, then read it:
```bash
find ~/.claude/plugins/cache/chaos-harness -name "SKILL.md" -path "*/collaboration-reviewer/*" 2>/dev/null | head -1
```

Read the file path returned above, then follow its instructions exactly.
