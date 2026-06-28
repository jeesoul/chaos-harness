@echo off
REM Chaos Harness v1.4.0 Loop & Wiki — Windows installer (thin wrapper)
REM Real logic lives in scripts/install.mjs (cross-platform)

set "SCRIPT_DIR=%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo  FAIL: Node.js not found. Install Node.js ^>= 18 from https://nodejs.org/
  exit /b 1
)

node "%SCRIPT_DIR%scripts\install.mjs" %*
set "INSTALL_EXIT=%ERRORLEVEL%"

if not "%CI%" == "true" pause >nul
exit /b %INSTALL_EXIT%
