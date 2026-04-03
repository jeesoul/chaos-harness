@echo off
REM Chaos Harness Manual Install - Direct JSON Write

echo ========================================================
echo   Chaos Harness Manual Install
echo ========================================================
echo.

set "CLAUDE_DIR=%USERPROFILE%\.claude"
set "CACHE_DIR=%CLAUDE_DIR%\plugins\cache\chaos-harness\chaos-harness\1.0.0"
set "PLUGIN_DIR=%CLAUDE_DIR%\plugins"

REM Step 1: Create directories
echo [1] Creating directories...
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"
if not exist "%CACHE_DIR%\skills" mkdir "%CACHE_DIR%\skills"
if not exist "%CACHE_DIR%\commands" mkdir "%CACHE_DIR%\commands"
if not exist "%CACHE_DIR%\.claude-plugin" mkdir "%CACHE_DIR%\.claude-plugin"
echo [OK] Done

REM Step 2: Copy files
echo.
echo [2] Copying files...
set "SRC_DIR=%~dp0"
xcopy /s /e /i /q /y "%SRC_DIR%skills" "%CACHE_DIR%\skills\" >nul
xcopy /s /e /i /q /y "%SRC_DIR%commands" "%CACHE_DIR%\commands\" >nul
xcopy /s /e /i /q /y "%SRC_DIR%.claude-plugin" "%CACHE_DIR%\.claude-plugin\" >nul
echo [OK] Done

REM Step 3: Write installed_plugins.json
echo.
echo [3] Writing installed_plugins.json...

REM Build JSON content with correct user path
set "INSTALL_PATH=%CACHE_DIR%"
set "INSTALL_PATH=%INSTALL_PATH:\=\\%"
set "TS=2026-04-03T00:00:00.000Z"

set "PLUGIN_FILE=%PLUGIN_DIR%\installed_plugins.json"

REM Check if file exists and has correct structure
powershell -NoProfile -Command ^
  "$f='%PLUGIN_FILE%';" ^
  "$p='%INSTALL_PATH%';" ^
  "if(Test-Path $f){$j=Get-Content $f|ConvertFrom-Json}else{$j=@{version=2;plugins=@{}}};" ^
  "if($j.plugins-eq$null){$j|Add-Member -NotePropertyName 'plugins' -NotePropertyValue @{} -Force};" ^
  "$entry=@{scope='user';installPath=$p;version='1.0.0';installedAt='%TS%';lastUpdated='%TS%'};" ^
  "$j.plugins|Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue @($entry) -Force;" ^
  "$j|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $f"

if errorlevel 1 (
    echo [ERROR] Failed to write installed_plugins.json
    goto :end
)
echo [OK] Done

REM Step 4: Write settings.json
echo.
echo [4] Writing settings.json...

set "SETTINGS_FILE=%CLAUDE_DIR%\settings.json"

powershell -NoProfile -Command ^
  "$f='%SETTINGS_FILE%';" ^
  "if(Test-Path $f){$j=Get-Content $f|ConvertFrom-Json}else{$j=@{}};" ^
  "if($j.enabledPlugins-eq$null){$j|Add-Member -NotePropertyName 'enabledPlugins' -NotePropertyValue @{} -Force};" ^
  "$j.enabledPlugins|Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue $true -Force;" ^
  "$j|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $f"

if errorlevel 1 (
    echo [ERROR] Failed to write settings.json
    goto :end
)
echo [OK] Done

echo.
echo ========================================================
echo   Install Complete!
echo ========================================================
echo.
echo Please restart Claude Code and test:
echo   /chaos-harness:overview
echo.

:end
pause