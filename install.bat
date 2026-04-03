@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Installation Script (Fixed Version)

setlocal enabledelayedexpansion

set "PLUGIN_NAME=chaos-harness"
set "MARKETPLACE_NAME=chaos-harness"
set "VERSION=1.0.0"

echo ========================================================
echo     Chaos Harness Installation Script
echo     Chaos demands order. Harness provides it.
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "MARKETPLACE_DIR=%USERPROFILE%\.claude\plugins\marketplaces\%MARKETPLACE_NAME%"
set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\%MARKETPLACE_NAME%\%PLUGIN_NAME%\%VERSION%"

if "%1"=="--uninstall" goto uninstall

echo Installing Chaos Harness plugin...

REM Create directories
if not exist "%MARKETPLACE_DIR%" mkdir "%MARKETPLACE_DIR%"
if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"

REM Copy files
echo Copying files...
xcopy /s /e /i /q /y "%SCRIPT_DIR%.claude-plugin" "%MARKETPLACE_DIR%\.claude-plugin\" >nul 2>&1
xcopy /s /e /i /q /y "%SCRIPT_DIR%skills" "%MARKETPLACE_DIR%\skills\" >nul 2>&1
xcopy /s /e /i /q /y "%SCRIPT_DIR%commands" "%MARKETPLACE_DIR%\commands\" >nul 2>&1
xcopy /s /e /i /q /y "%SCRIPT_DIR%hooks" "%MARKETPLACE_DIR%\hooks\" >nul 2>&1
if exist "%SCRIPT_DIR%templates" xcopy /s /e /i /q /y "%SCRIPT_DIR%templates" "%MARKETPLACE_DIR%\templates\" >nul 2>&1
if exist "%SCRIPT_DIR%CLAUDE.md" copy /y "%SCRIPT_DIR%CLAUDE.md" "%MARKETPLACE_DIR%\" >nul 2>&1

xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\.claude-plugin" "%CACHE_DIR%\.claude-plugin\" >nul 2>&1
xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\skills" "%CACHE_DIR%\skills\" >nul 2>&1
xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\commands" "%CACHE_DIR%\commands\" >nul 2>&1
xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\hooks" "%CACHE_DIR%\hooks\" >nul 2>&1
if exist "%MARKETPLACE_DIR%\templates" xcopy /s /e /i /q /y "%MARKETPLACE_DIR%\templates" "%CACHE_DIR%\templates\" >nul 2>&1
if exist "%MARKETPLACE_DIR%\CLAUDE.md" copy /y "%MARKETPLACE_DIR%\CLAUDE.md" "%CACHE_DIR%\" >nul 2>&1

echo [OK] Files copied

REM Create registration script
echo Creating registration script...
set "REG_SCRIPT=%TEMP%\register-chaos-harness.ps1"

