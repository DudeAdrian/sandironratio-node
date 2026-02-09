# ═══════════════════════════════════════════════════════════════════════════════
# start-sovereign-lab.ps1
# ═══════════════════════════════════════════════════════════════════════════════
# SOVEREIGN LABORATORY ORCHESTRATOR
# 
# Starts the complete SandIronRatio ecosystem:
# 1. Council (Python FastAPI) - Port 9000 - Code generation agents
# 2. Sofie-LLaMA Backend (Python FastAPI) - Port 8000 - AI intelligence
# 3. SandIronRatio Node (TypeScript/Node) - Port 3000 - Validator & Academy
# 
# Prerequisites:
# - Python 3.10+ with virtual environments
# - Node.js 20+
# - Ollama running (optional, for local LLM)
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipCouncil = $false,
    [switch]$SkipSofieLlama = $false,
    [switch]$SkipSandIron = $false,
    [switch]$LogsVisible = $false
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                               ║" -ForegroundColor Cyan
Write-Host "║              SANDIRONRATIO SOVEREIGN LABORATORY                               ║" -ForegroundColor Cyan
Write-Host "║              The Anagram Awakens                                              ║" -ForegroundColor Cyan
Write-Host "║                                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get repo root
$REPO_ROOT = $PSScriptRoot

# Log directory
$LOG_DIR = Join-Path $REPO_ROOT "logs"
if (-not (Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR | Out-Null
}

# Timestamp for logs
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Process tracking
$processes = @()

# ═══════════════════════════════════════════════════════════════════════════════
# 1. START COUNCIL (Port 9000)
# ═══════════════════════════════════════════════════════════════════════════════
if (-not $SkipCouncil) {
    Write-Host "🏛️  [COUNCIL] Starting 6-Agent Build Council..." -ForegroundColor Yellow
    Write-Host "   Port: 9000" -ForegroundColor Gray
    Write-Host "   Agents: Veda, Aura, Hex, Node, Spark, Tess" -ForegroundColor Gray
    Write-Host ""
    
    $councilPath = Join-Path $REPO_ROOT "src\council"
    $councilLog = Join-Path $LOG_DIR "council_$TIMESTAMP.log"
    
    # Check if Python venv exists
    $venvPath = Join-Path $councilPath "venv"
    if (-not (Test-Path $venvPath)) {
        Write-Host "   Creating Python virtual environment..." -ForegroundColor Gray
        python -m venv $venvPath
        
        Write-Host "   Installing dependencies..." -ForegroundColor Gray
        & "$venvPath\Scripts\activate.ps1"
        pip install fastapi uvicorn pydantic python-dotenv
        deactivate
    }
    
    # Start council API server
    $councilCmd = @"
Set-Location '$councilPath'
& '.\venv\Scripts\activate.ps1'
python -m uvicorn api_server:app --host 0.0.0.0 --port 9000 --reload
"@
    
    if ($LogsVisible) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $councilCmd
    } else {
        $councilProcess = Start-Process powershell -ArgumentList "-Command", $councilCmd -WindowStyle Hidden -PassThru
        $processes += $councilProcess
        "Council PID: $($councilProcess.Id)" | Out-File -FilePath $councilLog
    }
    
    Write-Host "   ✅ Council starting..." -ForegroundColor Green
    Write-Host "   Log: $councilLog" -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds 5
}

