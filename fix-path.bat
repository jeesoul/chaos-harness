@echo off
REM Fix double-escaped path in installed_plugins.json

echo ========================================================
echo   Chaos Harness Path Fix
echo ========================================================
echo.

set "PLUGIN_FILE=%USERPROFILE%\.claude\plugins\installed_plugins.json"
set "CORRECT_PATH=%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0"

echo Fixing double-escaped path issue...
echo.

powershell -NoProfile -Command ^
  "$f='%PLUGIN_FILE%';" ^
  "$p='%CORRECT_PATH%';" ^
  "if(Test-Path $f){" ^
    "$j=Get-Content $f|ConvertFrom-Json;" ^
    "if($j.plugins.'chaos-harness@chaos-harness'){" ^
      "$j.plugins.'chaos-harness@chaos-harness'[0].installPath=$p;" ^
      "$j|ConvertTo-Json -Depth 10|Out-File -Encoding utf8 $f;" ^
      "Write-Host '[OK] Path fixed';" ^
      "Write-Host 'New path: ' $j.plugins.'chaos-harness@chaos-harness'[0].installPath" ^
    "}else{Write-Host '[ERROR] chaos-harness entry not found'}" ^
  "}else{Write-Host '[ERROR] File not found'}"

echo.
echo ========================================================
echo   Fix Complete
echo ========================================================
echo.
echo Please restart Claude Code and test:
echo   /chaos-harness:overview
echo.

pause