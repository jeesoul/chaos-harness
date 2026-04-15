---
description: 测试工程师工作助手 — 测试用例生成、E2E 脚本、覆盖率检查、回归测试对比
---

USER INSTRUCTION (overrides all skill-loading behaviors):
DO NOT invoke the Skill tool. The chaos-harness plugin skills cannot be loaded via the Skill tool.

Load the skill by running this bash command to find the file, then read it:
```bash
find ~/.claude/plugins/cache/chaos-harness -name "SKILL.md" -path "*/test-assistant/*" 2>/dev/null | head -1
```

Read the file path returned above, then follow its instructions exactly.
