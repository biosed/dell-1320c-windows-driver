# Dell Color Laser 1320c Windows Driver Suite (x86, x64, ARM64)

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2011%20%7C%2010%20%7C%208.1%20%7C%207-0078D6?logo=windows&logoColor=white)](#)
[![Architectures: x86 | x64 | ARM64](https://img.shields.io/badge/Arch-x86%20%7C%20x64%20%7C%20ARM64-blueviolet)](#)
[![License: GPL-2.0](https://img.shields.io/badge/License-GPL--2.0-green.svg)](LICENSE)
[![Based on: biosed/dell-1320c-cups-driver](https://img.shields.io/badge/Upstream-biosed%2Fdell--1320c--cups--driver-orange?logo=github)](https://github.com/biosed/dell-1320c-cups-driver)

A complete, native Windows driver suite, print processor, and standalone rasterization engine for the **Dell Color Laser 1320c** (and its OEM sibling, the **Fuji Xerox DocuPrint C525A**).

Provides full native support for modern **Windows 11 on ARM64** (Snapdragon X Elite, Surface Pro X, Surface Laptop 7, Parallels VMs on Apple Silicon), standard **Windows 64-bit (x64)**, and legacy **Windows 32-bit (x86)**.

---

## 📌 Background & The Problem

The Dell Color Laser 1320c is a **host-based (GDI)** laser printer using **Host-Based Printing Language version 2 (HBPL v2)** with proprietary **SQ21 lossless compression**. The printer hardware contains no onboard PostScript or PCL rasterizer—the host computer is responsible for rendering the 600 DPI bitmap, applying SQ21 compression, generating the strict 78-byte binary page headers, and wrapping the payload in PJL (Printer Job Language) commands.

Official Dell driver development stopped during the Windows 7 era:
- **No ARM64 drivers** were ever produced by Dell or Xerox.
- Official drivers fail on modern Windows 11 ARM devices and cause spooler crashes.
- Legacy drivers require outdated 32-bit components.

This project ports the reverse-engineered Linux CUPS driver by [biosed](https://github.com/biosed/dell-1320c-cups-driver) to native Windows C99, compiling into standalone PE32/PE32+ executables and standard Windows INF/GPD print driver packages.

---

## ✨ Features

- **True Native Windows ARM64 Support**: Native `PE32+ aarch64` binary with zero emulation overhead on Snapdragon X Elite and Surface ARM devices.
- **x64 & x86 Binaries**: Native `PE32+ amd64` and `PE32 i386` binaries for all modern and legacy Intel/AMD Windows installations.
- **SQ21 Lossless Compression Engine**: Full C implementation of Fuji Xerox SQ21 compression (differential prediction + run-length encoding + variable-bit packing), delivering **90% to 99.5% data reduction** over raw 600 DPI bitmaps.
- **Direct RAW Port 9100 Network Client**: Built-in Winsock client allows printing directly to networked printers over TCP port 9100 without needing Windows print spooler queues.
- **Direct USB Virtual Port Support**: Send print jobs directly to `\\.\USB001` - `\\.\USB004`.
- **Complete Windows Driver Package**: Includes `dell1320c.inf`, `dell1320c.gpd` (Unidrv Generic Printer Description), and `dell1320c.ppd`.
- **One-Click Automated Setup**: Self-elevating PowerShell script (`Install-Dell1320c-Driver.ps1`) and batch script (`install.bat`) for effortless installation.
- **Hardware Calibration Test Page**: Built-in test generator (`--test-page`) to test printer connectivity and drum/toner alignment.

---

## 🚀 Quick Start & Installation

### Method 1: Automated Script (Recommended)

1. Download the latest **[Universal Driver Suite ZIP](public/downloads/dell1320c-windows-driver-universal.zip)**.
2. Extract the archive (e.g., to `C:\Dell1320c`).
3. Right-click `scripts\install.bat` and select **Run as Administrator**, or run PowerShell as Administrator:

```powershell
# Network connection (replace IP with your Dell 1320c IP address):
.\scripts\Install-Dell1320c-Driver.ps1 -ConnectionType Network -PrinterIP 192.168.1.100 -TestPrint

# USB connection:
.\scripts\Install-Dell1320c-Driver.ps1 -ConnectionType USB -USBPort USB001 -TestPrint
```

The script will:
- Auto-detect whether your Windows machine is **ARM64**, **x64**, or **x86**.
- Deploy the native engine binaries to `C:\Program Files\Dell1320c`.
- Stage the driver in the Windows Driver Store via `pnputil.exe`.
- Create the Standard TCP/IP printer port or assign the USB virtual port.
- Create the print queue and send a hardware test page.

---

### Method 2: Windows "Add Printer" Wizard (INF Method)

1. Open **Settings** > **Bluetooth & devices** > **Printers & scanners**.
2. Click **Add device**, wait a few seconds, then click **The printer that I want isn't listed**.
3. Choose **Add a local printer or network printer with manual settings** and click **Next**.
4. Select your port:
   - **Network**: Choose *Create a new port* > *Standard TCP/IP Port* and enter your Dell 1320c IP address.
   - **USB**: Choose *Use an existing port* > *USB001 (Virtual printer port for USB)*.
5. In the driver selection dialog, click **Have Disk...** and browse to `common\dell1320c.inf`.
6. Select **Dell Color Laser 1320c** and complete the wizard.

---

### Method 3: Direct Command-Line Printing (No Print Spooler Needed)

You can print directly from PowerShell or Command Prompt without installing any printer queue:

```cmd
:: Print built-in calibration test page over the network:
dell1320c_winprint.exe --test-page --host 192.168.1.100

:: Print a BMP or PPM file over the network:
dell1320c_winprint.exe -i document.bmp --host 192.168.1.100 --paper Letter --color

:: Print directly to a USB port:
dell1320c_winprint.exe -i document.bmp --usb \\.\USB001

:: Pipeline with Ghostscript on Windows (print any PDF to Dell 1320c):
gswin64c.exe -q -dNOPAUSE -dBATCH -sDEVICE=ppmraw -r600 -sOutputFile=- document.pdf | dell1320c_winprint.exe --host 192.168.1.100
```

---

## ⚙️ CLI Options & Flags

`dell1320c_winprint.exe` (and `dell1320c_filter.exe`) support the following arguments:

| Option | Values / Description | Default |
| :--- | :--- | :--- |
| `-i <file>` | Input BMP or PPM image file (`-` for STDIN pipe) | STDIN |
| `-o <file>` | Output raw `.hbpl` file (`-` for STDOUT) | STDOUT |
| `--host <ip>` | Send directly to printer via RAW TCP port 9100 | None |
| `--port <num>` | TCP port for network printing | `9100` |
| `--usb <port>` | Send directly to USB port (e.g., `\\.\USB001`) | None |
| `--test-page` | Generate hardware calibration pattern internally | Off |
| `--paper <sz>` | `Letter`, `A4`, `Legal`, `Executive`, `B5`, `Env10` | `Letter` |
| `--tray <num>` | `1` (Standard 250), `2` (Optional 500), `bypass`, `auto` | `1` |
| `--color` | 24bpp Color mode (RGB) | Enabled |
| `--mono` | 8bpp High-speed Grayscale mode | Off |
| `--dpi <res>` | Resolution: `600` or `300` DPI | `600` |

---

## 📁 Repository Structure

```
.
├── driver/
│   ├── bin/
│   │   ├── arm64/                    # Native Windows ARM64 PE32+ executables
│   │   │   ├── dell1320c_winprint.exe
│   │   │   └── dell1320c_filter.exe
│   │   ├── x64/                      # Native Windows 64-bit PE32+ executables
│   │   │   ├── dell1320c_winprint.exe
│   │   │   └── dell1320c_filter.exe
│   │   ├── x86/                      # Native Windows 32-bit PE32 executables
│   │   │   ├── dell1320c_winprint.exe
│   │   │   └── dell1320c_filter.exe
│   │   └── dell1320c_engine_linux    # Linux host binary
│   ├── common/
│   │   ├── dell1320c.inf             # Windows INF Setup file (x86, amd64, arm64)
│   │   ├── dell1320c.gpd             # Generic Printer Description (Unidrv)
│   │   └── dell1320c.ppd             # PostScript Printer Description
│   ├── scripts/
│   │   ├── Install-Dell1320c-Driver.ps1    # Automated PowerShell installer
│   │   ├── install.bat                     # Double-click batch installer
│   │   └── Uninstall-Dell1320c-Driver.ps1  # Uninstaller script
│   ├── src/
│   │   ├── dell1320c_engine.h        # HBPL v2 headers & packet structures
│   │   ├── dell1320c_engine.c        # Rasterizer, PJL generator & band chunker
│   │   ├── dell1320c_winprint.c      # Windows entry point, Winsock & USB dispatcher
│   │   ├── sq21_simple.c             # SQ21 lossless compression implementation
│   │   ├── CMakeLists.txt            # CMake build definition
│   │   └── Makefile                  # Multi-target cross-compilation Makefile
│   └── README.txt                    # Driver package documentation
├── public/downloads/                 # Pre-built distribution ZIP archives
│   ├── dell1320c-windows-driver-universal.zip
│   ├── dell1320c-windows-driver-arm64.zip
│   ├── dell1320c-windows-driver-x64.zip
│   └── dell1320c-windows-driver-x86.zip
├── src/                              # Web GUI & Interactive Protocol Workbench (React)
├── server.ts                         # Express backend API & protocol server
└── README.md                         # This file
```

---

## 🛠️ Building from Source

### Using Make (Cross-Compiling from Linux)

Cross-compiling for all Windows architectures requires `mingw-w64` and `llvm-mingw` (for ARM64):

```bash
cd driver/src

# Build for all architectures (x86, x64, ARM64, and Linux host):
make all

# Or build individual targets:
make arm64    # Windows ARM64 (aarch64-w64-mingw32-gcc)
make x64      # Windows x64 (x86_64-w64-mingw32-gcc)
make x86      # Windows 32-bit (i686-w64-mingw32-gcc)
make host     # Linux host native executable
```

### Using CMake on Windows

```cmd
cd driver\src
cmake -B build -S .
cmake --build build --config Release
```

### Using Visual Studio / MSBuild

Open Visual Studio 2019 or 2022, create a C Console Application project with `dell1320c_winprint.c`, `dell1320c_engine.c`, and `sq21_simple.c`, link `ws2_32.lib`, and select your target platform (**Win32**, **x64**, or **ARM64**).

---

## 🔬 Technical Protocol Details

### HBPL v2 Packet Structure

Every print stream sent to the Dell 1320c adheres to the following sequence:

```
1. Universal Exit Language (UEL)
   \033%-12345X
2. PJL Job Header
   @PJL DEFAULT SERVICEMODE=HPSTATUS
   @PJL SET JOBATTR="@OWNR=..."
   @PJL SET RENDERMODE=COLOR        (or BLACK)
   @PJL SET RESOLUTION=600
   @PJL ENTER LANGUAGE=HBPL
3. Binary Document Start Sequence
   41 81 a1 00 82 a2 01 00 83 a2 01 00 ...
4. 78-byte Binary Page Header
   Includes Paper Dimensions (Points), Paper Code, Tray ID, and Color Space
5. Compressed Raster Bands (SQ21)
   Each band begins with the SQ21 header marker followed by compressed byte stream
6. Page End Marker
   SD
7. Document End & UEL Exit
   B\033%-12345X@PJL EOJ
```

---

## 📄 License & Acknowledgments

- **Upstream CUPS Driver**: Reverse-engineered and implemented for Linux CUPS by **biosed** ([biosed/dell-1320c-cups-driver](https://github.com/biosed/dell-1320c-cups-driver)).
- **Windows Port & Driver Suite**: Modernized and ported to Windows C99 / Winsock with ARM64, x64, and x86 support.
- **License**: GNU General Public License v2.0 ([GPL-2.0](LICENSE)).
