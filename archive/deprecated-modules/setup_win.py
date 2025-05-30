"""
Windows Setup Script for BentonGeoPro Sync Dashboard
This script builds a standalone Windows executable that includes:
- FastAPI backend server
- Static web interface
- Role-based security
"""

import os
import sys
import shutil
from pathlib import Path

# Check if PyInstaller is installed
try:
    import PyInstaller
except ImportError:
    print("PyInstaller is not installed. Installing...")
    os.system("pip install pyinstaller")

# Create windows_build directory if it doesn't exist
build_dir = Path("windows_build")
if not build_dir.exists():
    build_dir.mkdir()
    print(f"Created build directory: {build_dir}")

# Create the main application launcher script
launcher_path = build_dir / "app_launcher.py"
with open(launcher_path, "w") as f:
    f.write("""import os
import sys
import shutil
import subprocess
import webbrowser
from pathlib import Path
import time

def ensure_dirs():
    # Ensure the required directories exist
    for directory in ["logs", "uploads", "static"]:
        os.makedirs(directory, exist_ok=True)

def copy_static_files():
    # Copy static files if they don't exist
    static_dir = Path("static")
    if not (static_dir / "index.html").exists():
        source_static = Path(os.path.dirname(os.path.abspath(__file__))) / "static"
        if source_static.exists():
            for file in source_static.glob("*"):
                shutil.copy(file, static_dir)
            print("Static files copied successfully")
        else:
            print("Warning: Static files source directory not found")

def main():
    print("Starting BentonGeoPro Sync Dashboard...")
    ensure_dirs()
    copy_static_files()
    
    # Start the server
    try:
        import uvicorn
        from main import app
        
        # Open browser after a short delay
        def open_browser():
            time.sleep(2)
            webbrowser.open("http://localhost:8000")
        
        import threading
        threading.Thread(target=open_browser, daemon=True).start()
        
        # Run the server
        uvicorn.run("main:app", host="0.0.0.0", port=8000)
    except Exception as e:
        print(f"Error starting server: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
""")
print(f"Created launcher script: {launcher_path}")

# Create the PyInstaller spec file
spec_path = build_dir / "sync_dashboard.spec"
with open(spec_path, "w") as f:
    f.write("""# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['app_launcher.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('static', 'static'),
        ('main.py', '.'),
        ('rbac_auth.py', '.'),
    ],
    hiddenimports=[
        'fastapi',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.lifespan.off',
        'pydantic',
        'pandas',
        'python-multipart',
        'starlette',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='BentonGeoProSyncDashboard',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='logo.ico',
)
""")
print(f"Created PyInstaller spec file: {spec_path}")

