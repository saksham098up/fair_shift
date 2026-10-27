# FairShift Vercel Deployment Script
$ErrorActionPreference = "Stop"
$toolsPath = Join-Path $PSScriptRoot ".tools\node-v20.18.0-win-x64"

if (Test-Path $toolsPath) {
    $env:PATH = "$toolsPath;$env:PATH"
}

Write-Host "▲ Deploying FairShift to Vercel..." -ForegroundColor Cyan
Write-Host "1. Logging into Vercel..." -ForegroundColor Yellow
npx vercel login

Write-Host "2. Deploying project to production..." -ForegroundColor Green
npx vercel --prod
