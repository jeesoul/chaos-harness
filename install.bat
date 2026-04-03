@echo off
REM Chaos Harness Clean Install - Fixes double-escape issue

setlocal enabledelayedexpansion

set "PLUGIN_NAME=chaos-harness"
set "VERSION=1.0.0"

echo ========================================================
echo   Chaos Harness Clean Install
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0"

echo [1] Creating directories...
if not exist "%CACHE_DIR%\skills" mkdir "%CACHE_DIR%\skills"
if not exist "%CACHE_DIR%\commands" mkdir "%CACHE_DIR%\commands"
if not exist "%CACHE_DIR%\.claude-plugin" mkdir "%CACHE_DIR%\.claude-plugin"
echo [OK] Done

echo.
echo [2] Copying files...
xcopy /s /e /i /q /y "%SCRIPT_DIR%skills" "%CACHE_DIR%\skills\" >nul 2>&1
xcopy /s /e /i /q /y "%SCRIPT_DIR%commands" "%CACHE_DIR%\commands\" >nul 2>&1
xcopy /s /e /i /q /y "%SCRIPT_DIR%.claude-plugin" "%CACHE_DIR%\.claude-plugin\" >nul 2>&1
if exist "%SCRIPT_DIR%templates" xcopy /s /e /i /q /y "%SCRIPT_DIR%templates" "%CACHE_DIR%\templates\" >nul 2>&1
echo [OK] Done

echo.
echo [3] Registering plugin...

REM Use Node.js-style JSON writing to avoid PowerShell escape issues
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$installedFile = \"$env:USERPROFILE\\.claude\\plugins\\installed_plugins.json\";" ^
  "$cacheDir = \"$env:USERPROFILE\\.claude\\plugins\\cache\\chaos-harness\\chaos-harness\\1.0.0\";" ^
  "$ts = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.000Z';" ^
  "$dir = Split-Path $installedFile;" ^
  "if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null };" ^
  "if (Test-Path $installedFile) { $json = Get-Content $installedFile -Raw | ConvertFrom-Json } else { $json = @{version=2;plugins=@{}} };" ^
  "if ($null -eq $json.plugins) { $json.plugins = @{} };" ^
  "$json.plugins.'chaos-harness@chaos-harness' = @(@{scope='user'; installPath=$cacheDir; version='1.0.0'; installedAt=$ts; lastUpdated=$ts});" ^
  "$json | ConvertTo-Json -Depth 10 | ForEach-Object { $_ -replace '\\\\\\\\', '\\' } | Out-File -Encoding utf8 $installedFile;" ^
  "Write-Host '[OK] Registered in installed_plugins.json'"

echo.
echo [4] Enabling plugin in settings.json...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$settingsFile = \"$env:USERPROFILE\\.claude\\settings.json\";" ^
  "$dir = Split-Path $settingsFile;" ^
  "if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null };" ^
  "if (Test-Path $settingsFile) { $json = Get-Content $settingsFile -Raw | ConvertFrom-Json } else { $json = @{} };" ^
  "if ($null -eq $json.enabledPlugins) { $json.enabledPlugins = @{} };" ^
  "$json.enabledPlugins.'chaos-harness@chaos-harness' = $true;" ^
  "$json | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $settingsFile;" ^
  "Write-Host '[OK] Enabled in settings.json'"

echo.
echo ========================================================
echo   Install Complete!
echo ========================================================
echo.
echo Please restart Claude Code and test:
echo   /chaos-harness:overview
echo.

endlocal
pause