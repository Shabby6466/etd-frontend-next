#!/bin/bash

echo "Starting Offline ETD Application..."
echo ""
echo "Opening demo page..."
if command -v open &> /dev/null; then
    open demo.html
elif command -v xdg-open &> /dev/null; then
    xdg-open demo.html
else
    echo "Please open demo.html in your browser"
fi
echo ""
echo "Starting local server on port 8080..."
echo "You can access the application at: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"

if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080
else
    echo "Python not found. Please install Python to run the local server."
    echo "Alternatively, you can open index.html directly in your browser."
fi
