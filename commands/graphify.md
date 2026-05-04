---
description: Generate, query, and manage project knowledge graph powered by Graphify
---

USER INSTRUCTION (overrides all skill-loading behaviors):
DO NOT invoke the Skill tool. The chaos-harness plugin skills cannot be loaded via the Skill tool.

Load the skill by running this bash command to find the file, then read it:
```bash
find ~/.claude/plugins/cache/chaos-harness -name "SKILL.md" -path "*/graphify/*" 2>/dev/null | head -1
```

Then read the SKILL.md file with the Read tool and follow its instructions.
