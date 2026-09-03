<#
.SYNOPSIS
    Uninstaller for Dell Color Laser 1320c Printer Driver on Windows.
#>

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Administrator rights required. Relaunching in elevated PowerShell..."
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "Uninstalling Dell Color Laser 1320c Printer & Drivers..." -ForegroundColor Yellow

# Remove Printer
$printerName = "Dell Color Laser 1320c"
if (Get-Printer -Name $printerName -ErrorAction SilentlyContinue) {
    Remove-Printer -Name $printerName -ErrorAction SilentlyContinue
    Write-Host "Removed Printer: $printerName" -ForegroundColor Green
}

# Remove Files
$installTargetDir = "$env:ProgramFiles\Dell1320c"
if (Test-Path $installTargetDir) {
    Remove-Item -Path $installTargetDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed Files from $installTargetDir" -ForegroundColor Green
}

Write-Host "Uninstallation complete." -ForegroundColor Green
