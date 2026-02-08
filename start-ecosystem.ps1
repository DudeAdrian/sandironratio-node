#!/usr/bin/env pwsh
#requires -Version 5.1
<#
.SYNOPSIS
    SandIronRatio Ecosystem Single-Window Launcher
.DESCRIPTION
    Starts all 4 core services (Ollama, Hive, Sofie, Council) in background jobs
    Provides interactive dashboard for monitoring and control
.NOTES
    File Name      : start-ecosystem.ps1
    Author         : The Dude
    Prerequisite   : PowerShell 5.1 or later
#>

[CmdletBinding()]
param(
    [switch]$SkipOllamaCheck,
    [switch]$VerboseOutput,
    [string]$GitHubToken = $env:GITHUB_TOKEN
)

# Configuration
$Config = @{
    BaseDir = "C:\Users\squat\repos\sandironratio-node"
    SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
    Ports = @{
        Ollama = 11434
        Hive = 3000
        Sofie = 8000
        Council = 9000
    }
    Colors = @{
        Success = "Green"
        Warning = "Yellow"
        Error = "Red"
        Info = "Cyan"
        Header = "Magenta"
    }
}

# Verify directories exist
if (-not (Test-Path $Config.BaseDir)) {
    Write-Host "❌ Base directory not found: $($Config.BaseDir)" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $Config.SofieDir)) {
    Write-Host "❌ Sofie directory not found: $($Config.SofieDir)" -ForegroundColor Red
    exit 1
}

# Header
function Show-Header {
    Clear-Host
    Write-Host @"
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║           🌸 SANDIRONRATIO ECOSYSTEM LAUNCHER 🌸                    ║
║                                                                      ║
║              The Dude ↔ Council ↔ Sofie ↔ Hive                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor $Config.Colors.Header
    Write-Host ""
}