# Create a batch file to build the executable
build_batch_path = build_dir / "build_installer.bat"
with open(build_batch_path, "w") as f:
    f.write("""@echo off
echo Building BentonGeoPro Sync Dashboard Installer...

REM Create required directories
mkdir static 2>nul

REM Copy server files to build directory
copy ..\server\main.py .
copy ..\server\rbac_auth.py .
xcopy /E /I /Y ..\server\static static

REM Install PyInstaller if not already installed
pip install pyinstaller

REM Create a basic icon
echo Creating icon...
python -c "import base64; \
icon_data = 'AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAABAAABILAAASCwAAAAAAAAAAAAD////////+/v7//v7+//7+/v/+/v7//f39//7+/v/////////////////+/v7//v7+//7+/v/+/v7//v7+//39/f/+/v7///////////////////////7+/v/+/v7//v7+//39/f/+/v7//////////////////v7+//7+/v/+/v7//v7+//39/f/+/v7/////////////////+/v7//v7+//9/f3///////////////////////7+/v/9/f3//f39//7+/v/////////////////+/v7//v7+//39/f/+/v7/////////////////+/v7//v7+//9/f3///////////////////////7+/v/9/f3//f39//7+/v/ExMT/Wlpa/z8/P/9JSUn/fX19/8PDw//7+/v//v7+//39/f/9/f3//v7+//7+/v/9/f3//v7+//7+/v/+/v7/+fn5/9PT0/+Kior/TU1N/z8/P/9YWFj/tbW1//T09P/+/v7//f39//39/f/9/f3//v7+//39/f/9/f3/3Nzc/1tbW/8AAAD/AAAA/wAAAP8AAAD/AAAA/09PT//V1dX//v7+///////+/v7//Pz8//r6+v/6+vr//f39//7+/v/4+Pj/nJyc/yUlJf8AAAD/AAAA/wAAAP8AAAD/AAAA/05OTv/U1NT//v7+///////+/v7//Pz8//r6+v/6+vr/+/v7/3d3d/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/ZGRk//X19f/+/v7/+vr6/+vr6//m5ub/6Ojo//X19f/5+fn/ioqK/wICAv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/YWFh//X19f/+/v7/+vr6/+vr6//m5ub/6Ojo//Hx8f+Ghob/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP+lpaX//v7+/+3t7f+2trb/j4+P/5WVlf/Jycn/6enp/1xcXP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP+hoaH//v7+/+3t7f+2trb/j4+P/5WVlf/Jycn/3t7e/1dXV/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/8jIyP/+/v7/zs7O/0FBQf8AAAD/AAAA/zAwMP+2trb/NTU1/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/8XFxf/+/v7/zs7O/0FBQf8AAAD/AAAA/zAwMP+2trb/SkpK/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/0dHR//7+/v/FxcX/MTEx/wAAAP8AAAD/HR0d/6ampv9ERET/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/zs7O//7+/v/FxcX/MTEx/wAAAP8AAAD/HR0d/6ampv9YWFj/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP/R0dH//v7+/8XFxf8xMTH/AAAA/wAAAP8dHR3/pqam/0RERP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP/Ozs7//v7+/8XFxf8xMTH/AAAA/wAAAP8dHR3/pqam/1hYWP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/9HR0f/+/v7/xcXF/zExMf8AAAD/AAAA/x0dHf+mpqb/RERE/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/87Ozv/+/v7/xcXF/zExMf8AAAD/AAAA/x0dHf+mpqb/WFhY/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/0dHR//7+/v/FxcX/MTEx/wAAAP8AAAD/HR0d/6ampv9ERET/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/zs7O//7+/v/FxcX/MTEx/wAAAP8AAAD/HR0d/6ampv9YWFj/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP/R0dH//v7+/8XFxf8xMTH/AAAA/wAAAP8dHR3/pqam/0RERP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP/Ozs7//v7+/8XFxf8xMTH/AAAA/wAAAP8dHR3/pqam/1hYWP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/9HR0f/+/v7/xcXF/zExMf8AAAD/AAAA/x0dHf+mpqb/RERE/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/87Ozv/+/v7/xcXF/zExMf8AAAD/AAAA/x0dHf+mpqb/WFhY/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/0dHR//7+/v/Ozs7/S0tL/wAAAP8AAAD/Nzc3/7q6uv8yMjL/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/zs7O//7+/v/Ozs7/S0tL/wAAAP8AAAD/Nzc3/7q6uv9FRUX/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP/MzMz//v7+/+jo6P+SkpL/Ozs7/z09Pf+BgYH/7Ozs/21tbf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wEBAf/Kysr//v7+/+jo6P+SkpL/Ozs7/z09Pf+BgYH/7Ozs/4CAgP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/6urq//+/v7//f39//Hx8f/g4OD/4ODg//Pz8//+/v7/5ubm/25ubv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/FRUV/8/Pz//+/v7//f39//Hx8f/g4OD/4ODg//Pz8//+/v7/5+fn/29vb/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/YmJi//X19f/+/v7//v7+//7+/v/+/v7//v7+//7+/v/+/v7//f39/7e3t/8qKir/AAAA/wAAAP8AAAD/AAAA/wAAAP8nJyf/srKy//7+/v/+/v7//v7+//7+/v/+/v7//v7+//7+/v/+/v7//f39/7e3t/8qKir/AAAA/wAAAP8AAAD/AAAA/wAAAP9WVlb/3d3d//7+/v/+/v7//f39//39/f/9/f3//v7+//7+/v/9/f3//v7+//n5+f/Ly8v/aWlp/ygoKP8eHh7/MzMz/3Nzc//Y2Nj//f39//7+/v/9/f3//f39//39/f/9/f3//v7+//7+/v/9/f3//v7+//n5+f/Ly8v/aWlp/ygoKP8eHh7/MzMz/3Nzc//b29v//v7+//39/f/+/v7/////////////////+/v7//v7+//9/f3//v7+//7+/v/+/v7//f39//Dw8P/v7+///f39//7+/v/+/v7//v7+//7+/v/+/v7//v7+//////////////////v7+//7+/v//f39//7+/v/+/v7//v7+//39/f/w8PD/7+/v//7+/v/+/v7//v7+//////////////////7+/v/+/v7//v7+//39/f/+/v7//////////////////v7+//7+/v/+/v7///////////////////////7+/v/+/v7//v7+//39/f/+/v7//////////////////v7+//7+/v/+/v7//v7+//7+/v/+/v7//v7+//7+/v/+/v7///////////////////////39/f/9/f3//v7+//////////////////7+/v/+/v7//v7+//7+/v/+/v7//v7+//7+/v/+/v7//v7+//7+/v/+/v7//v7+//7+/v/+/v7//v7+/////////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' ; \
with open('logo.ico', 'wb') as f: f.write(base64.b64decode(icon_data))"

REM Build the executable
pyinstaller --clean sync_dashboard.spec

REM Copy the executable to the parent directory
copy dist\BentonGeoProSyncDashboard.exe ..\BentonGeoProSyncDashboard.exe

echo Build completed successfully!
echo Executable is available at: ..\BentonGeoProSyncDashboard.exe
pause
""")
print(f"Created build batch file: {build_batch_path}")

# Create a README file
readme_path = build_dir / "README.txt"
with open(readme_path, "w") as f:
    f.write("""BentonGeoPro Sync Dashboard - Windows Installer
===========================================

This package contains the installer for the BentonGeoPro Sync Dashboard application.
The application provides ICSF-compliant property data synchronization with role-based access control.

Steps to build the Windows installer:
1. Copy the server directory contents (main.py, rbac_auth.py, and static folder) to this directory
2. Run the build_installer.bat script
3. The standalone executable will be created in the parent directory

User Authentication:
- Available credentials:
  - "CO\\jdoe" (Assessor role)
  - "CO\\mjohnson" (Staff role)
  - "CO\\bsmith" (ITAdmin role)
  - "CO\\tauditor" (Auditor role)

For more information, please contact the Benton County Assessor's Office IT Department.
""")
print(f"Created README file: {readme_path}")

print("\nSetup complete! To build the Windows installer:")
print("1. Navigate to the windows_build directory")
print("2. Run the build_installer.bat script")
print("3. The executable will be created in the project root directory")