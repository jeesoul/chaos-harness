@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Diagnostic Script
REM Checks installation and reports issues

echo ========================================================
echo     Chaos Harness Diagnostic Script
echo ========================================================
echo.

set "PLUGIN_NAME=chaos-harness"
set "MARKETPLACE_NAME=chaos-harness"
set "VERSION=1.0.0"
set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\%MARKETPLACE_NAME%\%PLUGIN_NAME%\%VERSION%"
set "MARKETPLACE_DIR=%USERPROFILE%\.claude\plugins\marketplaces\%MARKETPLACE_NAME%"

echo [1] Checking installation directories...
echo.

REM Check cache directory
echo Cache Directory:
if exist "%CACHE_DIR%" (
    echo   [OK] %CACHE_DIR%
) else (
    echo   [ERROR] NOT FOUND: %CACHE_DIR%
    echo   Please run install.bat first.
    goto :end_check
)

echo.

echo [2] Checking critical files...
echo.

set "ERRORS=0"

REM Check plugin.json
if exist "%CACHE_DIR%\.claude-plugin\plugin.json" (
    echo   [OK] .claude-plugin\plugin.json
) else (
    echo   [ERROR] Missing: .claude-plugin\plugin.json
    set /a ERRORS+=1
)

REM Check skills
if exist "%CACHE_DIR%\skills\overview\SKILL.md" (
    echo   [OK] skills\overview\SKILL.md
) else (
    echo   [ERROR] Missing: skills\overview\SKILL.md
    set /a ERRORS+=1
)

if exist "%CACHE_DIR%\skills\project-scanner\SKILL.md" (
    echo   [OK] skills\project-scanner\SKILL.md
) else (
    echo   [ERROR] Missing: skills\project-scanner\SKILL.md
    set /a ERRORS+=1
)

REM Check commands
if exist "%CACHE_DIR%\commands\overview.md" (
    echo   [OK] commands\overview.md
) else (
    echo   [ERROR] Missing: commands\overview.md
    set /a ERRORS+=1
)

REM Check hooks
if exist "%CACHE_DIR%\hooks\hooks.json" (
    echo   [OK] hooks\hooks.json
) else (
    echo   [ERROR] Missing: hooks\hooks.json
    set /a ERRORS+=1
)

echo.

echo [3] Checking plugin registration...
echo.

REM Check installed_plugins.json
set "INSTALLED_FILE=%USERPROFILE%\.claude\plugins\installed_plugins.json"
if exist "%INSTALLED_FILE%" (
    findstr /C:"chaos-harness@chaos-harness" "%INSTALLED_FILE%" >nul 2>&1
    if errorlevel 1 (
        echo   [ERROR] Not registered in installed_plugins.json
        set /a ERRORS+=1
    ) else (
        echo   [OK] Registered in installed_plugins.json
    )
) else (
    echo   [ERROR] installed_plugins.json not found
    set /a ERRORS+=1
)

REM Check known_marketplaces.json
set "MARKETPLACE_FILE=%USERPROFILE%\.claude\plugins\known_marketplaces.json"
if exist "%MARKETPLACE_FILE%" (
    findstr /C:"chaos-harness" "%MARKETPLACE_FILE%" >nul 2>&1
    if errorlevel 1 (
        echo   [WARN] Not found in known_marketplaces.json
    ) else (
        echo   [OK] Registered in known_marketplaces.json
    )
) else (
    echo   [WARN] known_marketplaces.json not found
)

echo.

echo [4] Checking settings...
echo.

set "SETTINGS_FILE=%USERPROFILE%\.claude\settings.json"
if exist "%SETTINGS_FILE%" (
    echo   File: %SETTINGS_FILE%
    findstr /C:"chaos-harness@chaos-harness" "%SETTINGS_FILE%" >nul 2>&1
    if errorlevel 1 (
        echo   [ERROR] "chaos-harness@chaos-harness" not found in enabledPlugins
        echo   This is likely why commands don't work!
        set /a ERRORS+=1
    ) else (
        echo   [OK] Enabled in settings.json
    )
) else (
    echo   [ERROR] settings.json not found
    echo   This is likely why commands don't work!
    set /a ERRORS+=1
)

echo.

:end_check
echo ========================================================
echo Summary
echo ========================================================

if "%ERRORS%"=="0" (
    echo.
    echo [SUCCESS] All checks passed!
    echo.
    echo Installation looks correct. If commands still don't work:
    echo   1. Close ALL Claude Code windows
    echo   2. Start a NEW Claude Code session
    echo   3. Try: /chaos-harness:overview
    echo.
    echo If still not working, the skill might need a restart:
    echo   - In Claude Code, type: /skills
    echo   - Check if chaos-harness appears in the list
) else (
    echo.
    echo [FAILED] Found %ERRORS% error(s)
    echo.
    echo To fix:
    echo   1. Close Claude Code
    echo   2. Run: uninstall.bat (if exists)
    echo   3. Run: install.bat
    echo   4. Start a NEW Claude Code session
    echo.
    echo If problems persist, check:
    echo   - Are you running from the correct directory?
    echo   - Do you have write permissions?
)

echo ========================================================
pause