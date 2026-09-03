import React, { useState, useEffect } from "react";
import { DriverPackage, PackagesResponse } from "./types";
import { Navbar } from "./components/Navbar";
import { DownloadsSection } from "./components/DownloadsSection";
import { InstallGuides } from "./components/InstallGuides";
import { CustomInstallerBuilder } from "./components/CustomInstallerBuilder";
import { LiveConverterWorkbench } from "./components/LiveConverterWorkbench";
import { NetworkPrintConsole } from "./components/NetworkPrintConsole";
import { SourceCodeExplorer } from "./components/SourceCodeExplorer";
import { TechnicalReference } from "./components/TechnicalReference";
import { Printer, Cpu, ExternalLink, ShieldCheck } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("downloads");
  const [packages, setPackages] = useState<DriverPackage[]>([]);
  const [releaseDate, setReleaseDate] = useState("2026-09-03");
  const [driverVersion, setDriverVersion] = useState("1.2.0.0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/driver-packages")
      .then((res) => res.json())
      .then((data: PackagesResponse) => {
        setPackages(data.packages || []);
        if (data.releaseDate) setReleaseDate(data.releaseDate);
        if (data.driverVersion) setDriverVersion(data.driverVersion);
      })
      .catch((err) => {
        console.error("Failed to fetch packages:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const universalPkg = packages.find((p) => p.id === "universal");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        universalDownloadUrl={universalPkg?.downloadUrl}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "downloads" && (
          <DownloadsSection
            packages={packages}
            releaseDate={releaseDate}
            driverVersion={driverVersion}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "guides" && <InstallGuides />}

        {activeTab === "customizer" && <CustomInstallerBuilder />}

        {activeTab === "workbench" && <LiveConverterWorkbench />}

        {activeTab === "network" && <NetworkPrintConsole />}

        {activeTab === "source" && (
          <div className="space-y-10">
            <SourceCodeExplorer />
            <TechnicalReference />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-600/10 flex items-center justify-center text-cyan-700">
              <Printer className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">
              Dell Color Laser 1320c Universal Windows Driver Suite
            </span>
            <span className="text-slate-400">·</span>
            <span>v{driverVersion}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
              <span>Native x86 / x64 / ARM64</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>GPL-2.0 License</span>
            </span>
            <span>·</span>
            <a
              href="https://github.com/biosed/dell-1320c-cups-driver"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-cyan-600 transition"
            >
              <span>Upstream: biosed</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
