#!/bin/bash
# ETD Python Desktop Application Launcher
# This script runs the Python ETD application with proper environment setup

echo "Starting ETD Desktop Application..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if requirements are installed
echo "Checking dependencies..."
python3 -c "import requests, tkinter" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Set environment variables
export ETD_ENV=development
export PYTHONPATH=$(pwd)

# Run the application
echo "Starting application..."
python3 main.py

# Check exit status
if [ $? -ne 0 ]; then
    echo
    echo "Application exited with error"
    read -p "Press Enter to continue..."
fi
