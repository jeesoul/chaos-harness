@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Installation Script (Windows)
REM Pure Skill integration, no MCP required

setlocal enabledelayedexpansion

echo ========================================================
echo     Chaos Harness Installation Script
echo     Chaos demands order. Harness provides it.
echo ========================================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "PLUGIN_NAME=chaos-harness"

REM Set target directory
set "PLUGIN_DIR=%USERPROFILE%\.claude\plugins"
set "TARGET_DIR=%PLUGIN_DIR%\%PLUGIN_NAME%"

REM Uninstall mode
if "%1"=="--uninstall" goto uninstall

REM Install
echo Installing Chaos Harness plugin...

REM Create plugin directory
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"

REM Remove old version
if exist "%TARGET_DIR%" (
    echo Removing old version...
    rmdir /s /q "%TARGET_DIR%"
)

REM Create target directory
mkdir "%TARGET_DIR%"

REM Copy plugin config
echo Copying plugin config...
xcopy /s /e /i /q "%SCRIPT_DIR%.claude-plugin" "%TARGET_DIR%\.claude-plugin\" >nul

REM Copy skills (core!)
echo Copying skills...
xcopy /s /e /i /q "%SCRIPT_DIR%skills" "%TARGET_DIR%\skills\" >nul

REM Copy CLAUDE.md
if exist "%SCRIPT_DIR%CLAUDE.md" (
    copy /y "%SCRIPT_DIR%CLAUDE.md" "%TARGET_DIR%\" >nul
)

REM Copy README.md
if exist "%SCRIPT_DIR%README.md" (
    copy /y "%SCRIPT_DIR%README.md" "%TARGET_DIR%\" >nul
)

REM Copy templates
if exist "%SCRIPT_DIR%templates" (
    xcopy /s /e /i /q "%SCRIPT_DIR%templates" "%TARGET_DIR%\templates\" >nul
)

echo [OK] Plugin installed to: %TARGET_DIR%

goto done

:uninstall
echo Uninstalling Chaos Harness...

if exist "%TARGET_DIR%" (
    rmdir /s /q "%TARGET_DIR%"
    echo [OK] Plugin removed
) else (
    echo Plugin not installed
)

echo Uninstall complete
exit /b 0

:done
echo.
echo ========================================================
echo   Installation Complete!
echo ========================================================
echo.
echo Usage:
echo.
echo 1. Restart Claude Code or start a new session
echo.
echo 2. Natural language triggers (just talk):
echo.
echo    # Scan project
echo    scan current project
echo.
echo    # Generate Harness
echo    generate harness for this project
echo.
echo    # Version management
echo    create version v0.1
echo.
echo    # Iron laws
echo    list all iron laws
echo.
echo 3. Slash commands:
echo.
echo    /chaos-harness:project-scanner     # Scan project
echo    /chaos-harness:version-locker      # Version lock
echo    /chaos-harness:harness-generator   # Generate constraints
echo    /chaos-harness:workflow-supervisor # Workflow
echo    /chaos-harness:iron-law-enforcer   # Iron law enforcement
echo    /chaos-harness:plugin-manager      # Plugin management
echo.
echo Installed Skills:
echo    - project-scanner     (Project scanning)
echo    - version-locker      (Version locking)
echo    - harness-generator   (Harness generation)
echo    - workflow-supervisor (Workflow supervision)
echo    - iron-law-enforcer   (Iron law enforcement)
echo    - plugin-manager      (Plugin management)
echo.
echo Plugin Management:
echo    view plugin list
echo    install plugin github:owner/plugin
echo    add iron law: no deployment on friday
echo.

endlocal