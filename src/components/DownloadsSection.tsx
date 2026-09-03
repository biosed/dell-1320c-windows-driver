import React, { useState } from "react";
import { DriverPackage } from "../types";
import {
  Download,
  Copy,
  Check,
  Cpu,
  HardDrive,
  FileCode,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface DownloadsSectionProps {
  packages: DriverPackage[];
  releaseDate: string;
  driverVersion: string;
  onNavigateTab: (tab: string) => void;
}

export const DownloadsSection: React.FC<DownloadsSectionProps> = ({
  packages,
  releaseDate,
  driverVersion,
  onNavigateTab,
}) => {
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "Calculating...";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const universalPkg = packages.find((p) => p.id === "universal");
  const specificPkgs = packages.filter((p) => p.id !== "universal");

  return (
    <div className="space-y-8">
      {/* Overview Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Native Windows Port of biosed/dell-1320c-cups-driver</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Universal Windows Driver Suite for Dell Color Laser 1320c
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Official Dell drivers only ever supported Windows 7 32-bit/64-bit and were abandoned years ago.
            This open-source suite provides full native Windows support for <strong>Windows ARM64</strong> (Snapdragon X Elite,
            Surface Pro X, Parallels VMs), <strong>Windows 64-bit (x64)</strong>, and <strong>Windows 32-bit (x86)</strong> with
            real-time SQ21 lossless compression and direct RAW Port 9100 network and USB output.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {universalPkg && (
              <a
                id="hero-download-universal"
                href={universalPkg.downloadUrl}
                download={universalPkg.filename}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Complete Universal Suite ({formatSize(universalPkg.fileSize)})
              </a>
            )}

            <button
              id="hero-quick-guide-btn"
              onClick={() => onNavigateTab("guides")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition border border-slate-700"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              View Installation Guides
            </button>

            <a
              id="download-testpage-sample"
              href="/api/download-test-page"
              download="Dell1320c_Calibration_TestPage.hbpl"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-medium transition border border-slate-700"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              Download Sample .HBPL Test Print
            </a>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 border-t border-slate-800/80">
            <span>Release: {releaseDate}</span>
            <span>Driver Ver: {driverVersion}</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Safe & Unsigned-Free INF Setup
            </span>
            <a
              href="https://github.com/biosed/dell-1320c-cups-driver"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400 transition"
            >
              <span>GitHub Upstream</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Primary Featured Package */}
      {universalPkg && (
        <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-xl p-6 text-white shadow-md relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Recommended Package
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {universalPkg.architecture}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white">{universalPkg.name}</h2>
              <p className="text-sm text-slate-300">{universalPkg.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                {universalPkg.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {universalPkg.sha256 && (
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 select-none">SHA256:</span>
                  <span className="truncate max-w-xs sm:max-w-md">{universalPkg.sha256}</span>
                  <button
                    id="copy-sha-universal"
                    onClick={() => handleCopySha(universalPkg.sha256)}
                    className="ml-auto p-1 hover:text-white transition"
                    title="Copy SHA-256"
                  >
                    {copiedSha === universalPkg.sha256 ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-3 shrink-0">
              <a
                id="btn-download-universal-main"
                href={universalPkg.downloadUrl}
                download={universalPkg.filename}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition shadow"
              >
                <Download className="w-4 h-4" />
                <span>Download Universal ZIP</span>
                <span className="text-xs font-normal opacity-90">({formatSize(universalPkg.fileSize)})</span>
              </a>

              <div className="text-center text-xs text-slate-400">
                Contains x86, x64, ARM64 & Installers
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specific Architecture Packages */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-600" />
          <span>Standalone Architecture Packages</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {specificPkgs.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      pkg.id === "arm64"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : pkg.id === "x64"
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {pkg.architecture}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {formatSize(pkg.fileSize)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{pkg.description}</p>

                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-700">Target Devices: </span>
                  {pkg.recommendedFor}
                </div>

                <div className="space-y-1.5 pt-1">
                  {pkg.features.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-cyan-600 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                <a
                  id={`download-${pkg.id}-btn`}
                  href={pkg.downloadUrl}
                  download={pkg.filename}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {pkg.architecture} ZIP</span>
                </a>

                {pkg.sha256 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="truncate max-w-[170px]">SHA: {pkg.sha256.slice(0, 16)}...</span>
                    <button
                      id={`copy-sha-${pkg.id}`}
                      onClick={() => handleCopySha(pkg.sha256)}
                      className="hover:text-slate-700 transition"
                      title="Copy Full SHA256"
                    >
                      {copiedSha === pkg.sha256 ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
