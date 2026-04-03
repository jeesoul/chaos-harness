@echo off
REM Chaos Harness Install

echo ========================================================
echo   Chaos Harness Install
echo ========================================================
echo.

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
if exist "%CACHE_DIR%\.orphaned_at" del /f /q "%CACHE_DIR%\.orphaned_at" 2>nul
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
node -e "const fs=require('fs'),p=require('path');const h=process.env.USERPROFILE;const c=p.join(h,'.claude','plugins','cache','chaos-harness','chaos-harness','1.0.0');const f=p.join(h,'.claude','plugins','installed_plugins.json');const t=new Date().toISOString();let d={version:2,plugins:{}};if(fs.existsSync(f)){try{let s=fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'');d=JSON.parse(s)}catch(e){console.log('Warning: Could not parse existing file')}}if(!d.plugins)d.plugins={};d.plugins['chaos-harness@chaos-harness']=[{scope:'user',installPath:c,version:'1.0.0',installedAt:t,lastUpdated:t}];fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(d,null,2));console.log('[OK] Registered');"

echo.
echo [4] Enabling plugin...
node -e "const fs=require('fs'),p=require('path');const h=process.env.USERPROFILE;const f=p.join(h,'.claude','settings.json');let d={};if(fs.existsSync(f)){try{let s=fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'');d=JSON.parse(s)}catch(e){console.log('Warning: Could not parse existing file')}}if(!d.enabledPlugins)d.enabledPlugins={};d.enabledPlugins['chaos-harness@chaos-harness']=true;fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(d,null,2));console.log('[OK] Enabled');"

echo.
echo ========================================================
echo   Install Complete!
echo ========================================================
echo.
echo Restart Claude Code and test: /chaos-harness:overview
echo.

:end
pause