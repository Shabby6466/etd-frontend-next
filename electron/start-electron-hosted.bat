@echo off
title ETD Electron Desktop App - Hosted Mode
echo.
echo ========================================
echo ETD Electron Desktop App - Hosted Mode
echo ========================================
echo.

REM Change to electron directory
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
echo Starting Electron Desktop App
echo ========================================
echo.
echo 🖥️  This will start the Electron DESKTOP application
echo 🌐 The app will be accessible via web browser at:
echo    http://localhost:3002
echo    http://[YOUR_IP]:3002
echo.
echo 📱 Other devices can access it via your local IP
echo 🛑 Press Ctrl+C to stop the app
echo.

REM Start the webpack dev server first (for the web interface)
echo Starting webpack dev server...
start /b npx webpack serve --mode development --host 0.0.0.0 --port 3002

REM Wait a moment for the server to start
timeout /t 3 /nobreak >nul

REM Start the Electron desktop app
echo Starting Electron desktop app...
npx electron . --no-sandbox --disable-web-security --disable-features=VizDisplayCompositor

echo.
echo Electron app closed.
pause
