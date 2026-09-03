import React from "react";
import { Printer, Cpu, Download, CheckCircle, ExternalLink, ShieldCheck } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  universalDownloadUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  universalDownloadUrl = "/downloads/dell1320c-windows-driver-universal.zip",
}) => {
  const tabs = [
    { id: "downloads", label: "Downloads & Binaries" },
    { id: "guides", label: "Installation Guides" },
    { id: "customizer", label: "Custom Installer" },
    { id: "workbench", label: "HBPL & SQ21 Studio" },
    { id: "network", label: "Network Print Test" },
    { id: "source", label: "Source & Protocol" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-100">
                  Dell 1320c
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Universal Windows Driver
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Native x86 · x64 · ARM64 · HBPL v2 Protocol Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Engine v1.2.0 Active</span>
              <span className="text-slate-500">|</span>
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>ARM64 Native</span>
            </div>

            <a
              id="header-download-btn"
              href={universalDownloadUrl}
              download="dell1320c-windows-driver-universal.zip"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Suite</span>
              <span className="sm:hidden">Download</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-slate-800 text-cyan-300 border-b-2 border-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
