# S.A.N.D.I.R.O.N.R.A.T.I.O. Ecosystem Launcher
# Full alignment: Ollama → Sofie → Voice → Hive → Council

param([switch]$NoVoice)

# Configuration
$BaseDir = "C:\Users\squat\repos\sandironratio-node"
$SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$LogDir = "$BaseDir\logs"
$LocalBin = "$BaseDir\bin"

$Ports = @{
    Ollama = 11434
    Sofie = 8000
    Hive = 3000
    Council = 9000
}

$Processes = @{
    Sofie = $null
    Hive = $null
    Council = $null
}

$VoiceEnabled = $false

# Output helpers
function Header($title) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function OK($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "[*] $msg" -ForegroundColor White }
function Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Err($msg) { Write-Host "[ERR] $msg" -ForegroundColor Red }

function Test-Port($port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $r = $c.BeginConnect("localhost", $port, $null, $null)
        $s = $r.AsyncWaitHandle.WaitOne([TimeSpan]::FromSeconds(2))
        if ($s) { $c.Close(); return $true }
        $c.Close(); return $false
    } catch { return $false }
}

function Wait-Service($name, $port, $max = 30) {
    Info "Waiting for $name..."
    for ($i = 0; $i -lt $max; $i++) {
        if (Test-Port $port) { OK "$name online (port $port)"; return $true }
        Write-Host "." -ForegroundColor Gray -NoNewline
        Start-Sleep -Seconds 1
    }
    Write-Host ""
    return $false
}

# ============ PHASE 1: OLLAMA ============
Header "PHASE 1: OLLAMA PREREQUISITE"

if (-not (Test-Port $Ports.Ollama)) {
    Err "Ollama not running on port $($Ports.Ollama)"
    Err "Start Ollama: ollama serve"
    exit 1
}

try {
    $m = Invoke-RestMethod -Uri "http://localhost:$($Ports.Ollama)/api/tags" -TimeoutSec 3
    $c = ($m.models | Measure-Object).Count
    OK "Ollama running with $c models"
} catch {
    OK "Ollama responding"
}

# ============ PHASE 2: VOICE DEPS ============
Header "PHASE 2: VOICE INTERFACE"

if (-not $NoVoice) {
    Info "Checking FFmpeg..."
    $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if (-not $ffmpeg -and (Test-Path "$LocalBin\ffmpeg.exe")) {
        $env:PATH = "$LocalBin;$env:PATH"
        $ffmpeg = $true
    }
    if ($ffmpeg) { OK "FFmpeg available" }
    else { Warn "FFmpeg not found - voice may have issues" }
    
    Info "Checking Python speech_recognition..."
    try {
        python -c "import speech_recognition" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $VoiceEnabled = $true
            OK "speech_recognition ready"
        } else { throw }
    } catch {
        Info "Installing speech_recognition..."
        python -m pip install SpeechRecognition pyaudio --quiet 2>&1 | Out-Null
        try {
            python -c "import speech_recognition" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $VoiceEnabled = $true
                OK "speech_recognition installed"
            }
        } catch {
            Err "Failed to install voice dependencies"
        }
    }
} else {
    Info "Voice disabled by flag"
}

# ============ PHASE 3: SOFIE ============
Header "PHASE 3: SOFIE API"

# Kill existing
Get-Process python -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*$SofieDir*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Check if already running
if (Test-Port $Ports.Sofie) {
    OK "Sofie already running"
} else {
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
    
    # Use simpler API entry point
    $entryPoints = @(
        "$SofieDir\sofie_api.py",
        "$SofieDir\src\api\server.py",
        "$SofieDir\sofie_llama_api.py"
    )
    
    $apiFile = $null
    foreach ($ep in $entryPoints) {
        if (Test-Path $ep) { $apiFile = $ep; break }
    }
    
    if (-not $apiFile) {
        Warn "No API entry point found - will use Ollama directly"
    } else {
        Info "Starting Sofie from: $apiFile"
        $ts = Get-Date -Format 'yyyyMMdd_HHmmss'
        
        $env:USE_OLLAMA = "true"
        $env:OLLAMA_MODEL = "llama3.1:8b"
        $env:HIVE_API_URL = "http://localhost:$($Ports.Hive)"
        
        $Processes.Sofie = Start-Process -FilePath "python" -ArgumentList $apiFile `
            -WorkingDirectory $SofieDir -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput "$LogDir\sofie_$ts.log" `
            -RedirectStandardError "$LogDir\sofie_$ts.err.log"
        
        if (-not (Wait-Service "Sofie" $Ports.Sofie -max 30)) {
            Warn "Sofie slow to start - check logs: $LogDir\sofie_$ts.err.log"
            # Continue anyway, fallback to Ollama
        }
    }
}

