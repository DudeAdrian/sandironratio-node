# ═══════════════════════════════════════════════════════════════════════════════
# SOVEREIGN LABORATORY - Unified Voice-First AI System
# ═══════════════════════════════════════════════════════════════════════════════
#
# ONE COMMAND, EVERYTHING WORKS
#
# Usage:   .\sovereign.ps1
#          npm run sovereign
#
# Features:
#   ✓ Ollama auto-detect/start
#   ✓ SOFIE Voice (Vosk STT + Piper TTS)
#   ✓ SandIronRatio Node (port 3000)
#   ✓ GOD MODE authority
#   ✓ Council convening
#
# Voice Commands:
#   "Sofie" - Wake word
#   "Convene council" - Assemble 6 agents
#   "Status" - System status
#
# ═══════════════════════════════════════════════════════════════════════════════

param([switch]$Debug)

# Fix encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Configuration
$RepoRoot = $PSScriptRoot
$VoiceDir = Join-Path $RepoRoot "voice"
$OllamaPort = 11434
$ServerPort = 3000

# Colors
function Write-Banner($text) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step($num, $text) {
    Write-Host "[$num/5] " -NoNewline -ForegroundColor Yellow
    Write-Host $text -ForegroundColor White
}

function Write-OK($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "  → $msg" -ForegroundColor Gray }
function Write-Err($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red }

# Banner
Clear-Host
Write-Banner "SOVEREIGN LABORATORY v2.0"

Write-Host "Unified Voice-First AI System" -ForegroundColor Gray
Write-Host "Adrian Sortino - DudeAdrian" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Check Ollama
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step 1 "Checking Ollama..."

$ollamaRunning = $false
try {
    $null = Invoke-RestMethod "http://localhost:$OllamaPort/api/tags" -TimeoutSec 2
    $ollamaRunning = $true
    Write-OK "Ollama running on port $OllamaPort"
} catch {
    Write-Info "Ollama not detected, attempting to start..."
    
    # Try to start Ollama
    $ollamaProcess = Get-Process ollama -ErrorAction SilentlyContinue
    if (-not $ollamaProcess) {
        try {
            Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
            Write-Info "Waiting for Ollama to initialize..."
            Start-Sleep -Seconds 5
            
            # Check again
            $null = Invoke-RestMethod "http://localhost:$OllamaPort/api/tags" -TimeoutSec 2
            $ollamaRunning = $true
            Write-OK "Ollama started successfully"
        } catch {
            Write-Err "Could not start Ollama"
            Write-Host ""
            Write-Host "  Please start Ollama manually:" -ForegroundColor Yellow
            Write-Host "    ollama serve" -ForegroundColor White
            Write-Host ""
            exit 1
        }
    } else {
        Write-OK "Ollama process found, waiting for API..."
        Start-Sleep -Seconds 3
        try {
            $null = Invoke-RestMethod "http://localhost:$OllamaPort/api/tags" -TimeoutSec 2
            $ollamaRunning = $true
            Write-OK "Ollama API ready"
        } catch {
            Write-Err "Ollama process running but API not ready"
            exit 1
        }
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Check Voice System
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step 2 "Checking voice system..."

# Check if voice files exist
if (-not (Test-Path "$VoiceDir\sofie_listen.py")) {
    Write-Err "Voice system not found at $VoiceDir"
    Write-Host ""
    Write-Host "  Run setup first:" -ForegroundColor Yellow
    Write-Host "    cd voice" -ForegroundColor White
    Write-Host "    pip install -r requirements-voice.txt" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-OK "Python: $pythonVersion"
} catch {
    Write-Err "Python not found"
    exit 1
}

# Check voice dependencies (quick check)
try {
    python -c "import vosk, sounddevice" 2>&1 | Out-Null
    Write-OK "Voice dependencies installed (Vosk, sounddevice)"
} catch {
    Write-Info "Installing voice dependencies..."
    Push-Location $VoiceDir
    pip install -r requirements-voice.txt | Out-Null
    Pop-Location
    Write-OK "Voice dependencies installed"
}

# Check Piper paths
$piperExe = "C:\llama\piper\piper.exe"
$voiceModel = "C:\llama\voices\en_US-amy-medium.onnx"

if ((Test-Path $piperExe) -and (Test-Path $voiceModel)) {
    Write-OK "Piper TTS paths verified"
} else {
    Write-Err "Piper TTS not found"
    Write-Info "Expected: $piperExe"
    Write-Info "Expected: $voiceModel"
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Start Voice Listener (Background)
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step 3 "Starting SOFIE Voice Listener..."

# Create log directory
$logDir = Join-Path $RepoRoot "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Start voice in background job
$voiceScript = @"
Set-Location '$VoiceDir'
`$Host.UI.RawUI.WindowTitle = 'SOFIE - Voice Listener'
python sofie_listen.py
"@

$voiceJob = Start-Job -ScriptBlock ([ScriptBlock]::Create($voiceScript))

Write-OK "Voice listener started (Job ID: $($voiceJob.Id))"
Write-Info "Initializing speech recognition..."
Start-Sleep -Seconds 4

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Check Node.js
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step 4 "Checking Node.js environment..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-OK "Node.js: $nodeVersion"
} catch {
    Write-Err "Node.js not found"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "$RepoRoot\node_modules")) {
    Write-Info "Installing npm dependencies..."
    npm install | Out-Null
    Write-OK "Dependencies installed"
} else {
    Write-OK "Dependencies found"
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Start Sovereign Node (Foreground)
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step 5 "Starting Sovereign Node..."

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🌌 SOVEREIGN LABORATORY ACTIVE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Services Running:" -ForegroundColor White
Write-Host "  ✓ Ollama       → http://localhost:$OllamaPort" -ForegroundColor Green
Write-Host "  ✓ Voice System → Listening for 'Sofie' wake word" -ForegroundColor Green
Write-Host "  ✓ SOFIE API    → http://localhost:$ServerPort" -ForegroundColor Green
Write-Host ""
Write-Host "Voice Commands:" -ForegroundColor Cyan
Write-Host '  "Sofie"           - Wake SOFIE' -ForegroundColor White
Write-Host '  "Convene council" - Assemble 6 agents (GOD MODE)' -ForegroundColor White
Write-Host '  "Status"          - System status' -ForegroundColor White
Write-Host '  "Who am I"        - Birth chart reading' -ForegroundColor White
Write-Host ""
Write-Host "Documentation: VOICE_COUNCIL_GUIDE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Cleanup function
$cleanup = {
    Write-Host ""
    Write-Host "Shutting down..." -ForegroundColor Yellow
    
    # Stop voice job
    if ($null -ne $voiceJob) {
        Stop-Job $voiceJob -ErrorAction SilentlyContinue
        Remove-Job $voiceJob -ErrorAction SilentlyContinue
        Write-Host "  ✓ Voice listener stopped" -ForegroundColor Green
    }
    
    Write-Host "  ✓ Sovereign laboratory offline" -ForegroundColor Green
    Write-Host ""
}

# Register cleanup on Ctrl+C
Register-EngineEvent PowerShell.Exiting -Action $cleanup | Out-Null

# Start the Node server (foreground)
try {
    npm run server
} finally {
    # Cleanup
    & $cleanup
}
