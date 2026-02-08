# SOFIE Chat Interface v2.1 - Real AI Chat Client
# Calls actual LLM API - Voice + Text modes

param([switch]$NoVoice)

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
$script:VoiceMode = $true
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
        default { "White" }
    }
    $prefix = switch ($Type) {
        "Success" { "[OK]    " }
        "Error" { "[ERROR] " }
        "Warning" { "[WARN]  " }
        "Info" { "[INFO]  " }
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
        [int]$MaxAttempts = 30
    )
    Write-Status "Waiting for $Name..." "Info"
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        if (Test-Port -Port $Port) {
            Write-Status "$Name is ONLINE (port $Port)" "Success"
            return $true
        }
        Write-Host "  Attempt $i/$MaxAttempts..." -ForegroundColor Gray -NoNewline
        Write-Host "`r" -NoNewline
        Start-Sleep -Seconds 2
    }
    
    Write-Host "`r                                      `r" -NoNewline
    Write-Status "$Name failed to start" "Error"
    return $false
}

# ============================================================================
# VOICE DEPENDENCIES SETUP
# ============================================================================
function Install-VoiceDeps {
    Write-Header "CHECKING VOICE DEPENDENCIES"
    
    # Check FFmpeg
    $ffmpegCmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if (-not $ffmpegCmd) {
        if (Test-Path "$LocalBin\ffmpeg.exe") {
            $env:PATH = "$LocalBin;$env:PATH"
            $ffmpegCmd = $true
        }
    }
    
    if (-not $ffmpegCmd) {
        Write-Status "FFmpeg not found - installing..." "Warning"
        
        if (-not (Test-Path $LocalBin)) {
            New-Item -ItemType Directory -Path $LocalBin -Force | Out-Null
        }
        
        # Quick winget try
        $winget = Get-Command winget -ErrorAction SilentlyContinue
        if ($winget) {
            Write-Status "Installing FFmpeg via winget..." "Info"
            try {
                $proc = Start-Process -FilePath "winget" `
                    -ArgumentList "install", "Gyan.FFmpeg", "-e", "--silent", "--accept-source-agreements", "--accept-package-agreements" `
                    -PassThru -WindowStyle Hidden
                
                for ($i = 0; $i -lt 12; $i++) {
                    Start-Sleep -Seconds 5
                    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
                    if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { break }
                    if ($proc.HasExited) { break }
                }
                
                if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
            } catch {}
        }
        
        # Download if still not found
        if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
            try {
                $url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
                $zipPath = "$env:TEMP\ffmpeg.zip"
                Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -TimeoutSec 60
                Expand-Archive -Path $zipPath -DestinationPath "$env:TEMP\ffmpeg" -Force
                $ffmpegExe = Get-ChildItem -Path "$env:TEMP\ffmpeg" -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
                if ($ffmpegExe) {
                    Copy-Item -Path $ffmpegExe.FullName -Destination "$LocalBin\ffmpeg.exe" -Force
                    $env:PATH = "$LocalBin;$env:PATH"
                }
            } catch {}
        }
    }
    
    # Check Python speech_recognition
    Write-Status "Checking Python speech_recognition..." "Info"
    try {
        $hasSR = python -c "import speech_recognition" 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Not installed" }
        Write-Status "speech_recognition installed" "Success"
    } catch {
        Write-Status "Installing speech_recognition..." "Warning"
        try {
            python -m pip install SpeechRecognition pyaudio --quiet 2>&1 | Out-Null
            Write-Status "speech_recognition installed" "Success"
        } catch {
            Write-Status "Failed to install speech_recognition" "Error"
            return $false
        }
    }
    
    # Final check
    try {
        python -c "import speech_recognition; import pyaudio" 2>&1 | Out-Null
        if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
            Write-Status "Voice dependencies ready" "Success"
            return $true
        }
    } catch {}
    
    Write-Status "Voice dependencies incomplete" "Warning"
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
    Write-Status "Start Ollama: ollama serve" "Error"
    return $false
}

