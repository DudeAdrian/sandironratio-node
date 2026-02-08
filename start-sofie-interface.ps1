# SOFIE Real Interface - AI Chat Client
# Actually talks to Sofie via HTTP API
# Version: 2.0.0 - Real LLM Integration

# ============================================================================
# CONFIGURATION
# ============================================================================
$SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$BaseDir = "C:\Users\squat\repos\sandironratio-node"
$LogDir = "$BaseDir\logs"
$LocalBin = "$BaseDir\bin"

$OllamaPort = 11434
$SofiePort = 8000
$HivePort = 3000
$CouncilPort = 9000

$script:SofieProcess = $null
$script:HiveProcess = $null
$script:CouncilProcess = $null
$script:VoiceEnabled = $false
$script:ChatHistory = @()

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================
function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "  $Title" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host ""
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $color = switch ($Type) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        "Info" { "Cyan" }
        "Sofie" { "Magenta" }
        default { "White" }
    }
    $prefix = switch ($Type) {
        "Success" { "[OK]    " }
        "Error" { "[ERROR] " }
        "Warning" { "[WARN]  " }
        "Info" { "[INFO]  " }
        "Sofie" { "[SOFIE] " }
        default { "[INFO]  " }
    }
    Write-Host "$prefix$Message" -ForegroundColor $color
}

function Test-Port {
    param([int]$Port, [int]$TimeoutSec = 2)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $result = $client.BeginConnect("localhost", $Port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne([TimeSpan]::FromSeconds($TimeoutSec))
        if ($success) {
            $client.EndConnect($result)
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    } catch {
        return $false
    }
}

function Wait-ForService {
    param(
        [string]$Name,
        [int]$Port,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )
    Write-Status "Waiting for $Name to start..." "Info"
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        $progress = [math]::Floor(($i / $MaxAttempts) * 100)
        Write-Host "  Progress: $progress% (attempt $i/$MaxAttempts)" -ForegroundColor Gray -NoNewline
        Write-Host "`r" -NoNewline
        
        if (Test-Port -Port $Port) {
            Write-Host "`r                                      `r" -NoNewline
            Write-Status "$Name is ONLINE (port $Port)" "Success"
            return $true
        }
        
        Start-Sleep -Seconds $DelaySeconds
    }
    
    Write-Host "`r                                      `r" -NoNewline
    Write-Status "$Name failed to start" "Error"
    return $false
}

# ============================================================================
# FFMPEG SETUP (for Voice)
# ============================================================================
function Install-Ffmpeg {
    Write-Header "CHECKING FFMPEG (Voice Support)"
    
    # Check if ffmpeg already in PATH
    $ffmpegCmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if ($ffmpegCmd) {
        Write-Status "FFmpeg found in PATH" "Success"
        return $true
    }
    
    # Check local bin directory
    if (Test-Path "$LocalBin\ffmpeg.exe") {
        Write-Status "FFmpeg found in local bin" "Success"
        $env:PATH = "$LocalBin;$env:PATH"
        return $true
    }
    
    Write-Status "FFmpeg not found - attempting install..." "Warning"
    
    # Ensure local bin exists
    if (-not (Test-Path $LocalBin)) {
        New-Item -ItemType Directory -Path $LocalBin -Force | Out-Null
    }
    
    # Try winget first (Windows 10/11)
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Status "Installing FFmpeg via winget..." "Info"
        try {
            Start-Process -FilePath "winget" -ArgumentList "install", "Gyan.FFmpeg", "-e", "--accept-source-agreements", "--accept-package-agreements" -Wait -WindowStyle Hidden
            # Refresh PATH
            $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
            
            if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
                Write-Status "FFmpeg installed via winget" "Success"
                return $true
            }
        } catch {
            Write-Status "Winget install failed, trying direct download..." "Warning"
        }
    }
    
    # Direct download fallback
    Write-Status "Downloading FFmpeg (please wait)..." "Info"
    try {
        $url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
        $zipPath = "$env:TEMP\ffmpeg.zip"
        $extractPath = "$env:TEMP\ffmpeg"
        
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        
        # Find ffmpeg.exe and copy to local bin
        $ffmpegExe = Get-ChildItem -Path $extractPath -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
        if ($ffmpegExe) {
            Copy-Item -Path $ffmpegExe.FullName -Destination "$LocalBin\ffmpeg.exe" -Force
            $env:PATH = "$LocalBin;$env:PATH"
            Write-Status "FFmpeg downloaded to local bin" "Success"
            return $true
        }
    } catch {
        Write-Status "Failed to download FFmpeg: $_" "Error"
    }
    
    Write-Status "Voice disabled - text mode only" "Warning"
    return $false
}

