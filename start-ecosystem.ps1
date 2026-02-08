#!/usr/bin/env pwsh
<#
.SYNOPSIS
    SandIronRatio Ecosystem Single-Window Launcher
#>

param(
    [switch]$SkipOllamaCheck
)

# Configuration
$BaseDir = "C:\Users\squat\repos\sandironratio-node"
$SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$GitHubToken = $env:GITHUB_TOKEN

if (-not $GitHubToken) {
    $GitHubToken = Read-Host "Enter GitHub Token (or set GITHUB_TOKEN env var)"
}

# Header
Clear-Host
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║           🌸 SANDIRONRATIO ECOSYSTEM LAUNCHER 🌸                    ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Helper function to check service health
function Test-Port {
    param($Port)
    try {
        $conn = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $conn.TcpTestSucceeded
    } catch { return $false }
}

# Start Ollama
Write-Host "🔧 Checking Ollama..." -ForegroundColor Cyan -NoNewline
if ((Test-Port -Port 11434) -or $SkipOllamaCheck) {
    Write-Host " ✅ Running" -ForegroundColor Green
} else {
    Write-Host " 🚀 Starting..." -ForegroundColor Yellow
    Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "    ✅ Started" -ForegroundColor Green
}

# Start Hive (Port 3000)
Write-Host "🏛️  Starting Hive..." -ForegroundColor Cyan -NoNewline
Set-Location $BaseDir
$hiveJob = Start-Job -ScriptBlock {
    Set-Location $using:BaseDir
    npm run dev 2>&1 | ForEach-Object { "[$(Get-Date -Format 'HH:mm:ss')] [HIVE] $_" }
} -Name "Hive"

$attempts = 0
while ($attempts -lt 30 -and -not (Test-Port -Port 3000)) {
    Start-Sleep -Milliseconds 500
    $attempts++
}
if (Test-Port -Port 3000) {
    Write-Host " ✅ Port 3000" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Timeout" -ForegroundColor Yellow
}

# Start Sofie (Port 8000)
Write-Host "🌸 Starting Sofie..." -ForegroundColor Cyan -NoNewline
Set-Location $SofieDir
$sofieJob = Start-Job -ScriptBlock {
    Set-Location $using:SofieDir
    $env:USE_OLLAMA = "true"
    $env:OLLAMA_MODEL = "llama3.1:8b"
    $env:HIVE_API_URL = "http://localhost:3000"
    $env:GITHUB_TOKEN = $using:GitHubToken
    
    python src/main.py --mode=chief 2>&1 | ForEach-Object { "[$(Get-Date -Format 'HH:mm:ss')] [SOFIE] $_" }
} -Name "Sofie"

$attempts = 0
while ($attempts -lt 60 -and -not (Test-Port -Port 8000)) {
    Start-Sleep -Milliseconds 500
    $attempts++
}
if (Test-Port -Port 8000) {
    Write-Host " ✅ Port 8000" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Timeout" -ForegroundColor Yellow
}

# Start Council (Port 9000)
Write-Host "⚖️  Starting Council..." -ForegroundColor Cyan -NoNewline
Set-Location $BaseDir
$councilJob = Start-Job -ScriptBlock {
    Set-Location $using:BaseDir
    $env:HIVE_API_URL = "http://localhost:3000"
    $env:GITHUB_TOKEN = $using:GitHubToken
    
    python -m src.council.api_server 2>&1 | ForEach-Object { "[$(Get-Date -Format 'HH:mm:ss')] [COUNCIL] $_" }
} -Name "Council"

$attempts = 0
while ($attempts -lt 30 -and -not (Test-Port -Port 9000)) {
    Start-Sleep -Milliseconds 500
    $attempts++
}
if (Test-Port -Port 9000) {
    Write-Host " ✅ Port 9000" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Timeout" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                    ALL SERVICES STARTED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Show status function
function Show-Status {
    Write-Host "Service Status:" -ForegroundColor Cyan
    Write-Host "  Ollama:  $(if (Test-Port 11434) {'🟢 ONLINE'} else {'🔴 OFF'})" -ForegroundColor $(if (Test-Port 11434) {'Green'} else {'Red'})
    Write-Host "  Hive:    $(if (Test-Port 3000) {'🟢 ONLINE'} else {'🔴 OFF'}) :3000" -ForegroundColor $(if (Test-Port 3000) {'Green'} else {'Red'})
    Write-Host "  Sofie:   $(if (Test-Port 8000) {'🟢 ONLINE'} else {'🔴 OFF'}) :8000" -ForegroundColor $(if (Test-Port 8000) {'Green'} else {'Red'})
    Write-Host "  Council: $(if (Test-Port 9000) {'🟢 ONLINE'} else {'🔴 OFF'}) :9000" -ForegroundColor $(if (Test-Port 9000) {'Green'} else {'Red'})
}

# Show logs function
function Show-Logs {
    param($Service = "all", $Lines = 10)
    if ($Service -eq "all" -or $Service -eq "hive") {
        Write-Host "`n--- HIVE ---" -ForegroundColor Yellow
        Receive-Job -Name "Hive" -Keep | Select-Object -Last $Lines
    }
    if ($Service -eq "all" -or $Service -eq "sofie") {
        Write-Host "`n--- SOFIE ---" -ForegroundColor Yellow
        Receive-Job -Name "Sofie" -Keep | Select-Object -Last $Lines
    }
    if ($Service -eq "all" -or $Service -eq "council") {
        Write-Host "`n--- COUNCIL ---" -ForegroundColor Yellow
        Receive-Job -Name "Council" -Keep | Select-Object -Last $Lines
    }
}

# Convene function
function Invoke-Convene {
    Write-Host "`nConvening Council..." -ForegroundColor Cyan
    try {
        $body = @{command="convene_autonomous";directive="Report state and expand autonomously"} | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:8000/v1/council/convene" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        Write-Host "✅ Council convened. Check logs council for progress." -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed: $_" -ForegroundColor Red
    }
}

# Stop function
function Stop-All {
    Write-Host "`n🛑 Stopping services..." -ForegroundColor Red
    Stop-Job -Name "Hive","Sofie","Council" -ErrorAction SilentlyContinue
    Remove-Job -Name "Hive","Sofie","Council" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Stopped. Goodbye." -ForegroundColor Green
    exit
}

# Main loop
Show-Status

while ($true) {
    Write-Host ""
    $cmd = Read-Host "Command (status/logs/convene/stop)"
    
    if ($cmd -eq "status") { Show-Status }
    elseif ($cmd -eq "logs") { Show-Logs -Lines 20 }
    elseif ($cmd -eq "logs hive") { Show-Logs -Service "hive" -Lines 30 }
    elseif ($cmd -eq "logs sofie") { Show-Logs -Service "sofie" -Lines 30 }
    elseif ($cmd -eq "logs council") { Show-Logs -Service "council" -Lines 30 }
    elseif ($cmd -eq "convene") { Invoke-Convene }
    elseif ($cmd -eq "stop") { Stop-All }
    elseif ($cmd -eq "quit") { Stop-All }
    elseif ($cmd -eq "exit") { Stop-All }
    else { Write-Host "Unknown. Use: status, logs, logs [service], convene, stop" -ForegroundColor Yellow }
}