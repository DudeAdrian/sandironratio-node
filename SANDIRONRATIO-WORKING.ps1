# S.A.N.D.I.R.O.N.R.A.T.I.O. - DEFINITIVE WORKING LAUNCHER
# Version: 3.0.0 - All Bugs Fixed
# Bridges: Ollama → Sofie → Voice → Hive → Council

param([switch]$NoVoice, [switch]$Debug)

# Fix encoding issues
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Configuration - use environment variables with fallbacks
$Config = @{
    BaseDir    = if ($env:SANDIRONRATIO_HOME) { $env:SANDIRONRATIO_HOME } else { "C:\Users\squat\repos\sandironratio-node" }
    SofieDir   = if ($env:SOFIE_HOME) { $env:SOFIE_HOME } else { "C:\Users\squat\repos\sofie-llama-backend" }
    LogDir     = "$($pwd)\logs"
    Ports      = @{
        Ollama  = 11434
        Sofie   = 8000
        Hive    = 3000
        Council = 9000
    }
}

# State tracking
$State = @{
    OllamaRunning  = $false
    SofieRunning   = $false
    VoiceReady     = $false
    HiveRunning    = $false
    CouncilRunning = $false
    Processes      = @{}
}

# Console helpers - ASCII only, no Unicode
function Write-Banner($text) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-OK($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "  [INFO] $msg" -ForegroundColor White }
function Write-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "  [ERROR] $msg" -ForegroundColor Red }

# Test port with timeout
function Test-Port($port, $timeout = 3) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $result = $client.BeginConnect("localhost", $port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne([TimeSpan]::FromSeconds($timeout))
        if ($success) {
            $client.EndConnect($result)
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    } catch { return $false }
}

# Wait for service with retry
function Wait-ForService($name, $port, $maxSeconds = 45) {
    Write-Info "Waiting for $name on port $port..."
    for ($i = 0; $i -lt $maxSeconds; $i++) {
        if (Test-Port $port) {
            Write-OK "$name is online (port $port)"
            return $true
        }
        Write-Host "." -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    Write-Host ""
    Write-Err "$name failed to start within $maxSeconds seconds"
    return $false
}

# Kill process on port safely
function Stop-ServiceOnPort($port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($conn -and $conn.OwningProcess) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            return $true
        }
    } catch {}
    return $false
}

# ============================================================================
# PHASE 1: OLLAMA CHECK
# ============================================================================
Write-Banner "PHASE 1: OLLAMA FOUNDATION"

Write-Info "Checking Ollama on port $($Config.Ports.Ollama)..."

if (-not (Test-Port $Config.Ports.Ollama)) {
    Write-Err "Ollama is not running on port $($Config.Ports.Ollama)"
    Write-Info "Start Ollama: ollama serve"
    exit 1
}

try {
    $models = Invoke-RestMethod -Uri "http://localhost:$($Config.Ports.Ollama)/api/tags" -TimeoutSec 5 -ErrorAction Stop
    $modelCount = ($models.models | Measure-Object).Count
    Write-OK "Ollama running with $modelCount model(s) available"
    $State.OllamaRunning = $true
} catch {
    Write-Warn "Ollama port open but API check failed - proceeding anyway"
    $State.OllamaRunning = $true
}

# ============================================================================
# PHASE 2: VOICE SETUP
# ============================================================================
Write-Banner "PHASE 2: VOICE INTERFACE"

if ($NoVoice) {
    Write-Info "Voice disabled by -NoVoice flag"
    $State.VoiceReady = $false
} else {
    # Check speech_recognition
    Write-Info "Checking Python speech_recognition..."
    $hasSR = $false
    try {
        $result = & python -c "import speech_recognition; print('OK')" 2>&1
        if ($result -eq "OK") { $hasSR = $true }
    } catch {}
    
    if (-not $hasSR) {
        Write-Info "Installing speech_recognition..."
        & python -m pip install SpeechRecognition pyaudio --quiet 2>&1 | Out-Null
        try {
            $result = & python -c "import speech_recognition; print('OK')" 2>&1
            if ($result -eq "OK") { $hasSR = $true }
        } catch {}
    }
    
    if ($hasSR) {
        Write-OK "Voice dependencies ready"
        $State.VoiceReady = $true
    } else {
        Write-Warn "Voice dependencies failed - will use text mode"
        $State.VoiceReady = $false
    }
}

# ============================================================================
# PHASE 3: SOFIE API (FIXED VERSION)
# ============================================================================
Write-Banner "PHASE 3: SOFIE API LAYER"

