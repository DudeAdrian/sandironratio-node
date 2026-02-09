# S.A.N.D.I.R.O.N.R.A.T.I.O. - Complete Ecosystem Launcher
# All Bridges Aligned: Ollama → Sofie → Voice → Hive → Council
# Version: 1.0.0 - Production Ready

param(
    [switch]$SkipVoice,
    [switch]$SkipHive,
    [switch]$Debug
)

# Error action preference
$ErrorActionPreference = "Stop"
if ($Debug) { $ErrorActionPreference = "Continue" }

# Configuration
$Config = @{
    BaseDir    = "C:\Users\squat\repos\sandironratio-node"
    SofieDir   = "C:\Users\squat\repos\sofie-llama-backend"
    LogDir     = "C:\Users\squat\repos\sandironratio-node\logs"
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

# Console helpers
function Write-Banner($text) {
    $width = 50
    $pad = [math]::Max(0, ($width - $text.Length) / 2)
    Write-Host ""
    Write-Host ("=" * $width) -ForegroundColor Cyan
    Write-Host $text.PadLeft($pad + $text.Length) -ForegroundColor Cyan
    Write-Host ("=" * $width) -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Info($msg)    { Write-Host "  ℹ $msg" -ForegroundColor White }
function Write-Warn($msg)    { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Error($msg)   { Write-Host "  ✗ $msg" -ForegroundColor Red }
function Write-Step($n, $total, $name) {
    Write-Host ""
    Write-Host "STEP $n/$total : $name" -ForegroundColor Magenta -BackgroundColor Black
    Write-Host ("-" * 50) -ForegroundColor Magenta
}

# Test if port is listening
function Test-Port($port, $timeout = 2) {
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

# Wait for service with progress
function Wait-ForService($name, $port, $maxSeconds = 30) {
    Write-Info "Waiting for $name on port $port..."
    for ($i = 0; $i -lt $maxSeconds; $i++) {
        if (Test-Port $port) {
            Write-Success "$name is online"
            return $true
        }
        Write-Host "." -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    Write-Host ""
    Write-Error "$name failed to start within $maxSeconds seconds"
    return $false
}

# Kill process on port
function Stop-ProcessOnPort($port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($conn) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    } catch {}
}

# ============================================================================
# STEP 1: OLLAMA (Foundation)
# ============================================================================
Write-Step 1 5 "OLLAMA FOUNDATION"

Write-Info "Checking Ollama on port $($Config.Ports.Ollama)..."

if (-not (Test-Port $Config.Ports.Ollama)) {
    Write-Error "Ollama is not running on port $($Config.Ports.Ollama)"
    Write-Info "Please start Ollama first with: ollama serve"
    Write-Info "Or run: Start-Process ollama -ArgumentList 'serve' -WindowStyle Hidden"
    exit 1
}

try {
    $models = Invoke-RestMethod -Uri "http://localhost:$($Config.Ports.Ollama)/api/tags" -TimeoutSec 5
    $modelCount = ($models.models | Measure-Object).Count
    Write-Success "Ollama running with $modelCount model(s) available"
    $State.OllamaRunning = $true
} catch {
    Write-Warn "Ollama port open but API check failed - proceeding anyway"
    $State.OllamaRunning = $true
}

# ============================================================================
# STEP 2: VOICE DEPENDENCIES
# ============================================================================
Write-Step 2 5 "VOICE INTERFACE"

if ($SkipVoice) {
    Write-Info "Voice skipped by -SkipVoice flag"
    $State.VoiceReady = $false
} else {
    # Check FFmpeg
    Write-Info "Checking FFmpeg..."
    $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if (-not $ffmpeg) {
        if (Test-Path "C:fmpeginfmpeg.exe") {
            $env:PATH = "C:fmpegin;$env:PATH"
            $ffmpeg = $true
        } elseif (Test-Path "$env:USERPROFILEfmpeginfmpeg.exe") {
            $env:PATH = "$env:USERPROFILEfmpegin;$env:PATH"
            $ffmpeg = $true
        }
    }
    if ($ffmpeg) {
        Write-Success "FFmpeg available"
    } else {
        Write-Warn "FFmpeg not found - installing via winget..."
        try {
            winget install Gyan.FFmpeg -e --silent --accept-source-agreements 2>&1 | Out-Null
            $env:PATH = [Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH", "User")
            Write-Success "FFmpeg installed"
        } catch {
            Write-Warn "FFmpeg install failed - voice may not work"
        }
    }
    
    # Check Python speech_recognition
    Write-Info "Checking Python speech_recognition..."
    try {
        $test = python -c "import speech_recognition; print('OK')" 2>&1
        if ($test -eq "OK") {
            Write-Success "speech_recognition available"
            $State.VoiceReady = $true
        } else { throw }
    } catch {
        Write-Info "Installing speech_recognition..."
        python -m pip install SpeechRecognition pyaudio --quiet 2>&1 | Out-Null
        try {
            $test = python -c "import speech_recognition; print('OK')" 2>&1
            if ($test -eq "OK") {
                Write-Success "speech_recognition installed"
                $State.VoiceReady = $true
            } else { throw }
        } catch {
            Write-Error "Failed to install voice dependencies"
            $State.VoiceReady = $false
        }
    }
}

# ============================================================================
# STEP 3: SOFIE API
# ============================================================================
Write-Step 3 5 "SOFIE API LAYER"

# Clear existing
Write-Info "Cleaning up existing Sofie processes..."
Stop-ProcessOnPort $Config.Ports.Sofie
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$($Config.SofieDir)*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Check if already running
if (Test-Port $Config.Ports.Sofie) {
    Write-Success "Sofie already running"
    $State.SofieRunning = $true
} else {
    # Find entry point
    $entryPoints = @(
        "$($Config.SofieDir)\sofie_api.py",
        "$($Config.SofieDir)\src\main.py",
        "$($Config.SofieDir)\app.py",
        "$($Config.SofieDir)\server.py"
    )
    
    $entryPoint = $null
    foreach ($ep in $entryPoints) {
        if (Test-Path $ep) {
            $entryPoint = $ep
            break
        }
    }
    
    if (-not $entryPoint) {
        Write-Error "No Sofie entry point found"
        Write-Info "Searched: $($entryPoints -join ', ')"
        exit 1
    }
    
    Write-Info "Starting Sofie from: $entryPoint"
    
    # Ensure logs dir
    if (-not (Test-Path $Config.LogDir)) {
        New-Item -ItemType Directory -Path $Config.LogDir -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $env:USE_OLLAMA = "true"
    $env:OLLAMA_MODEL = "llama3.1:8b"
    $env:OLLAMA_HOST = "http://localhost:$($Config.Ports.Ollama)"
    
    try {
        $State.Processes.Sofie = Start-Process -FilePath "python" -ArgumentList $entryPoint `
            -WorkingDirectory $Config.SofieDir `
            -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput "$($Config.LogDir)\sofie_$timestamp.log" `
            -RedirectStandardError "$($Config.LogDir)\sofie_$timestamp.err.log"
        
        if (Wait-ForService "Sofie" $Config.Ports.Sofie -maxSeconds 30) {
            $State.SofieRunning = $true
        } else {
            Write-Error "Sofie failed to start - check logs: $($Config.LogDir)\sofie_$timestamp.err.log"
            exit 1
        }
    } catch {
        Write-Error "Failed to start Sofie: $_"
        exit 1
    }
}

# ============================================================================
# STEP 4: HIVE (Optional)
# ============================================================================
Write-Step 4 5 "TERRACARE HIVE"

if ($SkipHive) {
    Write-Info "Hive skipped by -SkipHive flag"
} else {
    if (Test-Port $Config.Ports.Hive) {
        Write-Success "Hive already running"
        $State.HiveRunning = $true
    } else {
        Write-Info "Starting Hive..."
        
        # Check for Hive entry
        $hiveEntry = "$($Config.BaseDir)\server.ts"
        if (-not (Test-Path $hiveEntry)) {
            $hiveEntry = "$($Config.BaseDir)\awaken.ts"
        }
        
        if (Test-Path $hiveEntry) {
            Stop-ProcessOnPort $Config.Ports.Hive
            
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $env:NODE_ENV = "development"
            
            try {
                $State.Processes.Hive = Start-Process -FilePath "npx" -ArgumentList "tsx", "watch", $hiveEntry `
                    -WorkingDirectory $Config.BaseDir `
                    -PassThru -WindowStyle Hidden `
                    -RedirectStandardOutput "$($Config.LogDir)\hive_$timestamp.log" `
                    -RedirectStandardError "$($Config.LogDir)\hive_$timestamp.err.log"
                
                if (Wait-ForService "Hive" $Config.Ports.Hive -maxSeconds 20) {
                    $State.HiveRunning = $true
                } else {
                    Write-Warn "Hive slow to start - continuing anyway"
                }
            } catch {
                Write-Warn "Hive start failed: $_"
            }
        } else {
            Write-Warn "Hive entry point not found - skipping"
        }
    }
}

# ============================================================================
# STEP 5: COUNCIL (Optional)
# ============================================================================
Write-Step 5 5 "COUNCIL OF AGENTS"

if ($State.HiveRunning) {
    if (Test-Port $Config.Ports.Council) {
        Write-Success "Council already running"
        $State.CouncilRunning = $true
    } else {
        Write-Info "Starting Council..."
        
        $councilEntry = "$($Config.BaseDir)\src\council\api_server.py"
        if (Test-Path $councilEntry) {
            Stop-ProcessOnPort $Config.Ports.Council
            
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            
            try {
                $State.Processes.Council = Start-Process -FilePath "python" -ArgumentList "-m", "src.council.api_server" `
                    -WorkingDirectory $Config.BaseDir `
                    -PassThru -WindowStyle Hidden `
                    -RedirectStandardOutput "$($Config.LogDir)\council_$timestamp.log" `
                    -RedirectStandardError "$($Config.LogDir)\council_$timestamp.err.log"
                
                if (Wait-ForService "Council" $Config.Ports.Council -maxSeconds 15) {
                    $State.CouncilRunning = $true
                } else {
                    Write-Warn "Council slow to start"
                }
            } catch {
                Write-Warn "Council start failed: $_"
            }
        } else {
            Write-Warn "Council entry point not found"
        }
    }
} else {
    Write-Info "Hive not running - skipping Council"
}

# ============================================================================
# SYSTEM READY - MAIN INTERFACE
# ============================================================================
Write-Banner "ALL BRIDGES ALIGNED"

Write-Host "System Status:" -ForegroundColor Cyan
Write-Host "  Ollama:  $(if($State.OllamaRunning){'✓ ONLINE'}else{'✗ OFFLINE'})" -ForegroundColor $(if($State.OllamaRunning){'Green'}else{'Red'})
Write-Host "  Sofie:   $(if($State.SofieRunning){'✓ ONLINE'}else{'✗ OFFLINE'})" -ForegroundColor $(if($State.SofieRunning){'Green'}else{'Red'})
Write-Host "  Voice:   $(if($State.VoiceReady){'✓ READY'}else{'✗ UNAVAILABLE'})" -ForegroundColor $(if($State.VoiceReady){'Green'}else{'Yellow'})
Write-Host "  Hive:    $(if($State.HiveRunning){'✓ ONLINE'}else{'○ OFFLINE'})" -ForegroundColor $(if($State.HiveRunning){'Green'}else{'Gray'})
Write-Host "  Council: $(if($State.CouncilRunning){'✓ ONLINE'}else{'○ OFFLINE'})" -ForegroundColor $(if($State.CouncilRunning){'Green'}else{'Gray'})
Write-Host ""

# Chat functions
function Send-ToSofie($message) {
    try {
        $body = @{
            message = $message
            consent = $true
            chat_history = @()
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:$($Config.Ports.Sofie)/check-in" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        return $response.response
    } catch {
        # Fallback to direct Ollama
        try {
            $body = @{
                model = "llama3.1:8b"
                messages = @(
                    @{ role = "system"; content = "You are Sofie, sovereign AI of the 9 chambers. Respond with wisdom and clarity." }
                    @{ role = "user"; content = $message }
                )
                stream = $false
            } | ConvertTo-Json -Depth 5
            
            $response = Invoke-RestMethod -Uri "http://localhost:$($Config.Ports.Ollama)/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
            return $response.message.content
        } catch {
            return "[Bridge error: AI not responding]"
        }
    }
}

function Get-VoiceInput {
    $outFile = "$env:TEMP\voice_$([Guid]::NewGuid().ToString().Substring(0,8)).txt"
    
    $pythonScript = @'
import speech_recognition as sr
try:
    r = sr.Recognizer()
    r.energy_threshold = 300
    r.pause_threshold = 1.0
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        audio = r.listen(source, timeout=10)
    text = r.recognize_google(audio)
    print(text)
except:
    pass
'@
    
    $proc = Start-Process -FilePath "python" -ArgumentList "-c", $pythonScript `
        -PassThru -WindowStyle Hidden -RedirectStandardOutput $outFile
    
    # Show listening dots
    for ($i = 0; $i -lt 20 -and -not $proc.HasExited; $i++) {
        Write-Host "." -ForegroundColor Yellow -NoNewline
        Start-Sleep -Milliseconds 500
    }
    
    if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    
    $result = $null
    if (Test-Path $outFile) {
        $content = Get-Content $outFile -Raw -ErrorAction SilentlyContinue
        if ($content) { $result = $content.Trim() }
        Remove-Item $outFile -Force -ErrorAction SilentlyContinue
    }
    
    return $result
}

# Interface mode
if ($State.VoiceReady) {
    Write-Host "Mode: VOICE - SPEAK NOW" -ForegroundColor Green
} else {
    Write-Host "Mode: TEXT - TYPE YOUR MESSAGE" -ForegroundColor Yellow
}
Write-Host "Commands: /voice = speak, /text = type, /hive = start Hive, /council = start Council, /exit = quit"
Write-Host ""

$useVoice = $State.VoiceReady

# Main chat loop
try {
    while ($true) {
        $userInput = $null
        
        if ($useVoice -and $State.VoiceReady) {
            Write-Host "Listening" -ForegroundColor Yellow -NoNewline
            $voiceResult = Get-VoiceInput
            Write-Host ""
            
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
        if ($userInput -eq "/exit" -or $userInput -eq "quit") { break }
        if ($userInput -eq "/text") { $useVoice = $false; Write-Info "Text mode active"; continue }
        if ($userInput -eq "/voice") { 
            if ($State.VoiceReady) { 
                $useVoice = $true 
                Write-Info "Voice mode active - SPEAK NOW"
            } else { 
                Write-Error "Voice not available"
            }
            continue
        }
        if ($userInput -eq "/status") {
            Write-Host "Status - Ollama:$($State.OllamaRunning) Sofie:$($State.SofieRunning) Voice:$($State.VoiceReady) Hive:$($State.HiveRunning) Council:$($State.CouncilRunning)"
            continue
        }
        if ([string]::IsNullOrWhiteSpace($userInput)) { continue }
        
        # Send to AI
        Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
        $response = Send-ToSofie $userInput
        Write-Host $response -ForegroundColor White
        Write-Host ""
    }
} finally {
    # Cleanup
    Write-Banner "SHUTTING DOWN"
    
    if ($State.Processes.Council) {
        Stop-Process -Id $State.Processes.Council.Id -Force -ErrorAction SilentlyContinue
        Write-Info "Council stopped"
    }
    if ($State.Processes.Hive) {
        Stop-Process -Id $State.Processes.Hive.Id -Force -ErrorAction SilentlyContinue
        Write-Info "Hive stopped"
    }
    if ($State.Processes.Sofie) {
        Stop-Process -Id $State.Processes.Sofie.Id -Force -ErrorAction SilentlyContinue
        Write-Info "Sofie stopped"
    }
    
    Write-Success "Ecosystem offline. The Dude abides."
}
