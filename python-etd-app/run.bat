@echo off
REM ETD Python Desktop Application Launcher
REM This script runs the Python ETD application with proper environment setup

echo Starting ETD Desktop Application...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if requirements are installed
echo Checking dependencies...
python -c "import requests, tkinter" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Set environment variables
set ETD_ENV=development
set PYTHONPATH=%CD%

REM Run the application
echo Starting application...
python main.py

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo Application exited with error
    pause
)
