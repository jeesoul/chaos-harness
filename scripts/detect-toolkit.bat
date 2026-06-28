@echo off
REM Chaos Harness Toolkit Detection Script for Windows
REM 自动检测 Chaos Harness 依赖的工具链

echo.
echo ========================================
echo   Chaos Harness Toolkit Detection
echo ========================================
echo.

set MISSING=0

REM 检测函数
goto :main

:check_plugin
setlocal
set PLUGIN_NAME=%~1
set INSTALL_CMD=%~2

claude plugins list 2>nul | findstr /C:"%PLUGIN_NAME%" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] %PLUGIN_NAME%: 已安装
) else (
    echo [X] %PLUGIN_NAME%: 未安装
    echo     安装命令: %INSTALL_CMD%
    set /a MISSING+=1
)
endlocal & set MISSING=%MISSING%
goto :eof

:check_network
setlocal
set URL=%~1
set NAME=%~2

curl -s --max-time 5 "%URL%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] %NAME%: 可连接
) else (
    echo [!] %NAME%: 无法连接
)
endlocal
goto :eof

:main
echo === 工具检测 ===
echo.

call :check_plugin "skill-creator" "claude plugins install skill-creator@claude-plugins-official"
echo.

call :check_plugin "superpowers-chrome" "claude plugins install superpowers-chrome@superpowers-marketplace"
echo.

call :check_plugin "ui-ux-pro-max" "claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill"
echo.

call :check_plugin "webapp-testing" "claude plugins install webapp-testing@anthropics/skills"
echo.

echo === 网络环境检测 ===
echo.

call :check_network "https://github.com" "GitHub 官方"
call :check_network "https://kgithub.com" "KGitHub 镜像"
call :check_network "https://registry.npmmirror.com" "淘宝 npm 镜像"

echo.

echo === Playwright 环境 ===
echo.

where npx >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    npx playwright --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        for /f "tokens=*" %%i in ('npx playwright --version 2^>nul') do echo [OK] Playwright: %%i
    ) else (
        echo [!] Playwright: 未安装
        echo     安装命令: npm install -D @playwright/test
    )
) else (
    echo [X] npx: 未找到，请先安装 Node.js
)

echo.

echo ========================================
if %MISSING% EQU 0 (
    echo [OK] 所有工具已安装
) else (
    echo [!] 缺失 %MISSING% 个工具
    echo.
    echo 快速安装所有缺失工具:
    echo   /chaos-harness:auto-toolkit-installer install
    echo.
    echo 使用镜像安装 (国内推荐):
    echo   /chaos-harness:auto-toolkit-installer install --mirror
)
echo ========================================
echo.