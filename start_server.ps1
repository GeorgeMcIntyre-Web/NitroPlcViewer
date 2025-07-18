# PowerShell script to start the NitroPlcViewer server
# This avoids the bash-style && syntax that doesn't work in PowerShell

Write-Host "Starting NitroPlcViewer server..." -ForegroundColor Green

# Change to the project directory
Set-Location -Path $PSScriptRoot

# Start the Python server
try {
    python server.py
}
catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Write-Host "Make sure Python is installed and server.py exists in the current directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
} 