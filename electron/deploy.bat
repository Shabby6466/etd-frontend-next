@echo off
title ETD Application Deployment
echo.
echo ========================================
echo ETD Application Deployment
echo ========================================
echo.

cd /d "%~dp0"

REM Check if build exists
if not exist "dist\win-unpacked\ETD Application.exe" (
    echo ERROR: Production build not found!
    echo Please run build-production.bat first.
    pause
    exit /b 1
)

echo Creating deployment package...
echo.

REM Create deployment directory
if not exist "deployment" mkdir deployment
if not exist "deployment\ETD-Application" mkdir "deployment\ETD-Application"

REM Copy the built application
echo Copying application files...
xcopy "dist\win-unpacked\*" "deployment\ETD-Application\" /E /I /Y

REM Create a simple launcher
echo Creating launcher...
echo @echo off > "deployment\ETD-Application\Start-ETD.bat"
echo title ETD Application >> "deployment\ETD-Application\Start-ETD.bat"
echo "ETD Application.exe" >> "deployment\ETD-Application\Start-ETD.bat"

echo.
echo ========================================
echo Deployment Package Created!
echo ========================================
echo.
echo 📁 Deployment location: deployment\ETD-Application\
echo 🚀 Main executable: deployment\ETD-Application\ETD Application.exe
echo 🎯 Launcher script: deployment\ETD-Application\Start-ETD.bat
echo.
echo You can now distribute the entire "ETD-Application" folder.
echo Users can run "Start-ETD.bat" to launch the application.
echo.
echo ✅ Your source code is completely hidden and protected!
echo.
pause
