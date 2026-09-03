@echo off
setlocal enabledelayedexpansion

echo ==========================================================
echo  Dell Color Laser 1320c Windows Driver Installer
echo  Supports: Windows 32-bit (x86), 64-bit (x64), and ARM64
echo ==========================================================
echo.

:: Check Admin Rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator permissions...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

:: Run PowerShell Installer
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Dell1320c-Driver.ps1"

echo.
pause
