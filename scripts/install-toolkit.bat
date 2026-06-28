@echo off
REM Chaos Harness Toolkit Installer Script for Windows
REM 自动安装 Chaos Harness 依赖的工具链，支持镜像加速

setlocal enabledelayedexpansion

set USE_MIRROR=false
set MIRROR_GITHUB=kgithub.com
set MIRROR_NPM=registry.npmmirror.com
set TOOL_TO_INSTALL=
set COMMAND=check

REM Parse arguments
:parse_args
if "%~1"=="" goto :done_args
if /i "%~1"=="--mirror" (
    set USE_MIRROR=true
    shift
    goto :parse_args
)
if /i "%~1"=="-m" (
    set USE_MIRROR=true
    shift
    goto :parse_args
)
if /i "%~1"=="install" (
    set COMMAND=install
    shift
    goto :parse_args
)
if /i "%~1"=="check" (
    set COMMAND=check
    shift
    goto :parse_args
)
REM Tool name
set TOOL_TO_INSTALL=%~1
shift
goto :parse_args
:done_args

echo.
echo ========================================
echo   Chaos Harness Toolkit Installer
echo ========================================
if "%USE_MIRROR%"=="true" (
    echo   镜像模式: 启用
    echo   GitHub 镜像: %MIRROR_GITHUB%
    echo   npm 镜像: %MIRROR_NPM%
)
echo ========================================
echo.

REM Check claude CLI
where claude >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [31mClaude CLI 未找到[0m
    echo 请先安装 Claude Code: https://claude.ai/code
    exit /b 1
)

if "%COMMAND%"=="check" (
    echo === 工具状态检测 ===
    echo.

    set MISSING=0

    claude plugins list 2>nul | findstr /C:"skill-creator" >nul
    if %ERRORLEVEL% equ 0 (
        echo [32m✅ skill-creator[0m: 已安装
    ) else (
        echo [31m❌ skill-creator[0m: 未安装
        set /a MISSING+=1
    )

    claude plugins list 2>nul | findstr /C:"superpowers-chrome" >nul
    if %ERRORLEVEL% equ 0 (
        echo [32m✅ superpowers-chrome[0m: 已安装
    ) else (
        echo [31m❌ superpowers-chrome[0m: 未安装
        set /a MISSING+=1
    )

    claude plugins list 2>nul | findstr /C:"ui-ux-pro-max" >nul
    if %ERRORLEVEL% equ 0 (
        echo [32m✅ ui-ux-pro-max[0m: 已安装
    ) else (
        echo [31m❌ ui-ux-pro-max[0m: 未安装
        set /a MISSING+=1
    )

    claude plugins list 2>nul | findstr /C:"webapp-testing" >nul
    if %ERRORLEVEL% equ 0 (
        echo [32m✅ webapp-testing[0m: 已安装
    ) else (
        echo [31m❌ webapp-testing[0m: 未安装
        set /a MISSING+=1
    )

    echo.

    if !MISSING! equ 0 (
        echo [32m✅ 所有工具已安装[0m
    ) else (
        echo [33m⚠️  缺失 !MISSING! 个工具[0m
        echo.
        echo 安装命令:
        echo   install-toolkit.bat install          # 官方源
        echo   install-toolkit.bat install --mirror # 镜像加速
    )
    goto :end
)

if "%COMMAND%"=="install" (
    echo === 安装工具 ===
    echo.
    echo [33m注意: Windows 下建议手动安装插件[0m
    echo.
    echo 安装命令:
    echo   claude plugins install skill-creator@claude-plugins-official
    echo   claude plugins install superpowers-chrome@superpowers-marketplace
    echo   claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill
    echo   claude plugins install webapp-testing@anthropics/skills
    echo.
    if "%USE_MIRROR%"=="true" (
        echo [33m镜像加速:[0m
        echo   1. 从镜像克隆仓库: https://%MIRROR_GITHUB%/anthropics/claude-plugins-official
        echo   2. claude plugins marketplace add ^<本地路径^>
        echo   3. claude plugins install ^<plugin-id^>
    )
    goto :end
)

echo 用法: %~nx0 {check^|install} [--mirror] [tool-name]
echo.
echo 命令:
echo   check          检测已安装工具
echo   install        显示安装指南
echo.
echo 选项:
echo   --mirror, -m   显示镜像加速方法
goto :end

:end
echo.
echo ========================================
exit /b 0