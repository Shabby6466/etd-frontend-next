#!/usr/bin/env python3
"""
Build script for ETD Python Desktop Application

This script handles building and packaging the application for distribution.
"""

import os
import sys
import shutil
import subprocess
import platform
from pathlib import Path

class ETDBuilder:
    """Build system for ETD Desktop Application"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.dist_dir = self.project_root / "dist"
        self.build_dir = self.project_root / "build"
        self.spec_file = self.project_root / "etd_app.spec"
        
    def clean(self):
        """Clean build directories"""
        print("Cleaning build directories...")
        
        dirs_to_clean = [self.dist_dir, self.build_dir]
        for dir_path in dirs_to_clean:
            if dir_path.exists():
                shutil.rmtree(dir_path)
                print(f"Removed {dir_path}")
        
        # Remove spec file if it exists
        if self.spec_file.exists():
            self.spec_file.unlink()
            print(f"Removed {self.spec_file}")
    
    def install_dependencies(self):
        """Install build dependencies"""
        print("Installing build dependencies...")
        
        try:
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
            ], check=True, cwd=self.project_root)
            print("Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"Failed to install dependencies: {e}")
            sys.exit(1)
    
    def create_spec_file(self):
        """Create PyInstaller spec file"""
        print("Creating PyInstaller spec file...")
        
        spec_content = f'''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['{self.project_root}'],
    binaries=[],
    datas=[
        ('config.py', '.'),
        ('biometric_device.py', '.'),
    ],
    hiddenimports=[
        'requests',
        'urllib3',
        'tkinter',
        'tkinter.ttk',
        'tkinter.messagebox',
        'ssl',
        'json',
        'threading',
        'logging',
        'datetime',
    ],
    hookspath=[],
    hooksconfig={{}},
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
    name='ETD_Desktop_App',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
'''
        
        with open(self.spec_file, 'w') as f:
            f.write(spec_content)
        
        print(f"Spec file created: {self.spec_file}")
    
    def build_executable(self):
        """Build executable using PyInstaller"""
        print("Building executable...")
        
        try:
            # Use spec file for more control
            subprocess.run([
                sys.executable, "-m", "PyInstaller", 
                "--clean", 
                str(self.spec_file)
            ], check=True, cwd=self.project_root)
            print("Executable built successfully")
        except subprocess.CalledProcessError as e:
            print(f"Failed to build executable: {e}")
            sys.exit(1)
    
    def create_installer(self):
        """Create installer package"""
        print("Creating installer package...")
        
        system = platform.system().lower()
        
        if system == "windows":
            self._create_windows_installer()
        elif system == "darwin":
            self._create_macos_installer()
        elif system == "linux":
            self._create_linux_installer()
        else:
            print(f"Installer creation not supported for {system}")
    
    def _create_windows_installer(self):
        """Create Windows installer"""
        print("Creating Windows installer...")
        
        # Create NSIS installer script
        nsis_script = self.project_root / "installer.nsi"
        nsis_content = f'''
!define APPNAME "ETD Desktop Application"
!define COMPANYNAME "ETD Team"
!define DESCRIPTION "Emergency Travel Document Desktop Application"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0
!define HELPURL "https://github.com/etd-team/etd-desktop-app"
!define UPDATEURL "https://github.com/etd-team/etd-desktop-app"
!define ABOUTURL "https://github.com/etd-team/etd-desktop-app"
!define INSTALLSIZE 50000

RequestExecutionLevel admin
InstallDir "$PROGRAMFILES\\${{APPNAME}}"
Name "${{APPNAME}}"
outFile "ETD_Desktop_App_Installer.exe"

!include LogicLib.nsh

page directory
page instfiles

!macro VerifyUserIsAdmin
UserInfo::GetAccountType
pop $0
${{If}} $0 != "admin"
    messageBox mb_iconstop "Administrator rights required!"
    setErrorLevel 740
    quit
${{EndIf}}
!macroend

function .onInit
    setShellVarContext all
    !insertmacro VerifyUserIsAdmin
functionEnd

section "install"
    setOutPath $INSTDIR
    file "dist\\ETD_Desktop_App.exe"
    
    createDirectory "$SMPROGRAMS\\${{APPNAME}}"
    createShortCut "$SMPROGRAMS\\${{APPNAME}}\\${{APPNAME}}.lnk" "$INSTDIR\\ETD_Desktop_App.exe"
    createShortCut "$DESKTOP\\${{APPNAME}}.lnk" "$INSTDIR\\ETD_Desktop_App.exe"
    
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "DisplayName" "${{APPNAME}}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "UninstallString" "$\\"$INSTDIR\\uninstall.exe$\\""
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "QuietUninstallString" "$\\"$INSTDIR\\uninstall.exe$\\" /S"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "InstallLocation" "$\\"$INSTDIR$\\""
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "DisplayIcon" "$\\"$INSTDIR\\ETD_Desktop_App.exe$\\""
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "Publisher" "${{COMPANYNAME}}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "HelpLink" "${{HELPURL}}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "URLUpdateInfo" "${{UPDATEURL}}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "URLInfoAbout" "${{ABOUTURL}}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "DisplayVersion" "${{VERSIONMAJOR}}.${{VERSIONMINOR}}.${{VERSIONBUILD}}"
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "VersionMajor" ${{VERSIONMAJOR}}
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "VersionMinor" ${{VERSIONMINOR}}
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "NoModify" 1
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}" "NoRepair" 1
    WriteUninstaller "$INSTDIR\\uninstall.exe"
sectionEnd

section "uninstall"
    delete "$INSTDIR\\ETD_Desktop_App.exe"
    delete "$INSTDIR\\uninstall.exe"
    rmDir "$INSTDIR"
    
    delete "$SMPROGRAMS\\${{APPNAME}}\\${{APPNAME}}.lnk"
    rmDir "$SMPROGRAMS\\${{APPNAME}}"
    delete "$DESKTOP\\${{APPNAME}}.lnk"
    
    DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${{APPNAME}}"
sectionEnd
'''
        
        with open(nsis_script, 'w') as f:
            f.write(nsis_content)
        
        print(f"NSIS script created: {nsis_script}")
        print("Note: Install NSIS to create Windows installer")
    
    def _create_macos_installer(self):
        """Create macOS installer"""
        print("Creating macOS installer...")
        print("Note: macOS installer creation requires additional tools")
    
    def _create_linux_installer(self):
        """Create Linux installer"""
        print("Creating Linux installer...")
        print("Note: Linux installer creation requires additional tools")
    
    def build_all(self):
        """Build complete application"""
        print("Starting ETD Desktop Application build process...")
        
        # Clean previous builds
        self.clean()
        
        # Install dependencies
        self.install_dependencies()
        
        # Create spec file
        self.create_spec_file()
        
        # Build executable
        self.build_executable()
        
        # Create installer
        self.create_installer()
        
        print("Build process completed!")
        print(f"Executable location: {self.dist_dir}")
    
    def run_tests(self):
        """Run application tests"""
        print("Running tests...")
        
        try:
            subprocess.run([
                sys.executable, "-m", "pytest", "tests/", "-v"
            ], check=True, cwd=self.project_root)
            print("Tests passed successfully")
        except subprocess.CalledProcessError as e:
            print(f"Tests failed: {e}")
            sys.exit(1)
        except FileNotFoundError:
            print("No tests found or pytest not installed")

def main():
    """Main build function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="ETD Desktop Application Builder")
    parser.add_argument("--clean", action="store_true", help="Clean build directories")
    parser.add_argument("--test", action="store_true", help="Run tests")
    parser.add_argument("--build", action="store_true", help="Build executable")
    parser.add_argument("--all", action="store_true", help="Clean, test, and build")
    
    args = parser.parse_args()
    
    builder = ETDBuilder()
    
    if args.clean:
        builder.clean()
    elif args.test:
        builder.run_tests()
    elif args.build:
        builder.build_all()
    elif args.all:
        builder.clean()
        builder.run_tests()
        builder.build_all()
    else:
        # Default: build all
        builder.build_all()

if __name__ == "__main__":
    main()
