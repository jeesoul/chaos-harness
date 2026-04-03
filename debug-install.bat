@echo off
chcp 65001 >nul 2>&1
REM Debug script for Chaos Harness installation

echo ========================================================
echo     Chaos Harness Installation Debug Script
echo ========================================================
echo.

set "PLUGIN_NAME=chaos-harness"
set "SETTINGS_FILE=%USERPROFILE%\.claude\settings.json"

echo [1] Checking settings.json location...
echo     Expected: %SETTINGS_FILE%
echo.

if exist "%SETTINGS_FILE%" (
    echo     [OK] File exists
    echo.
    echo [2] Current content of enabledPlugins:
    findstr /C:"enabledPlugins" "%SETTINGS_FILE%" >nul 2>&1
    if errorlevel 1 (
        echo     [WARN] enabledPlugins section not found
    ) else (
        echo     Showing enabledPlugins section:
        echo     ----------------------------------------
        powershell -Command "$json = Get-Content '%SETTINGS_FILE%' | ConvertFrom-Json; $json.enabledPlugins | ConvertTo-Json"
        echo     ----------------------------------------
    )
) else (
    echo     [ERROR] File does not exist
    echo     Will be created during installation
)

echo.
echo [3] Testing PowerShell command...
echo.

REM Test the PowerShell command without the 2>nul to see errors
powershell -Command "$file='%SETTINGS_FILE%'; Write-Host 'Loading file...'; $json = Get-Content $file | ConvertFrom-Json; Write-Host 'File loaded'; Write-Host 'enabledPlugins exists:' ($null -ne $json.enabledPlugins); if($json.enabledPlugins) { Write-Host 'Adding member...'; $json.enabledPlugins | Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue $true -Force; Write-Host 'Member added'; Write-Host 'Saving...'; $json | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $file; Write-Host 'Saved!' } else { Write-Host 'Creating enabledPlugins...'; Add-Member -InputObject $json -NotePropertyName 'enabledPlugins' -NotePropertyValue @{} -Force; $json.enabledPlugins | Add-Member -NotePropertyName 'chaos-harness@chaos-harness' -NotePropertyValue $true -Force; $json | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $file; Write-Host 'Created and saved!' }"

echo.
echo [4] Verifying result...
findstr /C:"chaos-harness@chaos-harness" "%SETTINGS_FILE%" >nul 2>&1
if errorlevel 1 (
    echo     [FAILED] chaos-harness@chaos-harness not found in settings.json
) else (
    echo     [SUCCESS] chaos-harness@chaos-harness found in settings.json
)

echo.
echo ========================================================
pause