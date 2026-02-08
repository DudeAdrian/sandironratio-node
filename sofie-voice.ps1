# SOFIE Voice Interface - Working Version
param([switch]$NoVoice)

$SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$BaseDir = "C:\Users\squat\repos\sandironratio-node"
$LogDir = "$BaseDir\logs"

$OllamaPort = 11434
$SofiePort = 8000

$script:SofieProcess = $null
$script:VoiceEnabled = $false

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $color = switch ($Type) { "Success" { "Green" } "Error" { "Red" } "Warning" { "Yellow" } default { "White" } }
    $prefix = switch ($Type) { "Success" { "[OK] " } "Error" { "[ERR] " } "Warning" { "[WARN] " } default { "[*] " } }
    Write-Host "$prefix$Message" -ForegroundColor $color
}

function Test-Port {
    param([int]$Port)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $result = $client.BeginConnect("localhost", $Port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne([TimeSpan]::FromSeconds(2))
        if ($success) { $client.Close(); return $true }
        $client.Close(); return $false
    } catch { return $false }
}

# Check Ollama
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOFIE VOICE INTERFACE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Status "Checking Ollama..." "Info"
if (-not (Test-Port -Port $OllamaPort)) {
    Write-Status "Ollama not running on port $OllamaPort" "Error"
    exit 1
}
Write-Status "Ollama OK" "Success"

# Install voice deps if not skipped
if (-not $NoVoice) {
    Write-Status "Checking voice dependencies..." "Info"
    try {
        python -c "import speech_recognition" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $script:VoiceEnabled = $true
            Write-Status "Voice ready" "Success"
        } else {
            throw "Not installed"
        }
    } catch {
        Write-Status "Installing speech_recognition..." "Warning"
        python -m pip install SpeechRecognition pyaudio --quiet 2>&1 | Out-Null
        $script:VoiceEnabled = $true
        Write-Status "Voice installed" "Success"
    }
} else {
    Write-Status "Voice disabled" "Warning"
}

# Start Sofie
Write-Status "Starting Sofie..." "Info"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$mainPy = "$SofieDir\src\main.py"
if (-not (Test-Path $mainPy)) { $mainPy = "$SofieDir\sofie_api.py" }

if (Test-Path $mainPy) {
    $env:USE_OLLAMA = "true"
    $script:SofieProcess = Start-Process -FilePath "python" -ArgumentList $mainPy `
        -WorkingDirectory $SofieDir -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput "$LogDir\sofie_$timestamp.log" `
        -RedirectStandardError "$LogDir\sofie_$timestamp.err.log"
    
    # Wait for health
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $r = Invoke-RestMethod -Uri "http://localhost:$SofiePort/health" -TimeoutSec 2 -ErrorAction Stop
            if ($r.status -eq "ok" -or $r.status -eq "healthy") { break }
        } catch {}
        Start-Sleep -Seconds 1
    }
    Write-Status "Sofie online (port $SofiePort)" "Success"
} else {
    Write-Status "Sofie not found" "Error"
    exit 1
}

# Chat function
function Send-Chat {
    param([string]$Message)
    try {
        $body = @{ message = $Message; consent = $true } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "http://localhost:$SofiePort/check-in" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        return $r.response
    } catch {
        # Fallback to Ollama
        try {
            $b = @{ model = "llama3.1:8b"; messages = @(@{ role = "user"; content = $Message }); stream = $false } | ConvertTo-Json
            $o = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/chat" -Method POST -Body $b -ContentType "application/json" -TimeoutSec 60
            return $o.message.content
        } catch {
            return "[Error: Cannot reach AI]"
        }
    }
}

# Voice input function
function Get-Voice {
    $out = "$env:TEMP\v_$(Get-Random).txt"
    $py = "$env:TEMP\v_$(Get-Random).py"
    
    @"
import speech_recognition as sr
try:
    r = sr.Recognizer()
    r.energy_threshold = 300
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        a = r.listen(source, timeout=5)
    t = r.recognize_google(a)
    print(t)
except:
    pass
"@ | Out-File $py -Encoding UTF8
    
    $p = Start-Process python -ArgumentList $py -PassThru -WindowStyle Hidden -RedirectStandardOutput $out
    $p.WaitForExit(8000)
    if (-not $p.HasExited) { Stop-Process $p.Id -Force -ErrorAction SilentlyContinue }
    
    $result = $null
    if (Test-Path $out) {
        $c = Get-Content $out -Raw -ErrorAction SilentlyContinue
        if ($c) { $result = $c.Trim() }
    }
    Remove-Item $py, $out -Force -ErrorAction SilentlyContinue
    return $result
}

# Main loop
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHAT STARTED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($script:VoiceEnabled) {
    Write-Host "Voice mode: SPEAK NOW (or type /text to switch)" -ForegroundColor Green
} else {
    Write-Host "Text mode:" -ForegroundColor Yellow
}
Write-Host ""

$voiceMode = $script:VoiceEnabled

while ($true) {
    $input = $null
    
    if ($voiceMode) {
        Write-Host "[VOICE] " -ForegroundColor Yellow -NoNewline
        Write-Host "Listening... " -ForegroundColor Gray -NoNewline
        $v = Get-Voice
        if ($v) {
            Write-Host ""
            Write-Host "You: $v" -ForegroundColor White
            $input = $v
        } else {
            Write-Host "(no speech)"
            Start-Sleep -Milliseconds 500
            continue
        }
    } else {
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        $input = Read-Host
    }
    
    if ($input -eq "/exit" -or $input -eq "exit") { break }
    if ($input -eq "/text") { $voiceMode = $false; Write-Host "Switched to TEXT mode" -ForegroundColor Yellow; continue }
    if ($input -eq "/voice") { 
        if ($script:VoiceEnabled) { 
            $voiceMode = $true; 
            Write-Host "Switched to VOICE mode" -ForegroundColor Green 
        } else { 
            Write-Host "Voice not available" -ForegroundColor Red 
        }
        continue 
    }
    if ($input -eq "") { continue }
    
    Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
    $resp = Send-Chat -Message $input
    Write-Host $resp -ForegroundColor White
    Write-Host ""
}

# Cleanup
Write-Host ""
Write-Status "Shutting down..." "Info"
if ($script:SofieProcess -and -not $script:SofieProcess.HasExited) {
    Stop-Process -Id $script:SofieProcess.Id -Force -ErrorAction SilentlyContinue
}
Write-Status "Goodbye!" "Success"
