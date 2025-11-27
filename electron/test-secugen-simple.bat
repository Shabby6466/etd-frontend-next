@echo off
echo ========================================
echo Simple SecuGen Test - Electron App
echo ========================================
echo.

REM Change to the script's directory to ensure we're in the electron folder
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo This will run the Electron app with the simplified SecuGen implementation
echo that matches the working web app approach.
echo.

REM Check if package.json exists (to verify we're in the right directory)
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the electron directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running with Administrator privileges
) else (
    echo ⚠️ Not running as Administrator - this may cause issues
    echo Consider right-clicking and "Run as Administrator"
    echo.
)

echo Starting Electron with simplified SecuGen approach...
echo.

REM Run with minimal flags for testing
npx electron . --no-sandbox --disable-web-security --disable-gpu --disable-gpu-sandbox --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content

echo.
echo Test completed.
pause