# ============================================================================
# SOFIE SERVICE
# ============================================================================
function Start-SofieService {
    Write-Header "STARTING SOFIE"
    
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:$SofiePort/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Status "Sofie already running (port $SofiePort)" "Success"
        return $true
    } catch {}
    
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $logOut = "$LogDir\sofie_$timestamp.log"
    $logErr = "$LogDir\sofie_$timestamp.err.log"
    
    $mainPy = "$SofieDir\src\main.py"
    if (-not (Test-Path $mainPy)) {
        $mainPy = "$SofieDir\sofie_api.py"
    }
    
    if (-not (Test-Path $mainPy)) {
        Write-Status "Cannot find Sofie entry point" "Error"
        return $false
    }
    
    Write-Status "Starting Sofie..." "Info"
    Write-Status "Logs: $logOut" "Info"
    
    try {
        $env:USE_OLLAMA = "true"
        $env:OLLAMA_MODEL = "llama3.1:8b"
        
        $script:SofieProcess = Start-Process -FilePath "python" `
            -ArgumentList "`"$mainPy`"" `
            -WorkingDirectory $SofieDir `
            -RedirectStandardOutput $logOut `
            -RedirectStandardError $logErr `
            -PassThru -WindowStyle Minimized
        
        Write-Status "Sofie starting (PID: $($script:SofieProcess.Id))..." "Info"
        
        $ready = Wait-ForService -Name "Sofie" -Port $SofiePort -MaxAttempts 30
        return $ready
    } catch {
        Write-Status "Failed to start Sofie: $_" "Error"
        return $false
    }
}

function Stop-SofieService {
    if ($script:SofieProcess -and -not $script:SofieProcess.HasExited) {
        Stop-Process -Id $script:SofieProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Status "Sofie stopped" "Success"
    }
}

# ============================================================================
# COUNCIL ACTIVATION
# ============================================================================
function Start-Council {
    Write-Header "CONVENING COUNCIL"
    
    # Start Hive
    if (-not (Test-Port -Port $HivePort)) {
        Write-Status "Starting Hive..." "Info"
        
        $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $logOut = "$LogDir\hive_$timestamp.log"
        $logErr = "$LogDir\hive_$timestamp.err.log"
        
        try {
            $script:HiveProcess = Start-Process -FilePath "npx" `
                -ArgumentList "tsx", "watch", "awaken.ts" `
                -WorkingDirectory $BaseDir `
                -RedirectStandardOutput $logOut `
                -RedirectStandardError $logErr `
                -PassThru -WindowStyle Minimized
            
            Wait-ForService -Name "Hive" -Port $HivePort -MaxAttempts 20
        } catch {
            Write-Status "Failed to start Hive: $_" "Error"
        }
    } else {
        Write-Status "Hive already running" "Success"
    }
    
    # Start Council
    if (-not (Test-Port -Port $CouncilPort)) {
        Write-Status "Starting Council..." "Info"
        
        $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $logOut = "$LogDir\council_$timestamp.log"
        $logErr = "$LogDir\council_$timestamp.err.log"
        
        try {
            $councilPath = "$BaseDir\src\council\api_server.py"
            if (Test-Path $councilPath) {
                $script:CouncilProcess = Start-Process -FilePath "python" `
                    -ArgumentList "-m", "src.council.api_server" `
                    -WorkingDirectory $BaseDir `
                    -RedirectStandardOutput $logOut `
                    -RedirectStandardError $logErr `
                    -PassThru -WindowStyle Minimized
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
                            @{ role = "system"; content = "You are Sofie, sovereign AI of the 9 chambers." }
                            @{ role = "user"; content = $Message }
                        )
                        stream = $false
                    } | ConvertTo-Json -Depth 5
                }
            }
            
            $response = Invoke-RestMethod -Uri $ep.Url -Method $ep.Method -Body $body -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
            
            $responseText = switch ($ep.BodyType) {
                "message" { $response.response }
                "checkin" { $response.response }
                "openai" { $response.choices[0].message.content }
            }
            
            if ($responseText) {
                return $responseText
            }
        } catch {
            continue
        }
    }
    
    # Fallback to Ollama
    try {
        $body = @{
            model = "llama3.1:8b"
            messages = @(
                @{ role = "system"; content = "You are Sofie, sovereign AI." }
                @{ role = "user"; content = $Message }
            )
            stream = $false
        } | ConvertTo-Json -Depth 5
        
        $response = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
        return $response.message.content
    } catch {
        return "[Error: Cannot reach Sofie. Is the service running?]"
    }
}

# ============================================================================
# VOICE INPUT
# ============================================================================
function Get-VoiceInput {
    try {
        $pythonScript = @"
import speech_recognition as sr
import sys
try:
    r = sr.Recognizer()
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        try:
            audio = r.listen(source, timeout=5, phrase_time_limit=5)
        except sr.WaitTimeoutError:
            sys.exit(0)
    try:
        text = r.recognize_google(audio)
        print(text)
    except sr.UnknownValueError:
        sys.exit(0)
    except sr.RequestError as e:
        print(f"ERROR:{e}", file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f"ERROR:{e}", file=sys.stderr)
    sys.exit(1)
"@
        
        $proc = Start-Process -FilePath "python" -ArgumentList "-c", $pythonScript `
            -PassThru -WindowStyle Hidden -RedirectStandardOutput "$env:TEMP\voice_out.txt" -RedirectStandardError "$env:TEMP\voice_err.txt"
        
        $proc.WaitForExit(10000)
        
        if (Test-Path "$env:TEMP\voice_out.txt") {
            $text = Get-Content "$env:TEMP\voice_out.txt" -Raw
            Remove-Item "$env:TEMP\voice_out.txt" -Force -ErrorAction SilentlyContinue
            return $text.Trim()
        }
        return $null
    } catch {
        return $null
    }
}

function Speak-Response {
    param([string]$Text)
    try {
        $powershellCmd = "Add-Type -AssemblyName System.Speech; `$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; `$synth.Speak(`"$Text`")"
        Start-Process -FilePath "powershell" -ArgumentList "-Command", $powershellCmd -WindowStyle Hidden -Wait
    } catch {}
}

# ============================================================================
# MAIN CHAT INTERFACE
# ============================================================================
function Start-ChatInterface {
    Write-Header "SOFIE CHAT INTERFACE"
    
    Write-Host " Commands:" -ForegroundColor Gray
    Write-Host "   /voice  - Voice input mode" -ForegroundColor Gray
    Write-Host "   /text   - Text input mode" -ForegroundColor Gray
    Write-Host "   /council - Convene Council" -ForegroundColor Gray
    Write-Host "   /status - Check services" -ForegroundColor Gray
    Write-Host "   /exit   - Exit" -ForegroundColor Gray
    Write-Host ""
    
    if ($script:VoiceEnabled) {
        Write-Status "VOICE MODE ACTIVE" "Success"
        $script:VoiceMode = $true
    } else {
        Write-Status "TEXT MODE (voice unavailable)" "Warning"
        $script:VoiceMode = $false
    }
    
    Write-Host ""
    
    while ($true) {
        # Show prompt
        $userInput = $null
        if ($script:VoiceMode -and $script:VoiceEnabled) {
            Write-Host "[VOICE] Listening... (speak now or press Enter to type)" -ForegroundColor Yellow
            $voiceResult = Get-VoiceInput
            if ($voiceResult -and $voiceResult -is [string] -and $voiceResult.Trim()) {
                $userInput = $voiceResult.Trim()
                Write-Host "You said: $userInput" -ForegroundColor White
            } else {
                $script:VoiceMode = $false
                Write-Host "[TEXT] You: " -ForegroundColor Cyan -NoNewline
                $userInput = Read-Host
            }
        } else {
            Write-Host "[TEXT] You: " -ForegroundColor Cyan -NoNewline
            $userInput = Read-Host
        }
        
        if ($userInput -isnot [string]) { $userInput = "" }
        $userInput = $userInput.Trim()
        
        # Commands
        if ($userInput -eq "/exit" -or $userInput -eq "/quit" -or $userInput -eq "exit" -or $userInput -eq "quit") {
            Write-Status "Goodbye!" "Info"
            break
        }
        
        if ($userInput -eq "/voice") {
            if ($script:VoiceEnabled) {
                $script:VoiceMode = $true
                Write-Status "Voice mode ON" "Success"
            } else {
                Write-Status "Voice not available" "Warning"
            }
            continue
        }
        
        if ($userInput -eq "/text") {
            $script:VoiceMode = $false
            Write-Status "Text mode ON" "Info"
            continue
        }
        
        if ($userInput -eq "/council") {
            Start-Council
            continue
        }
        
        if ($userInput -eq "/status") {
            Show-Status
            continue
        }
        
        if ($userInput -eq "") {
            continue
        }
        
        # Send to Sofie
        Write-Host "Sofie: " -ForegroundColor Magenta -NoNewline
        
        $response = Invoke-SofieChat -Message $userInput
        
        Write-Host $response -ForegroundColor White
        
        if ($script:VoiceMode -and $script:VoiceEnabled) {
            Speak-Response -Text $response
        }
        
        # Update history
        $script:ChatHistory += @{ role = "user"; content = $userInput }
        $script:ChatHistory += @{ role = "assistant"; content = $response }
        
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
    }
    if ($script:HiveProcess) {
        Stop-Process -Id $script:HiveProcess.Id -Force -ErrorAction SilentlyContinue
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
    Write-Header "SOFIE INTERFACE v2.1"
    Write-Host "  Voice + Text AI | Council Control | Real-time Chat" -ForegroundColor Gray
    
    # Check Ollama
    if (-not (Test-Ollama)) {
        exit 1
    }
    
    # Setup voice dependencies (unless -NoVoice flag)
    if ($NoVoice) {
        Write-Status "Voice disabled by flag" "Info"
        $script:VoiceEnabled = $false
    } else {
        $script:VoiceEnabled = Install-VoiceDeps
    }
    
    if (-not $script:VoiceEnabled) {
        Write-Status "Running in TEXT MODE" "Warning"
    }
    
    # Start Sofie
    if (-not (Start-SofieService)) {
        Write-Status "Failed to start Sofie" "Error"
        exit 1
    }
    
    # Start chat
    try {
        Start-ChatInterface
    } finally {
        Stop-AllServices
    }
}

# Run
try {
    Main
} catch {
    Write-Status "Error: $_" "Error"
} finally {
    Stop-AllServices
}
