@echo off
echo ========================================
echo ETD Electron Desktop App
echo ========================================
echo.

cd /d "%~dp0"

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting ETD Electron Desktop App...
echo.
echo This will:
echo 1. Start a web server on port 3002
echo 2. Open the Electron desktop app
echo 3. Allow web access from other devices
echo.

REM Use the npm script that's already configured
npm run dev

echo.
echo App closed.
pause
