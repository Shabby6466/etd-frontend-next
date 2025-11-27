@echo off
echo ========================================
echo Simple Test - This should stay open
echo ========================================
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Testing basic commands...
echo.

echo 1. Checking if we're in the right directory:
if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json NOT found
    echo Current directory: %CD%
)

echo.
echo 2. Checking Node.js:
node --version
if errorlevel 1 (
    echo ❌ Node.js not found
) else (
    echo ✅ Node.js found
)

echo.
echo 3. Checking npm:
npm --version
if errorlevel 1 (
    echo ❌ npm not found
) else (
    echo ✅ npm found
)

echo.
echo 4. Testing webpack command:
echo Running: npx webpack --version
npx webpack --version

echo.
echo 5. If you see this message, the batch file is working!
echo The window will stay open for 10 seconds...
timeout /t 10

echo.
echo Test completed. Press any key to close...
pause >nul
