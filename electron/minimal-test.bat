@echo off
title ETD Web Server Test
echo.
echo ========================================
echo ETD Minimal Web Server Test
echo ========================================
echo.

REM Change to electron directory
cd /d "%~dp0"
echo Working directory: %CD%
echo.

REM Check if we have the required files
echo Checking required files...
if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json missing
    echo Please run this from the electron directory
    pause
    exit /b 1
)

if exist "src\index.tsx" (
    echo ✅ src\index.tsx found
) else (
    echo ❌ src\index.tsx missing
    pause
    exit /b 1
)

if exist "public\index.html" (
    echo ✅ public\index.html found
) else (
    echo ❌ public\index.html missing
    pause
    exit /b 1
)

echo.
echo All required files found!
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo ========================================
echo Starting Web Server...
echo ========================================
echo.
echo 🌐 Server will be available at:
echo    http://localhost:3002
echo    http://[YOUR_IP]:3002
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start webpack dev server
npx webpack serve --mode development --host 0.0.0.0 --port 3002

echo.
echo ========================================
echo Server stopped
echo ========================================
echo.
echo Press any key to close...
pause >nul
