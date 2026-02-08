# SOFIE Voice Interface - Clean Working Version
param([switch]$NoVoice)

$SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$BaseDir = "C:\Users\squat\repos\sandironratio-node"
$LogDir = "$BaseDir\logs"

$OllamaPort = 11434
$SofiePort = 8000

$script:SofieProcess = $null

function Write-OK { param([string]$m) Write-Host "[OK] $m" -ForegroundColor Green }
function Write-Info { param([string]$m) Write-Host "[*] $m" -ForegroundColor White }
function Write-Err { param([string]$m) Write-Host "[ERR] $m" -ForegroundColor Red }

Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOFIE VOICE INTERFACE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Ollama
Write-Info "Checking Ollama..."
try {
    $r = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/tags" -TimeoutSec 3 -ErrorAction Stop
    Write-OK "Ollama running"
} catch {
    Write-Err "Ollama not running. Start: ollama serve"
    exit 1
}

# Check voice
$voiceOK = $false
if (-not $NoVoice) {
    Write-Info "Checking voice..."
    try {
        python -c "import speech_recognition" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $voiceOK = $true
            Write-OK "Voice ready"
        }
    } catch {}
    if (-not $voiceOK) {
        Write-Info "Installing speech_recognition..."
        python -m pip install SpeechRecognition pyaudio --quiet 2>&1 | Out-Null
        $voiceOK = $true
        Write-OK "Voice installed"
    }
} else {
    Write-Info "Voice disabled by flag"
}

# Check if Sofie already running
Write-Info "Checking Sofie..."
try {
    $h = Invoke-RestMethod -Uri "http://localhost:$SofiePort/health" -TimeoutSec 2 -ErrorAction Stop
    Write-OK "Sofie already running"
} catch {
    # Need to start Sofie
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
    
    $mainPy = "$SofieDir\src\main.py"
    if (-not (Test-Path $mainPy)) { $mainPy = "$SofieDir\sofie_api.py" }
    
    if (Test-Path $mainPy) {
        Write-Info "Starting Sofie..."
        $env:USE_OLLAMA = "true"
        $ts = Get-Date -Format 'yyyyMMdd_HHmmss'
        
        $script:SofieProcess = Start-Process -FilePath "python" -ArgumentList $mainPy `
            -WorkingDirectory $SofieDir -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput "$LogDir\sofie_$ts.log" `
            -RedirectStandardError "$LogDir\sofie_$ts.err.log"
        
        # Wait for health
        $started = $false
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Seconds 1
            try {
                $h = Invoke-RestMethod -Uri "http://localhost:$SofiePort/health" -TimeoutSec 1 -ErrorAction Stop
                if ($h.status -eq "ok" -or $h.status -eq "healthy") {
                    $started = $true
                    break
                }
            } catch {}
            Write-Host "." -ForegroundColor Gray -NoNewline
        }
        Write-Host ""
        
        if ($started) {
            Write-OK "Sofie online (PID: $($script:SofieProcess.Id))"
        } else {
            Write-Err "Sofie failed to start"
            exit 1
        }
    } else {
        Write-Err "Sofie entry point not found"
        exit 1
    }
}

# Chat function
function Ask-Sofie {
    param([string]$msg)
    try {
        $body = @{ message = $msg; consent = $true } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "http://localhost:$SofiePort/check-in" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        return $r.response
    } catch {
        try {
            $b = @{ model = "llama3.1:8b"; messages = @(@{ role = "user"; content = $msg }); stream = $false } | ConvertTo-Json
            $o = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/chat" -Method POST -Body $b -ContentType "application/json" -TimeoutSec 60
            return $o.message.content
        } catch {
            return "[Error: AI not responding]"
        }
    }
}

# Voice function
function Hear-Voice {
    $out = "$env:TEMP\v_$(Get-Random).txt"
    $py = "$env:TEMP\v_$(Get-Random).py"
    
    @'
import speech_recognition as sr
try:
    r = sr.Recognizer()
    r.energy_threshold = 300
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        a = r.listen(source, timeout=10)
    t = r.recognize_google(a)
    if t:
        print(t)
except:
    pass
'@ | Out-File $py -Encoding UTF8
    
    $proc = Start-Process python -ArgumentList $py -PassThru -WindowStyle Hidden -RedirectStandardOutput $out
    
    # Show listening for up to 10 seconds
    for ($i = 0; $i -lt 20; $i++) {
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
    Write-Host "Mode: VOICE (speak now)" -ForegroundColor Green
    Write-Host "Commands: /text = type, /exit = quit" -ForegroundColor Gray
} else {
    Write-Host "Mode: TEXT (type your message)" -ForegroundColor Yellow
    Write-Host "Command: /exit = quit" -ForegroundColor Gray
}
Write-Host ""

$useVoice = $voiceOK

while ($true) {
    $msg = $null
    
    if ($useVoice) {
        Write-Host "Listening... " -ForegroundColor Yellow -NoNewline
        $heard = Hear-Voice
        Write-Host ""
        if ($heard) {
            Write-Host "You: $heard" -ForegroundColor White
            $msg = $heard
        } else {
            Write-Host "(no speech detected, retrying...)" -ForegroundColor Gray
            Start-Sleep -Milliseconds 500
            continue
        }
    } else {
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        $msg = Read-Host
    }
    
    if ($msg -eq "/exit" -or $msg -eq "exit") { break }
    if ($msg -eq "/text") { $useVoice = $false; Write-Host "Switched to TEXT" -ForegroundColor Yellow; continue }
    if ($msg -eq "/voice") { 
        if ($voiceOK) { $useVoice = $true; Write-Host "Switched to VOICE" -ForegroundColor Green }
        else { Write-Host "Voice not available" -ForegroundColor Red }
        continue
    }
    if ([string]::IsNullOrWhiteSpace($msg)) { continue }
    
    Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
    $resp = Ask-Sofie -msg $msg
    Write-Host $resp -ForegroundColor White
    Write-Host ""
}

# Cleanup
Write-Host ""
Write-Info "Shutting down..."
if ($script:SofieProcess -and -not $script:SofieProcess.HasExited) {
    Stop-Process -Id $script:SofieProcess.Id -Force -ErrorAction SilentlyContinue
}
Write-OK "Goodbye!"
