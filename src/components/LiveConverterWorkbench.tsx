import React, { useState } from "react";
import { ConversionResult } from "../types";
import {
  Sparkles,
  Upload,
  Download,
  FileCode,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
} from "lucide-react";

export const LiveConverterWorkbench: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [paper, setPaper] = useState("Letter");
  const [colorMode, setColorMode] = useState(true);
  const [dpi, setDpi] = useState(600);
  const [activeView, setActiveView] = useState<"summary" | "pjl" | "hex">("summary");

  const handleGenerateTestPage = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create a 24-bit test image on a hidden canvas
      const canvas = document.createElement("canvas");
      canvas.width = (paper === "A4" ? 4960 : 5100);
      canvas.height = (paper === "A4" ? 7016 : 6600);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header banner
        ctx.fillStyle = "#0284C7";
        ctx.fillRect(200, 200, canvas.width - 400, 150);

        // Color calibration blocks
        const colors = ["#00FFFF", "#FF00FF", "#FFFF00", "#000000", "#FF0000", "#00FF00", "#0000FF"];
        const blockW = (canvas.width - 400) / colors.length;
        colors.forEach((c, idx) => {
          ctx.fillStyle = c;
          ctx.fillRect(200 + idx * blockW, 450, blockW, 200);
        });

        // Text title
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 60px sans-serif";
        ctx.fillText("Dell Color Laser 1320c - Windows Universal Driver Test", 250, 300);
      }

      const dataUrl = canvas.toDataURL("image/bmp");
      await executeConversion(dataUrl);
    } catch (err: any) {
      setError(err.message || "Failed to generate test page");
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        await executeConversion(base64);
      } catch (err: any) {
        setError(err.message || "Failed to convert file");
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("File read error");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const executeConversion = async (base64Img: string) => {
    try {
      const res = await fetch("/api/convert-to-hbpl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Img,
          paper,
          color: colorMode,
          dpi,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Engine error");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadHbpl = () => {
    if (!result?.hbplBase64) return;
    const byteCharacters = atob(result.hbplBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/octet-stream" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dell1320c_print_job.hbpl";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-600" />
          <span>HBPL v2 & SQ21 Protocol Studio</span>
        </h2>
        <p className="text-sm text-slate-600">
          Inspect the live C rasterization engine in action. Convert any raster into raw Dell 1320c print packets
          using proprietary SQ21 lossless compression and inspect the binary streams.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Actions & Parameters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Job Parameters</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paper Format
                </label>
                <select
                  value={paper}
                  onChange={(e) => setPaper(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Letter">Letter (612 x 792 pt)</option>
                  <option value="A4">A4 (595 x 842 pt)</option>
                  <option value="Legal">Legal (612 x 1008 pt)</option>
                  <option value="Executive">Executive</option>
                  <option value="B5">B5</option>
                  <option value="Env10">Envelope #10</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDpi(600)}
                    className={`px-3 py-1.5 text-xs rounded-lg border text-center ${
                      dpi === 600
                        ? "bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    600 DPI (High)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDpi(300)}
                    className={`px-3 py-1.5 text-xs rounded-lg border text-center ${
                      dpi === 300
                        ? "bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    300 DPI (Fast)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setColorMode(true)}
                    className={`px-3 py-1.5 text-xs rounded-lg border text-center ${
                      colorMode
                        ? "bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    24bpp Color
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode(false)}
                    className={`px-3 py-1.5 text-xs rounded-lg border text-center ${
                      !colorMode
                        ? "bg-cyan-50 border-cyan-500 text-cyan-800 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    8bpp Mono
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                id="btn-run-test-engine"
                type="button"
                disabled={loading}
                onClick={handleGenerateTestPage}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-300 text-white font-semibold text-xs transition shadow-sm"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Run SQ21 Compression Benchmark</span>
              </button>

              <div className="relative">
                <input
                  type="file"
                  id="user-file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="user-file-input"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer border border-slate-300 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Image (BMP/PNG)</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results & Inspection */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Protocol Stream Inspector</span>
                {result && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    SQ21 Compression: {result.compressionRatio} Saved
                  </span>
                )}
              </div>

              {result && (
                <button
                  id="btn-download-hbpl-stream"
                  onClick={downloadHbpl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .HBPL File</span>
                </button>
              )}
            </div>

            {result ? (
              <div className="space-y-4">
                {/* Metric Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">Raw Raster Size</span>
                    <span className="text-base font-bold text-white font-mono">
                      {formatSize(result.originalSize)}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">SQ21 Compressed</span>
                    <span className="text-base font-bold text-cyan-400 font-mono">
                      {formatSize(result.hbplSize)}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">Data Reduction</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {result.compressionRatio}
                    </span>
                  </div>
                </div>

                {/* Sub-tabs for stream views */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setActiveView("summary")}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                      activeView === "summary"
                        ? "bg-slate-800 text-cyan-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Packet Breakdown
                  </button>
                  <button
                    onClick={() => setActiveView("pjl")}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                      activeView === "pjl"
                        ? "bg-slate-800 text-cyan-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    PJL Header
                  </button>
                  <button
                    onClick={() => setActiveView("hex")}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                      activeView === "hex"
                        ? "bg-slate-800 text-cyan-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Hex Dump (First 128 Bytes)
                  </button>
                </div>

                {/* Content based on sub-tab */}
                {activeView === "summary" && (
                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950/70 p-4 rounded-lg border border-slate-800 font-mono">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>[0x000] Universal Exit Language (UEL): \033%-12345X</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span>[PJL] Job Attributes: MODE=PRINTER, RENDERMODE={colorMode ? "COLOR" : "BLACK"}, RESOLUTION={dpi}</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-400">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>[0x... ] Enter Language: HBPL</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>[Doc Start] 41 81 a1 00 82 a2 01 00 83 a2 01 00</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>[Page Header] 78 bytes: Code={paper}, Dim={paper === "A4" ? "595x842" : "612x792"}pt, SQ21 Algorithm</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>[Payload] SQ21 Compressed Stream ({formatSize(result.hbplSize)})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span>[Trailer] Page End &quot;SD&quot; + Doc End &quot;B&quot; + \033%-12345X@PJL EOJ</span>
                    </div>
                  </div>
                )}

                {activeView === "pjl" && (
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 max-h-56 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{result.pjlHeaderSnippet}</pre>
                  </div>
                )}

                {activeView === "hex" && (
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 leading-relaxed max-h-56 overflow-y-auto">
                    <code>{result.hexPreview}</code>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <FileCode className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">
                  Click <strong>&quot;Run SQ21 Compression Benchmark&quot;</strong> or upload an image to convert raster data
                  into real Dell 1320c HBPL packets.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>SQ21 lossless compression preserves 100% pixel fidelity</span>
            <span>HBPL v2 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