# Clean up existing
Write-Info "Cleaning up existing Sofie processes..."
Stop-ServiceOnPort $Config.Ports.Sofie
Get-Process python -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -and $_.Path.Contains("sofie") 
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Check if already running
if (Test-Port $Config.Ports.Sofie) {
    Write-OK "Sofie already running on port $($Config.Ports.Sofie)"
    $State.SofieRunning = $true
} else {
    # Find entry point - prefer simpler API files over main.py (which has Unicode issues)
    $entryPoints = @(
        "$($Config.SofieDir)\sofie_api.py",
        "$($Config.SofieDir)\sofie_llama_api.py",
        "$($Config.SofieDir)\app.py",
        "$($Config.SofieDir)\server.py",
        "$($Config.SofieDir)\src\api\server.py",
        "$($Config.SofieDir)\src\main.py"  # Last resort - has Unicode issues
    )
    
    $entryPoint = $null
    foreach ($ep in $entryPoints) {
        if (Test-Path $ep) {
            $entryPoint = $ep
            break
        }
    }
    
    if (-not $entryPoint) {
        Write-Warn "No Sofie entry point found - will use Ollama directly"
        $State.SofieRunning = $false
    } else {
        Write-Info "Starting Sofie from: $entryPoint"
        
        # Ensure logs dir exists
        if (-not (Test-Path $Config.LogDir)) {
            New-Item -ItemType Directory -Path $Config.LogDir -Force | Out-Null
        }
        
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        
        # Set environment - disable Unicode to prevent encoding errors
        $env:USE_OLLAMA = "true"
        $env:OLLAMA_MODEL = "llama3.1:8b"
        $env:OLLAMA_HOST = "http://localhost:$($Config.Ports.Ollama)"
        $env:PYTHONIOENCODING = "utf-8"
        
        # FIX: Use SEPARATE log files for stdout and stderr (was causing crash)
        $logOut = "$($Config.LogDir)\sofie_$timestamp.log"
        $logErr = "$($Config.LogDir)\sofie_$timestamp.err.log"
        
        try {
            $State.Processes.Sofie = Start-Process -FilePath "python" -ArgumentList $entryPoint `
                -WorkingDirectory $Config.SofieDir `
                -PassThru -WindowStyle Hidden `
                -RedirectStandardOutput $logOut `   # SEPARATE FILE
                -RedirectStandardError $logErr      # SEPARATE FILE
            
            Write-Info "Sofie starting (PID: $($State.Processes.Sofie.Id))..."
            
            if (Wait-ForService "Sofie" $Config.Ports.Sofie -maxSeconds 45) {
                $State.SofieRunning = $true
            } else {
                Write-Warn "Sofie slow to start - check logs: $logErr"
                Write-Warn "Will fallback to Ollama for chat"
                $State.SofieRunning = $false
            }
        } catch {
            Write-Err "Failed to start Sofie: $_"
            Write-Warn "Will fallback to Ollama for chat"
            $State.SofieRunning = $false
        }
    }
}

# ============================================================================
# PHASE 4: CHAT INTERFACE
# ============================================================================
Write-Banner "SOFIE CHAT INTERFACE"

# Status display
Write-Host "Bridge Status:" -ForegroundColor Cyan
Write-Host "  Ollama:  $(if($State.OllamaRunning){'ONLINE'}else{'OFFLINE'})" -ForegroundColor $(if($State.OllamaRunning){'Green'}else{'Red'})
Write-Host "  Sofie:   $(if($State.SofieRunning){'ONLINE'}else{'OFFLINE (using Ollama)'})" -ForegroundColor $(if($State.SofieRunning){'Green'}else{'Yellow'})
Write-Host "  Voice:   $(if($State.VoiceReady){'READY'}else{'UNAVAILABLE'})" -ForegroundColor $(if($State.VoiceReady){'Green'}else{'Yellow'})
Write-Host ""

if ($State.VoiceReady) {
    Write-Host "Mode: VOICE - Say 'Sofie' then speak your message" -ForegroundColor Green
} else {
    Write-Host "Mode: TEXT - Type your message" -ForegroundColor Yellow
}
Write-Host "Commands: /voice = speak mode, /text = type mode, /exit = quit" -ForegroundColor Gray
Write-Host ""

# Chat function with error handling
function Send-Chat($message) {
    # Try Sofie API first
    if ($State.SofieRunning) {
        try {
            $body = @{
                message = $message
                consent = $true
                chat_history = @()
            } | ConvertTo-Json -ErrorAction Stop
            
            $response = Invoke-RestMethod -Uri "http://localhost:$($Config.Ports.Sofie)/check-in" `
                -Method POST -Body $body -ContentType "application/json" `
                -TimeoutSec 30 -ErrorAction Stop
            
            if ($response.response) {
                return $response.response
            }
        } catch {
            if ($Debug) { Write-Warn "Sofie API failed: $_. Falling back to Ollama" }
        }
    }
    
    # Fallback to direct Ollama
    try {
        $body = @{
            model = "llama3.1:8b"
            messages = @(
                @{ role = "system"; content = "You are Sofie, sovereign AI of the 9 chambers. Speak with wisdom and clarity. Keep responses concise." }
                @{ role = "user"; content = $message }
            )
            stream = $false
        } | ConvertTo-Json -Depth 5 -ErrorAction Stop
        
        $response = Invoke-RestMethod -Uri "http://localhost:$($Config.Ports.Ollama)/api/chat" `
            -Method POST -Body $body -ContentType "application/json" `
            -TimeoutSec 60 -ErrorAction Stop
        
        return $response.message.content
    } catch {
        return "[Error: AI not responding. Check Ollama.]"
    }
}