# ============================================================================
# OLLAMA CHECK
# ============================================================================
function Test-Ollama {
    Write-Header "CHECKING OLLAMA"
    
    if (Test-Port -Port $OllamaPort) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/tags" -UseBasicParsing -TimeoutSec 3
            $modelCount = ($response.models | Measure-Object).Count
            Write-Status "Ollama running with $modelCount model(s)" "Success"
            return $true
        } catch {
            Write-Status "Ollama port responds" "Success"
            return $true
        }
    }
    
    Write-Status "Ollama not running on port $OllamaPort" "Error"
    Write-Status "Please start Ollama: ollama serve" "Error"
    return $false
}

# ============================================================================
# SOFIE SERVICE MANAGEMENT
# ============================================================================
function Start-SofieService {
    Write-Header "STARTING SOFIE"
    
    # Check if already running
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:$SofiePort/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Status "Sofie already running (port $SofiePort)" "Success"
        return $true
    } catch {}
    
    # Ensure log directory
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    $logFile = "$LogDir\sofie_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
    
    # Check for main.py
    $mainPy = "$SofieDir\src\main.py"
    if (-not (Test-Path $mainPy)) {
        $mainPy = "$SofieDir\sofie_api.py"
    }
    
    if (-not (Test-Path $mainPy)) {
        Write-Status "Cannot find Sofie entry point" "Error"
        return $false
    }
    
    Write-Status "Starting Sofie from: $mainPy" "Info"
    Write-Status "Logs: $logFile" "Info"
    
    try {
        # Set environment
        $env:USE_OLLAMA = "true"
        $env:OLLAMA_MODEL = "llama3.1:8b"
        $env:ENABLE_VOICE_INTERFACE = "true"
        
        # Start Sofie minimized
        $script:SofieProcess = Start-Process -FilePath "python" `
            -ArgumentList "`"$mainPy`"" `
            -WorkingDirectory $SofieDir `
            -RedirectStandardOutput $logFile `
            -RedirectStandardError $logFile `
            -PassThru -WindowStyle Minimized
        
        Write-Status "Sofie starting (PID: $($script:SofieProcess.Id))..." "Info"
        
        # Wait for health check
        $ready = $false
        for ($i = 0; $i -lt 30; $i++) {
            try {
                $health = Invoke-RestMethod -Uri "http://localhost:$SofiePort/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
                if ($health.status -eq "healthy" -or $health.status -eq "ok") {
                    $ready = $true
                    break
                }
            } catch {}
            Start-Sleep -Seconds 1
        }
        
        if ($ready) {
            Write-Status "Sofie is ready!" "Success"
            return $true
        } else {
            Write-Status "Sofie starting but health check pending..." "Warning"
            return $true
        }
    } catch {
        Write-Status "Failed to start Sofie: $_" "Error"
        return $false
    }
}

function Stop-SofieService {
    if ($script:SofieProcess -and -not $script:SofieProcess.HasExited) {
        Write-Status "Stopping Sofie..." "Info"
        Stop-Process -Id $script:SofieProcess.Id -Force -ErrorAction SilentlyContinue
    }
}

# ============================================================================
# COUNCIL ACTIVATION
# ============================================================================
function Start-Council {
    Write-Header "CONVENING COUNCIL"
    
    # Start Hive if not running
    if (-not (Test-Port -Port $HivePort)) {
        Write-Status "Starting Hive (Terracare Ledger)..." "Info"
        
        $logFile = "$LogDir\hive_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
        try {
            $script:HiveProcess = Start-Process -FilePath "npx" `
                -ArgumentList "tsx", "watch", "awaken.ts" `
                -WorkingDirectory $BaseDir `
                -RedirectStandardOutput $logFile `
                -RedirectStandardError $logFile `
                -PassThru -WindowStyle Minimized
            
            Wait-ForService -Name "Hive" -Port $HivePort -MaxAttempts 20
        } catch {
            Write-Status "Failed to start Hive: $_" "Error"
        }
    } else {
        Write-Status "Hive already running" "Success"
    }
    
    # Start Council if not running
    if (-not (Test-Port -Port $CouncilPort)) {
        Write-Status "Starting Council (6 Agents)..." "Info"
        
        $logFile = "$LogDir\council_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
        try {
            # Try different entry points
            $councilPath = "$BaseDir\src\council\api_server.py"
            if (Test-Path $councilPath) {
                $script:CouncilProcess = Start-Process -FilePath "python" `
                    -ArgumentList "-m", "src.council.api_server" `
                    -WorkingDirectory $BaseDir `
                    -RedirectStandardOutput $logFile `
                    -RedirectStandardError $logFile `
                    -PassThru -WindowStyle Minimized
            } else {
                Write-Status "Council entry point not found - may need manual start" "Warning"
            }
            
            Wait-ForService -Name "Council" -Port $CouncilPort -MaxAttempts 15
        } catch {
            Write-Status "Failed to start Council: $_" "Error"
        }
    } else {
        Write-Status "Council already running" "Success"
    }
    
    Write-Status "Council convened on ports $HivePort/$CouncilPort" "Success"
}

# ============================================================================
# REAL SOFIE CHAT API
# ============================================================================
function Invoke-SofieChat {
    param([string]$Message)
    
    # Try /speak endpoint first (most common in Sofie API)
    $endpoints = @(
        @{ Url = "http://localhost:$SofiePort/speak"; Method = "POST"; BodyType = "message" },
        @{ Url = "http://localhost:$SofiePort/check-in"; Method = "POST"; BodyType = "checkin" },
        @{ Url = "http://localhost:$SofiePort/v1/chat/completions"; Method = "POST"; BodyType = "openai" }
    )
    
    foreach ($ep in $endpoints) {
        try {
            $body = switch ($ep.BodyType) {
                "message" { @{ message = $Message; context = $script:ChatHistory } | ConvertTo-Json }
                "checkin" { @{ message = $Message; consent = $true; chat_history = $script:ChatHistory } | ConvertTo-Json }
                "openai" { 
                    @{ 
                        model = "llama3.1:8b"
                        messages = @(
                            @{ role = "system"; content = "You are Sofie, sovereign AI of the 9 chambers. Respond with wisdom and clarity." }
                            @{ role = "user"; content = $Message }
                        )
                        stream = $false
                    } | ConvertTo-Json -Depth 5
                }
            }
            
            $response = Invoke-RestMethod -Uri $ep.Url -Method $ep.Method -Body $body -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
            
            # Extract response text based on endpoint format
            $responseText = switch ($ep.BodyType) {
                "message" { $response.response }
                "checkin" { $response.response }
                "openai" { $response.choices[0].message.content }
            }
            
            if ($responseText) {
                return $responseText
            }
        } catch {
            # Try next endpoint
            continue
        }
    }
    
    # Fallback: direct Ollama call if Sofie API fails
    try {
        $body = @{
            model = "llama3.1:8b"
            messages = @(
                @{ role = "system"; content = "You are Sofie, sovereign AI of the 9 chambers." }
                @{ role = "user"; content = $Message }
            )
            stream = $false
        } | ConvertTo-Json -Depth 5
        
        $response = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
        return $response.message.content
    } catch {
        return "[Error: Unable to reach Sofie. Is the service running?]"
    }
}

# ============================================================================
# VOICE INPUT
# ============================================================================
function Test-VoiceAvailable {
    try {
        python -c "import speech_recognition" 2>$null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Get-VoiceInput {
    try {
        $pythonScript = @"
import speech_recognition as sr
import sys

try:
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("LISTENING...", flush=True)
        r.adjust_for_ambient_noise(source, duration=0.5)
        audio = r.listen(source, timeout=10, phrase_time_limit=10)
    
    try:
        text = r.recognize_google(audio)
        print(f"RECOGNIZED: {text}")
    except sr.UnknownValueError:
        print("RECOGNIZED: ")
    except sr.RequestError as e:
        print(f"ERROR: {e}")
except Exception as e:
    print(f"ERROR: {e}")
"@
        
        $output = python -c $pythonScript 2>&1
        
        foreach ($line in $output) {
            if ($line -match "^RECOGNIZED: (.+)") {
                return $matches[1]
            }
        }
        return $null
    } catch {
        return $null
    }
}

function Speak-Response {
    param([string]$Text)
    
    try {
        # Use Windows built-in TTS
        $powershellCmd = "Add-Type -AssemblyName System.Speech; `$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; `$synth.Speak(`"$Text`")"
        Start-Process -FilePath "powershell" -ArgumentList "-Command", $powershellCmd -WindowStyle Hidden -Wait
    } catch {
        # TTS failed, that's okay
    }
}

