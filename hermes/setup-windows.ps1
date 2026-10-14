<#
  Sets up Hermes as Prem's personal assistant on this Windows laptop:
  installs Hermes, connects it to OmniRoute (models), Telegram (chat) and PREM OS (premos MCP server),
  adds daily/weekly check-ins, and starts the gateway at login.

  Run from the repo folder in PowerShell (no admin needed):
    cd C:\Users\Ganesh\projects\a-z-web-of-me
    powershell -ExecutionPolicy Bypass -File hermes\setup-windows.ps1 `
      -OmniRouteKey "sk-..." -Model "auto"
    (add -TelegramToken / -TelegramUserId only if Telegram isn't connected yet)

  Safe to re-run: it backs up your existing Hermes config and SOUL.md first.
#>
param(
  [string] $TelegramToken,      # leave out if Telegram is already connected to Hermes
  [string] $TelegramUserId,
  [Parameter(Mandatory)] [string] $OmniRouteKey,
  [Parameter(Mandatory)] [string] $Model,
  [string] $OmniRouteUrl   = "http://localhost:20128/v1",
  [string] $ServiceAccount = "$env:USERPROFILE\.config\premos\service-account.json",
  [string] $Repo           = (Resolve-Path "$PSScriptRoot\..").Path,
  [switch] $SkipCron
)
# Continue: npm and hermes write progress to stderr, which "Stop" would treat as fatal in Windows PowerShell 5.1.
# Failures are checked explicitly below.
$ErrorActionPreference = "Continue"
function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "    ✓ $m" -ForegroundColor Green }
function Fail($m) { Write-Host "    ✗ $m" -ForegroundColor Red; exit 1 }

Step "Checking prerequisites"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "    Node.js not found, installing LTS with winget..."
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements | Out-Null
  $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
}
$node = (Get-Command node).Source
$major = [int]((& $node -v).TrimStart("v").Split(".")[0])
if ($major -lt 20) { Fail "Node $major found; PREM OS needs Node 20 or newer (winget upgrade OpenJS.NodeJS.LTS)" }
Ok "Node $(& $node -v) at $node"
if (-not (Test-Path $ServiceAccount)) {
  Fail "Firebase service-account key not found at $ServiceAccount.`n      Firebase console > Project settings > Service accounts > Generate new private key, save it there, and re-run."
}
Ok "Service-account key found"
try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 -Headers @{Authorization="Bearer $OmniRouteKey"} "$OmniRouteUrl/models" | Out-Null; Ok "OmniRoute answering at $OmniRouteUrl" }
catch { Write-Host "    ! OmniRoute didn't answer at $OmniRouteUrl. Start it (and set it to run at login) before chatting." -ForegroundColor Yellow }

Step "Installing PREM OS MCP server"
Push-Location "$Repo\premos-mcp"
npm install --no-audit --no-fund 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install failed in premos-mcp" }
npm test 2>&1 | Select-String "# (pass|fail)" | ForEach-Object { Write-Host "    $_" }
Pop-Location
Ok "premos-mcp ready"

Step "Installing Hermes"
if (-not (Get-Command hermes -ErrorAction SilentlyContinue)) {
  $inst = Join-Path $env:TEMP "hermes-install.ps1"
  Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1" -OutFile $inst
  & $inst -NonInteractive -SkipBrowser
  $env:Path += ";$env:LOCALAPPDATA\hermes\bin"
}
if (-not (Get-Command hermes -ErrorAction SilentlyContinue)) { Fail "hermes not on PATH. Open a new PowerShell window and re-run." }
Ok "Hermes $(hermes --version 2>$null)"

Step "Writing Hermes config"
$home_ = if ($env:HERMES_HOME) { $env:HERMES_HOME } else { "$env:LOCALAPPDATA\hermes" }
New-Item -ItemType Directory -Force $home_ | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
foreach ($f in "config.yaml","SOUL.md") { if (Test-Path "$home_\$f") { Copy-Item "$home_\$f" "$home_\$f.bak-$stamp"; Ok "Backed up $f" } }
$fwd = { param($p) $p -replace '\\','/' }
(Get-Content "$PSScriptRoot\config.template.yaml" -Raw) `
  -replace '\{\{MODEL\}\}', $Model `
  -replace '\{\{OMNIROUTE_URL\}\}', $OmniRouteUrl `
  -replace '\{\{OMNIROUTE_KEY\}\}', $OmniRouteKey `
  -replace '\{\{NODE\}\}', (& $fwd $node) `
  -replace '\{\{REPO\}\}', (& $fwd $Repo) `
  -replace '\{\{SERVICE_ACCOUNT\}\}', (& $fwd $ServiceAccount) |
  Set-Content -Encoding UTF8 "$home_\config.yaml"
Copy-Item "$PSScriptRoot\SOUL.md" "$home_\SOUL.md" -Force
Ok "config.yaml and SOUL.md written to $home_"

hermes config set HERMES_TIMEZONE "Asia/Kolkata" | Out-Null
if ($TelegramToken) { hermes config set TELEGRAM_BOT_TOKEN $TelegramToken | Out-Null }
if ($TelegramUserId) {
  hermes config set TELEGRAM_ALLOWED_USERS $TelegramUserId | Out-Null
  hermes config set TELEGRAM_HOME_CHANNEL $TelegramUserId | Out-Null
  Ok "Telegram locked to user $TelegramUserId"
} else {
  Ok "Kept your existing Telegram connection (check TELEGRAM_ALLOWED_USERS is set to your user ID in $home_\.env)"
}

Step "Testing the PREM OS connection"
hermes mcp test premos
if ($LASTEXITCODE -ne 0) { Fail "Hermes couldn't start the premos MCP server (see above)." }

if (-not $SkipCron) {
  Step "Adding check-ins"
  $existing = (hermes cron list 2>$null) -join "`n"
  if ($existing -notmatch "premos-evening") {
    hermes cron create "30 21 * * *" --name premos-evening --deliver telegram `
      "Evening check-in for Prem. Use premos list_records for today's transactions and health logs, then send one short Telegram message: what was logged today, today's spend total, and ask if anything is missing (fuel, food, workout, sleep). Keep it under 6 lines." | Out-Null
    Ok "Daily 9:30 pm check-in"
  }
  if ($existing -notmatch "premos-weekly") {
    hermes cron create "0 10 * * 0" --name premos-weekly --deliver telegram `
      "Weekly money note for Prem. Use premos month_summary for this month and list_records for the last 7 days. Send: spent this week, top 3 categories, what's left this month, and how many items wait in his PREM OS review queue. Under 8 lines." | Out-Null
    Ok "Sunday 10 am weekly summary"
  }
}

Step "Starting Hermes at login"
hermes gateway install | Out-Null
hermes gateway restart 2>$null; if ($LASTEXITCODE -ne 0) { hermes gateway start }
hermes gateway status

Write-Host "`nDone. Message your bot on Telegram: 'spent 120 on chai' and check https://premganeshd.web.app/premos/#review" -ForegroundColor Green
