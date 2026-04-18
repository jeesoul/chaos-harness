@echo off
REM Chaos Harness v1.3.1 安装验证脚本（Windows）
REM 无需手动配置 settings.json，插件系统自动加载 Skills 和 Hooks

echo =========================================
echo  Chaos Harness v1.3.1 孔明Pro 安装验证
echo =========================================
echo.

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"

REM 1. 检查 Node.js
echo [1/6] 检查 Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo  FAIL: Node.js 未安装，请先安装 Node.js ^>= 18
  echo  下载: https://nodejs.org/
  goto :errors
)
for /f "tokens=*" %%v in ('node --version') do echo  OK: %%v
echo.

REM 2. 检查 hooks.json
echo [2/6] 检查 hooks.json...
if not exist "%SCRIPT_DIR%hooks\hooks.json" (
  echo  FAIL: hooks\hooks.json 不存在
  goto :errors
)
for /f "tokens=*" %%c in ('node -e "const h=JSON.parse(require('fs').readFileSync('%SCRIPT_DIR:\=\\%hooks\\hooks.json','utf8')); let c=0; for(const m of Object.values(h.hooks)) c+=m.length; console.log(c)"') do echo  OK: %%c 个 hook matcher
echo.

REM 3. 检查 Skills
echo [3/6] 检查 Skills...
set "SKILL_COUNT=0"
for %%f in ("%SCRIPT_DIR%skills\*\SKILL.md") do set /a SKILL_COUNT+=1
if %SKILL_COUNT% gtr 0 (
  echo  OK: %SKILL_COUNT% 个 Skills
) else (
  echo  FAIL: skills\ 目录下无 SKILL.md 文件
  goto :errors
)
echo.

REM 4. 检查脚本语法
echo [4/6] 检查脚本语法...
set "FAIL_COUNT=0"
set "SCRIPT_COUNT=0"
for %%f in ("%SCRIPT_DIR%scripts\*.mjs") do (
  set /a SCRIPT_COUNT+=1
  node --check "%%f" 2>nul || set /a FAIL_COUNT+=1
)
if %FAIL_COUNT% equ 0 (
  echo  OK: %SCRIPT_COUNT% 个脚本语法通过
) else (
  echo  FAIL: %FAIL_COUNT% 个脚本语法错误
  goto :errors
)
echo.

REM 5. 检查数据目录
echo [5/6] 检查数据目录...
for %%d in (instincts evals\capability evals\regression evals\results schemas) do (
  if exist "%SCRIPT_DIR%%%d\" (
    echo  OK: %%d\
  ) else (
    echo  WARN: %%d\ 不存在（运行时自动创建）
  )
)
echo.

REM 6. 检查版本一致性
echo [6/6] 检查版本一致性...
for /f "tokens=*" %%p in ('node -e "console.log(JSON.parse(require('fs').readFileSync('%SCRIPT_DIR:\=\\%\.claude-plugin\\plugin.json','utf8')).version)"') do set "PLUGIN_VER=%%p"
for /f "tokens=*" %%p in ('node -e "console.log(JSON.parse(require('fs').readFileSync('%SCRIPT_DIR:\=\\%\\package.json','utf8')).version)"') do set "PKG_VER=%%p"
echo  plugin.json: %PLUGIN_VER%
echo  package.json: %PKG_VER%
if "%PLUGIN_VER%" == "%PKG_VER%" (
  echo  OK: 版本一致
) else (
  echo  WARN: 版本不一致
)
echo.

REM 总结
echo =========================================
echo  验证通过！所有组件正常
echo =========================================
echo.
echo 安装方式（无需额外配置 settings.json）：
echo   1. claude plugins marketplace add "%%SCRIPT_DIR%%"
echo   2. claude plugins install chaos-harness@chaos-harness
echo   3. 重启 Claude Code
echo.
echo 验证：在 Claude Code 中运行 /chaos-harness:overview
echo.
goto :end

:errors
echo.
echo =========================================
echo  发现错误，请修复后重试
echo =========================================
echo.

:end
echo 按任意键退出...
pause >nul