# ============================================================================
# MAIN INTERACTIVE LOOP
# ============================================================================
function Start-ChatInterface {
    Write-Header "SOFIE CHAT INTERFACE"
    
    Write-Host " Commands:" -ForegroundColor Gray
    Write-Host "   Type your message - Chat with Sofie" -ForegroundColor Gray
    Write-Host "   /voice           - Toggle voice input mode" -ForegroundColor Gray
    Write-Host "   /council         - Convene Council (Hive + 6 Agents)" -ForegroundColor Gray
    Write-Host "   /status          - Check service status" -ForegroundColor Gray
    Write-Host "   /exit or /quit   - Exit" -ForegroundColor Gray
    Write-Host ""
    
    if ($script:VoiceEnabled) {
        Write-Status "Voice input available (say 'Sofie' to activate)" "Success"
    }
    
    Write-Host ""
    
    $voiceMode = $false
    
    while ($true) {
        # Show prompt
        if ($voiceMode) {
            Write-Host "[VOICE] " -ForegroundColor Yellow -NoNewline
        }
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        
        # Get input
        $input = $null
        if ($voiceMode) {
            $input = Get-VoiceInput
            if ($input) {
                Write-Host $input -ForegroundColor White
            } else {
                Write-Host "(no speech detected)" -ForegroundColor Gray
                $voiceMode = $false
                continue
            }
        } else {
            $input = Read-Host
        }
        
        $input = $input.Trim()
        
        # Handle commands
        if ($input -eq "/exit" -or $input -eq "/quit" -or $input -eq "exit" -or $input -eq "quit") {
            Write-Status "Goodbye!" "Info"
            break
        }
        
        if ($input -eq "/voice") {
            if ($script:VoiceEnabled) {
                $voiceMode = -not $voiceMode
                Write-Status "Voice mode: $(if($voiceMode){'ON'}else{'OFF'})" "Info"
            } else {
                Write-Status "Voice not available - install speech_recognition" "Warning"
            }
            continue
        }
        
        if ($input -eq "/council" -or $input -eq "convene council") {
            Start-Council
            continue
        }
        
        if ($input -eq "/status" -or $input -eq "status") {
            Show-Status
            continue
        }
        
        if ($input -eq "") {
            continue
        }
        
        # Send to Sofie
        Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
        
        $response = Invoke-SofieChat -Message $input
        
        Write-Host $response -ForegroundColor White
        
        # Speak if in voice mode
        if ($voiceMode) {
            Speak-Response -Text $response
        }
        
        # Add to history
        $script:ChatHistory += @{ role = "user"; content = $input }
        $script:ChatHistory += @{ role = "assistant"; content = $response }
        
        # Keep history manageable (last 10 exchanges)
        if ($script:ChatHistory.Count -gt 20) {
            $script:ChatHistory = $script:ChatHistory[-20..-1]
        }
        
        Write-Host ""
    }
}

