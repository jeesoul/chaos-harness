@echo off
REM Chaos Harness 安装脚本 (Windows)
REM 纯 Skill 方式集成，无需 MCP

setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════════╗
echo ║     Chaos Harness 安装脚本                 ║
echo ║     Chaos demands order. Harness provides it. ║
echo ╚════════════════════════════════════════════╝
echo.

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "PLUGIN_NAME=chaos-harness"

REM 设置目标目录
set "PLUGIN_DIR=%USERPROFILE%\.claude\plugins"
set "TARGET_DIR=%PLUGIN_DIR%\%PLUGIN_NAME%"

REM 卸载模式
if "%1"=="--uninstall" goto uninstall

REM 安装
echo 正在安装 Chaos Harness 插件...

REM 创建插件目录
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"

REM 删除旧版本
if exist "%TARGET_DIR%" (
    echo 删除旧版本...
    rmdir /s /q "%TARGET_DIR%"
)

REM 创建目标目录
mkdir "%TARGET_DIR%"

REM 复制插件配置
echo 复制插件配置...
xcopy /s /e /i /q "%SCRIPT_DIR%.claude-plugin" "%TARGET_DIR%\.claude-plugin\" >nul

REM 复制 skills（核心！）
echo 复制 skills...
xcopy /s /e /i /q "%SCRIPT_DIR%skills" "%TARGET_DIR%\skills\" >nul

REM 复制 CLAUDE.md
if exist "%SCRIPT_DIR%CLAUDE.md" (
    copy /y "%SCRIPT_DIR%CLAUDE.md" "%TARGET_DIR%\" >nul
)

REM 复制 README.md
if exist "%SCRIPT_DIR%README.md" (
    copy /y "%SCRIPT_DIR%README.md" "%TARGET_DIR%\" >nul
)

REM 复制 templates
if exist "%SCRIPT_DIR%templates" (
    xcopy /s /e /i /q "%SCRIPT_DIR%templates" "%TARGET_DIR%\templates\" >nul
)

echo √ 插件已安装到: %TARGET_DIR%

goto done

:uninstall
echo 正在卸载 Chaos Harness...

if exist "%TARGET_DIR%" (
    rmdir /s /q "%TARGET_DIR%"
    echo √ 插件已删除
) else (
    echo 插件未安装
)

echo 卸载完成
exit /b 0

:done
echo.
echo ══════════════════════════════════════════════
echo   安装完成！
echo ══════════════════════════════════════════════
echo.
echo 使用方式:
echo.
echo 1. 重启 Claude Code 或开始新会话
echo.
echo 2. Skills 会自动激活，直接对话即可：
echo.
echo    # 扫描项目
echo    帮我扫描当前项目
echo.
echo    # 生成 Harness
echo    生成这个项目的 Harness
echo.
echo    # 版本管理
echo    创建版本 v0.1
echo.
echo    # 工作流
echo    创建工作流
echo.
echo    # 铁律
echo    列出所有铁律
echo.
echo 已安装的 Skills:
echo    - project-scanner    (项目扫描)
echo    - version-locker     (版本锁定)
echo    - harness-generator  (Harness生成)
echo    - workflow-supervisor (工作流监督)
echo    - iron-law-enforcer  (铁律执行，始终激活)
echo.

endlocal