# Service Management Functions
function Test-Service {
    param($Port, $Name)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Test-Council {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($Config.Ports.Council)/council/status" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-Ollama {
    if ($SkipOllamaCheck) { return $true }
    
    Write-Host "🔧 Checking Ollama..." -ForegroundColor $Config.Colors.Info -NoNewline
    if (Test-Service -Port $Config.Ports.Ollama -Name "Ollama") {
        Write-Host " ✅ Already running" -ForegroundColor $Config.Colors.Success
        return $true
    }
    
    Write-Host " 🚀 Starting..." -ForegroundColor $Config.Colors.Warning
    try {
        $global:OllamaProcess = Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden -PassThru
        Start-Sleep -Seconds 3
        
        # Verify it started
        $attempts = 0
        while ($attempts -lt 10) {
            if (Test-Service -Port $Config.Ports.Ollama -Name "Ollama") {
                Write-Host "    ✅ Ollama operational" -ForegroundColor $Config.Colors.Success
                return $true
            }
            Start-Sleep -Seconds 1
            $attempts++
        }
        throw "Ollama failed to start"
    } catch {
        Write-Host "    ❌ Failed to start Ollama: $_" -ForegroundColor $Config.Colors.Error
        return $false
    }
}

function Start-Hive {
    Write-Host "🏛️  Starting Hive Ledger..." -ForegroundColor $Config.Colors.Info -NoNewline
    
    # Check if Hive is already running
    if (Test-Service -Port $Config.Ports.Hive -Name "Hive") {
        Write-Host " ✅ Already running on port $($Config.Ports.Hive)" -ForegroundColor $Config.Colors.Success
        return $true
    }
    
    $job = Start-Job -Name "Hive" -ScriptBlock {
        param($baseDir)
        Set-Location $baseDir
        $env:NODE_ENV = "development"
        npm run dev 2>&1 | ForEach-Object {
            "[$(Get-Date -Format 'HH:mm:ss')] [HIVE] $_"
        }
    } -ArgumentList $Config.BaseDir
    
    # Wait for Hive to be ready
    $attempts = 0
    while ($attempts -lt 30) {
        if (Test-Service -Port $Config.Ports.Hive -Name "Hive") {
            Write-Host " ✅ Port 3000 active" -ForegroundColor $Config.Colors.Success
            return $true
        }
        Start-Sleep -Milliseconds 500
        $attempts++
    }
    
    Write-Host " ❌ Timeout" -ForegroundColor $Config.Colors.Error
    return $false
}

function Start-Sofie {
    Write-Host "🌸 Starting Sofie..." -ForegroundColor $Config.Colors.Info -NoNewline
    
    # Check if Sofie is already running
    if (Test-Service -Port $Config.Ports.Sofie -Name "Sofie") {
        Write-Host " ✅ Already running on port $($Config.Ports.Sofie)" -ForegroundColor $Config.Colors.Success
        return $true
    }
    
    $job = Start-Job -Name "Sofie" -ScriptBlock {
        param($dir, $token)
        Set-Location $dir
        $env:USE_OLLAMA = "true"
        $env:OLLAMA_MODEL = "llama3.1:8b"
        $env:HIVE_API_URL = "http://localhost:3000"
        if ($token) { $env:GITHUB_TOKEN = $token }
        
        python src/main.py --mode=chief 2>&1 | ForEach-Object {
            "[$(Get-Date -Format 'HH:mm:ss')] [SOFIE] $_"
        }
    } -ArgumentList $Config.SofieDir, $GitHubToken
    
    # Wait for Sofie
    $attempts = 0
    while ($attempts -lt 60) {
        if (Test-Service -Port $Config.Ports.Sofie -Name "Sofie") {
            Write-Host " ✅ Port 8000 active" -ForegroundColor $Config.Colors.Success
            return $true
        }
        Start-Sleep -Milliseconds 500
        $attempts++
    }
    
    Write-Host " ❌ Timeout" -ForegroundColor $Config.Colors.Error
    return $false
}

function Start-Council {
    Write-Host "⚖️  Starting Council..." -ForegroundColor $Config.Colors.Info -NoNewline
    
    # Check if Council is already running
    if (Test-Council) {
        Write-Host " ✅ Already running on port $($Config.Ports.Council)" -ForegroundColor $Config.Colors.Success
        return $true
    }
    
    $job = Start-Job -Name "Council" -ScriptBlock {
        param($dir, $token)
        Set-Location $dir
        $env:HIVE_API_URL = "http://localhost:3000"
        if ($token) { $env:GITHUB_TOKEN = $token }
        
        python -m src.council.api_server 2>&1 | ForEach-Object {
            "[$(Get-Date -Format 'HH:mm:ss')] [COUNCIL] $_"
        }
    } -ArgumentList $Config.BaseDir, $GitHubToken
    
    # Wait for Council
    $attempts = 0
    while ($attempts -lt 30) {
        if (Test-Council) {
            Write-Host " ✅ Port 9000 active" -ForegroundColor $Config.Colors.Success
            return $true
        }
        Start-Sleep -Milliseconds 500
        $attempts++
    }
    
    Write-Host " ❌ Timeout" -ForegroundColor $Config.Colors.Error
    return $false
}

function Show-Dashboard {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Header
    Write-Host "                         SERVICE STATUS                                 " -ForegroundColor $Config.Colors.Header
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Header
    
    $services = @(
        @{Name = "Ollama"; Port = $Config.Ports.Ollama; URL = "http://localhost:$($Config.Ports.Ollama)"; Checker = { Test-Service -Port $Config.Ports.Ollama -Name "Ollama" }},
        @{Name = "Hive"; Port = $Config.Ports.Hive; URL = "http://localhost:$($Config.Ports.Hive)/health"; Checker = { Test-Service -Port $Config.Ports.Hive -Name "Hive" }},
        @{Name = "Sofie"; Port = $Config.Ports.Sofie; URL = "http://localhost:$($Config.Ports.Sofie)/health"; Checker = { Test-Service -Port $Config.Ports.Sofie -Name "Sofie" }},
        @{Name = "Council"; Port = $Config.Ports.Council; URL = "http://localhost:$($Config.Ports.Council)/council/status"; Checker = { Test-Council }}
    )
    
    foreach ($svc in $services) {
        $isOnline = & $svc.Checker
        $status = if ($isOnline) { "🟢 ONLINE" } else { "🔴 OFFLINE" }
        $color = if ($isOnline) { $Config.Colors.Success } else { $Config.Colors.Error }
        Write-Host ("{0,-10} {1,-15} {2}" -f $svc.Name, $status, $svc.URL) -ForegroundColor $color
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Header
    Write-Host ""
}

function Show-Logs {
    param($Service = "all", $Lines = 20)
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
    Write-Host "                         RECENT LOGS ($Service)                          " -ForegroundColor $Config.Colors.Info
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
    
    $jobs = if ($Service -eq "all") { 
        Get-Job -Name "Hive", "Sofie", "Council" -ErrorAction SilentlyContinue 
    } else { 
        Get-Job -Name $Service -ErrorAction SilentlyContinue 
    }
    
    if (-not $jobs) {
        Write-Host "No logs available. Services may not be running." -ForegroundColor $Config.Colors.Warning
        return
    }
    
    foreach ($job in $jobs) {
        Write-Host ""
        Write-Host "--- $($job.Name) ---" -ForegroundColor $Config.Colors.Warning
        $logs = Receive-Job -Job $job -Keep -ErrorAction SilentlyContinue
        if ($logs) {
            $logs | Select-Object -Last $Lines | ForEach-Object { Write-Host $_ }
        } else {
            Write-Host "(No new log entries)" -ForegroundColor Gray
        }
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
}

function Invoke-Convene {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
    Write-Host "                         CONVENING COUNCIL                              " -ForegroundColor $Config.Colors.Info
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
    
    # Check if services are running
    if (-not (Test-Service -Port $Config.Ports.Sofie -Name "Sofie")) {
        Write-Host "❌ Sofie is not running on port $($Config.Ports.Sofie)" -ForegroundColor $Config.Colors.Error
        return
    }
    if (-not (Test-Council)) {
        Write-Host "❌ Council is not running on port $($Config.Ports.Council)" -ForegroundColor $Config.Colors.Error
        return
    }
    
    try {
        $body = @{
            command = "convene_autonomous"
            directive = "Report state of all builds then expand autonomously"
            scope = "full_ecosystem"
            authority_level = "full_deployment"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:$($Config.Ports.Sofie)/v1/council/convene" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        
        Write-Host "✅ Council convened successfully" -ForegroundColor $Config.Colors.Success
        Write-Host ""
        Write-Host "Response:" -ForegroundColor $Config.Colors.Info
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3 | Write-Host
        
        Write-Host ""
        Write-Host "The 6 agents are now:" -ForegroundColor $Config.Colors.Warning
        Write-Host "  • Investigating all repos" -ForegroundColor White
        Write-Host "  • Self-organizing tasks" -ForegroundColor White
        Write-Host "  • Beginning autonomous build" -ForegroundColor White
        Write-Host ""
        Write-Host "Use 'logs council' to watch progress" -ForegroundColor Gray
        
    } catch {
        Write-Host "❌ Failed to convene: $_" -ForegroundColor $Config.Colors.Error
        Write-Host "Ensure Sofie (Port 8000) and Council (Port 9000) are running." -ForegroundColor $Config.Colors.Warning
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
}

function Invoke-CouncilDirect {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
    Write-Host "                    DIRECT COUNCIL CONVENE                              " -ForegroundColor $Config.Colors.Info
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
    
    # Check if Council is running
    if (-not (Test-Council)) {
        Write-Host "❌ Council is not running on port $($Config.Ports.Council)" -ForegroundColor $Config.Colors.Error
        return
    }
    
    try {
        $body = @{
            command = "convene"
            timestamp = (Get-Date -Format "o")
            chief_architect_present = $true
            ecosystem_state = @{
                sofie_status = "awakened"
                hive_connected = (Test-Service -Port $Config.Ports.Hive -Name "Hive")
            }
            sofie_requirements = @("Build CalmInterface bridge", "Expand ecosystem autonomously")
            critical_path = @("API Gateway", "WebSocket Bridge", "Health Monitoring")
            protected_notice = "Sovereign territory protected - sofie-llama-backend"
        } | ConvertTo-Json -Depth 5
        
        $response = Invoke-WebRequest -Uri "http://localhost:$($Config.Ports.Council)/council/convene" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        
        Write-Host "✅ Council convened successfully" -ForegroundColor $Config.Colors.Success
        Write-Host ""
        Write-Host "Response:" -ForegroundColor $Config.Colors.Info
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3 | Write-Host
        
    } catch {
        Write-Host "❌ Failed to convene: $_" -ForegroundColor $Config.Colors.Error
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Info
}

function Stop-Ecosystem {
    Write-Host ""
    Write-Host "🛑 Stopping all services started by this script..." -ForegroundColor $Config.Colors.Error
    
    # Stop background jobs
    $jobs = Get-Job -Name "Hive", "Sofie", "Council" -ErrorAction SilentlyContinue
    if ($jobs) {
        $jobs | Stop-Job -ErrorAction SilentlyContinue
        $jobs | Remove-Job -Force -ErrorAction SilentlyContinue
        Write-Host "  Background jobs stopped" -ForegroundColor $Config.Colors.Success
    } else {
        Write-Host "  No background jobs to stop" -ForegroundColor Gray
    }
    
    # Stop Ollama if we started it
    if ($global:OllamaProcess -and -not $global:OllamaProcess.HasExited) {
        $global:OllamaProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "  Ollama stopped" -ForegroundColor $Config.Colors.Success
    }
    
    Write-Host ""
    Write-Host "All services stopped. Goodbye, Dude." -ForegroundColor $Config.Colors.Success
    exit 0
}

function Show-Help {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Header
    Write-Host "                         AVAILABLE COMMANDS                             " -ForegroundColor $Config.Colors.Header
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Header
    Write-Host ""
    Write-Host "  status         - Show dashboard with all service health" -ForegroundColor White
    Write-Host "  logs [svc] [n] - Show recent logs (svc: all/hive/sofie/council, n: lines)" -ForegroundColor White
    Write-Host "  convene        - Command Sofie to convene the Council (via Sofie API)" -ForegroundColor White
    Write-Host "  convene-direct - Convene Council directly (bypass Sofie)" -ForegroundColor White
    Write-Host "  stop           - Stop all services and exit" -ForegroundColor White
    Write-Host "  help           - Show this help message" -ForegroundColor White
    Write-Host "  clear          - Clear screen" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Gray
    Write-Host "  logs sofie 50   - Show last 50 lines from Sofie" -ForegroundColor Gray
    Write-Host "  logs council    - Show all Council logs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor $Config.Colors.Header
}

# Main Execution
Show-Header

# Startup Sequence
$success = $true

if (-not (Start-Ollama)) { $success = $false }
if (-not (Start-Hive)) { $success = $false }
if (-not (Start-Sofie)) { $success = $false }
if (-not (Start-Council)) { $success = $false }

if (-not $success) {
    Write-Host ""
    Write-Host "⚠️  Some services failed to start. Check logs for details." -ForegroundColor $Config.Colors.Warning
}

Show-Dashboard

# Interactive Loop
while ($true) {
    Write-Host ""
    $input = Read-Host "Command (status/logs/convene/help/stop)"
    $parts = $input -split '\s+'
    $cmd = $parts[0].ToLower()
    $arg1 = if ($parts.Count -gt 1) { $parts[1] } else { "all" }
    $arg2 = if ($parts.Count -gt 2) { [int]$parts[2] } else { 20 }
    
    switch ($cmd) {
        "status" { Show-Dashboard }
        "logs" { Show-Logs -Service $arg1 -Lines $arg2 }
        "convene" { Invoke-Convene }
        "convene-direct" { Invoke-CouncilDirect }
        "stop" { Stop-Ecosystem }
        "help" { Show-Help }
        "clear" { Show-Header; Show-Dashboard }
        "quit" { Stop-Ecosystem }
        "exit" { Stop-Ecosystem }
        default { 
            Write-Host "Unknown command: $cmd" -ForegroundColor $Config.Colors.Error
            Write-Host "Type 'help' for available commands" -ForegroundColor $Config.Colors.Warning
        }
    }
}
