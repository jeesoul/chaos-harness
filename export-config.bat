@echo off
REM Chaos Harness Config Export - Pure English

echo ========================================================
echo   Chaos Harness Config Export
echo ========================================================
echo.

set "CLAUDE_DIR=%USERPROFILE%\.claude"
set "PLUGIN_FILE=%CLAUDE_DIR%\plugins\installed_plugins.json"
set "SETTINGS_FILE=%CLAUDE_DIR%\settings.json"
set "CACHE_DIR=%CLAUDE_DIR%\plugins\cache\chaos-harness\chaos-harness\1.0.0"

echo === [1] installed_plugins.json ===
echo.
if exist "%PLUGIN_FILE%" (
    type "%PLUGIN_FILE%"
) else (
    echo FILE NOT FOUND: %PLUGIN_FILE%
)

echo.
echo === [2] settings.json ===
echo.
if exist "%SETTINGS_FILE%" (
    type "%SETTINGS_FILE%"
) else (
    echo FILE NOT FOUND: %SETTINGS_FILE%
)

echo.
echo === [3] Cache Directory Structure ===
echo.
if exist "%CACHE_DIR%" (
    dir /s /b "%CACHE_DIR%"
) else (
    echo DIRECTORY NOT FOUND: %CACHE_DIR%
)

echo.
echo === [4] skills/overview/SKILL.md ===
echo.
if exist "%CACHE_DIR%\skills\overview\SKILL.md" (
    type "%CACHE_DIR%\skills\overview\SKILL.md"
) else (
    echo FILE NOT FOUND
)

echo.
echo ========================================================
echo   Export Complete
echo ========================================================
echo.

pause