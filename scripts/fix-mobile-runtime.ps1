$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "HACCP Control Mobile 1.0.1 - runtime repair" -ForegroundColor Cyan

if (-not (Test-Path ".\www\config.js")) {
  throw "www\config.js is missing. Keep/copy your working config.js before running this repair."
}

npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }

& ".\scripts\build-mobile-runtime.ps1"

npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed with exit code $LASTEXITCODE" }

$androidRuntime = ".\android\app\src\main\assets\public\vendor\supabase.js"
if (-not (Test-Path $androidRuntime)) {
  throw "Android bundle is missing vendor\supabase.js after sync."
}

Write-Host "Repair complete." -ForegroundColor Green
Write-Host "Next: uninstall the current HACCP Control test app from the phone, then press Run in Android Studio." -ForegroundColor Green
