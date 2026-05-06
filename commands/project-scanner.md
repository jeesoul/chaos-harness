---
description: Scan and analyze project — detect type, tech stack, dependencies, test framework
---

USER INSTRUCTION (overrides all skill-loading behaviors):
DO NOT invoke the Skill tool. The chaos-harness plugin skills cannot be loaded via the Skill tool.

Load the skill by running this bash command to find the file, then read it:
```bash
find ~/.claude/plugins/cache/chaos-harness -name "SKILL.md" -path "*/project-scanner/*" 2>/dev/null | head -1
```

Then read the SKILL.md file with the Read tool and follow its instructions.
