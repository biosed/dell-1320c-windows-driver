========================================================================
 Dell Color Laser 1320c Windows Driver Suite (x86, x64, and ARM64)
 Ported from open-source project: biosed/dell-1320c-cups-driver
========================================================================

OVERVIEW:
The Dell Color Laser 1320c (and its sister printer, the Fuji Xerox DocuPrint C525A)
uses Host-Based Printing Language version 2 (HBPL v2) with proprietary SQ21
compression. Official Dell drivers ceased development during the Windows 7 era
and never supported Windows on ARM64 or modern Windows 11 kernel requirements.

This driver suite provides:
  1. Native Windows Binaries for:
     - Windows 32-bit (x86)
     - Windows 64-bit (x64 / AMD64)
     - Windows ARM64 (Surface Pro X, Surface Laptop 7, Snapdragon X Elite, etc.)
  2. Windows Spooler Engine (`dell1320c_winprint.exe`):
     - Translates standard raster formats (BMP, PPM) into HBPL v2 + SQ21 packets
     - Emits PJL job headers, vendor attribute codes, and EOJ sequences
     - Built-in RAW Port 9100 network print client for networked Dell 1320c
     - Built-in USB stream output for direct USB connection (USB001 - USB004)
     - Hardware calibration test page generator (`--test-page`)
  3. Windows Driver Package:
     - `dell1320c.inf` (Setup Information File covering x86, amd64, arm, arm64)
     - `dell1320c.gpd` (Generic Printer Description with all paper sizes and trays)
     - `dell1320c.ppd` (PostScript Description)
  4. Automated Installation Scripts:
     - `Install-Dell1320c-Driver.ps1` (Self-elevating PowerShell setup)
     - `install.bat` (Double-click batch installer)
     - `Uninstall-Dell1320c-Driver.ps1` (Clean uninstaller)

------------------------------------------------------------------------
QUICK START INSTALLATION:
------------------------------------------------------------------------

METHOD 1: Automated Script (Recommended)
1. Extract the ZIP archive to a folder (e.g. C:\Dell1320c).
2. Right-click `install.bat` and select "Run as Administrator"
   (or run PowerShell as Administrator):
     .\scripts\Install-Dell1320c-Driver.ps1 -ConnectionType Network -PrinterIP 192.168.1.100 -TestPrint
3. The installer auto-detects whether your PC is ARM64 or x64, deploys the
   engine to C:\Program Files\Dell1320c, stages the INF in the Windows Driver Store,
   and creates the print queue.

METHOD 2: Standard Windows "Add Printer" Wizard (INF Method)
1. Open Windows Settings -> "Bluetooth & devices" -> "Printers & scanners".
2. Click "Add device", then click "The printer that I want isn't listed".
3. Choose "Add a local printer or network printer with manual settings".
4. Select or create your port:
   - For Network: Choose "Standard TCP/IP Port" -> enter your Dell 1320c IP address.
   - For USB: Choose existing "USB001 (Virtual printer port for USB)".
5. Click "Have Disk..." and browse to `common\dell1320c.inf`.
6. Select "Dell Color Laser 1320c" and complete the wizard.

METHOD 3: Direct Printing / Command Line / Scripting
You can print directly to your Dell 1320c from any script or terminal without
even installing a printer queue:

  Print a calibration test page over the network:
    dell1320c_winprint.exe --test-page --host 192.168.1.100

  Print a BMP or PPM file:
    dell1320c_winprint.exe -i document.bmp --host 192.168.1.100 --paper Letter

  Print directly to USB:
    dell1320c_winprint.exe -i document.bmp --usb \\.\USB001

  Pipeline with Ghostscript (converting PDF/PS to Dell 1320c on Windows):
    gswin64c.exe -q -dNOPAUSE -dBATCH -sDEVICE=ppmraw -r600 -sOutputFile=- mydoc.pdf | dell1320c_winprint.exe --host 192.168.1.100

------------------------------------------------------------------------
PAPER & TRAY OPTIONS:
------------------------------------------------------------------------
  --paper Letter    (8.5 x 11 in, 612x792 pt, default)
  --paper A4        (210 x 297 mm, 595x842 pt)
  --paper Legal     (8.5 x 14 in, 612x1008 pt)
  --paper Executive (7.25 x 10.5 in, 522x756 pt)
  --paper B5        (182 x 257 mm, 516x729 pt)
  --paper Env10     (No. 10 Envelope, 4.125 x 9.5 in)
  --tray 1          (Standard 250-sheet lower tray, default)
  --tray 2          (Optional 500-sheet auxiliary tray)
  --tray bypass     (Manual bypass slot)
  --color           (Full 24bpp Color mode, default)
  --mono            (High-speed 8bpp Grayscale mode)
  --dpi 600         (High resolution 600x600 dpi, default)
  --dpi 300         (Draft resolution 300x300 dpi)

------------------------------------------------------------------------
COMPILATION FROM SOURCE:
------------------------------------------------------------------------
Source files are in the `src/` directory.
- Windows GCC / MinGW:
    mingw32-make (or make -f Makefile)
- Visual Studio / MSBuild:
    Open `src\dell1320c.sln` in Visual Studio 2019/2022, choose your platform
    (Win32, x64, or ARM64) and select Build Solution.
- CMake:
    cmake -B build -S src
    cmake --build build --config Release

------------------------------------------------------------------------
CREDITS & LICENSE:
------------------------------------------------------------------------
Based on reverse-engineering work by biosed (https://github.com/biosed/dell-1320c-cups-driver).
Licensed under GNU General Public License v2 (GPL-2.0).
========================================================================
