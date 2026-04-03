@echo off
chcp 65001 >nul 2>&1
REM Chaos Harness Uninstall Script

echo ========================================================
echo     Chaos Harness Uninstall Script
echo ========================================================
echo.

set "PLUGIN_NAME=chaos-harness"
set "MARKETPLACE_NAME=chaos-harness"

echo Uninstalling Chaos Harness...

REM Remove cache directory
set "CACHE_PARENT=%USERPROFILE%\.claude\plugins\cache\%MARKETPLACE_NAME%"
if exist "%CACHE_PARENT%" (
    echo Removing cache directory...
    rmdir /s /q "%CACHE_PARENT%" 2>nul
    echo   [OK] Cache removed
) else (
    echo   [SKIP] Cache directory not found
)

REM Remove marketplace directory
set "MARKETPLACE_DIR=%USERPROFILE%\.claude\plugins\marketplaces\%MARKETPLACE_NAME%"
if exist "%MARKETPLACE_DIR%" (
    echo Removing marketplace directory...
    rmdir /s /q "%MARKETPLACE_DIR%" 2>nul
    echo   [OK] Marketplace removed
) else (
    echo   [SKIP] Marketplace directory not found
)

REM Unregister from installed_plugins.json
echo Unregistering from installed_plugins.json...
powershell -Command "$file='%USERPROFILE%\.claude\plugins\installed_plugins.json'; if(Test-Path $file){ $json=Get-Content $file|ConvertFrom-Json; $json.plugins.PSObject.Properties.Remove('chaos-harness@chaos-harness'); $json|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $file; Write-Host '  [OK] Unregistered' } else { Write-Host '  [SKIP] File not found' }" 2>nul

REM Unregister from known_marketplaces.json
echo Unregistering from known_marketplaces.json...
powershell -Command "$file='%USERPROFILE%\.claude\plugins\known_marketplaces.json'; if(Test-Path $file){ $json=Get-Content $file|ConvertFrom-Json; $json.PSObject.Properties.Remove('chaos-harness'); $json|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $file; Write-Host '  [OK] Unregistered' } else { Write-Host '  [SKIP] File not found' }" 2>nul

REM Disable in settings.json
echo Disabling in settings.json...
powershell -Command "$file='%USERPROFILE%\.claude\settings.json'; if(Test-Path $file){ $json=Get-Content $file|ConvertFrom-Json; $json.enabledPlugins.PSObject.Properties.Remove('chaos-harness@chaos-harness'); $json.extraKnownMarketplaces.PSObject.Properties.Remove('chaos-harness'); $json|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $file; Write-Host '  [OK] Disabled' } else { Write-Host '  [SKIP] File not found' }" 2>nul

echo.
echo ========================================================
echo Uninstall Complete
echo ========================================================
echo.
echo Chaos Harness has been removed.
echo Please restart Claude Code to complete the uninstallation.
echo.
pause