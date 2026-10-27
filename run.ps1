# FairShift PowerShell Launcher
$ErrorActionPreference = "Stop"
$toolsPath = Join-Path $PSScriptRoot ".tools\node-v20.18.0-win-x64"

if (Test-Path $toolsPath) {
    $env:PATH = "$toolsPath;$env:PATH"
    Write-Host "✅ Configured Portable Node.js: $(node -v) | npm: $(npm -v)" -ForegroundColor Green
} else {
    Write-Warning "Could not find portable Node in .tools directory. Using system PATH."
}

Write-Host "🚀 Launching FairShift on http://localhost:8080..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server.`n" -ForegroundColor Yellow

node server/server.js
