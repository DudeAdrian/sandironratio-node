# SOFIE Voice Interface - Clean Version
param([switch]$NoVoice)

$SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$BaseDir = "C:\Users\squat\repos\sandironratio-node"
$LogDir = "$BaseDir\logs"

$OllamaPort = 11434
$SofiePort = 8000

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
    Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/tags" -TimeoutSec 3 | Out-Null
    Write-OK "Ollama running"
} catch {
    Write-Err "Ollama not running. Start: ollama serve"
    exit 1
}

# Check voice deps
$voiceOK = $false
if (-not $NoVoice) {
    Write-Info "Checking voice..."
    try {
        python -c "import speech_recognition" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $voiceOK = $true }
    } catch {}
    if (-not $voiceOK) {
        python -m pip install SpeechRecognition pyaudio --quiet 2>&1 | Out-Null
        $voiceOK = $true
    }
    if ($voiceOK) { Write-OK "Voice ready" }
} else {
    Write-Info "Voice disabled"
}

# Start Sofie using simpler API (no Unicode issues)
Write-Info "Starting Sofie..."
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# Use simpler entry point if available
$apiPy = "$SofieDir\sofie_api.py"
if (-not (Test-Path $apiPy)) { $apiPy = "$SofieDir\src\main.py" }

# Kill any existing Sofie on port 8000
try {
    $conn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
} catch {}

# Start Sofie
$env:USE_OLLAMA = "true"
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$SofieProc = Start-Process -FilePath "python" -ArgumentList $apiPy `
    -WorkingDirectory $SofieDir -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput "$LogDir\sofie_$ts.log" `
    -RedirectStandardError "$LogDir\sofie_$ts.err.log"

# Wait for it
$started = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $h = Invoke-RestMethod -Uri "http://localhost:$SofiePort/health" -TimeoutSec 1 -ErrorAction Stop
        if ($h.status -eq "ok" -or $h.status -eq "healthy") {
            $started = $true
            break
        }
    } catch {
        Write-Host "." -ForegroundColor Gray -NoNewline
    }
}
Write-Host ""

if (-not $started) {
    Write-Err "Sofie failed to start. Trying direct Ollama mode..."
    # Will fallback to Ollama directly
} else {
    Write-OK "Sofie online"
}

# Chat function - tries Sofie first, falls back to Ollama
function Ask-Sofie($msg) {
    # Try Sofie API first
    try {
        $body = @{ message = $msg; consent = $true } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "http://localhost:$SofiePort/check-in" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        return $r.response
    } catch {
        # Fallback to Ollama
        try {
            $b = @{ model = "llama3.1:8b"; messages = @(@{ role = "user"; content = $msg }); stream = $false } | ConvertTo-Json
            $o = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/chat" -Method POST -Body $b -ContentType "application/json" -TimeoutSec 60
            return $o.message.content
        } catch {
            return "[Error: Cannot reach AI]"
        }
    }
}

# Voice function
function Hear-Voice {
    $out = "$env:TEMP\v_$([Guid]::NewGuid().ToString().Substring(0,6)).txt"
    $py = "$env:TEMP\v_$([Guid]::NewGuid().ToString().Substring(0,6)).py"
    
    @'
import speech_recognition as sr
try:
    r = sr.Recognizer()
    r.energy_threshold = 300
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        a = r.listen(source, timeout=8)
    t = r.recognize_google(a)
    if t:
        print(t)
except:
    pass
'@ | Out-File $py -Encoding UTF8
    
    $proc = Start-Process python -ArgumentList $py -PassThru -WindowStyle Hidden -RedirectStandardOutput $out
    
    # Show listening
    for ($i = 0; $i -lt 16; $i++) {
        if ($proc.HasExited) { break }
        Write-Host "." -ForegroundColor Yellow -NoNewline
        Start-Sleep -Milliseconds 500
    }
    
    if (-not $proc.HasExited) { Stop-Process $proc.Id -Force -ErrorAction SilentlyContinue }
    
    $result = $null
    if (Test-Path $out) {
        $c = Get-Content $out -Raw -ErrorAction SilentlyContinue
        if ($c) { $result = $c.Trim() }
        Remove-Item $out -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $py -Force -ErrorAction SilentlyContinue
    return $result
}

# Main chat
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHAT READY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
if ($voiceOK) {
    Write-Host "Mode: VOICE - Speak now" -ForegroundColor Green
} else {
    Write-Host "Mode: TEXT" -ForegroundColor Yellow
}
Write-Host "/text = type, /exit = quit"
Write-Host ""

$useVoice = $voiceOK

while ($true) {
    $msg = $null
    
    if ($useVoice) {
        Write-Host "Listening" -ForegroundColor Yellow -NoNewline
        $heard = Hear-Voice
        Write-Host ""
        if ($heard) {
            Write-Host "You: $heard" -ForegroundColor White
            $msg = $heard
        } else {
            Write-Host "(no speech)" -ForegroundColor Gray
            continue
        }
    } else {
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        $msg = Read-Host
    }
    
    if ($msg -eq "/exit") { break }
    if ($msg -eq "/text") { $useVoice = $false; Write-Host "TEXT mode" -ForegroundColor Yellow; continue }
    if ($msg -eq "/voice") { 
        if ($voiceOK) { $useVoice = $true; Write-Host "VOICE mode" -ForegroundColor Green }
        else { Write-Host "Voice unavailable" -ForegroundColor Red }
        continue
    }
    if ([string]::IsNullOrWhiteSpace($msg)) { continue }
    
    Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
    $resp = Ask-Sofie $msg
    Write-Host $resp -ForegroundColor White
    Write-Host ""
}

# Cleanup
Write-Host ""
Write-Info "Stopping..."
if ($SofieProc -and -not $SofieProc.HasExited) {
    Stop-Process -Id $SofieProc.Id -Force -ErrorAction SilentlyContinue
}
Write-OK "Done"
