import React, { useState } from "react";
import { Network, Send, RefreshCw, CheckCircle2, AlertCircle, Terminal, HelpCircle } from "lucide-react";

export const NetworkPrintConsole: React.FC = () => {
  const [printerIp, setPrinterIp] = useState("192.168.1.100");
  const [port, setPort] = useState(9100);
  const [paper, setPaper] = useState("Letter");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handleSendTestPrint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      `[${timestamp}] Initiating RAW socket connection to ${printerIp}:${port}...`,
      `[${timestamp}] Generating 600 DPI hardware calibration page with HBPL v2 headers...`,
      ...prev,
    ]);

    try {
      const res = await fetch("/api/send-test-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: printerIp, port, paper }),
      });

      const data = await res.json();
      const finishTime = new Date().toLocaleTimeString();

      if (!res.ok || !data.success) {
        setStatus("error");
        setStatusMsg(data.error || "Failed to reach printer");
        setLogs((prev) => [
          `[${finishTime}] ERROR: ${data.error || "Network timeout / connection refused"}`,
          ...prev,
        ]);
      } else {
        setStatus("success");
        setStatusMsg(`Job delivered successfully to ${printerIp}:${port}`);
        setLogs((prev) => [
          `[${finishTime}] SUCCESS: Dispatched HBPL stream to ${printerIp}:${port}`,
          `[${finishTime}] Printer engine accepted print stream.`,
          ...prev,
        ]);
      }
    } catch (err: any) {
      const finishTime = new Date().toLocaleTimeString();
      setStatus("error");
      setStatusMsg(err.message || "Network request failed");
      setLogs((prev) => [
        `[${finishTime}] FATAL: ${err.message}`,
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-600" />
          <span>Network Test Print Console (Port 9100)</span>
        </h2>
        <p className="text-sm text-slate-600">
          Directly test communication between your browser/server and your physical Dell 1320c network printer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Target Printer Address
          </h3>

          <form onSubmit={handleSendTestPrint} className="space-y-4">
            <div>
              <label htmlFor="net-ip-field" className="block text-xs font-semibold text-slate-700 mb-1">
                Printer IP Address or Hostname
              </label>
              <input
                id="net-ip-field"
                type="text"
                required
                value={printerIp}
                onChange={(e) => setPrinterIp(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Make sure your computer or host can reach this IP address on port 9100.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="net-port-field" className="block text-xs font-semibold text-slate-700 mb-1">
                  RAW Port
                </label>
                <input
                  id="net-port-field"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="net-paper-field" className="block text-xs font-semibold text-slate-700 mb-1">
                  Paper Size
                </label>
                <select
                  id="net-paper-field"
                  value={paper}
                  onChange={(e) => setPaper(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Letter">Letter</option>
                  <option value="A4">A4</option>
                  <option value="Legal">Legal</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>

            <button
              id="btn-send-network-test"
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-300 text-white font-semibold text-xs transition shadow-sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send Calibration Test Page</span>
            </button>
          </form>

          {status === "success" && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {status === "error" && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Network Status</span>
                <span>{statusMsg}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1.5">
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
              Troubleshooting Network Printing:
            </span>
            <p>1. If this server is hosted in cloud/container, it cannot reach your private LAN 192.168.x.x directly.</p>
            <p>2. In that case, download the <strong>Universal Driver Suite</strong> or use the Windows command line:</p>
            <code className="block bg-slate-200 p-1.5 rounded font-mono text-[10px] text-slate-900">
              .\dell1320c_winprint.exe --test-page --host {printerIp}
            </code>
          </div>
        </div>

        {/* Live Terminal Log */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-cyan-400 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>Winsock RAW Connection Log</span>
              </span>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Clear Log
              </button>
            </div>

            <div className="h-64 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-slate-500 py-10 text-center">
                  Ready. Enter your Dell 1320c IP address and click &quot;Send Calibration Test Page&quot;.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes("ERROR") || log.includes("FATAL")
                        ? "text-red-400"
                        : log.includes("SUCCESS")
                        ? "text-emerald-400"
                        : "text-slate-300"
                    }
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Protocol: RAW Port 9100 Stream (JetDirect)</span>
            <span>Packet: HBPL v2 + SQ21</span>
          </div>
        </div>
      </div>
    </div>
  );
};
