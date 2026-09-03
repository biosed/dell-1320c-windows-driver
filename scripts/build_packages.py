#!/usr/bin/env python3
import os
import zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DRIVER_DIR = os.path.join(ROOT, "driver")
OUT_DIR = os.path.join(ROOT, "public", "downloads")
os.makedirs(OUT_DIR, exist_ok=True)

def add_folder_to_zip(zip_file, folder_path, arc_root=""):
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, folder_path)
            arc_name = os.path.join(arc_root, rel_path) if arc_root else rel_path
            zip_file.write(full_path, arc_name)

# 1. Universal Driver Package
universal_zip_path = os.path.join(OUT_DIR, "dell1320c-windows-driver-universal.zip")
print(f"Creating {universal_zip_path}...")
with zipfile.ZipFile(universal_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "bin"), "bin")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "common"), "common")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "scripts"), "scripts")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "src"), "src")
    zf.write(os.path.join(DRIVER_DIR, "README.txt"), "README.txt")
    if os.path.exists(os.path.join(ROOT, "README.md")):
        zf.write(os.path.join(ROOT, "README.md"), "README.md")

# 2. ARM64 Package
arm64_zip_path = os.path.join(OUT_DIR, "dell1320c-windows-driver-arm64.zip")
print(f"Creating {arm64_zip_path}...")
with zipfile.ZipFile(arm64_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "bin", "arm64"), "bin")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "common"), "common")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "scripts"), "scripts")
    zf.write(os.path.join(DRIVER_DIR, "README.txt"), "README.txt")

# 3. x64 Package
x64_zip_path = os.path.join(OUT_DIR, "dell1320c-windows-driver-x64.zip")
print(f"Creating {x64_zip_path}...")
with zipfile.ZipFile(x64_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "bin", "x64"), "bin")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "common"), "common")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "scripts"), "scripts")
    zf.write(os.path.join(DRIVER_DIR, "README.txt"), "README.txt")

# 4. x86 (32-bit) Package
x86_zip_path = os.path.join(OUT_DIR, "dell1320c-windows-driver-x86.zip")
print(f"Creating {x86_zip_path}...")
with zipfile.ZipFile(x86_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "bin", "x86"), "bin")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "common"), "common")
    add_folder_to_zip(zf, os.path.join(DRIVER_DIR, "scripts"), "scripts")
    zf.write(os.path.join(DRIVER_DIR, "README.txt"), "README.txt")

print("Packages built successfully!")
for f in os.listdir(OUT_DIR):
    p = os.path.join(OUT_DIR, f)
    print(f" - {f}: {os.path.getsize(p):,} bytes")
