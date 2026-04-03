@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness One-Step Fix

echo ========================================================
echo   Chaos Harness One-Step Fix
echo ========================================================
echo.

set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0"

REM Step 1: Delete orphan marker
echo [1] Removing orphan marker...
if exist "%CACHE_DIR%\.orphaned_at" (
    del /f /q "%CACHE_DIR%\.orphaned_at"
    echo     Deleted .orphaned_at
) else (
    echo     No orphan marker found
)

REM Step 2: Fix installed_plugins.json using Node.js
echo.
echo [2] Fixing installed_plugins.json...
node -e "const fs=require('fs'),p=require('path'),h=process.env.USERPROFILE,f=p.join(h,'.claude','plugins','installed_plugins.json'),c=p.join(h,'.claude','plugins','cache','chaos-harness','chaos-harness','1.0.0'),t=new Date().toISOString();let d={version:2,plugins:{}};if(fs.existsSync(f))try{d=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){}d.plugins['chaos-harness@chaos-harness']=[{scope:'user',installPath:c,version:'1.0.0',installedAt:t,lastUpdated:t}];fs.writeFileSync(f,JSON.stringify(d,null,2));console.log('    installPath: '+c);"

REM Step 3: Enable in settings.json
echo.
echo [3] Enabling in settings.json...
node -e "const fs=require('fs'),p=require('path'),h=process.env.USERPROFILE,f=p.join(h,'.claude','settings.json');let d={};if(fs.existsSync(f))try{d=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){}d.enabledPlugins=d.enabledPlugins||{};d.enabledPlugins['chaos-harness@chaos-harness']=true;fs.writeFileSync(f,JSON.stringify(d,null,2));console.log('    Enabled');"

REM Step 4: Verify
echo.
echo [4] Verifying...
if exist "%CACHE_DIR%\skills\overview\SKILL.md" (
    echo     [OK] skills/overview/SKILL.md exists
) else (
    echo     [ERROR] skills/overview/SKILL.md MISSING
)
if exist "%CACHE_DIR%\commands\overview.md" (
    echo     [OK] commands/overview.md exists
) else (
    echo     [ERROR] commands/overview.md MISSING
)

echo.
echo ========================================================
echo   Done!
echo ========================================================
echo.
echo 1. CLOSE Claude Code completely (not just restart)
echo 2. OPEN Claude Code again
echo 3. Type: /chaos-harness:overview
echo.

pause