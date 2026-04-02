@echo off
REM Chaos Harness 安装脚本 (Windows)
REM
REM 用法:
REM   install.bat              # 安装到 Claude Code
REM   install.bat --uninstall  # 从 Claude Code 卸载

setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════════╗
echo ║     Chaos Harness 安装脚本                 ║
echo ║     Chaos demands order. Harness provides it. ║
echo ╚════════════════════════════════════════════╝
echo.

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "PLUGIN_NAME=chaos-harness"

REM 检测 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 需要安装 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    exit /b 1
)

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

REM 复制 skills
echo 复制 skills...
xcopy /s /e /i /q "%SCRIPT_DIR%skills" "%TARGET_DIR%\skills\" >nul

REM 复制 CLAUDE.md
if exist "%SCRIPT_DIR%CLAUDE.md" (
    copy /y "%SCRIPT_DIR%CLAUDE.md" "%TARGET_DIR%\" >nul
)

echo √ 插件已安装到: %TARGET_DIR%

REM 配置 MCP Server
echo.
echo 配置 MCP Server...

set "CONFIG_DIR=%APPDATA%\Claude"
set "CONFIG_FILE=%CONFIG_DIR%\claude_desktop_config.json"

REM 创建配置目录
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

REM 转换路径为正斜杠
set "SCRIPT_DIR_UNIX=%SCRIPT_DIR:\=/%"

REM 检查配置文件是否存在
if not exist "%CONFIG_FILE%" (
    echo 创建配置文件...
    echo {} > "%CONFIG_FILE%"
)

REM 使用 node 更新配置
node -e "const fs=require('fs');const p='%CONFIG_FILE%';const d='%SCRIPT_DIR_UNIX%'.replace(/\\\\/g,'/');let c={};try{c=JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){c={}}c.mcpServers=c.mcpServers||{};c.mcpServers['chaos-harness']={command:'node',args:[d+'bin/mcp-server.js'],cwd:d};fs.writeFileSync(p,JSON.stringify(c,null,2));console.log('√ MCP Server 已配置')"

echo √ 配置文件已更新: %CONFIG_FILE%

goto done

:uninstall
echo 正在卸载 Chaos Harness...

if exist "%TARGET_DIR%" (
    rmdir /s /q "%TARGET_DIR%"
    echo √ 插件已删除
) else (
    echo 插件未安装
)

REM 移除 MCP 配置
set "CONFIG_FILE=%APPDATA%\Claude\claude_desktop_config.json"
if exist "%CONFIG_FILE%" (
    node -e "const fs=require('fs');const p='%CONFIG_FILE%';let c={};try{c=JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){}if(c.mcpServers&&c.mcpServers['chaos-harness']){delete c.mcpServers['chaos-harness'];fs.writeFileSync(p,JSON.stringify(c,null,2));console.log('√ MCP 配置已移除')}"
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
echo 1. 重启 Claude Code 使配置生效
echo.
echo 2. 在 Claude Code 中使用以下命令:
echo.
echo    # 扫描项目
echo    帮我扫描当前项目
echo.
echo    # 生成 Harness
echo    生成这个项目的 Harness
echo.
echo    # 检测偷懒模式
echo    检测是否有偷懒行为
echo.
echo    # 创建工作流
echo    创建一个工作流
echo.
echo    # 列出铁律
echo    列出所有铁律
echo.
echo 更多信息请查看 README.md 和 CLAUDE.md
echo.

endlocal