# ═══════════════════════════════════════════════════════════════════════════════
# 2. START SOFIE-LLAMA BACKEND (Port 8000)
# ═══════════════════════════════════════════════════════════════════════════════
if (-not $SkipSofieLlama) {
    Write-Host "🌸 [SOFIE-LLAMA] Starting AI Intelligence Backend..." -ForegroundColor Magenta
    Write-Host "   Port: 8000" -ForegroundColor Gray
    Write-Host "   Model: LLaMA 3.1 (via Ollama or HuggingFace)" -ForegroundColor Gray
    Write-Host ""
    
    $sofieLlamaPath = Join-Path (Split-Path $REPO_ROOT -Parent) "sofie-llama-backend"
    
    if (-not (Test-Path $sofieLlamaPath)) {
        Write-Host "   ⚠️  sofie-llama-backend not found at: $sofieLlamaPath" -ForegroundColor Red
        Write-Host "   Expected structure: repos/sofie-llama-backend/" -ForegroundColor Gray
        Write-Host "   Skipping SOFIE-LLAMA..." -ForegroundColor Yellow
        Write-Host ""
    } else {
        $sofieLlamaLog = Join-Path $LOG_DIR "sofie-llama_$TIMESTAMP.log"
        
        # Check for .env file
        $envFile = Join-Path $sofieLlamaPath ".env"
        if (-not (Test-Path $envFile)) {
            Write-Host "   Creating .env file with Ollama defaults..." -ForegroundColor Gray
            @"
USE_OLLAMA=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
DEPLOYMENT_TIER=architect
ENABLE_QUANTUM_OPTIMIZATION=false
"@ | Out-File -FilePath $envFile -Encoding utf8
        }
        
        # Check if Python venv exists
        $venvPath = Join-Path $sofieLlamaPath "venv"
        if (-not (Test-Path $venvPath)) {
            Write-Host "   Creating Python virtual environment..." -ForegroundColor Gray
            python -m venv $venvPath
            
            Write-Host "   Installing dependencies (this may take a few minutes)..." -ForegroundColor Gray
            & "$venvPath\Scripts\activate.ps1"
            pip install fastapi uvicorn pydantic python-dotenv ollama
            deactivate
        }
        
        # Start sofie-llama backend
        $sofieLlamaCmd = @"
Set-Location '$sofieLlamaPath'
& '.\venv\Scripts\activate.ps1'
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
"@
        
        if ($LogsVisible) {
            Start-Process powershell -ArgumentList "-NoExit", "-Command", $sofieLlamaCmd
        } else {
            $sofieLlamaProcess = Start-Process powershell -ArgumentList "-Command", $sofieLlamaCmd -WindowStyle Hidden -PassThru
            $processes += $sofieLlamaProcess
            "Sofie-LLaMA PID: $($sofieLlamaProcess.Id)" | Out-File -FilePath $sofieLlamaLog
        }
        
        Write-Host "   ✅ Sofie-LLaMA starting..." -ForegroundColor Green
        Write-Host "   Log: $sofieLlamaLog" -ForegroundColor Gray
        Write-Host ""
        
        Start-Sleep -Seconds 8
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# 3. START SANDIRONRATIO NODE (Port 3000)
# ═══════════════════════════════════════════════════════════════════════════════
if (-not $SkipSandIron) {
    Write-Host "🔥 [SANDIRONRATIO] Starting Validator & Academy..." -ForegroundColor Red
    Write-Host "   Port: 3000" -ForegroundColor Gray
    Write-Host "   Components: Forge, Observatory, 9 Chambers, SOFIE Core" -ForegroundColor Gray
    Write-Host ""
    
    $sandIronLog = Join-Path $LOG_DIR "sandironratio_$TIMESTAMP.log"
    
    # Check if node_modules exists
    if (-not (Test-Path (Join-Path $REPO_ROOT "node_modules"))) {
        Write-Host "   Installing Node.js dependencies..." -ForegroundColor Gray
        Set-Location $REPO_ROOT
        npm install
    }
    
    # Start sandironratio node
    $sandIronCmd = @"
Set-Location '$REPO_ROOT'
npm run awaken
"@
    
    if ($LogsVisible) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $sandIronCmd
    } else {
        $sandIronProcess = Start-Process powershell -ArgumentList "-Command", $sandIronCmd -WindowStyle Hidden -PassThru
        $processes += $sandIronProcess
        "SandIronRatio PID: $($sandIronProcess.Id)" | Out-File -FilePath $sandIronLog
    }
    
    Write-Host "   ✅ SandIronRatio starting..." -ForegroundColor Green
    Write-Host "   Log: $sandIronLog" -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds 5
}

# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECKS
# ═════════════════════════════════════════════════════════════════════════════
Write-Host "🔍 Running health checks..." -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 10

# Check Council
if (-not $SkipCouncil) {
    try {
        $councilHealth = Invoke-RestMethod -Uri "http://localhost:9000/health" -Method Get -TimeoutSec 5
        Write-Host "   🏛️  Council: " -NoNewline
        Write-Host "HEALTHY" -ForegroundColor Green
        Write-Host "      Status: $($councilHealth.status)" -ForegroundColor Gray
    } catch {
        Write-Host "   🏛️  Council: " -NoNewline
        Write-Host "NOT RESPONDING" -ForegroundColor Red
    }
}

# Check Sofie-LLaMA
if (-not $SkipSofieLlama) {
    try {
        $sofieHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
        Write-Host "   🌸 Sofie-LLaMA: " -NoNewline
        Write-Host "HEALTHY" -ForegroundColor Green
        Write-Host "      Status: $($sofieHealth.status)" -ForegroundColor Gray
    } catch {
        Write-Host "   🌸 Sofie-LLaMA: " -NoNewline
        Write-Host "NOT RESPONDING" -ForegroundColor Red
    }
}

# Check SandIronRatio
if (-not $SkipSandIron) {
    try {
        $sandHealth = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
        Write-Host "   🔥 SandIronRatio: " -NoNewline
        Write-Host "HEALTHY" -ForegroundColor Green
        Write-Host "      Status: $($sandHealth.status)" -ForegroundColor Gray
    } catch {
        Write-Host "   🔥 SandIronRatio: " -NoNewline
        Write-Host "NOT RESPONDING" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 SOVEREIGN LABORATORY OPERATIONAL" -ForegroundColor Green
Write-Host ""
Write-Host "   Endpoints:" -ForegroundColor White
Write-Host "   • Council API:        http://localhost:9000" -ForegroundColor Gray
Write-Host "   • Sofie-LLaMA API:    http://localhost:8000" -ForegroundColor Gray
Write-Host "   • SandIronRatio API:  http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "   Logs: $LOG_DIR" -ForegroundColor Gray
Write-Host ""
Write-Host "   Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
    foreach ($proc in $processes) {
        if ($proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "✅ All services stopped" -ForegroundColor Green
    Write-Host ""
}
