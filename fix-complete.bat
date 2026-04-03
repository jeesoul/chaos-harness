@echo off
REM Chaos Harness Complete Fix

echo ========================================================
echo   Chaos Harness Complete Fix
echo ========================================================
echo.

set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0"

echo [1] Removing orphan marker...
if exist "%CACHE_DIR%\.orphaned_at" (
    del /f /q "%CACHE_DIR%\.orphaned_at"
    echo [OK] Removed .orphaned_at
) else (
    echo [INFO] No orphan marker found
)

echo.
echo [2] Fixing installed_plugins.json...

REM Create Node.js fix script
set "JS_FILE=%TEMP%\chaos-fix.cjs"
echo const fs = require('fs'); > "%JS_FILE%"
echo const path = require('path'); >> "%JS_FILE%"
echo const home = process.env.USERPROFILE; >> "%JS_FILE%"
echo const installedFile = path.join(home, '.claude', 'plugins', 'installed_plugins.json'); >> "%JS_FILE%"
echo const cacheDir = path.join(home, '.claude', 'plugins', 'cache', 'chaos-harness', 'chaos-harness', '1.0.0'); >> "%JS_FILE%"
echo const ts = new Date().toISOString(); >> "%JS_FILE%"
echo. >> "%JS_FILE%"
echo let installed = {version: 2, plugins: {}}; >> "%JS_FILE%"
echo if (fs.existsSync(installedFile)) { >> "%JS_FILE%"
echo   try { installed = JSON.parse(fs.readFileSync(installedFile, 'utf8')); } catch(e) {} >> "%JS_FILE%"
echo } >> "%JS_FILE%"
echo if (!installed.plugins) installed.plugins = {}; >> "%JS_FILE%"
echo. >> "%JS_FILE%"
echo // Remove old entry if exists >> "%JS_FILE%"
echo delete installed.plugins['chaos-harness@chaos-harness']; >> "%JS_FILE%"
echo. >> "%JS_FILE%"
echo // Add correct entry >> "%JS_FILE%"
echo installed.plugins['chaos-harness@chaos-harness'] = [{ >> "%JS_FILE%"
echo   scope: 'user', >> "%JS_FILE%"
echo   installPath: cacheDir, >> "%JS_FILE%"
echo   version: '1.0.0', >> "%JS_FILE%"
echo   installedAt: ts, >> "%JS_FILE%"
echo   lastUpdated: ts >> "%JS_FILE%"
echo }]; >> "%JS_FILE%"
echo. >> "%JS_FILE%"
echo fs.writeFileSync(installedFile, JSON.stringify(installed, null, 2)); >> "%JS_FILE%"
echo console.log('[OK] Fixed installed_plugins.json'); >> "%JS_FILE%"
echo console.log('installPath: ' + cacheDir); >> "%JS_FILE%"

node "%JS_FILE%"
del "%JS_FILE%" 2>nul

echo.
echo [3] Verifying settings.json...
set "JS_FILE=%TEMP%\chaos-verify.cjs"
echo const fs = require('fs'); > "%JS_FILE%"
echo const path = require('path'); >> "%JS_FILE%"
echo const home = process.env.USERPROFILE; >> "%JS_FILE%"
echo const settingsFile = path.join(home, '.claude', 'settings.json'); >> "%JS_FILE%"
echo. >> "%JS_FILE%"
echo let settings = {}; >> "%JS_FILE%"
echo if (fs.existsSync(settingsFile)) { >> "%JS_FILE%"
echo   try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch(e) {} >> "%JS_FILE%"
echo } >> "%JS_FILE%"
echo if (!settings.enabledPlugins) settings.enabledPlugins = {}; >> "%JS_FILE%"
echo settings.enabledPlugins['chaos-harness@chaos-harness'] = true; >> "%JS_FILE%"
echo fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2)); >> "%JS_FILE%"
echo console.log('[OK] Enabled in settings.json'); >> "%JS_FILE%"

node "%JS_FILE%"
del "%JS_FILE%" 2>nul

echo.
echo [4] Verifying files exist...
if exist "%CACHE_DIR%\skills\overview\SKILL.md" (
    echo [OK] skills/overview/SKILL.md exists
) else (
    echo [ERROR] skills/overview/SKILL.md MISSING - run install.bat first
)
if exist "%CACHE_DIR%\commands\overview.md" (
    echo [OK] commands/overview.md exists
) else (
    echo [ERROR] commands/overview.md MISSING - run install.bat first
)

echo.
echo ========================================================
echo   Fix Complete!
echo ========================================================
echo.
echo IMPORTANT: Restart Claude Code completely (close and reopen)
echo Then test: /chaos-harness:overview
echo.

pause