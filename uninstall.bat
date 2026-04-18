@echo off
REM Chaos Harness v1.3.1 卸载脚本（Windows）

echo =========================================
echo  Chaos Harness v1.3.1 卸载
echo =========================================
echo.

claude plugins marketplace remove chaos-harness 2>/dev/null || echo   marketplace 已移除或不存在
claude plugins uninstall chaos-harness@chaos-harness 2>/dev/null || echo   插件已卸载或不存在

echo.
echo =========================================
echo  卸载完成
echo =========================================
echo.
echo 如需清理本地数据，请手动删除：
echo   instincts\  evals\  schemas\  output\
echo.
pause
