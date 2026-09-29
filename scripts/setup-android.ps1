$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Run-Step([string]$Label, [scriptblock]$Command) {
  Write-Host $Label -ForegroundColor Cyan
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE" }
}

Write-Host "HACCP Control Mobile - Android setup" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js was not found. Install Node.js 22 LTS or newer, then reopen PowerShell."
}

$nodeMajor = [int]((node -v).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 22) {
  throw "Capacitor 8 requires Node.js 22+. Current: $(node -v)"
}

if (-not (Test-Path ".\www\config.js")) {
  throw "www\config.js is missing. First run scripts\use-existing-config.ps1 with your current web config.js path."
}

Run-Step "Installing dependencies..." { npm install }

Write-Host "Building local Supabase runtime..." -ForegroundColor Cyan
& ".\scripts\build-mobile-runtime.ps1"

if (-not (Test-Path ".\android")) {
  Run-Step "Creating Android native project..." { npx cap add android }
} else {
  Write-Host "Android project already exists; keeping it." -ForegroundColor DarkGray
}

Run-Step "Syncing web source into Android..." { npx cap sync android }
Run-Step "Running Capacitor doctor..." { npx cap doctor }

Write-Host "Ready. Run: npm run android:open" -ForegroundColor Green
