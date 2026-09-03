import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { createServer as createViteServer } from "vite";

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const ROOT_DIR = process.cwd();
const DOWNLOADS_DIR = path.join(ROOT_DIR, "public", "downloads");
const DRIVER_DIR = path.join(ROOT_DIR, "driver");
const LINUX_ENGINE = path.join(DRIVER_DIR, "bin", "dell1320c_engine_linux");

function getFileChecksum(filePath: string): string {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  } catch {
    return "";
  }
}

// Ensure download directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    printer: "Dell Color Laser 1320c",
    engineVersion: "1.2.0",
    targets: ["x86", "x64", "arm64"],
  });
});

// 2. Driver Packages list
app.get("/api/driver-packages", (_req, res) => {
  const packages = [
    {
      id: "universal",
      name: "Dell 1320c Universal Driver Suite (All-In-One)",
      filename: "dell1320c-windows-driver-universal.zip",
      architecture: "x86, x64, ARM64",
      description: "Includes native binaries for all architectures (32-bit, 64-bit, ARM64), INF/GPD/PPD drivers, automated PowerShell & BAT installers, and full C source code.",
      recommendedFor: "All Windows versions (Windows 11, 10, 8.1, 7, Server)",
      isPrimary: true,
      features: [
        "Windows 32-bit (x86) PE32 Native Executable",
        "Windows 64-bit (x64) PE32+ Native Executable",
        "Windows ARM64 (AArch64) PE32+ Native Executable",
        "INF Driver Setup file (dell1320c.inf)",
        "Unidrv GPD printer description (dell1320c.gpd)",
        "PostScript PPD printer description (dell1320c.ppd)",
        "One-click PowerShell installer (Install-Dell1320c-Driver.ps1)",
        "One-click Double-click installer (install.bat)",
        "Visual Studio 2019/2022 Solution & CMakeLists.txt",
      ],
    },
    {
      id: "arm64",
      name: "Dell 1320c Driver for Windows ARM64",
      filename: "dell1320c-windows-driver-arm64.zip",
      architecture: "ARM64 (AArch64)",
      description: "Lightweight package optimized specifically for ARM-powered Windows machines.",
      recommendedFor: "Surface Pro X, Surface Laptop 7, Snapdragon X Elite, Snapdragon X Plus, ThinkPad X13s, Windows on ARM VMs (Parallels/UTM)",
      isPrimary: false,
      features: [
        "Native ARM64 PE32+ Filter & Print Processor",
        "Direct RAW Port 9100 Winsock Dispatcher",
        "dell1320c.inf Driver Setup",
        "dell1320c.gpd Generic Printer Profile",
        "PowerShell installer with ARM64 auto-detection",
      ],
    },
    {
      id: "x64",
      name: "Dell 1320c Driver for Windows 64-bit (x64)",
      filename: "dell1320c-windows-driver-x64.zip",
      architecture: "x64 (AMD64 / Intel 64)",
      description: "Optimized for standard modern 64-bit Windows PC desktops and laptops.",
      recommendedFor: "Standard 64-bit Windows 11, Windows 10, Windows 7, Windows Server",
      isPrimary: false,
      features: [
        "Native x64 PE32+ Filter & Print Processor",
        "Direct RAW Port 9100 Winsock Dispatcher",
        "dell1320c.inf Driver Setup",
        "dell1320c.gpd Generic Printer Profile",
        "PowerShell and batch installers",
      ],
    },
    {
      id: "x86",
      name: "Dell 1320c Driver for Windows 32-bit (x86)",
      filename: "dell1320c-windows-driver-x86.zip",
      architecture: "x86 (32-bit)",
      description: "Compatible with legacy 32-bit Windows systems and POS terminals.",
      recommendedFor: "Windows 10 32-bit, Windows 7 32-bit, Windows XP, Embedded POS systems",
      isPrimary: false,
      features: [
        "Native 32-bit PE32 Filter & Print Processor",
        "Direct RAW Port 9100 Winsock Dispatcher",
        "dell1320c.inf Driver Setup",
        "dell1320c.gpd Generic Printer Profile",
        "PowerShell and batch installers",
      ],
    },
  ];

  const packageListWithMeta = packages.map((pkg) => {
    const filePath = path.join(DOWNLOADS_DIR, pkg.filename);
    let size = 0;
    let sha256 = "";
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      size = stats.size;
      sha256 = getFileChecksum(filePath);
    }
    return {
      ...pkg,
      fileSize: size,
      sha256,
      downloadUrl: `/downloads/${pkg.filename}`,
    };
  });

  res.json({
    packages: packageListWithMeta,
    releaseDate: "2026-09-03",
    driverVersion: "1.2.0.0",
    upstreamSource: "https://github.com/biosed/dell-1320c-cups-driver",
  });
});