echo $ErrorActionPreference = 'Stop' > "%REG_SCRIPT%"
echo $CACHE_DIR = '%CACHE_DIR%' >> "%REG_SCRIPT%"
echo $MARKETPLACE_DIR = '%MARKETPLACE_DIR%' >> "%REG_SCRIPT%"
echo $VERSION = '%VERSION%' >> "%REG_SCRIPT%"
echo $ts = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.000Z' >> "%REG_SCRIPT%"
echo. >> "%REG_SCRIPT%"
echo # Register in installed_plugins.json >> "%REG_SCRIPT%"
echo $installedFile = "$env:USERPROFILE\.claude\plugins\installed_plugins.json" >> "%REG_SCRIPT%"
echo $installedDir = Split-Path $installedFile >> "%REG_SCRIPT%"
echo if (-not (Test-Path $installedDir)) { New-Item -ItemType Directory -Force -Path $installedDir ^| Out-Null } >> "%REG_SCRIPT%"
echo if (-not (Test-Path $installedFile)) { '{\"version\":2,\"plugins\":{}}' ^| Out-File -Encoding utf8 $installedFile } >> "%REG_SCRIPT%"
echo $json = Get-Content $installedFile ^| ConvertFrom-Json >> "%REG_SCRIPT%"
echo if ($null -eq $json.plugins) { $json ^| Add-Member -NotePropertyName 'plugins' -NotePropertyValue @{} -Force } >> "%REG_SCRIPT%"
echo $entry = @{scope='user'; installPath=$CACHE_DIR; version=$VERSION; installedAt=$ts; lastUpdated=$ts} >> "%REG_SCRIPT%"
echo $json.plugins ^| Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue @($entry) -Force >> "%REG_SCRIPT%"
echo $json ^| ConvertTo-Json -Depth 10 ^| Out-File -Encoding utf8 $installedFile >> "%REG_SCRIPT%"
echo Write-Host '[OK] Registered in installed_plugins.json' >> "%REG_SCRIPT%"
echo. >> "%REG_SCRIPT%"
echo # Register in known_marketplaces.json >> "%REG_SCRIPT%"
echo $marketplaceFile = "$env:USERPROFILE\.claude\plugins\known_marketplaces.json" >> "%REG_SCRIPT%"
echo if (-not (Test-Path $marketplaceFile)) { '{}' ^| Out-File -Encoding utf8 $marketplaceFile } >> "%REG_SCRIPT%"
echo $json = Get-Content $marketplaceFile ^| ConvertFrom-Json >> "%REG_SCRIPT%"
echo $json ^| Add-Member -NotePropertyName 'chaos-harness' -NotePropertyValue @{source=@{source='github';repo='jeesoul/chaos-harness'};installLocation=$MARKETPLACE_DIR;lastUpdated=$ts} -Force >> "%REG_SCRIPT%"
echo $json ^| ConvertTo-Json -Depth 10 ^| Out-File -Encoding utf8 $marketplaceFile >> "%REG_SCRIPT%"
echo Write-Host '[OK] Registered in known_marketplaces.json' >> "%REG_SCRIPT%"
echo. >> "%REG_SCRIPT%"
echo # Enable in settings.json >> "%REG_SCRIPT%"
echo $settingsFile = "$env:USERPROFILE\.claude\settings.json" >> "%REG_SCRIPT%"
echo $settingsDir = Split-Path $settingsFile >> "%REG_SCRIPT%"
echo if (-not (Test-Path $settingsDir)) { New-Item -ItemType Directory -Force -Path $settingsDir ^| Out-Null } >> "%REG_SCRIPT%"
echo if (Test-Path $settingsFile) { >> "%REG_SCRIPT%"
echo     $json = Get-Content $settingsFile ^| ConvertFrom-Json >> "%REG_SCRIPT%"
echo } else { >> "%REG_SCRIPT%"
echo     $json = [PSCustomObject]@{} >> "%REG_SCRIPT%"
echo } >> "%REG_SCRIPT%"
echo if ($null -eq $json.enabledPlugins) { $json ^| Add-Member -NotePropertyName 'enabledPlugins' -NotePropertyValue ([PSCustomObject]@{}) -Force } >> "%REG_SCRIPT%"
echo $json.enabledPlugins ^| Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue $true -Force >> "%REG_SCRIPT%"
echo $json ^| ConvertTo-Json -Depth 10 ^| Out-File -Encoding utf8 $settingsFile >> "%REG_SCRIPT%"
echo Write-Host '[OK] Enabled in settings.json' >> "%REG_SCRIPT%"

REM Run registration script
echo Running registration...
powershell -NoProfile -ExecutionPolicy Bypass -File "%REG_SCRIPT%"
if errorlevel 1 (
    echo [ERROR] Registration failed
    echo Please run the following PowerShell commands manually:
    type "%REG_SCRIPT%"
    goto done
)

del /f /q "%REG_SCRIPT%" 2>nul

echo.
echo [OK] Plugin installed successfully

goto done

:uninstall
echo Uninstalling Chaos Harness...

if exist "%USERPROFILE%\.claude\plugins\cache\chaos-harness" rmdir /s /q "%USERPROFILE%\.claude\plugins\cache\chaos-harness"
if exist "%MARKETPLACE_DIR%" rmdir /s /q "%MARKETPLACE_DIR%"

powershell -NoProfile -Command "$f='$env:USERPROFILE\.claude\plugins\installed_plugins.json'; if(Test-Path $f){$j=Get-Content $f|ConvertFrom-Json;$j.plugins.PSObject.Properties.Remove('chaos-harness@chaos-harness');$j|ConvertTo-Json -Depth 10|Out-File $f}"
powershell -NoProfile -Command "$f='$env:USERPROFILE\.claude\plugins\known_marketplaces.json'; if(Test-Path $f){$j=Get-Content $f|ConvertFrom-Json;$j.PSObject.Properties.Remove('chaos-harness');$j|ConvertTo-Json -Depth 10|Out-File $f}"
powershell -NoProfile -Command "$f='$env:USERPROFILE\.claude\settings.json'; if(Test-Path $f){$j=Get-Content $f|ConvertFrom-Json;$j.enabledPlugins.PSObject.Properties.Remove('chaos-harness@chaos-harness');$j|ConvertTo-Json -Depth 10|Out-File $f}"

echo [OK] Uninstall complete
exit /b 0

:done
echo.
echo ========================================================
echo   Installation Complete!
echo ========================================================
echo.
echo Commands: /chaos-harness:overview
echo.
echo Next: Restart Claude Code and try the command
echo.

endlocal