import React, { useState } from "react";
import {
  Terminal,
  Cpu,
  Laptop,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  FolderOpen,
  Network,
  Usb,
  ShieldAlert,
} from "lucide-react";

export const InstallGuides: React.FC = () => {
  const [selectedGuide, setSelectedGuide] = useState<"arm64" | "x64" | "inf" | "network" | "signing">("arm64");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Step-by-Step Installation Guides</h2>
        <p className="text-sm text-slate-600">
          Clear, tested instructions for deploying the Dell 1320c driver across all Windows platforms.
        </p>
      </div>

      {/* Guide selector buttons */}
      <div className="flex flex-wrap gap-2 pb-2">
        {[
          { id: "arm64", label: "Windows 11 / 10 ARM64", icon: Cpu },
          { id: "x64", label: "Windows 64-bit (x64)", icon: Laptop },
          { id: "inf", label: "Manual INF Wizard", icon: FolderOpen },
          { id: "network", label: "Network (Port 9100)", icon: Network },
          { id: "signing", label: "Driver Signature Help", icon: ShieldAlert },
        ].map((item) => {
          const Icon = item.icon;
          const active = selectedGuide === item.id;
          return (
            <button
              key={item.id}
              id={`guide-btn-${item.id}`}
              onClick={() => setSelectedGuide(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                active
                  ? "bg-cyan-700 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ARM64 Guide */}
      {selectedGuide === "arm64" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                <Cpu className="w-3 h-3" /> Native ARM64 (Snapdragon X Elite / Surface Pro X / Parallels)
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Installing on Windows 11 ARM64
              </h3>
              <p className="text-xs text-slate-600">
                Because official Dell 1320c drivers never had ARM64 builds, this package uses a native 64-bit ARM
                PE32+ engine with zero emulation slowdown.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold shrink-0">
                1
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Extract the Driver Archive</p>
                <p className="text-xs text-slate-600">
                  Download and unzip <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">dell1320c-windows-driver-universal.zip</code> (or the ARM64 package) to a folder such as <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">C:\Dell1320c</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold shrink-0">
                2
              </span>
              <div className="space-y-2 w-full">
                <p className="text-sm font-semibold text-slate-900">Open PowerShell as Administrator</p>
                <p className="text-xs text-slate-600">
                  Right-click the Windows Start menu button, select <strong>Terminal (Admin)</strong> or <strong>PowerShell (Admin)</strong>, and navigate to the extracted scripts folder:
                </p>
                <div className="relative bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono">
                  <code>cd C:\Dell1320c\scripts</code>
                  <button
                    onClick={() => handleCopy("cd C:\\Dell1320c\\scripts", 1)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-1"
                  >
                    {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold shrink-0">
                3
              </span>
              <div className="space-y-2 w-full">
                <p className="text-sm font-semibold text-slate-900">Run the Automated Installer</p>
                <p className="text-xs text-slate-600">
                  Replace <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">192.168.1.100</code> with your Dell 1320c printer's IP address:
                </p>
                <div className="relative bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono">
                  <code>.\Install-Dell1320c-Driver.ps1 -ConnectionType Network -PrinterIP 192.168.1.100 -TestPrint</code>
                  <button
                    onClick={() => handleCopy(".\\Install-Dell1320c-Driver.ps1 -ConnectionType Network -PrinterIP 192.168.1.100 -TestPrint", 2)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-1"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  For USB connections, simply pass <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">-ConnectionType USB -USBPort USB001</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold shrink-0">
                4
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Verification & Test Print</p>
                <p className="text-xs text-slate-600">
                  The script will automatically detect the ARM64 architecture, copy the ARM64 binaries to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">C:\Program Files\Dell1320c</code>, register the driver into the Windows Driver Store via <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">pnputil</code>, and trigger a hardware test page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* x64 Guide */}
      {selectedGuide === "x64" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mb-1">
            <Laptop className="w-3 h-3" /> Standard Windows 64-bit (x64)
          </div>
          <h3 className="text-lg font-bold text-slate-900">Installing on Windows 11 / 10 64-bit (x64)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                Option A: Double-Click Batch Installer
              </h4>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                <li>Extract the downloaded ZIP.</li>
                <li>Open the <code className="bg-slate-200 px-1 py-0.5 rounded">scripts</code> folder.</li>
                <li>Right-click <code className="bg-slate-200 px-1 py-0.5 rounded">install.bat</code> and choose <strong>Run as Administrator</strong>.</li>
                <li>Follow the on-screen prompt to complete installation.</li>
              </ol>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                Option B: PowerShell Direct Command
              </h4>
              <p className="text-xs text-slate-600">Run in an elevated PowerShell prompt:</p>
              <div className="relative bg-slate-900 text-slate-200 p-2.5 rounded text-[11px] font-mono">
                <code>powershell.exe -ExecutionPolicy Bypass -File .\scripts\Install-Dell1320c-Driver.ps1</code>
                <button
                  onClick={() => handleCopy("powershell.exe -ExecutionPolicy Bypass -File .\\scripts\\Install-Dell1320c-Driver.ps1", 3)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white p-0.5"
                >
                  {copiedIndex === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual INF Wizard */}
      {selectedGuide === "inf" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Windows "Add Printer" Wizard (INF Method)</h3>
          <p className="text-xs text-slate-600">
            For corporate IT environments or users who prefer standard Windows GUI printer wizards:
          </p>

          <ol className="space-y-3 text-xs text-slate-700 list-decimal pl-4">
            <li>
              Open <strong>Settings</strong> &gt; <strong>Bluetooth & devices</strong> &gt; <strong>Printers & scanners</strong>.
            </li>
            <li>Click <strong>Add device</strong>, wait a moment, then click <strong>The printer that I want isn't listed</strong>.</li>
            <li>Select <strong>Add a local printer or network printer with manual settings</strong> and click Next.</li>
            <li>
              Choose your port:
              <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                <li><strong>Network:</strong> Select "Create a new port" &gt; "Standard TCP/IP Port", enter your Dell 1320c IP address.</li>
                <li><strong>USB:</strong> Select "Use an existing port" &gt; "USB001 (Virtual printer port for USB)".</li>
              </ul>
            </li>
            <li>
              On the "Install the printer driver" screen, click <strong>Have Disk...</strong>
            </li>
            <li>Browse to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">common\dell1320c.inf</code> in the extracted folder.</li>
            <li>Select <strong>Dell Color Laser 1320c</strong> from the list and finish the wizard.</li>
          </ol>
        </div>
      )}

      {/* Network Setup */}
      {selectedGuide === "network" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Configuring Dell 1320c over Network (Port 9100)</h3>
          <p className="text-xs text-slate-600">
            The Dell 1320c network card listens on RAW TCP port 9100 (standard AppSocket / JetDirect).
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Finding your Dell 1320c IP Address</h4>
            <p className="text-xs text-slate-600">
              Hold the <strong>Continue</strong> button on the Dell 1320c control panel for 3 seconds to print the
              "Printer Settings / Network Configuration Page". The IP address (e.g. 192.168.1.150) will be printed in the IPv4 section.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">Direct CLI Print Command</h4>
            <p className="text-xs text-slate-600">
              You can test communication directly without installing any spooler queue:
            </p>
            <div className="relative bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono">
              <code>dell1320c_winprint.exe --test-page --host 192.168.1.100</code>
              <button
                onClick={() => handleCopy("dell1320c_winprint.exe --test-page --host 192.168.1.100", 4)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-1"
              >
                {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Signature Enforcement */}
      {selectedGuide === "signing" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-base font-bold">Understanding Driver Signature on Windows 10 & 11</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Because this open-source driver is community-built and not signed by Microsoft's paid WHQL program, Windows may show a red or yellow security prompt when installing the INF file.
          </p>

          <div className="space-y-3">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3.5 space-y-2 text-xs">
              <span className="font-bold text-amber-900">Method 1: Windows Security Prompt</span>
              <p className="text-amber-800">
                When running the installer or INF, if Windows shows "Windows can't verify the publisher of this driver software", simply click <strong>"Install this driver software anyway"</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
              <span className="font-bold text-slate-900">Method 2: Testsigning Mode (Optional for Devs)</span>
              <p className="text-slate-600">
                If Windows group policy blocks unsigned drivers entirely, enable test signing in an Administrator Command Prompt:
              </p>
              <div className="bg-slate-900 text-slate-200 p-2 rounded font-mono text-[11px]">
                bcdedit /set testsigning on
              </div>
              <p className="text-slate-500 text-[11px]">Reboot your machine to apply.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
