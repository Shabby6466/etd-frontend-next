@echo off
title ETD Electron - Desktop App with Web Access
echo.
echo ========================================
echo ETD Electron - Desktop + Web Access
echo ========================================
echo.

cd /d "%~dp0"
echo Working directory: %CD%
echo.

REM Check required files
if not exist "package.json" (
    echo ERROR: package.json not found
    pause
    exit /b 1
)

if not exist "main.js" (
    echo ERROR: main.js not found
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
)

echo.
echo ========================================
echo Starting ETD Application
echo ========================================
echo.
echo 🖥️  This will start BOTH:
echo    1. Electron DESKTOP application
echo    2. Web server for external access
echo.
echo 🌐 Access methods:
echo    - Desktop: Electron app window (opens automatically)
echo    - Web:     http://localhost:3002
echo    - Network: http://[YOUR_IP]:3002
echo.
echo 📱 Other devices can access via your local IP
echo 🛑 Press Ctrl+C to stop both
echo.

REM Start webpack dev server in background
echo Starting web server...
start "ETD Web Server" cmd /c "echo Starting webpack dev server... && npx webpack serve --mode development --host 0.0.0.0 --port 3002 && echo Web server stopped. && pause"

REM Wait for server to start
echo Waiting for web server to start...
timeout /t 5 /nobreak >nul

REM Start Electron desktop app
echo Starting Electron desktop app...
npx electron . --no-sandbox --disable-web-security --disable-features=VizDisplayCompositor

echo.
echo Electron app closed.
echo Web server may still be running in background.
pause