// 3. Source File Viewer API
app.get("/api/source-file", (req, res) => {
  const filePathParam = req.query.path as string;
  if (!filePathParam) {
    res.status(400).json({ error: "Missing path query parameter" });
    return;
  }

  // Prevent path traversal
  const normalized = path.normalize(filePathParam).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(ROOT_DIR, normalized);

  if (!fullPath.startsWith(ROOT_DIR) || !fs.existsSync(fullPath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      res.status(400).json({ error: "Target is a directory" });
      return;
    }
    const content = fs.readFileSync(fullPath, "utf-8");
    res.json({
      path: normalized,
      filename: path.basename(fullPath),
      size: stat.size,
      content,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Convert Image / Raster to Dell 1320c HBPL
app.post("/api/convert-to-hbpl", async (req, res) => {
  try {
    const { imageBase64, paper = "Letter", color = true, dpi = 600, tray = "1" } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "Missing imageBase64 payload" });
      return;
    }

    // Extract raw base64 data if it has data URL prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    const tmpId = crypto.randomBytes(8).toString("hex");
    const tmpInput = path.join("/tmp", `input_${tmpId}.bmp`);
    const tmpOutput = path.join("/tmp", `output_${tmpId}.hbpl`);

    fs.writeFileSync(tmpInput, imgBuffer);

    // Call native engine
    const args = [
      "-i", tmpInput,
      "-o", tmpOutput,
      "--paper", paper,
      "--tray", tray,
      "--dpi", String(dpi),
    ];
    if (color) {
      args.push("--color");
    } else {
      args.push("--mono");
    }

    await execFileAsync(LINUX_ENGINE, args);

    if (!fs.existsSync(tmpOutput)) {
      res.status(500).json({ error: "Engine did not produce output file" });
      return;
    }

    const hbplBuf = fs.readFileSync(tmpOutput);
    const pjlHeader = hbplBuf.subarray(0, 1024).toString("latin1").split("\x1b")[0] || "";
    const hexSlice = hbplBuf.subarray(0, 128);
    const hexPreview = Array.from(hexSlice)
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");

    const compressionRatio = imgBuffer.length > 0 
      ? Math.round(((imgBuffer.length - hbplBuf.length) / imgBuffer.length) * 100) 
      : 0;

    // Clean up temporary files
    try { fs.unlinkSync(tmpInput); } catch {}
    try { fs.unlinkSync(tmpOutput); } catch {}

    res.json({
      success: true,
      originalSize: imgBuffer.length,
      hbplSize: hbplBuf.length,
      compressionRatio: `${compressionRatio}%`,
      pjlHeaderSnippet: pjlHeader.slice(0, 500),
      hexPreview,
      hbplBase64: hbplBuf.toString("base64"),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Conversion failed" });
  }
});

// 5. Generate and download Test Page HBPL file
app.get("/api/download-test-page", async (_req, res) => {
  try {
    const tmpId = crypto.randomBytes(8).toString("hex");
    const tmpOutput = path.join("/tmp", `testpage_${tmpId}.hbpl`);

    await execFileAsync(LINUX_ENGINE, ["--test-page", "-o", tmpOutput]);

    if (!fs.existsSync(tmpOutput)) {
      res.status(500).json({ error: "Could not generate test page" });
      return;
    }

    res.download(tmpOutput, "Dell1320c_Calibration_TestPage.hbpl", () => {
      try { fs.unlinkSync(tmpOutput); } catch {}
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Direct Network Test Print over Port 9100
app.post("/api/send-test-print", async (req, res) => {
  try {
    const { host, port = 9100, paper = "Letter" } = req.body;
    if (!host || typeof host !== "string") {
      res.status(400).json({ error: "Host IP address is required" });
      return;
    }

    // Validate IP / hostname format
    const cleanHost = host.trim();
    if (!/^([a-zA-Z0-9.-]+)$/.test(cleanHost)) {
      res.status(400).json({ error: "Invalid host format" });
      return;
    }

    const { stdout, stderr } = await execFileAsync(LINUX_ENGINE, [
      "--test-page",
      "--host", cleanHost,
      "--port", String(port),
      "--paper", paper,
    ]);

    res.json({
      success: true,
      host: cleanHost,
      port,
      output: stdout || stderr || "Test print sent successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to connect to printer at ${req.body.host}:${req.body.port || 9100}. Please ensure the Dell 1320c is powered on and accessible on the local network. (${err.message})`,
    });
  }
});

// 7. Generate Customized Installer Script
app.post("/api/custom-installer", (req, res) => {
  const { connectionType = "Network", printerIp = "192.168.1.100", usbPort = "USB001", defaultPaper = "Letter" } = req.body;

  const scriptContent = `<#
.SYNOPSIS
    Customized Dell 1320c Driver Installer for ${connectionType} Connection (${connectionType === "Network" ? printerIp : usbPort})
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

# Deploy Engine
$installTargetDir = "$env:ProgramFiles\\Dell1320c"
New-Item -ItemType Directory -Path $installTargetDir -Force | Out-Null
Copy-Item -Path "$binDir\\*" -Destination $installTargetDir -Recurse -Force

# Stage INF
& pnputil.exe /add-driver "$infPath" /install

# Setup Port
$portName = "${connectionType === "Network" ? `IP_${printerIp}` : usbPort}"
${connectionType === "Network" ? `
if (-not (Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue)) {
    Add-PrinterPort -Name $portName -PrinterHostAddress "${printerIp}" -PortNumber 9100 -ErrorAction SilentlyContinue
}
` : `
Write-Host "Configured USB Port: $portName"
`}

# Register Printer
Add-Printer -Name "Dell Color Laser 1320c" -DriverName "Generic / Text Only" -PortName $portName -ErrorAction SilentlyContinue

Write-Host "Installation Completed! Default Paper Size: ${defaultPaper}" -ForegroundColor Green
Write-Host "Sending hardware test page..." -ForegroundColor Cyan
& "$installTargetDir\\dell1320c_winprint.exe" --test-page ${connectionType === "Network" ? `--host ${printerIp}` : `--usb ${usbPort}`} --paper ${defaultPaper}
`;

  res.setHeader("Content-Disposition", "attachment; filename=Install-Dell1320c-Custom.ps1");
  res.setHeader("Content-Type", "application/octet-stream");
  res.send(scriptContent);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dell 1320c Driver Suite Server running on http://localhost:${PORT}`);
  });
}

startServer();
