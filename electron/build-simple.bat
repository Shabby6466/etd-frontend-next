@echo off
title ETD Simple Production Build
echo.
echo ========================================
echo ETD Simple Production Build
echo ========================================
echo.

cd /d "%~dp0"

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
echo Creating production directory...
if not exist "production" mkdir production
if not exist "production\ETD-Application" mkdir "production\ETD-Application"

echo Copying application files...
xcopy "build\*" "production\ETD-Application\" /E /I /Y
xcopy "main.js" "production\ETD-Application\" /Y
xcopy "preload.js" "production\ETD-Application\" /Y
xcopy "package.json" "production\ETD-Application\" /Y

echo Copying node_modules (essential only)...
if not exist "production\ETD-Application\node_modules" mkdir "production\ETD-Application\node_modules"

REM Copy only essential node_modules
xcopy "node_modules\electron" "production\ETD-Application\node_modules\electron\" /E /I /Y
xcopy "node_modules\@types" "production\ETD-Application\node_modules\@types\" /E /I /Y

echo Creating launcher script...
echo @echo off > "production\ETD-Application\Start-ETD.bat"
echo title ETD Application >> "production\ETD-Application\Start-ETD.bat"
echo echo Starting ETD Application... >> "production\ETD-Application\Start-ETD.bat"
echo npx electron . --no-sandbox --disable-web-security --disable-features=VizDisplayCompositor >> "production\ETD-Application\Start-ETD.bat"
echo pause >> "production\ETD-Application\Start-ETD.bat"

echo Creating README...
echo ETD Application > "production\ETD-Application\README.txt"
echo. >> "production\ETD-Application\README.txt"
echo To start the application, run: Start-ETD.bat >> "production\ETD-Application\README.txt"
echo. >> "production\ETD-Application\README.txt"
echo This is a production build with source code protection. >> "production\ETD-Application\README.txt"

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo ✅ Production build completed successfully!
echo.
echo 📁 Output location: production\ETD-Application\
echo 🚀 Launcher: production\ETD-Application\Start-ETD.bat
echo.
echo Your source code is now protected and bundled.
echo Users can run Start-ETD.bat to launch the application.
echo.
echo 📦 To distribute: Copy the entire "ETD-Application" folder
echo.
pause
