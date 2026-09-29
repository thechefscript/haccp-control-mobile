param(
  [Parameter(Mandatory=$true)]
  [string]$ConfigPath,
  [string]$PublicAppUrl = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root "www\config.js"

if (-not (Test-Path $ConfigPath)) {
  throw "config.js not found: $ConfigPath"
}

Copy-Item -Force $ConfigPath $target
Write-Host "Copied your existing config.js to $target" -ForegroundColor Green

if ($PublicAppUrl) {
  $text = Get-Content -Raw $target
  if ($text -match 'PUBLIC_APP_URL\s*:') {
    $escaped = $PublicAppUrl.Replace('"','\"')
    $text = [regex]::Replace($text, 'PUBLIC_APP_URL\s*:\s*["''][^"'']*["'']', "PUBLIC_APP_URL: `"$escaped`"")
  } else {
    $insert = "  PUBLIC_APP_URL: `"$PublicAppUrl`",`r`n"
    $text = $text -replace '(window\.HACCP_CONFIG\s*=\s*\{\s*)', "`$1`r`n$insert"
  }
  Set-Content -NoNewline -Encoding UTF8 $target $text
  Write-Host "Set PUBLIC_APP_URL to $PublicAppUrl" -ForegroundColor Green
}

Write-Host "Important: confirm the file contains ONLY a publishable/anon browser key, never service_role/secret credentials." -ForegroundColor Yellow
