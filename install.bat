@echo off
REM Chaos Harness Install - Using Node.js for JSON

echo ========================================================
echo   Chaos Harness Install
echo ========================================================
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo Please install Node.js from https://nodejs.org/
    goto :end
)

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

REM Create temp JS file
set "JS_FILE=%TEMP%\chaos-install.js"
echo const fs = require('fs'); > "%JS_FILE%"
echo const path = require('path'); >> "%JS_FILE%"
echo const home = process.env.USERPROFILE; >> "%JS_FILE%"
echo const cacheDir = path.join(home, '.claude', 'plugins', 'cache', 'chaos-harness', 'chaos-harness', '1.0.0'); >> "%JS_FILE%"
echo const installedFile = path.join(home, '.claude', 'plugins', 'installed_plugins.json'); >> "%JS_FILE%"
echo const settingsFile = path.join(home, '.claude', 'settings.json'); >> "%JS_FILE%"
echo const ts = new Date().toISOString(); >> "%JS_FILE%"
echo. >> "%JS_FILE%"
echo // Read or create installed_plugins.json >> "%JS_FILE%"
echo let installed = {version: 2, plugins: {}}; >> "%JS_FILE%"
echo if (fs.existsSync(installedFile)) { >> "%JS_FILE%"
echo   try { installed = JSON.parse(fs.readFileSync(installedFile, 'utf8')); } catch(e) {} >> "%JS_FILE%"
echo } >> "%JS_FILE%"
echo if (!installed.plugins) installed.plugins = {}; >> "%JS_FILE%"
echo installed.plugins['chaos-harness@chaos-harness'] = [{ >> "%JS_FILE%"
echo   scope: 'user', >> "%JS_FILE%"
echo   installPath: cacheDir, >> "%JS_FILE%"
echo   version: '1.0.0', >> "%JS_FILE%"
echo   installedAt: ts, >> "%JS_FILE%"
echo   lastUpdated: ts >> "%JS_FILE%"
echo }]; >> "%JS_FILE%"
echo fs.mkdirSync(path.dirname(installedFile), {recursive: true}); >> "%JS_FILE%"
echo fs.writeFileSync(installedFile, JSON.stringify(installed, null, 2)); >> "%JS_FILE%"
echo console.log('[OK] Registered in installed_plugins.json'); >> "%JS_FILE%"
echo. >> "%JS_FILE%"
echo // Read or create settings.json >> "%JS_FILE%"
echo let settings = {}; >> "%JS_FILE%"
echo if (fs.existsSync(settingsFile)) { >> "%JS_FILE%"
echo   try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch(e) {} >> "%JS_FILE%"
echo } >> "%JS_FILE%"
echo if (!settings.enabledPlugins) settings.enabledPlugins = {}; >> "%JS_FILE%"
echo settings.enabledPlugins['chaos-harness@chaos-harness'] = true; >> "%JS_FILE%"
echo fs.mkdirSync(path.dirname(settingsFile), {recursive: true}); >> "%JS_FILE%"
echo fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2)); >> "%JS_FILE%"
echo console.log('[OK] Enabled in settings.json'); >> "%JS_FILE%"

node "%JS_FILE%"
del "%JS_FILE%" 2>nul

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