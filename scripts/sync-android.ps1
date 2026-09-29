$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not (Test-Path ".\www\config.js")) { throw "www\config.js is missing." }
& ".\scripts\build-mobile-runtime.ps1"
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed with exit code $LASTEXITCODE" }
Write-Host "Android project synced with the latest www source and local Supabase runtime." -ForegroundColor Green
