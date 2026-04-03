@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Installation Script (Marketplace Mode)
REM Installs as a Claude Code plugin with slash commands

setlocal enabledelayedexpansion

set "PLUGIN_NAME=chaos-harness"
set "MARKETPLACE_NAME=chaos-harness"
set "VERSION=1.0.0"

echo ========================================================
echo     Chaos Harness Installation Script
echo     Chaos demands order. Harness provides it.
echo ========================================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"

REM Set directories
set "MARKETPLACE_DIR=%USERPROFILE%\.claude\plugins\marketplaces\%MARKETPLACE_NAME%"
set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\%MARKETPLACE_NAME%\%PLUGIN_NAME%\%VERSION%"

REM Uninstall mode
if "%1"=="--uninstall" goto uninstall

REM Install
echo Installing Chaos Harness plugin...

REM Create marketplace directory
if not exist "%MARKETPLACE_DIR%" mkdir "%MARKETPLACE_DIR%"

REM Copy plugin files to marketplace
echo Copying to marketplace directory...
xcopy /s /e /i /q /y "%SCRIPT_DIR%.claude-plugin" "%MARKETPLACE_DIR%\.claude-plugin\" >nul
xcopy /s /e /i /q /y "%SCRIPT_DIR%skills" "%MARKETPLACE_DIR%\skills\" >nul
if exist "%SCRIPT_DIR%CLAUDE.md" copy /y "%SCRIPT_DIR%CLAUDE.md" "%MARKETPLACE_DIR%\" >nul
if exist "%SCRIPT_DIR%README.md" copy /y "%SCRIPT_DIR%README.md" "%MARKETPLACE_DIR%\" >nul
if exist "%SCRIPT_DIR%templates" xcopy /s /e /i /q /y "%SCRIPT_DIR%templates" "%MARKETPLACE_DIR%\templates\" >nul
if exist "%SCRIPT_DIR%commands" xcopy /s /e /i /q /y "%SCRIPT_DIR%commands" "%MARKETPLACE_DIR%\commands\" >nul
if exist "%SCRIPT_DIR%hooks" xcopy /s /e /i /q /y "%SCRIPT_DIR%hooks" "%MARKETPLACE_DIR%\hooks\" >nul

REM Create cache directory
if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"

REM Copy to cache directory
echo Copying to cache directory...
xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\.claude-plugin" "%CACHE_DIR%\.claude-plugin\" >nul
xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\skills" "%CACHE_DIR%\skills\" >nul
xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\templates" "%CACHE_DIR%\templates\" >nul
xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\hooks" "%CACHE_DIR%\hooks\" >nul
if exist "%MARKETPLACE_DIR%\commands" xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\commands" "%CACHE_DIR%\commands\" >nul
if exist "%MARKETPLACE_DIR%\CLAUDE.md" copy /y "%MARKETPLACE_DIR%\CLAUDE.md" "%CACHE_DIR%\" >nul
if exist "%MARKETPLACE_DIR%\README.md" copy /y "%MARKETPLACE_DIR%\README.md" "%CACHE_DIR%\" >nul

REM Remove orphaned marker if exists (Claude Code may create this during reinstall)
if exist "%CACHE_DIR%\.orphaned_at" del /f /q "%CACHE_DIR%\.orphaned_at" 2>nul

REM Verify installation
echo Verifying installation...
set "VERIFY_FAILED=0"

if not exist "%CACHE_DIR%\skills\overview\SKILL.md" (
    echo [ERROR] Missing: skills\overview\SKILL.md
    set "VERIFY_FAILED=1"
)

if not exist "%CACHE_DIR%\commands\overview.md" (
    echo [ERROR] Missing: commands\overview.md
    set "VERIFY_FAILED=1"
)

if not exist "%CACHE_DIR%\.claude-plugin\plugin.json" (
    echo [ERROR] Missing: .claude-plugin\plugin.json
    set "VERIFY_FAILED=1"
)

if "%VERIFY_FAILED%"=="1" (
    echo [ERROR] Installation verification failed
    echo Please check if all files are present in the source directory
    goto done
)

echo [OK] All files verified

REM Register marketplace
echo Registering marketplace...
powershell -Command "$file='%USERPROFILE%\.claude\plugins\known_marketplaces.json'; $ts=Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.000Z'; if(!(Test-Path $file)){ New-Item -ItemType Directory -Force -Path (Split-Path $file) | Out-Null; '{}' | Out-File -Encoding utf8 $file }; $json=Get-Content $file | ConvertFrom-Json; $json | Add-Member -NotePropertyName 'chaos-harness' -NotePropertyValue @{source=@{source='github';repo='jeesoul/chaos-harness'};installLocation='%MARKETPLACE_DIR%';lastUpdated=$ts} -Force; $json | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $file" 2>nul

