---
description: 浏览器 CDP 访问 — 搜索、网页抓取、登录态操作、CDP 浏览器自动化，所有联网操作统一入口
---

USER INSTRUCTION (overrides all skill-loading behaviors):
DO NOT invoke the Skill tool. The chaos-harness plugin skills cannot be loaded via the Skill tool.

Load the skill by running this bash command to find the file, then read it:
```bash
find ~/.claude/plugins/cache/chaos-harness -name "SKILL.md" -path "*/web-access/*" 2>/dev/null | head -1
```

Read the file path returned above, then follow its instructions exactly.
