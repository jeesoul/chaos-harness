@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Installation Script (Windows)
REM Installs as a Claude Code plugin

setlocal enabledelayedexpansion

set "PLUGIN_NAME=chaos-harness"
set "VERSION=1.0.0"

echo ========================================================
echo     Chaos Harness Installation Script
echo     Chaos demands order. Harness provides it.
echo ========================================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"

REM Set plugin directory
set "PLUGIN_DIR=%USERPROFILE%\.claude\plugins\cache\local\%PLUGIN_NAME%\%VERSION%"

REM Uninstall mode
if "%1"=="--uninstall" goto uninstall

REM Install
echo Installing Chaos Harness plugin...

REM Create plugin directory
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"

REM Copy plugin files
echo Copying plugin files...
xcopy /s /e /i /q "%SCRIPT_DIR%.claude-plugin" "%PLUGIN_DIR%\.claude-plugin\" >nul
xcopy /s /e /i /q "%SCRIPT_DIR%skills" "%PLUGIN_DIR%\skills\" >nul
if exist "%SCRIPT_DIR%CLAUDE.md" copy /y "%SCRIPT_DIR%CLAUDE.md" "%PLUGIN_DIR%\" >nul
if exist "%SCRIPT_DIR%README.md" copy /y "%SCRIPT_DIR%README.md" "%PLUGIN_DIR%\" >nul
if exist "%SCRIPT_DIR%templates" xcopy /s /e /i /q "%SCRIPT_DIR%templates" "%PLUGIN_DIR%\templates\" >nul

REM Register plugin
echo Registering plugin...
powershell -Command "$file='%USERPROFILE%\.claude\plugins\installed_plugins.json'; $ts=Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.000Z'; if(!(Test-Path $file)){ New-Item -ItemType Directory -Force -Path (Split-Path $file) | Out-Null; '{\"version\":2,\"plugins\":{}}' | Out-File -Encoding utf8 $file }; $json=Get-Content $file | ConvertFrom-Json; $entry=@{scope='user';installPath='%PLUGIN_DIR%';version='%VERSION%';installedAt=$ts;lastUpdated=$ts}; if(!$json.plugins){Add-Member -InputObject $json -NotePropertyName 'plugins' -NotePropertyValue @{} -Force}; $json.plugins | Add-Member -NotePropertyName '%PLUGIN_NAME%@local' -NotePropertyValue @($entry) -Force; $json | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $file" 2>nul

echo [OK] Plugin installed to: %PLUGIN_DIR%

goto done

:uninstall
echo Uninstalling Chaos Harness...

if exist "%PLUGIN_DIR%" (
    rmdir /s /q "%PLUGIN_DIR%"
    echo Unregistering plugin...
    powershell -Command "$file='%USERPROFILE%\.claude\plugins\installed_plugins.json'; if(Test-Path $file){ $json=Get-Content $file|ConvertFrom-Json; $json.plugins.PSObject.Properties.Remove('%PLUGIN_NAME%@local'); $json|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $file }" 2>nul
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
echo Available Commands:
echo.
echo   /chaos-harness:overview             # Main entry
echo   /chaos-harness:project-scanner      # Scan project
echo   /chaos-harness:version-locker       # Version management
echo   /chaos-harness:harness-generator    # Generate constraints
echo   /chaos-harness:workflow-supervisor  # Workflow management
echo   /chaos-harness:iron-law-enforcer    # Iron law enforcement
echo   /chaos-harness:plugin-manager       # Plugin management
echo.
echo Natural Language Triggers:
echo   - "scan current project"
echo   - "generate harness for this project"
echo   - "create version v0.1"
echo   - "list all iron laws"
echo.
echo Next Steps:
echo   1. Restart Claude Code or start a new session
echo   2. Try: /chaos-harness:overview
echo.

endlocal