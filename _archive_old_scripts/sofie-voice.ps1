# SOFIE Voice Interface - Working Version
# Bypasses Unicode issues, uses direct Ollama for chat

param([switch]$NoVoice)

$OllamaPort = 11434

function Write-OK($m) { Write-Host "[OK] $m" -ForegroundColor Green }
function Write-Info($m) { Write-Host "[*] $m" -ForegroundColor White }
function Write-Err($m) { Write-Host "[ERR] $m" -ForegroundColor Red }

Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOFIE VOICE INTERFACE" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Ollama
Write-Info "Checking Ollama..."
try {
    $models = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/tags" -TimeoutSec 3
    Write-OK "Ollama running with $(($models.models | Measure-Object).Count) models"
} catch {
    Write-Err "Ollama not running. Start: ollama serve"
    exit 1
}

# Setup voice
$voiceOK = $false
if (-not $NoVoice) {
    Write-Info "Setting up voice..."
    try {
        python -c "import speech_recognition" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $voiceOK = $true }
    } catch {}
    
    if (-not $voiceOK) {
        python -m pip install SpeechRecognition pyaudio --quiet 2>&1 | Out-Null
        $voiceOK = $true
    }
    
    if ($voiceOK) { 
        Write-OK "Voice ready" 
    } else {
        Write-Err "Voice setup failed"
    }
}

# Direct chat with Ollama (bypasses Sofie Unicode issues)
function Chat($msg) {
    $body = @{
        model = "llama3.1:8b"
        messages = @(
            @{ role = "system"; content = "You are Sofie, sovereign AI of the 9 chambers. Respond with wisdom and clarity." }
            @{ role = "user"; content = $msg }
        )
        stream = $false
    } | ConvertTo-Json
    
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
        return $resp.message.content
    } catch {
        return "[Error: $_.Exception.Message]"
    }
}

# Voice input - simplified
function Listen {
    $out = "$env:TEMP\v_$([Guid]::NewGuid().ToString().Substring(0,6)).txt"
    
    # Inline Python - no file writing issues
    $code = @'
import speech_recognition as sr
try:
    r = sr.Recognizer()
    r.energy_threshold = 300
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        audio = r.listen(source, timeout=10)
    text = r.recognize_google(audio)
    print(text)
except Exception as e:
    pass
'@
    
    $proc = Start-Process python -ArgumentList "-c", $code -PassThru -WindowStyle Hidden -RedirectStandardOutput $out
    
    # Wait with visual feedback
    $dots = 0
    while (-not $proc.HasExited -and $dots -lt 20) {
        Write-Host "." -ForegroundColor Yellow -NoNewline
        Start-Sleep -Milliseconds 500
        $dots++
    }
    
    if (-not $proc.HasExited) { 
        Stop-Process $proc.Id -Force -ErrorAction SilentlyContinue 
    }
    
    $result = $null
    if (Test-Path $out) {
        $content = Get-Content $out -Raw -ErrorAction SilentlyContinue
        if ($content) { $result = $content.Trim() }
        Remove-Item $out -Force -ErrorAction SilentlyContinue
    }
    
    return $result
}

# Main loop
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  READY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($voiceOK) {
    Write-Host "SPEAK NOW (voice active)" -ForegroundColor Green
} else {
    Write-Host "TYPE your message" -ForegroundColor Yellow
}
Write-Host "Commands: /text = type, /voice = speak, /exit = quit"
Write-Host ""

$useVoice = $voiceOK

while ($true) {
    $msg = $null
    
    if ($useVoice -and $voiceOK) {
        Write-Host "Listening" -ForegroundColor Yellow -NoNewline
        $heard = Listen
        Write-Host ""
        
        if ($heard) {
            Write-Host "You: $heard" -ForegroundColor White
            $msg = $heard
        } else {
            Write-Host "(didn't hear anything - try speaking louder or type /text)" -ForegroundColor Gray
            continue
        }
    } else {
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        $msg = Read-Host
    }
    
    # Handle commands
    if ($msg -eq "/exit" -or $msg -eq "quit") { break }
    if ($msg -eq "/text") { $useVoice = $false; Write-Host "TEXT mode" -ForegroundColor Yellow; continue }
    if ($msg -eq "/voice") { 
        if ($voiceOK) { 
            $useVoice = $true 
            Write-Host "VOICE mode - SPEAK NOW" -ForegroundColor Green
        } else { 
            Write-Host "Voice not available" -ForegroundColor Red 
        }
        continue
    }
    if ([string]::IsNullOrWhiteSpace($msg)) { continue }
    
    # Get response
    Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
    $resp = Chat $msg
    Write-Host $resp -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Info "Goodbye!"