# ============ CHAT INTERFACE ============
Header "ECOSYSTEM ALIGNED - CHAT READY"

function Chat($msg) {
    # Try Sofie first
    if (Test-Port $Ports.Sofie) {
        try {
            $body = @{ message = $msg; consent = $true; chat_history = @() } | ConvertTo-Json
            $r = Invoke-RestMethod -Uri "http://localhost:$($Ports.Sofie)/check-in" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
            return $r.response
        } catch {}
    }
    
    # Fallback to Ollama
    try {
        $body = @{
            model = "llama3.1:8b"
            messages = @(
                @{ role = "system"; content = "You are Sofie, sovereign AI of the 9 chambers." }
                @{ role = "user"; content = $msg }
            )
            stream = $false
        } | ConvertTo-Json -Depth 5
        $r = Invoke-RestMethod -Uri "http://localhost:$($Ports.Ollama)/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
        return $r.message.content
    } catch {
        return "[Bridge error: $_]"
    }
}

function Listen-Voice {
    $out = "$env:TEMP\v_$([Guid]::NewGuid().ToString().Substring(0,6)).txt"
    
    $code = @'
import speech_recognition as sr
try:
    r = sr.Recognizer()
    r.energy_threshold = 300
    r.pause_threshold = 1.0
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        audio = r.listen(source, timeout=10)
    text = r.recognize_google(audio)
    if text: print(text)
except: pass
'@
    
    $proc = Start-Process python -ArgumentList "-c", $code -PassThru -WindowStyle Hidden -RedirectStandardOutput $out
    
    for ($i = 0; $i -lt 20 -and -not $proc.HasExited; $i++) {
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
    return $result
}

# Status
Write-Host "Bridges:" -ForegroundColor Cyan
Write-Host "  Ollama:  Port $($Ports.Ollama) $(if(Test-Port $Ports.Ollama){'[OK]'}else{'[X]'})" -ForegroundColor $(if(Test-Port $Ports.Ollama){'Green'}else{'Red'})
Write-Host "  Sofie:   Port $($Ports.Sofie) $(if(Test-Port $Ports.Sofie){'[OK]'}else{'[X]'})" -ForegroundColor $(if(Test-Port $Ports.Sofie){'Green'}else{'Yellow'})
Write-Host "  Voice:   $(if($VoiceEnabled){'[OK]'}else{'[X]'})" -ForegroundColor $(if($VoiceEnabled){'Green'}else{'Yellow'})
Write-Host ""

if ($VoiceEnabled) {
    Write-Host "Mode: VOICE - SPEAK NOW" -ForegroundColor Green
} else {
    Write-Host "Mode: TEXT" -ForegroundColor Yellow
}
Write-Host "Commands: /hive = start Hive, /council = start Council, /text = type, /exit = quit"
Write-Host ""

$useVoice = $VoiceEnabled

# Main loop
while ($true) {
    $msg = $null
    
    if ($useVoice -and $VoiceEnabled) {
        Write-Host "Listening" -ForegroundColor Yellow -NoNewline
        $heard = Listen-Voice
        Write-Host ""
        
        if ($heard) {
            Write-Host "You: $heard" -ForegroundColor White
            $msg = $heard
        } else {
            Write-Host "(no speech - try louder or type /text)" -ForegroundColor Gray
            continue
        }
    } else {
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        $msg = Read-Host
    }
    
    # Commands
    if ($msg -eq "/exit") { break }
    if ($msg -eq "/text") { $useVoice = $false; Info "Text mode"; continue }
    if ($msg -eq "/voice") { 
        if ($VoiceEnabled) { $useVoice = $true; Info "Voice mode" }
        else { Warn "Voice not available" }
        continue
    }
    if ($msg -eq "/status") {
        Write-Host "Status: Ollama=$(Test-Port $Ports.Ollama), Sofie=$(Test-Port $Ports.Sofie), Voice=$VoiceEnabled" -ForegroundColor Cyan
        continue
    }
    if ([string]::IsNullOrWhiteSpace($msg)) { continue }
    
    # Chat
    Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
    $resp = Chat $msg
    Write-Host $resp -ForegroundColor White
    Write-Host ""
}

# Cleanup
Header "SHUTTING DOWN"
if ($Processes.Sofie) {
    Stop-Process -Id $Processes.Sofie.Id -Force -ErrorAction SilentlyContinue
    Info "Sofie stopped"
}
OK "Ecosystem offline"
