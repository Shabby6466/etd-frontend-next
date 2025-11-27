@echo off
setlocal enabledelayedexpansion
echo ========================================
echo ETD Electron App - Hosted Web Server
echo ========================================
echo.

REM Change to the script's directory to ensure we're in the electron folder
cd /d "%~dp0"
echo Current directory: %CD%
echo.

REM Check if package.json exists (to verify we're in the right directory)
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the electron directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Installing dependencies if needed...
if not exist "node_modules" (
    echo Installing npm packages...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Get local IP address
echo Detecting network configuration...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip: =!"
    if not "!ip!"=="127.0.0.1" (
        if not "!ip!"=="" (
            set "LOCAL_IP=!ip!"
            goto :found_ip
        )
    )
)

:found_ip
if not defined LOCAL_IP (
    set "LOCAL_IP=[Unable to detect - check ipconfig]"
)

echo.
echo ========================================
echo Starting Webpack Development Server...
echo ========================================
echo.
echo 🌐 Application URLs:
echo ----------------------------------------
echo Local:    http://localhost:3002
echo Network:  http://!LOCAL_IP!:3002
echo ----------------------------------------
echo.
echo 📱 To access from mobile devices or other computers:
echo 1. Connect to the same Wi-Fi network
echo 2. Open browser and go to: http://!LOCAL_IP!:3002
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start the webpack dev server with host binding to allow external access
echo Starting webpack dev server...
npx webpack serve --mode development --host 0.0.0.0 --port 3002 --open-target http://localhost:3002

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start webpack dev server
    echo Please check the error messages above
    echo.
    pause
    exit /b 1
)

echo.
echo Server stopped.
pause
