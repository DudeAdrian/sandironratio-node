# ═══════════════════════════════════════════════════════════════════════════════
# SOVEREIGN LABORATORY - UNIFIED LAUNCHER
# ═══════════════════════════════════════════════════════════════════════════════
# One window. Everything integrated. Voice-first AI laboratory.
# ═══════════════════════════════════════════════════════════════════════════════

$Host.UI.RawUI.WindowTitle = "SOVEREIGN LABORATORY - Adrian's Private AI"
Clear-Host

Write-Host "`n╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                               ║" -ForegroundColor Cyan
Write-Host "║" -NoNewline -ForegroundColor Cyan
Write-Host "                    SOVEREIGN LABORATORY AWAKENING                         " -NoNewline -ForegroundColor Yellow
Write-Host "║" -ForegroundColor Cyan
Write-Host "║                                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Check Ollama
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "🔍 [1/3] Checking Ollama (LLaMA 3.1 8B)..." -ForegroundColor White
$ollamaProcess = Get-Process ollama -ErrorAction SilentlyContinue
if ($null -eq $ollamaProcess) {
    Write-Host "   ⚠️  Ollama not running. Starting..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "   ✅ Ollama running" -ForegroundColor Green
}

try {
    $null = Invoke-RestMethod http://localhost:11434/api/tags -ErrorAction Stop
    Write-Host "   ✅ Ollama API ready" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Ollama may still be starting..." -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Start SOFIE Voice Listener (Background Job)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n🎤 [2/3] Starting SOFIE Voice Listener..." -ForegroundColor White
Write-Host "   - Wake word: 'Sofie'" -ForegroundColor DarkGray
Write-Host "   - Command: 'Convene council'" -ForegroundColor DarkGray
Write-Host "   - Voice: Piper (Female TTS)" -ForegroundColor DarkGray

$voiceJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\squat\repos\sofie-llama-backend"
    python sofie_listen.py 2>&1
}

Start-Sleep -Seconds 2
$jobOutput = Receive-Job $voiceJob
if ($jobOutput -match "listening|Vosk|piper") {
    Write-Host "   ✅ Voice system initializing" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Voice starting in background..." -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Launch Integrated Server
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n🔥 [3/3] Launching Sovereign Node..." -ForegroundColor White
Write-Host ""

# Monitor voice output alongside server
$monitorVoice = {
    while ($true) {
        $output = Receive-Job $using:voiceJob
        if ($output) {
            foreach ($line in $output) {
                if ($line -match "You said:|SOFIE:|convene|council") {
                    Write-Host "🎤 $line" -ForegroundColor Magenta
                }
            }
        }
        Start-Sleep -Milliseconds 500
    }
}

Start-Job -ScriptBlock $monitorVoice | Out-Null

# Run the server (blocks until Ctrl+C)
npm run server

# Cleanup on exit
Write-Host "`n🌙 Shutting down..." -ForegroundColor Yellow
Stop-Job $voiceJob
Remove-Job $voiceJob
Get-Job | Stop-Job
Get-Job | Remove-Job
