@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Nuclear Fix - Rewrites ALL config with correct paths

echo ========================================================
echo   Chaos Harness Nuclear Fix
echo ========================================================
echo.

REM Step 1: Clean up ALL chaos-harness related files
echo [1] Cleaning up old installations...
set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\chaos-harness"
set "MARKET_DIR=%USERPROFILE%\.claude\plugins\marketplaces\chaos-harness"
if exist "%CACHE_DIR%" rmdir /s /q "%CACHE_DIR%" 2>nul
if exist "%MARKET_DIR%" rmdir /s /q "%MARKET_DIR%" 2>nul
echo [OK] Cleaned

REM Step 2: Create fresh directories
echo.
echo [2] Creating fresh directories...
set "NEW_CACHE=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0"
mkdir "%NEW_CACHE%\skills" 2>nul
mkdir "%NEW_CACHE%\commands" 2>nul
mkdir "%NEW_CACHE%\.claude-plugin" 2>nul
echo [OK] Created

REM Step 3: Copy files from script directory
echo.
echo [3] Copying plugin files...
set "SRC=%~dp0"
if exist "%SRC%skills" xcopy /s /e /i /q /y "%SRC%skills" "%NEW_CACHE%\skills\" >nul
if exist "%SRC%commands" xcopy /s /e /i /q /y "%SRC%commands" "%NEW_CACHE%\commands\" >nul
if exist "%SRC%.claude-plugin" xcopy /s /e /i /q /y "%SRC%.claude-plugin" "%NEW_CACHE%\.claude-plugin\" >nul
if exist "%SRC%templates" xcopy /s /e /i /q /y "%SRC%templates" "%NEW_CACHE%\templates\" >nul
echo [OK] Copied

REM Step 4: Write installed_plugins.json with Node.js (NO DOUBLE ESCAPE)
echo.
echo [4] Writing installed_plugins.json...
node -e "const fs=require('fs'),p=require('path');const h=process.env.USERPROFILE;const c=p.join(h,'.claude','plugins','cache','chaos-harness','chaos-harness','1.0.0');const f=p.join(h,'.claude','plugins','installed_plugins.json');const t=new Date().toISOString();let d={version:2,plugins:{}};if(fs.existsSync(f)){try{d=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){}}d.plugins['chaos-harness@chaos-harness']=[{scope:'user',installPath:c,version:'1.0.0',installedAt:t,lastUpdated:t}];fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(d,null,2));console.log('[OK] Written');console.log('Path: '+c);"

REM Step 5: Update settings.json
echo.
echo [5] Updating settings.json...
node -e "const fs=require('fs'),p=require('path');const h=process.env.USERPROFILE;const f=p.join(h,'.claude','settings.json');let d={};if(fs.existsSync(f)){try{d=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){}}d.enabledPlugins=d.enabledPlugins||{};d.enabledPlugins['chaos-harness@chaos-harness']=true;fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(d,null,2));console.log('[OK] Enabled');"

REM Step 6: Verify
echo.
echo [6] Verifying installation...
if exist "%NEW_CACHE%\skills\overview\SKILL.md" (
    echo [OK] skills/overview/SKILL.md
) else (
    echo [ERROR] skills/overview/SKILL.md MISSING
)
if exist "%NEW_CACHE%\commands\overview.md" (
    echo [OK] commands/overview.md
) else (
    echo [ERROR] commands/overview.md MISSING
)
if exist "%NEW_CACHE%\.claude-plugin\plugin.json" (
    echo [OK] .claude-plugin/plugin.json
) else (
    echo [ERROR] .claude-plugin/plugin.json MISSING
)

echo.
echo ========================================================
echo   Installation Complete!
echo ========================================================
echo.
echo IMPORTANT:
echo 1. CLOSE Claude Code COMPLETELY (exit the app)
echo 2. REOPEN Claude Code
echo 3. Type: /chaos-harness:overview
echo.
echo If it still shows /overview without prefix,
echo run this script again and make sure Node.js is installed.
echo.

pause