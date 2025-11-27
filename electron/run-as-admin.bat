@echo off
echo ========================================
echo ETD Electron App - Administrator Mode
echo ========================================
echo.

REM Change to the script's directory to ensure we're in the electron folder
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo This script will run the ETD Electron app with Administrator privileges
echo to ensure proper SecuGen device access.
echo.

REM Check if package.json exists (to verify we're in the right directory)
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the electron directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Check if already running as admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running with Administrator privileges
    echo.
    echo Starting ETD Electron app with SecuGen support...
    echo.
    
    REM Run with all necessary flags for SecuGen
    npx electron . --no-sandbox --disable-web-security --disable-gpu --disable-gpu-sandbox --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content --disable-features=VizDisplayCompositor
    
    echo.
    echo App closed.
) else (
    echo ❌ Not running as Administrator
    echo.
    echo Please right-click this file and select "Run as Administrator"
    echo This is required for proper SecuGen device access.
    echo.
    pause
    exit /b 1
)

pause

