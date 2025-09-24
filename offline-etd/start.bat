@echo off
echo Starting Offline ETD Application...
echo.
echo Opening demo page...
start demo.html
echo.
echo Starting local server on port 8080...
echo You can access the application at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
python -m http.server 8080