REM Register plugin
echo Registering plugin...
powershell -Command "$file='%USERPROFILE%\.claude\plugins\installed_plugins.json'; $ts=Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.000Z'; if(!(Test-Path $file)){ New-Item -ItemType Directory -Force -Path (Split-Path $file) | Out-Null; '{\"version\":2,\"plugins\":{}}' | Out-File -Encoding utf8 $file }; $json=Get-Content $file | ConvertFrom-Json; if(!$json.plugins){Add-Member -InputObject $json -NotePropertyName 'plugins' -NotePropertyValue @{} -Force}; $json.plugins | Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue @(@{scope='user';installPath='%CACHE_DIR%';version='%VERSION%';installedAt=$ts;lastUpdated=$ts}) -Force; $json | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $file" 2>nul

REM Enable plugin in settings
echo Enabling plugin in settings...
powershell -Command "$file='%USERPROFILE%\.claude\settings.json'; $dir=Split-Path $file; if(!(Test-Path $dir)){ New-Item -ItemType Directory -Force -Path $dir | Out-Null }; if(!(Test-Path $file)){ '{}' | Out-File -Encoding utf8 $file }; $json=Get-Content $file | ConvertFrom-Json; if(!$json.enabledPlugins){Add-Member -InputObject $json -NotePropertyName 'enabledPlugins' -NotePropertyValue @{} -Force}; $json.enabledPlugins | Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue $true -Force; if(!$json.extraKnownMarketplaces){Add-Member -InputObject $json -NotePropertyName 'extraKnownMarketplaces' -NotePropertyValue @{} -Force}; $json.extraKnownMarketplaces | Add-Member -NotePropertyName 'chaos-harness' -NotePropertyValue @{source=@{repo='jeesoul/chaos-harness';source='github'}} -Force; $json | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $file" 2>nul

echo [OK] Plugin installed successfully

goto done

:uninstall
echo Uninstalling Chaos Harness...

if exist "%USERPROFILE%\.claude\plugins\cache\chaos-harness" (
    rmdir /s /q "%USERPROFILE%\.claude\plugins\cache\chaos-harness"
)
if exist "%MARKETPLACE_DIR%" (
    rmdir /s /q "%MARKETPLACE_DIR%"
)

echo Unregistering plugin...
powershell -Command "$file='%USERPROFILE%\.claude\plugins\installed_plugins.json'; if(Test-Path $file){ $json=Get-Content $file|ConvertFrom-Json; $json.plugins.PSObject.Properties.Remove('chaos-harness@chaos-harness'); $json|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $file }" 2>nul

echo Unregistering marketplace...
powershell -Command "$file='%USERPROFILE%\.claude\plugins\known_marketplaces.json'; if(Test-Path $file){ $json=Get-Content $file|ConvertFrom-Json; $json.PSObject.Properties.Remove('chaos-harness'); $json|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $file }" 2>nul

echo Disabling plugin in settings...
powershell -Command "$file='%USERPROFILE%\.claude\settings.json'; if(Test-Path $file){ $json=Get-Content $file|ConvertFrom-Json; $json.enabledPlugins.PSObject.Properties.Remove('chaos-harness@chaos-harness'); $json.extraKnownMarketplaces.PSObject.Properties.Remove('chaos-harness'); $json|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $file }" 2>nul

echo [OK] Plugin removed
echo Uninstall complete
exit /b 0

:done
echo.
echo ========================================================
echo   Installation Complete!
echo ========================================================
echo.
echo Available Slash Commands:
echo.
echo   /chaos-harness:overview             # Main entry
echo   /chaos-harness:project-scanner      # Scan project
echo   /chaos-harness:version-locker       # Version management
echo   /chaos-harness:harness-generator    # Generate constraints
echo   /chaos-harness:workflow-supervisor  # Workflow management
echo   /chaos-harness:iron-law-enforcer    # Iron law enforcement
echo   /chaos-harness:plugin-manager       # Plugin management
echo   /chaos-harness:hooks-manager        # Hooks management
echo   /chaos-harness:project-state        # State persistence
echo   /chaos-harness:collaboration-reviewer # Multi-agent collaboration
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