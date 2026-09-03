<#
.SYNOPSIS
    Automated Installer for Dell Color Laser 1320c Printer Driver on Windows.
    Supports Windows 32-bit (x86), 64-bit (x64), and ARM64 (Surface Pro X, Snapdragon X Elite, etc.).

.DESCRIPTION
    This script installs the Dell 1320c driver package, copies the native HBPL/SQ21
    processing engine, configures either a Network (RAW Port 9100) or USB port,
    and sets up the Windows Printer Spooler.

.PARAMETER ConnectionType
    Specifies 'Network' (default) or 'USB'.

.PARAMETER PrinterIP
    The IP address of the Dell 1320c on your local network (e.g., 192.168.1.150).

.PARAMETER USBPort
    The USB virtual printer port (default: 'USB001').

.PARAMETER TestPrint
    Automatically send a hardware calibration test page upon installation.

.EXAMPLE
    .\Install-Dell1320c-Driver.ps1 -ConnectionType Network -PrinterIP 192.168.1.100 -TestPrint
#>

[CmdletBinding()]
param (
    [ValidateSet("Network", "USB")]
    [string]$ConnectionType = "Network",

    [string]$PrinterIP = "192.168.1.100",

    [string]$USBPort = "USB001",

    [switch]$TestPrint
)

# 1. Require Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Administrator rights required. Relaunching in elevated PowerShell..."
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -ConnectionType $ConnectionType -PrinterIP $PrinterIP -USBPort $USBPort $(if ($TestPrint) {'-TestPrint'})" -Verb RunAs
    exit
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Dell Color Laser 1320c Driver Installer" -ForegroundColor Cyan
Write-Host " Supports: Windows x86, x64, and ARM64" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 2. Detect System Architecture
$arch = $env:PROCESSOR_ARCHITECTURE
Write-Host "`n[1/5] Detecting System Architecture: $arch" -ForegroundColor Yellow

$binSubdir = "x64"
if ($arch -eq "ARM64") {
    $binSubdir = "arm64"
    Write-Host "  -> Selected Windows ARM64 native binaries" -ForegroundColor Green
} elseif ($arch -eq "x86") {
    $binSubdir = "x86"
    Write-Host "  -> Selected Windows 32-bit (x86) native binaries" -ForegroundColor Green
} else {
    $binSubdir = "x64"
    Write-Host "  -> Selected Windows 64-bit (x64) native binaries" -ForegroundColor Green
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$driverRootDir = Split-Path -Parent $scriptDir
$binDir = Join-Path $driverRootDir "bin\$binSubdir"
$commonDir = Join-Path $driverRootDir "common"
$infPath = Join-Path $commonDir "dell1320c.inf"
$engineExe = Join-Path $binDir "dell1320c_winprint.exe"

if (-not (Test-Path $engineExe)) {
    Write-Error "Engine executable not found at: $engineExe"
    exit 1
}

# 3. Deploy Engine Utilities to System
Write-Host "`n[2/5] Deploying Native Engine..." -ForegroundColor Yellow
$installTargetDir = "$env:ProgramFiles\Dell1320c"
if (-not (Test-Path $installTargetDir)) {
    New-Item -ItemType Directory -Path $installTargetDir -Force | Out-Null
}
Copy-Item -Path "$binDir\*" -Destination $installTargetDir -Recurse -Force
Write-Host "  -> Installed engine binaries to $installTargetDir" -ForegroundColor Green

# 4. Stage and Install INF Driver Package into Driver Store
Write-Host "`n[3/5] Installing Driver into Windows Driver Store..." -ForegroundColor Yellow
try {
    $pnpOutput = & pnputil.exe /add-driver "$infPath" /install
    Write-Host "  -> $pnpOutput" -ForegroundColor Gray
} catch {
    Write-Warning "pnputil execution completed with notices."
}

# 5. Configure Printer Port
Write-Host "`n[4/5] Configuring Printer Port..." -ForegroundColor Yellow
$portName = ""
if ($ConnectionType -eq "Network") {
    $portName = "IP_$PrinterIP"
    Write-Host "  Configuring Standard TCP/IP Port ($portName) on Port 9100..."
    $checkPort = Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue
    if (-not $checkPort) {
        Add-PrinterPort -Name $portName -PrinterHostAddress $PrinterIP -PortNumber 9100 -ErrorAction SilentlyContinue
        Write-Host "  -> Created TCP/IP Port $portName ($PrinterIP)" -ForegroundColor Green
    } else {
        Write-Host "  -> Port $portName already exists." -ForegroundColor Gray
    }
} else {
    $portName = $USBPort
    Write-Host "  -> Assigned USB Port $portName" -ForegroundColor Green
}

# 6. Register Printer in Windows Spooler
Write-Host "`n[5/5] Registering 'Dell Color Laser 1320c'..." -ForegroundColor Yellow
$printerName = "Dell Color Laser 1320c"
$existingPrinter = Get-Printer -Name $printerName -ErrorAction SilentlyContinue
if ($existingPrinter) {
    Write-Host "  -> Updating existing printer configuration..."
    Set-Printer -Name $printerName -PortName $portName -ErrorAction SilentlyContinue
} else {
    # Try generic MS Publisher Color or Dell driver binding
    try {
        Add-Printer -Name $printerName -DriverName "Generic / Text Only" -PortName $portName -ErrorAction SilentlyContinue
        Write-Host "  -> Registered Printer Queue: $printerName" -ForegroundColor Green
    } catch {
        Write-Warning "Could not register default spooler queue automatically. You can also print directly using dell1320c_winprint.exe."
    }
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " Installation Complete!" -ForegroundColor Green
Write-Host " Engine Location: $installTargetDir\dell1320c_winprint.exe"
Write-Host " Target Port:     $portName"
Write-Host "==========================================================" -ForegroundColor Green

# 7. Optional Test Print
if ($TestPrint) {
    Write-Host "`nSending Hardware Calibration Test Page..." -ForegroundColor Cyan
    if ($ConnectionType -eq "Network") {
        & "$installTargetDir\dell1320c_winprint.exe" --test-page --host $PrinterIP
    } else {
        & "$installTargetDir\dell1320c_winprint.exe" --test-page --usb $portName
    }
} else {
    Write-Host "`nTo print a test page at any time, run:" -ForegroundColor Gray
    if ($ConnectionType -eq "Network") {
        Write-Host "  & `"$installTargetDir\dell1320c_winprint.exe`" --test-page --host $PrinterIP" -ForegroundColor White
    } else {
        Write-Host "  & `"$installTargetDir\dell1320c_winprint.exe`" --test-page --usb $USBPort" -ForegroundColor White
    }
}
