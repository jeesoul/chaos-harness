@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Installation Script (Windows)
REM Installs skills to ~/.claude/skills/

setlocal enabledelayedexpansion

echo ========================================================
echo     Chaos Harness Installation Script
echo     Chaos demands order. Harness provides it.
echo ========================================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"

REM Set skills directory
set "SKILLS_DIR=%USERPROFILE%\.claude\skills"

REM Uninstall mode
if "%1"=="--uninstall" goto uninstall

REM Install
echo Installing Chaos Harness skills...

REM Create skills directory if not exists
if not exist "%SKILLS_DIR%" mkdir "%SKILLS_DIR%"

REM Install each skill
for /d %%D in ("%SCRIPT_DIR%skills\*") do (
    if exist "%%D\SKILL.md" (
        set "SKILL_NAME=%%~nxD"
        echo   Installing: !SKILL_NAME!

        REM Remove old version if exists
        if exist "%SKILLS_DIR%\!SKILL_NAME!" rmdir /s /q "%SKILLS_DIR%\!SKILL_NAME!"

        REM Copy skill
        xcopy /s /e /i /q "%%D" "%SKILLS_DIR%\!SKILL_NAME!\" >nul
    )
)

echo [OK] Skills installed to: %SKILLS_DIR%

goto done

:uninstall
echo Uninstalling Chaos Harness skills...

REM List of skills to remove
for %%S in (overview project-scanner version-locker harness-generator workflow-supervisor iron-law-enforcer plugin-manager) do (
    if exist "%SKILLS_DIR%\%%S" (
        echo   Removing: %%S
        rmdir /s /q "%SKILLS_DIR%\%%S"
    )
)

echo [OK] Skills removed
exit /b 0

:done
echo.
echo ========================================================
echo   Installation Complete!
echo ========================================================
echo.
echo Available Skills:
echo    - overview             (Main entry, Iron Laws)
echo    - project-scanner      (Project scanning)
echo    - version-locker       (Version locking)
echo    - harness-generator    (Harness generation)
echo    - workflow-supervisor  (Workflow supervision)
echo    - iron-law-enforcer    (Iron law enforcement)
echo    - plugin-manager       (Plugin management)
echo.
echo Usage:
echo.
echo 1. Restart Claude Code or start a new session
echo.
echo 2. Natural language triggers:
echo    - scan current project
echo    - generate harness for this project
echo    - create version v0.1
echo    - list all iron laws
echo.
echo 3. The skills will auto-activate based on context
echo.

endlocal