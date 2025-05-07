@echo off
echo Installing BentonGeoPro Sync Dashboard...
echo This installer requires administrative privileges.

REM Check if running with administrative privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if %errorlevel% neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

REM Run the PowerShell installer script with administrative privileges
powershell.exe -ExecutionPolicy Bypass -File "%~dp0\windows_installer.ps1"