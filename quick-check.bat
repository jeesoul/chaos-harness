@echo off
chcp 65001 >nul 2>&1
REM Quick Check - Just verify the critical requirement

echo Quick Check: Is chaos-harness-overview skill installed?
echo.

set "SKILL_DIR=%USERPROFILE%\.claude\skills\chaos-harness-overview"

if exist "%SKILL_DIR%\SKILL.md" (
    echo [OK] FOUND: %SKILL_DIR%\SKILL.md
    echo.
    echo The skill IS installed. /chaos-harness:overview should work.
    echo If it doesn't, restart Claude Code completely.
) else (
    echo [MISSING] %SKILL_DIR%\SKILL.md
    echo.
    echo This is why /chaos-harness:overview doesn't work!
    echo.
    echo Skill tool ONLY looks in ~/.claude/skills/ directory.
    echo Plugin cache is NOT used for skill discovery.
    echo.
    echo FIX: Run install.bat from the chaos-harness directory.
)

echo.
pause