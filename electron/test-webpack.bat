@echo off
echo ========================================
echo Testing Webpack Serve
echo ========================================
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Installing dependencies first...
npm install

echo.
echo Starting webpack dev server...
echo This will run on http://localhost:3002
echo.
echo Press Ctrl+C to stop the server
echo.

npx webpack serve --mode development --host 0.0.0.0 --port 3002

echo.
echo Webpack serve command finished.
echo Exit code: %errorlevel%
echo.
echo Press any key to close this window...
pause >nul
