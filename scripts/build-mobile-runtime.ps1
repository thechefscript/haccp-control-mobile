$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$source = Join-Path $root "node_modules\@supabase\supabase-js\dist\umd\supabase.js"
$vendorDir = Join-Path $root "www\vendor"
$destination = Join-Path $vendorDir "supabase.js"

if (-not (Test-Path $source)) {
  throw "Local Supabase UMD runtime was not found. Run npm install first. Expected: $source"
}

New-Item -ItemType Directory -Force -Path $vendorDir | Out-Null
Copy-Item -Force $source $destination

if (-not (Test-Path $destination)) {
  throw "Failed to create www\vendor\supabase.js"
}

Write-Host "Local Supabase runtime ready: www\vendor\supabase.js" -ForegroundColor Green
