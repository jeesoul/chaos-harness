@echo off
REM Chaos Harness One-Click Fix Script

echo ========================================================
echo   Chaos Harness One-Click Fix
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0"

echo Step 1: Creating directories...
if not exist "%CACHE_DIR%\skills" mkdir "%CACHE_DIR%\skills"
if not exist "%CACHE_DIR%\commands" mkdir "%CACHE_DIR%\commands"
if not exist "%CACHE_DIR%\.claude-plugin" mkdir "%CACHE_DIR%\.claude-plugin"
echo [OK] Directories created

echo.
echo Step 2: Copying files...
if exist "%SCRIPT_DIR%skills" xcopy /s /e /i /q /y "%SCRIPT_DIR%skills" "%CACHE_DIR%\skills\"
if exist "%SCRIPT_DIR%commands" xcopy /s /e /i /q /y "%SCRIPT_DIR%commands" "%CACHE_DIR%\commands\"
if exist "%SCRIPT_DIR%.claude-plugin" xcopy /s /e /i /q /y "%SCRIPT_DIR%.claude-plugin" "%CACHE_DIR%\.claude-plugin\"
echo [OK] Files copied

echo.
echo Step 3: Creating registration PowerShell script...
set "REG_SCRIPT=%TEMP%\fix-chaos-harness.ps1"

echo $ErrorActionPreference = 'Stop' > "%REG_SCRIPT%"
echo $ts = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.000Z' >> "%REG_SCRIPT%"
echo. >> "%REG_SCRIPT%"
echo $installedFile = "$env:USERPROFILE\.claude\plugins\installed_plugins.json" >> "%REG_SCRIPT%"
echo $installedDir = Split-Path $installedFile >> "%REG_SCRIPT%"
echo if (-not (Test-Path $installedDir)) { New-Item -ItemType Directory -Force -Path $installedDir ^| Out-Null } >> "%REG_SCRIPT%"
echo if (-not (Test-Path $installedFile)) { '{"version":2,"plugins":{}}' ^| Out-File -Encoding utf8 $installedFile } >> "%REG_SCRIPT%"
echo $json = Get-Content $installedFile ^| ConvertFrom-Json >> "%REG_SCRIPT%"
echo if ($null -eq $json.plugins) { $json ^| Add-Member -NotePropertyName 'plugins' -NotePropertyValue @{} -Force } >> "%REG_SCRIPT%"
echo $entry = @{scope='user'; installPath='%CACHE_DIR%'; version='1.0.0'; installedAt=$ts; lastUpdated=$ts} >> "%REG_SCRIPT%"
echo $json.plugins ^| Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue @($entry) -Force >> "%REG_SCRIPT%"
echo $json ^| ConvertTo-Json -Depth 10 ^| Out-File -Encoding utf8 $installedFile >> "%REG_SCRIPT%"
echo Write-Host '[OK] Registered in installed_plugins.json' >> "%REG_SCRIPT%"
echo. >> "%REG_SCRIPT%"
echo $settingsFile = "$env:USERPROFILE\.claude\settings.json" >> "%REG_SCRIPT%"
echo $settingsDir = Split-Path $settingsFile >> "%REG_SCRIPT%"
echo if (-not (Test-Path $settingsDir)) { New-Item -ItemType Directory -Force -Path $settingsDir ^| Out-Null } >> "%REG_SCRIPT%"
echo if (Test-Path $settingsFile) { $json = Get-Content $settingsFile ^| ConvertFrom-Json } else { $json = [PSCustomObject]@{} } >> "%REG_SCRIPT%"
echo if ($null -eq $json.enabledPlugins) { $json ^| Add-Member -NotePropertyName 'enabledPlugins' -NotePropertyValue ([PSCustomObject]@{}) -Force } >> "%REG_SCRIPT%"
echo $json.enabledPlugins ^| Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue $true -Force >> "%REG_SCRIPT%"
echo $json ^| ConvertTo-Json -Depth 10 ^| Out-File -Encoding utf8 $settingsFile >> "%REG_SCRIPT%"
echo Write-Host '[OK] Enabled in settings.json' >> "%REG_SCRIPT%"

echo.
echo Step 4: Running registration...
powershell -NoProfile -ExecutionPolicy Bypass -File "%REG_SCRIPT%"
if errorlevel 1 (
    echo [ERROR] Registration failed
    echo Try running install.bat instead
    goto :end
)

del /f /q "%REG_SCRIPT%" 2>nul

echo.
echo ========================================================
echo   Fix Complete!
echo ========================================================
echo.
echo Please restart Claude Code and test:
echo   /chaos-harness:overview
echo.

:end
pause