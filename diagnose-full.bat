@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Full Diagnosis Script
REM Checks ALL requirements for /chaos-harness:overview to work

echo ========================================================
echo     Chaos Harness FULL Diagnosis Script
echo     Checks ALL requirements for command to work
echo ========================================================
echo.

set "ERRORS=0"
set "WARNINGS=0"

echo [STEP 1] Checking Personal Skills Directory (CRITICAL!)
echo.
set "PERSONAL_SKILLS_DIR=%USERPROFILE%\.claude\skills"
if exist "%PERSONAL_SKILLS_DIR%" (
    echo   Directory exists: %PERSONAL_SKILLS_DIR%
) else (
    echo   [ERROR] Personal skills directory does NOT exist!
    echo   This is why /chaos-harness:overview doesn't work!
    set /a ERRORS+=1
    goto :step2
)

echo.
echo   Checking for chaos-harness-overview skill...
if exist "%PERSONAL_SKILLS_DIR%\chaos-harness-overview" (
    echo   [OK] chaos-harness-overview directory found
    if exist "%PERSONAL_SKILLS_DIR%\chaos-harness-overview\SKILL.md" (
        echo   [OK] SKILL.md exists
    ) else (
        echo   [ERROR] SKILL.md missing in chaos-harness-overview
        set /a ERRORS+=1
    )
) else (
    echo   [ERROR] chaos-harness-overview NOT found in personal skills!
    echo   This is the ROOT CAUSE - Skill tool only looks here!
    set /a ERRORS+=1
)

echo.
echo   Listing all skills in personal directory:
dir /b "%PERSONAL_SKILLS_DIR%" 2>nul | findstr /i "chaos"
if errorlevel 1 (
    echo   [WARN] No chaos-harness skills found
    set /a WARNINGS+=1
)

:step2
echo.
echo ========================================================
echo [STEP 2] Checking Plugin Registration
echo.

set "INSTALLED_FILE=%USERPROFILE%\.claude\plugins\installed_plugins.json"
if exist "%INSTALLED_FILE%" (
    echo   File exists: %INSTALLED_FILE%
    findstr /C:"chaos-harness@chaos-harness" "%INSTALLED_FILE%" >nul 2>&1
    if errorlevel 1 (
        echo   [WARN] Not registered in installed_plugins.json
        echo   This is for tracking, not required for command to work
        set /a WARNINGS+=1
    ) else (
        echo   [OK] Registered in installed_plugins.json
    )
) else (
    echo   [WARN] installed_plugins.json not found
    set /a WARNINGS+=1
)

:step3
echo.
echo ========================================================
echo [STEP 3] Checking Settings.json (Plugin Enabled)
echo.

set "SETTINGS_FILE=%USERPROFILE%\.claude\settings.json"
if exist "%SETTINGS_FILE%" (
    echo   File exists: %SETTINGS_FILE%
    findstr /C:"chaos-harness@chaos-harness" "%SETTINGS_FILE%" >nul 2>&1
    if errorlevel 1 (
        echo   [WARN] Not enabled in settings.json
        echo   This may affect some plugin features
        set /a WARNINGS+=1
    ) else (
        echo   [OK] Enabled in settings.json
    )
) else (
    echo   [WARN] settings.json not found
    set /a WARNINGS+=1
)

:step4
echo.
echo ========================================================
echo [STEP 4] Checking Plugin Cache (Optional)
echo.

set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0"
if exist "%CACHE_DIR%" (
    echo   [OK] Cache directory exists: %CACHE_DIR%
) else (
    echo   [INFO] Cache directory not found - not required for Skill tool
)

:step5
echo.
echo ========================================================
echo [STEP 5] Checking Marketplace Registration
echo.

set "MARKETPLACE_FILE=%USERPROFILE%\.claude\plugins\known_marketplaces.json"
if exist "%MARKETPLACE_FILE%" (
    findstr /C:"chaos-harness" "%MARKETPLACE_FILE%" >nul 2>&1
    if errorlevel 1 (
        echo   [INFO] Not in known_marketplaces.json - optional
    ) else (
        echo   [OK] Registered in known_marketplaces.json
    )
) else (
    echo   [INFO] known_marketplaces.json not found - optional
)

echo.
echo ========================================================
echo SUMMARY
echo ========================================================
echo.

if "%ERRORS%"=="0" (
    if "%WARNINGS%"=="0" (
        echo [SUCCESS] All checks passed!
        echo.
        echo The /chaos-harness:overview command should work.
        echo If it doesn't, try:
        echo   1. Close ALL Claude Code windows
        echo   2. Start a NEW Claude Code session
        echo   3. Type: /chaos-harness:overview
    ) else (
        echo [PARTIAL] Passed with %WARNINGS% warning(s)
        echo.
        echo Core requirements met. Command should work after restart.
    )
) else (
    echo [FAILED] Found %ERRORS% critical error(s)
    echo.
    echo ROOT CAUSE: Skills not in personal skills directory!
    echo.
    echo FIX: Run install.bat again, then:
    echo   1. Verify ~/.claude/skills/chaos-harness-overview exists
    echo   2. Restart Claude Code
    echo.
    echo If install.bat doesn't create the directory, the script has a bug.
)

echo.
echo ========================================================
echo TECHNICAL EXPLANATION
echo ========================================================
echo.
echo How Skill Tool Discovery Works:
echo   1. Skill tool ONLY looks in ~/.claude/skills/ (personal directory)
echo   2. Plugin cache (~/.claude/plugins/cache/) is NOT used for discovery
echo   3. Each skill needs: directory + SKILL.md inside
echo   4. Directory name 'chaos-harness-overview' enables '/chaos-harness:overview'
echo.
echo This is why copying to personal skills directory is REQUIRED.
echo ========================================================

pause