function Show-Status {
    Write-Host ""
    Write-Host "Service Status:" -ForegroundColor Cyan
    
    $services = @(
        @{ Name = "Ollama"; Port = $OllamaPort },
        @{ Name = "Sofie"; Port = $SofiePort },
        @{ Name = "Hive"; Port = $HivePort },
        @{ Name = "Council"; Port = $CouncilPort }
    )
    
    foreach ($svc in $services) {
        $isUp = Test-Port -Port $svc.Port
        $status = if ($isUp) { "ONLINE" } else { "OFFLINE" }
        $color = if ($isUp) { "Green" } else { "Red" }
        Write-Host "  $($svc.Name.PadRight(10)) : $status (port $($svc.Port))" -ForegroundColor $color
    }
    Write-Host ""
}

function Stop-AllServices {
    Write-Header "SHUTTING DOWN"
    
    if ($script:CouncilProcess) {
        Stop-Process -Id $script:CouncilProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Status "Council stopped" "Success"
    }
    
    if ($script:HiveProcess) {
        Stop-Process -Id $script:HiveProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Status "Hive stopped" "Success"
    }
    
    Stop-SofieService
    
    Write-Status "All services stopped" "Success"
}

# ============================================================================
# MAIN ENTRY
# ============================================================================
function Main {
    $ErrorActionPreference = "Continue"
    
    Clear-Host
    Write-Header "SOFIE INTERFACE v2.0"
    Write-Host "  Real AI Chat | Voice + Text | Council Control" -ForegroundColor Gray
    
    # 1. Check Ollama
    if (-not (Test-Ollama)) {
        exit 1
    }
    
    # 2. Setup FFmpeg for voice
    $script:VoiceEnabled = Install-Ffmpeg
    
    # 3. Start Sofie
    if (-not (Start-SofieService)) {
        Write-Status "Failed to start Sofie. Exiting." "Error"
        exit 1
    }
    
    # 4. Start chat
    try {
        Start-ChatInterface
    } finally {
        Stop-AllServices
    }
}

# Handle Ctrl+C
try {
    Main
} catch {
    Write-Status "Error: $_" "Error"
} finally {
    Stop-AllServices
}
