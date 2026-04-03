@echo off
REM Chaos Harness Install - PowerShell Compatible

setlocal enabledelayedexpansion

echo ========================================================
echo   Chaos Harness Install
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

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$f = Join-Path $env:USERPROFILE '.claude\\plugins\\installed_plugins.json';" ^
  "$p = Join-Path $env:USERPROFILE '.claude\\plugins\\cache\\chaos-harness\\chaos-harness\\1.0.0';" ^
  "$ts = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.000Z';" ^
  "$d = Split-Path $f -Parent;" ^
  "if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null };" ^
  "if (Test-Path $f) { $j = Get-Content $f -Raw | ConvertFrom-Json } else { $j = [PSCustomObject]@{version=2;plugins=[PSCustomObject]@{}} };" ^
  "if ($null -eq $j.plugins) { $j | Add-Member -NotePropertyName 'plugins' -NotePropertyValue ([PSCustomObject]@{}) -Force };" ^
  "$entry = [PSCustomObject]@{scope='user'; installPath=$p; version='1.0.0'; installedAt=$ts; lastUpdated=$ts};" ^
  "$j.plugins | Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue @($entry) -Force;" ^
  "$j | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $f;" ^
  "Write-Host '[OK] Registered'"

echo.
echo [4] Enabling plugin...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$f = Join-Path $env:USERPROFILE '.claude\\settings.json';" ^
  "$d = Split-Path $f -Parent;" ^
  "if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null };" ^
  "if (Test-Path $f) { $j = Get-Content $f -Raw | ConvertFrom-Json } else { $j = [PSCustomObject]@{} };" ^
  "if ($null -eq $j.enabledPlugins) { $j | Add-Member -NotePropertyName 'enabledPlugins' -NotePropertyValue ([PSCustomObject]@{}) -Force };" ^
  "$j.enabledPlugins | Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue $true -Force;" ^
  "$j | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $f;" ^
  "Write-Host '[OK] Enabled'"

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