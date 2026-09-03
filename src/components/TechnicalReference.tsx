import React from "react";
import { BookOpen, Cpu, Layers, HardDrive, ShieldCheck, CheckCircle2 } from "lucide-react";

export const TechnicalReference: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-600" />
          <span>Technical Architecture & Protocol Specification</span>
        </h2>
        <p className="text-sm text-slate-600">
          In-depth technical breakdown of the Dell 1320c / Fuji Xerox DocuPrint C525A print protocol and Windows driver architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Why Host-Based? */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-cyan-700">
            <Cpu className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-900">Why Host-Based Printing (HBPL v2)?</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Dell Color Laser 1320c (and its OEM sibling, Fuji Xerox DocuPrint C525A) is a <em>host-based</em> printer.
            Unlike high-end enterprise copiers, it lacks an onboard PostScript or PCL RIP (Raster Image Processor) and only contains
            a minimal ASIC. The host computer's CPU is responsible for rasterizing the document into a 600 DPI bitmap, applying
            SQ21 lossless compression, and packaging it inside PJL envelopes.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">The Problem:</span> When Microsoft released Windows on ARM64 (Surface Pro X, Snapdragon X Elite),
            Dell's old 2008 Windows 7 x86/x64 drivers could not operate in the Windows 64-bit kernel spooler. This driver provides the missing native ARM64 and modern x64 engine.
          </div>
        </div>

        {/* Card 2: SQ21 Compression */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-purple-700">
            <Layers className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-900">SQ21 Compression Algorithm</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            SQ21 is a proprietary lossless bitmap compression scheme designed by Fuji Xerox for real-time laser engine streaming.
            It utilizes:
          </p>
          <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
            <li><strong>Differential Coding:</strong> Predicts pixel values from horizontal and vertical neighbors.</li>
            <li><strong>Run-Length Encoding (RLE):</strong> Compresses wide whitespace margins and solid toner fills to single-byte markers.</li>
            <li><strong>Variable-Bit Packing:</strong> Packs color components (24bpp RGB or 8bpp Mono) into high-entropy byte streams.</li>
          </ul>
          <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            Achieves 90%–99.5% bandwidth reduction on standard documents, keeping network and USB buffers full at 16 ppm.
          </p>
        </div>

        {/* Card 3: The 78-byte Page Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <HardDrive className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-900">The 78-byte HBPL Page Header</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every raster page is preceded by a strict 78-byte binary structure mapped in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">dell1320c_engine.h</code>:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-cyan-300 space-y-1">
            <div>0x00..0x03: Magic Header (41 81 a1 00)</div>
            <div>0x04..0x0B: Document Token Sequences</div>
            <div>0x0C..0x13: Paper Dimensions (Points in Big-Endian)</div>
            <div>0x14..0x15: Paper Tray ID (1=Tray1, 2=Tray2, 3=Bypass)</div>
            <div>0x16..0x17: Paper Code (1=Letter, 2=A4, 3=Legal...)</div>
            <div>0x18..0x19: Color Flag (0x0001=Color 24bpp, 0x0000=Mono)</div>
            <div>0x40..0x4D: Trailing Padding & Checksum bytes</div>
          </div>
        </div>

        {/* Card 4: ARM64 Native Execution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-900">Native Windows ARM64 Compilation</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Windows ARM64 binaries were compiled with LLVM MinGW targeting <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">aarch64-w64-mingw32</code>.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            <li><strong>PE32+ Executable:</strong> True ARM64 binary executing natively on Snapdragon X Elite and Apple Silicon Parallels VMs.</li>
            <li><strong>Zero Emulation Overhead:</strong> No translation or JIT latency during print jobs.</li>
            <li><strong>Standard Windows API:</strong> Uses standard <code className="bg-slate-100 px-1 py-0.5 rounded">ws2_32.dll</code> for Winsock networking and standard Win32 file handles for USB.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
