import React, { useState } from "react";
import { Sliders, Download, Copy, Check, Terminal, FileCode, CheckCircle2 } from "lucide-react";

export const CustomInstallerBuilder: React.FC = () => {
  const [connectionType, setConnectionType] = useState<"Network" | "USB">("Network");
  const [printerIp, setPrinterIp] = useState("192.168.1.100");
  const [usbPort, setUsbPort] = useState("USB001");
  const [defaultPaper, setDefaultPaper] = useState("Letter");
  const [defaultColor, setDefaultColor] = useState("Color");
  const [tray, setTray] = useState("1");
  const [copied, setCopied] = useState(false);

  const generatedScript = `<#
.SYNOPSIS
    Customized Dell 1320c Driver Installer (${connectionType} - ${connectionType === "Network" ? printerIp : usbPort})
    Generated dynamically by Dell 1320c Universal Driver Suite
#>

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File \`"$PSCommandPath\`"" -Verb RunAs
    exit
}

Write-Host "Installing Dell Color Laser 1320c (${connectionType})..." -ForegroundColor Cyan

$arch = $env:PROCESSOR_ARCHITECTURE
$binSubdir = if ($arch -eq "ARM64") { "arm64" } elseif ($arch -eq "x86") { "x86" } else { "x64" }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$driverRootDir = Split-Path -Parent $scriptDir
$binDir = Join-Path $driverRootDir "bin\\$binSubdir"
$commonDir = Join-Path $driverRootDir "common"
$infPath = Join-Path $commonDir "dell1320c.inf"

# 1. Deploy Engine
$installTargetDir = "$env:ProgramFiles\\Dell1320c"
New-Item -ItemType Directory -Path $installTargetDir -Force | Out-Null
Copy-Item -Path "$binDir\\*" -Destination $installTargetDir -Recurse -Force
Write-Host "Deployed engine binaries to $installTargetDir" -ForegroundColor Green

# 2. Stage Driver in Windows Driver Store
& pnputil.exe /add-driver "$infPath" /install

# 3. Configure Port
$portName = "${connectionType === "Network" ? `IP_${printerIp}` : usbPort}"
${
  connectionType === "Network"
    ? `if (-not (Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue)) {
    Add-PrinterPort -Name $portName -PrinterHostAddress "${printerIp}" -PortNumber 9100 -ErrorAction SilentlyContinue
    Write-Host "Created Standard TCP/IP Port $portName" -ForegroundColor Green
}`
    : `Write-Host "Assigned USB Port $portName" -ForegroundColor Green`
}

# 4. Register Printer Spooler Queue
Add-Printer -Name "Dell Color Laser 1320c" -DriverName "Generic / Text Only" -PortName $portName -ErrorAction SilentlyContinue
Write-Host "Printer queue 'Dell Color Laser 1320c' ready." -ForegroundColor Green

# 5. Hardware Calibration Test Print
Write-Host "Sending hardware calibration test page..." -ForegroundColor Cyan
& "$installTargetDir\\dell1320c_winprint.exe" --test-page ${
    connectionType === "Network" ? `--host ${printerIp}` : `--usb ${usbPort}`
  } --paper ${defaultPaper} ${defaultColor === "Monochrome" ? "--mono" : "--color"} --tray ${tray}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedScript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Install-Dell1320c-${connectionType.toLowerCase()}.ps1`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-600" />
          <span>Custom Installer Configurator</span>
        </h2>
        <p className="text-sm text-slate-600">
          Configure your printer settings and generate a customized, zero-touch PowerShell installer for your system.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Target Printer Settings
          </h3>

          {/* Connection Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Connection Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="cfg-conn-net"
                onClick={() => setConnectionType("Network")}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition ${
                  connectionType === "Network"
                    ? "bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Network (Port 9100)
              </button>
              <button
                type="button"
                id="cfg-conn-usb"
                onClick={() => setConnectionType("USB")}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition ${
                  connectionType === "USB"
                    ? "bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                USB Cable
              </button>
            </div>
          </div>

          {/* Port / IP */}
          {connectionType === "Network" ? (
            <div>
              <label htmlFor="cfg-ip-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Dell 1320c IP Address
              </label>
              <input
                id="cfg-ip-input"
                type="text"
                value={printerIp}
                onChange={(e) => setPrinterIp(e.target.value)}
                placeholder="e.g. 192.168.1.150"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The standard RAW printing port 9100 will be used automatically.
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="cfg-usb-input" className="block text-xs font-semibold text-slate-700 mb-1">
                USB Virtual Port
              </label>
              <input
                id="cfg-usb-input"
                type="text"
                value={usbPort}
                onChange={(e) => setUsbPort(e.target.value)}
                placeholder="USB001"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Typically USB001, USB002, or USB003.
              </p>
            </div>
          )}

          {/* Paper Size */}
          <div>
            <label htmlFor="cfg-paper-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Default Paper Size
            </label>
            <select
              id="cfg-paper-select"
              value={defaultPaper}
              onChange={(e) => setDefaultPaper(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="Letter">Letter (8.5 x 11 in)</option>
              <option value="A4">A4 (210 x 297 mm)</option>
              <option value="Legal">Legal (8.5 x 14 in)</option>
              <option value="Executive">Executive (7.25 x 10.5 in)</option>
              <option value="B5">B5 (182 x 257 mm)</option>
              <option value="Env10">Envelope #10</option>
            </select>
          </div>

          {/* Color Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Color Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDefaultColor("Color")}
                className={`px-3 py-1.5 text-xs rounded-lg border text-center transition ${
                  defaultColor === "Color"
                    ? "bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Color (24bpp)
              </button>
              <button
                type="button"
                onClick={() => setDefaultColor("Monochrome")}
                className={`px-3 py-1.5 text-xs rounded-lg border text-center transition ${
                  defaultColor === "Monochrome"
                    ? "bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Mono (8bpp)
              </button>
            </div>
          </div>

          {/* Tray */}
          <div>
            <label htmlFor="cfg-tray-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Default Input Tray
            </label>
            <select
              id="cfg-tray-select"
              value={tray}
              onChange={(e) => setTray(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="1">Tray 1 (Standard 250-sheet Lower)</option>
              <option value="2">Tray 2 (Optional 500-sheet)</option>
              <option value="bypass">Bypass / Manual Slot</option>
              <option value="auto">Auto Select</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              id="btn-download-custom-installer"
              type="button"
              onClick={handleDownload}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Configured .PS1 Installer
            </button>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm text-slate-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-cyan-400 font-mono flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                <span>Generated PowerShell Script</span>
              </span>
              <button
                id="btn-copy-custom-script"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Script"}</span>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 select-all">
              <pre className="whitespace-pre-wrap">{generatedScript}</pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Requires Windows PowerShell 5.1+ or PowerShell 7</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Self-elevating Administrator script
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
