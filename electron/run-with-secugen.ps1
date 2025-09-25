# ETD Electron App with SecuGen Support
# This script runs the app with additional permissions for SecuGen device access

Write-Host "Starting ETD Electron App with SecuGen support..." -ForegroundColor Green
Write-Host ""
Write-Host "This will run the app with additional permissions for SecuGen device access." -ForegroundColor Yellow
Write-Host "If you encounter issues, try running as Administrator." -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if ($isAdmin) {
    Write-Host "Running with Administrator privileges..." -ForegroundColor Green
} else {
    Write-Host "WARNING: Not running as Administrator. SecuGen may not work properly." -ForegroundColor Red
    Write-Host "Consider right-clicking PowerShell and 'Run as Administrator' if you have issues." -ForegroundColor Yellow
    Write-Host ""
}

# Run the Electron app with SecuGen-friendly settings
Write-Host "Starting Electron with SecuGen permissions..." -ForegroundColor Cyan
electron . --no-sandbox --disable-web-security

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

