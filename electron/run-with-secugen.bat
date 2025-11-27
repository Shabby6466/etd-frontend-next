@echo off
echo Starting ETD Electron App with SecuGen support...
echo.

REM Change to the script's directory to ensure we're in the electron folder
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo This will run the app with additional permissions for SecuGen device access.
echo If you encounter issues, try running as Administrator.
echo.

REM Try to run with admin privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
) else (
    echo WARNING: Not running as Administrator. SecuGen may not work properly.
    echo Consider right-clicking and "Run as Administrator" if you have issues.
    echo.
)

REM Check if package.json exists (to verify we're in the right directory)
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the electron directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Run the Electron app with SecuGen-friendly settings
echo Starting Electron app...
npx electron . --no-sandbox --disable-web-security --disable-gpu --disable-gpu-sandbox --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content

pause