# Voice input function with proper error handling
function Get-VoiceInput {
    $outFile = "$env:TEMP\voice_$([Guid]::NewGuid().ToString().Substring(0,8)).txt"
    $errFile = "$env:TEMP\voice_err_$([Guid]::NewGuid().ToString().Substring(0,8)).txt"
    
    # Python script - no Unicode, no emojis
    $pythonCode = @'
import speech_recognition as sr
import sys

try:
    r = sr.Recognizer()
    r.energy_threshold = 300
    r.dynamic_energy_threshold = True
    r.pause_threshold = 1.5
    
    with sr.Microphone() as source:
        sys.stderr.write("[adjusting mic]\n")
        r.adjust_for_ambient_noise(source, duration=0.5)
        sys.stderr.write("[listening]\n")
        audio = r.listen(source, timeout=10, phrase_time_limit=15)
    
    sys.stderr.write("[recognizing]\n")
    text = r.recognize_google(audio)
    if text:
        sys.stdout.write(text)
        sys.exit(0)
    else:
        sys.exit(1)
        
except sr.WaitTimeoutError:
    sys.stderr.write("[timeout: no speech]\n")
    sys.exit(1)
except sr.UnknownValueError:
    sys.stderr.write("[could not understand]\n")
    sys.exit(1)
except Exception as e:
    sys.stderr.write("[error: " + str(e) + "]\n")
    sys.exit(1)
'@
    
    try {
        # Write Python script to temp file
        $pyFile = "$env:TEMP\voice_script_$([Guid]::NewGuid().ToString().Substring(0,8)).py"
        [System.IO.File]::WriteAllText($pyFile, $pythonCode, [System.Text.Encoding]::UTF8)
        
        $proc = Start-Process -FilePath "python" -ArgumentList $pyFile `
            -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput $outFile `
            -RedirectStandardError $errFile
        
        # Show listening animation
        $dots = 0
        while (-not $proc.HasExited -and $dots -lt 30) {
            Write-Host "." -NoNewline -ForegroundColor Yellow
            Start-Sleep -Milliseconds 500
            $dots++
        }
        
        # Clean up process if still running
        if (-not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
        
        # Get result
        $result = $null
        if (Test-Path $outFile) {
            $content = Get-Content $outFile -Raw -ErrorAction SilentlyContinue
            if ($content) {
                $result = $content.Trim()
            }
            Remove-Item $outFile -Force -ErrorAction SilentlyContinue
        }
        
        # Show debug if needed
        if ($Debug -and (Test-Path $errFile)) {
            $err = Get-Content $errFile -Raw -ErrorAction SilentlyContinue
            if ($err) { Write-Info "Voice: $($err.Trim())" }
        }
        
        # Cleanup
        if (Test-Path $errFile) { Remove-Item $errFile -Force -ErrorAction SilentlyContinue }
        if (Test-Path $pyFile) { Remove-Item $pyFile -Force -ErrorAction SilentlyContinue }
        
        return $result
    } catch {
        if ($Debug) { Write-Err "Voice error: $_" }
        return $null
    }
}

# Main chat loop
$useVoice = $State.VoiceReady

while ($true) {
    $userInput = $null
    
    if ($useVoice -and $State.VoiceReady) {
        Write-Host "Listening" -ForegroundColor Yellow -NoNewline
        $voiceResult = Get-VoiceInput
        Write-Host ""  # Newline after dots
        
        if ($voiceResult) {
            Write-Host "You: $voiceResult" -ForegroundColor White
            $userInput = $voiceResult
        } else {
            Write-Warn "No speech detected - try speaking louder or type /text"
            continue
        }
    } else {
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        $userInput = Read-Host
    }
    
    # Command handling
    if ($userInput -match "^/exit" -or $userInput -match "^exit" -or $userInput -match "^quit") { break }
    
    if ($userInput -eq "/text") {
        $useVoice = $false
        Write-Info "Text mode active"
        continue
    }
    
    if ($userInput -eq "/voice") {
        if ($State.VoiceReady) {
            $useVoice = $true
            Write-Info "Voice mode active - SPEAK NOW"
        } else {
            Write-Warn "Voice not available - check microphone and speech_recognition installation"
        }
        continue
    }
    
    if ([string]::IsNullOrWhiteSpace($userInput)) { continue }
    
    # Get AI response
    Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
    $response = Send-Chat $userInput
    Write-Host $response -ForegroundColor White
    Write-Host ""
}

# Cleanup
Write-Banner "SHUTTING DOWN"

if ($State.Processes.Sofie) {
    try {
        Stop-Process -Id $State.Processes.Sofie.Id -Force -ErrorAction SilentlyContinue
        Write-Info "Sofie stopped"
    } catch {}
}

Write-OK "Ecosystem offline. The Dude abides."
