import React, { useState, useEffect } from "react";
import { FileCode, Copy, Check, ExternalLink, Terminal, Cpu } from "lucide-react";

export const SourceCodeExplorer: React.FC = () => {
  const files = [
    { name: "dell1320c_engine.h", path: "driver/src/dell1320c_engine.h", type: "C Header", desc: "Core HBPL v2 structures, 78-byte page header, SQ21 signatures" },
    { name: "dell1320c_engine.c", path: "driver/src/dell1320c_engine.c", type: "C Source", desc: "PJL builder, raster chunking, band streamer, and test page generator" },
    { name: "dell1320c_winprint.c", path: "driver/src/dell1320c_winprint.c", type: "C Windows Entry", desc: "Win32/Win64/ARM64 Winsock dispatcher, spooler pipeline, and USB handler" },
    { name: "sq21_simple.c", path: "driver/src/sq21_simple.c", type: "C Source", desc: "Fuji Xerox / Dell SQ21 lossless compression encoder" },
    { name: "dell1320c.inf", path: "driver/common/dell1320c.inf", type: "Windows INF", desc: "Setup Information file covering x86, amd64, and arm64 targets" },
    { name: "dell1320c.gpd", path: "driver/common/dell1320c.gpd", type: "Windows GPD", desc: "Generic Printer Description for Unidrv spooler engine" },
    { name: "Install-Dell1320c-Driver.ps1", path: "driver/scripts/Install-Dell1320c-Driver.ps1", type: "PowerShell", desc: "Automated admin installer with architecture auto-detection" },
    { name: "Makefile", path: "driver/src/Makefile", type: "Build Script", desc: "Cross-compilation targets for x86, x64, and ARM64" },
  ];

  const [selectedFile, setSelectedFile] = useState(files[0]);
  const [content, setContent] = useState<string>("Loading file content...");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/source-file?path=${encodeURIComponent(selectedFile.path)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setContent(data.content || "Could not load file content");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setContent(`Error loading file: ${err.message}`);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileCode className="w-5 h-5 text-cyan-600" />
          <span>Driver Source Code & Architecture Inspector</span>
        </h2>
        <p className="text-sm text-slate-600">
          Inspect the complete reverse-engineered C source code, protocol headers, and Windows setup files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Navigator */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Driver Source Tree
          </h3>

          <div className="space-y-1">
            {files.map((f) => {
              const active = selectedFile.path === f.path;
              return (
                <button
                  key={f.path}
                  onClick={() => setSelectedFile(f)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition flex flex-col gap-0.5 ${
                    active
                      ? "bg-cyan-50 border border-cyan-400 text-cyan-950 font-medium"
                      : "text-slate-700 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">{f.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                      {f.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 truncate">{f.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <a
              href="https://github.com/biosed/dell-1320c-cups-driver"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-cyan-600 transition px-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Upstream: biosed/dell-1320c-cups-driver</span>
            </a>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400">
                  {selectedFile.path}
                </span>
                <span className="text-[11px] text-slate-400">({selectedFile.type})</span>
              </div>

              <button
                id="btn-copy-code-view"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            <div className="h-96 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/80 p-4 rounded-lg border border-slate-800 select-all">
              {loading ? (
                <div className="text-slate-500 text-center py-20">Loading source code...</div>
              ) : (
                <pre className="whitespace-pre-wrap">{content}</pre>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Standard C99 / Windows API (Winsock2)</span>
            <span>GPL-2.0 License</span>
          </div>
        </div>
      </div>
    </div>
  );
};
