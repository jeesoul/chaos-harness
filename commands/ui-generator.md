---
description: UI 代码生成器 — 从 PRD 用户故事推导页面清单，生成可运行的 Vue/React 组件，CDP 验证预览
---

USER INSTRUCTION (overrides all skill-loading behaviors):
DO NOT invoke the Skill tool. The chaos-harness plugin skills cannot be loaded via the Skill tool.

Load the skill by running this bash command to find the file, then read it:
```bash
find ~/.claude/plugins/cache/chaos-harness -name "SKILL.md" -path "*/ui-generator/*" 2>/dev/null | head -1
```

Read the file path returned above, then follow its instructions exactly.
