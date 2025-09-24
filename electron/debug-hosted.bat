@echo off
echo ========================================
echo ETD Electron App - Debug Hosted Server
echo ========================================
echo.

REM Change to the script's directory to ensure we're in the electron folder
cd /d "%~dp0"
echo Current directory: %CD%
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Checking Node.js version...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js.
    pause
    exit /b 1
)

echo Checking npm version...
npm --version
if errorlevel 1 (
    echo ERROR: npm not found.
    pause
    exit /b 1
)

echo.
echo Checking if webpack is available...
npx webpack --version
if errorlevel 1 (
    echo WARNING: webpack not found, will install...
)

echo.
echo Installing dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Testing webpack serve command...
echo Running: npx webpack serve --mode development --host 0.0.0.0 --port 3002
echo.

npx webpack serve --mode development --host 0.0.0.0 --port 3002

echo.
echo Command completed with exit code: %errorlevel%
pause
