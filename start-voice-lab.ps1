# ============================================
# Voice Laboratory - Start Everything
# ============================================
# Starts SOFIE voice listener + sandironratio-node
# in split terminals for easy monitoring

Write-Host "`n🎤 Starting Voice Laboratory...`n" -ForegroundColor Cyan

# Check if repos exist
$sofieBackend = "..\sofie-llama-backend"
$sandironNode = "."

if (-not (Test-Path $sofieBackend)) {
    Write-Host "❌ sofie-llama-backend not found at $sofieBackend" -ForegroundColor Red
    Write-Host "   Please adjust the path in this script.`n" -ForegroundColor Yellow
    exit 1
}

# Start SOFIE voice listener in new terminal
Write-Host "🔷 Starting SOFIE Voice Listener..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$sofieBackend'; Write-Host '`n🎤 SOFIE Voice Listener' -ForegroundColor Green; Write-Host '========================`n' -ForegroundColor Green; python sofie_listen.py"
)

Write-Host "   ✓ SOFIE listening in new terminal" -ForegroundColor Green

# Wait a moment
Start-Sleep -Seconds 2

# Start sandironratio-node in new terminal  
Write-Host "`n🏛️ Starting SandIronRatio Node..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$sandironNode'; Write-Host '`n🏛️ SandIronRatio Node (GOD MODE)' -ForegroundColor Green; Write-Host '================================`n' -ForegroundColor Green; npm run awaken"
)

Write-Host "   ✓ Node awakening in new terminal" -ForegroundColor Green

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "🎤 Voice Laboratory is starting!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📋 What's happening:" -ForegroundColor White
Write-Host "  1. SOFIE Voice Listener (sofie_listen.py) is starting..." -ForegroundColor DarkGray
Write-Host "     → Always listening for 'Sofie' wake word" -ForegroundColor DarkGray
Write-Host "     → Detects 'convene council' command" -ForegroundColor DarkGray
Write-Host "`n  2. SandIronRatio Node is awakening..." -ForegroundColor DarkGray
Write-Host "     → SOFIE GOD MODE active" -ForegroundColor DarkGray
Write-Host "     → Council ready to convene" -ForegroundColor DarkGray

Write-Host "`n🎙️ Try saying:" -ForegroundColor Cyan
Write-Host '  "Sofie"' -ForegroundColor Yellow
Write-Host '  "Convene council"' -ForegroundColor Yellow

Write-Host "`n📖 Documentation:" -ForegroundColor Cyan
Write-Host "  VOICE_COUNCIL_GUIDE.md" -ForegroundColor Yellow

Write-Host "`n⚠️  Wait ~10 seconds for both services to fully start." -ForegroundColor Yellow
Write-Host "   Watch the new terminal windows for startup messages.`n" -ForegroundColor DarkGray

# Optional: Start Ollama if available
try {
    $ollamaRunning = Get-Process ollama -ErrorAction SilentlyContinue
    if (-not $ollamaRunning) {
        Write-Host "`n💡 Tip: Start Ollama for local LLM support:" -ForegroundColor Cyan
        Write-Host "   ollama serve" -ForegroundColor Yellow
        Write-Host "   ollama pull llama3.1:8b`n" -ForegroundColor Yellow
    } else {
        Write-Host "`n✓ Ollama is running`n" -ForegroundColor Green
    }
} catch {
    # Ollama not installed, that's fine
}
