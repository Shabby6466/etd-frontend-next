@echo off
title ETD Production Build
echo.
echo ========================================
echo ETD Production Build Process
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

echo Installing/updating dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Building Production Bundle
echo ========================================
echo.

REM Set production environment
set NODE_ENV=production

echo Building webpack bundle for production...
call npm run build:web
if errorlevel 1 (
    echo ERROR: Failed to build webpack bundle
    pause
    exit /b 1
)

echo.
echo ========================================
echo Building Electron Executable
echo ========================================
echo.

echo Building Electron executable...
call npm run build:win
if errorlevel 1 (
    echo ERROR: Failed to build Electron executable
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo ✅ Production build completed successfully!
echo.
echo 📁 Output location: dist\win-unpacked\
echo 🚀 Executable: dist\win-unpacked\ETD Application.exe
echo 📦 Portable: dist\ETD Application.exe
echo.
echo Your source code is now protected and bundled into the executable.
echo Users cannot access your source code from the built application.
echo.
pause
