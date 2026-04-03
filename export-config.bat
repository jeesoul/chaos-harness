@echo off
REM Export full configuration for debugging

echo ========================================================
echo   Chaos Harness Config Export
echo ========================================================
echo.

set "OUTPUT_FILE=%USERPROFILE%\chaos-harness-config.txt"

echo Exporting to: %OUTPUT_FILE%
echo.

echo ======================================================== > "%OUTPUT_FILE%"
echo Chaos Harness Configuration Export >> "%OUTPUT_FILE%"
echo ======================================================== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo [1] installed_plugins.json >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"
set "INSTALLED_FILE=%USERPROFILE%\.claude\plugins\installed_plugins.json"
if exist "%INSTALLED_FILE%" (
    type "%INSTALLED_FILE%" >> "%OUTPUT_FILE%"
) else (
    echo FILE NOT FOUND >> "%OUTPUT_FILE%"
)
echo. >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo [2] settings.json >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"
set "SETTINGS_FILE=%USERPROFILE%\.claude\settings.json"
if exist "%SETTINGS_FILE%" (
    type "%SETTINGS_FILE%" >> "%OUTPUT_FILE%"
) else (
    echo FILE NOT FOUND >> "%OUTPUT_FILE%"
)
echo. >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo [3] Plugin cache directory listing >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"
set "CACHE_DIR=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0"
if exist "%CACHE_DIR%" (
    dir /s "%CACHE_DIR%" >> "%OUTPUT_FILE%"
) else (
    echo DIRECTORY NOT FOUND >> "%OUTPUT_FILE%"
)
echo. >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo [4] Skills overview SKILL.md >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"
if exist "%CACHE_DIR%\skills\overview\SKILL.md" (
    type "%CACHE_DIR%\skills\overview\SKILL.md" >> "%OUTPUT_FILE%"
) else (
    echo FILE NOT FOUND >> "%OUTPUT_FILE%"
)
echo. >> "%OUTPUT_FILE%"

echo ======================================================== >> "%OUTPUT_FILE%"
echo Export Complete >> "%OUTPUT_FILE%"
echo ======================================================== >> "%OUTPUT_FILE%"

echo.
echo [OK] Export complete
echo File: %OUTPUT_FILE%
echo.
echo Please send this file content for analysis.
echo.

type "%OUTPUT_FILE%"

pause