# S.A.N.D.I.R.O.N.R.A.T.I.O. - Single Window Ecosystem Launcher
# Voice + Text Interface with Progressive Activation
# Version: 1.0.0 - Production Ready
# ASCII ONLY - NO Unicode characters

# ============================================================================
# CONFIGURATION
# ============================================================================
$BaseDir = "C:\Users\squat\repos\sandironratio-node"
$SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$LogDir = "$BaseDir\logs"
# GitHub token - set as environment variable if needed: $env:GITHUB_TOKEN
$GitHubToken = $env:GITHUB_TOKEN

# Ports
$OllamaPort = 11434
$SofiePort = 8000
$HivePort = 3000
$CouncilPort = 9000

# Process tracking
$script:SofieProcess = $null
$script:HiveProcess = $null
$script:CouncilProcess = $null
$script:VoiceJob = $null
$script:VoiceEnabled = $false
$script:VoiceMode = $false

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================
function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $color = switch ($Type) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        "Info" { "White" }
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

function Test-HealthEndpoint {
    param([string]$Url, [int]$TimeoutSec = 3)
    try {
        $response = Invoke-RestMethod -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Wait-ForService {
    param(
        [string]$Name,
        [int]$Port,
        [string]$HealthUrl = $null,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )
    Write-Status "Waiting for $Name to start..." "Info"
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        $progress = [math]::Floor(($i / $MaxAttempts) * 100)
        Write-Host "  Progress: $progress% (attempt $i/$MaxAttempts)" -ForegroundColor Gray -NoNewline
        Write-Host "`r" -NoNewline
        
        $isReady = $false
        
        # Try health endpoint first
        if ($HealthUrl) {
            if (Test-HealthEndpoint -Url $HealthUrl -TimeoutSec 2) {
                $isReady = $true
            }
        }
        # Fallback to port check
        elseif (Test-Port -Port $Port) {
            $isReady = $true
        }
        
        if ($isReady) {
            Write-Host "`r                                      `r" -NoNewline
            Write-Status "$Name is ONLINE (port $Port)" "Success"
            return $true
        }
        
        Start-Sleep -Seconds $DelaySeconds
    }
    
    Write-Host "`r                                      `r" -NoNewline
    Write-Status "$Name failed to start within timeout" "Error"
    return $false
}

# ============================================================================
# FFMPEG INSTALLATION
# ============================================================================
function Install-Ffmpeg {
    Write-Header "CHECKING FFMPEG (Voice Requirement)"
    
    # Check if ffmpeg exists
    $ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue
    
    if ($ffmpegPath) {
        $version = & ffmpeg -version 2>&1 | Select-Object -First 1
        Write-Status "FFmpeg found: $version" "Success"
        return $true
    }
    
    Write-Status "FFmpeg NOT found - Voice interface requires FFmpeg" "Warning"
    Write-Status "Installing FFmpeg via Chocolatey..." "Info"
    
    # Check if chocolatey is available
    $choco = Get-Command choco -ErrorAction SilentlyContinue
    
    if (-not $choco) {
        Write-Status "Chocolatey not found. Installing Chocolatey first..." "Warning"
        try {
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            $env:PATH = "$env:PATH;$env:ALLUSERSPROFILE\chocolatey\bin"
            Write-Status "Chocolatey installed successfully" "Success"
        } catch {
            Write-Status "Failed to install Chocolatey: $_" "Error"
            return $false
        }
    }
    
    # Install ffmpeg
    try {
        Write-Status "Downloading and installing FFmpeg (this may take a few minutes)..." "Info"
        $result = Start-Process -FilePath "choco" -ArgumentList "install", "ffmpeg", "-y", "--no-progress" -Wait -PassThru -WindowStyle Hidden
        
        if ($result.ExitCode -eq 0) {
            # Refresh environment
            $env:PATH = "$env:PATH;$env:ALLUSERSPROFILE\chocolatey\bin;C:\ProgramData\chocolatey\bin"
            
            # Verify installation
            $ffmpegCheck = Get-Command ffmpeg -ErrorAction SilentlyContinue
            if ($ffmpegCheck) {
                $version = & ffmpeg -version 2>&1 | Select-Object -First 1
                Write-Status "FFmpeg installed: $version" "Success"
                return $true
            }
        }
        
        Write-Status "FFmpeg installation may have failed" "Warning"
        return $false
    } catch {
        Write-Status "Failed to install FFmpeg: $_" "Error"
        return $false
    }
}

# ============================================================================
# OLLAMA MANAGEMENT
# ============================================================================
function Start-OllamaService {
    Write-Header "CHECKING OLLAMA"
    
    if (Test-Port -Port $OllamaPort) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$OllamaPort/api/tags" -UseBasicParsing -TimeoutSec 3
            $modelCount = ($response.models | Measure-Object).Count
            Write-Status "Ollama is running with $modelCount model(s)" "Success"
            return $true
        } catch {
            Write-Status "Ollama port responds but API check failed" "Warning"
            return $true
        }
    }
    
    Write-Status "Ollama not running - attempting to start..." "Warning"
    
    try {
        # Try to start ollama
        $ollamaProcess = Start-Process -FilePath "ollama" -ArgumentList "serve" -PassThru -WindowStyle Hidden
        
        # Wait for it to be ready
        $ready = Wait-ForService -Name "Ollama" -Port $OllamaPort -MaxAttempts 20
        
        if ($ready) {
            Write-Status "Ollama started successfully" "Success"
            return $true
        } else {
            Write-Status "Ollama failed to start. Please start manually: ollama serve" "Error"
            return $false
        }
    } catch {
        Write-Status "Failed to start Ollama: $_" "Error"
        Write-Status "Please start Ollama manually in another terminal: ollama serve" "Error"
        return $false
    }
}

# ============================================================================
# SOFIE MANAGEMENT
# ============================================================================
function Start-SofieService {
    Write-Header "STARTING SOFIE (Sovereign Interface)"
    
    # Check if already running
    if (Test-Port -Port $SofiePort) {
        Write-Status "Sofie is already running on port $SofiePort" "Success"
        return $true
    }
    
    # Ensure log directory exists
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    $logFile = "$LogDir\sofie_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
    
    # Check for main.py in different locations
    $mainPyPath = "$SofieDir\src\main.py"
    if (-not (Test-Path $mainPyPath)) {
        $mainPyPath = "$SofieDir\sofie_api.py"
    }
    
    if (-not (Test-Path $mainPyPath)) {
        Write-Status "Could not find Sofie main file (tried src/main.py and sofie_api.py)" "Error"
        return $false
    }
    
    Write-Status "Starting Sofie from: $mainPyPath" "Info"
    Write-Status "Logs: $logFile" "Info"
    
    try {
        # Setup environment
        $env:USE_OLLAMA = "true"
        $env:OLLAMA_MODEL = "llama3.1:8b"
        $env:HIVE_API_URL = "http://localhost:$HivePort"
        
        # Determine how to run Sofie
        if ($mainPyPath -like "*sofie_api.py") {
            # Direct API mode
            $script:SofieProcess = Start-Process -FilePath "python" `
                -ArgumentList "`"$mainPyPath`"" `
                -WorkingDirectory $SofieDir `
                -RedirectStandardOutput $logFile `
                -RedirectStandardError $logFile `
                -PassThru -WindowStyle Hidden
        } else {
            # CLI mode with server
            $script:SofieProcess = Start-Process -FilePath "python" `
                -ArgumentList "`"$mainPyPath`"", "--mode=chief" `
                -WorkingDirectory $SofieDir `
                -RedirectStandardOutput $logFile `
                -RedirectStandardError $logFile `
                -PassThru -WindowStyle Hidden
        }
        
        Write-Status "Sofie process started (PID: $($script:SofieProcess.Id))" "Info"
        
        # Wait for health check
        $ready = Wait-ForService -Name "Sofie" -Port $SofiePort -HealthUrl "http://localhost:$SofiePort/health" -MaxAttempts 30
        
        if ($ready) {
            Write-Status "Sofie is ready for commands" "Success"
            return $true
        } else {
            Write-Status "Sofie process started but health check failed" "Warning"
            Write-Status "Check logs: $logFile" "Info"
            return $false
        }
    } catch {
        Write-Status "Failed to start Sofie: $_" "Error"
        Write-Status "Check logs: $logFile" "Info"
        return $false
    }
}

function Stop-SofieService {
    if ($script:SofieProcess -and -not $script:SofieProcess.HasExited) {
        Write-Status "Stopping Sofie (PID: $($script:SofieProcess.Id))..." "Info"
        try {
            Stop-Process -Id $script:SofieProcess.Id -Force -ErrorAction SilentlyContinue
            Write-Status "Sofie stopped" "Success"
        } catch {
            Write-Status "Error stopping Sofie: $_" "Warning"
        }
    }
    
    # Also kill any python processes on port 8000
    try {
        $connections = Get-NetTCPConnection -LocalPort $SofiePort -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process -and $process.Name -like "*python*") {
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

# ============================================================================
# HIVE MANAGEMENT
# ============================================================================
function Start-HiveService {
    Write-Header "STARTING HIVE (Terracare Ledger)"
    
    if (Test-Port -Port $HivePort) {
        Write-Status "Hive is already running on port $HivePort" "Success"
        return $true
    }
    
    $logFile = "$LogDir\hive_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
    
    Write-Status "Initializing Terracare Ledger..." "Info"
    Write-Status "Logs: $logFile" "Info"
    
    try {
        $env:NODE_ENV = "development"
        
        $script:HiveProcess = Start-Process -FilePath "npx" `
            -ArgumentList "tsx", "watch", "awaken.ts" `
            -WorkingDirectory $BaseDir `
            -RedirectStandardOutput $logFile `
            -RedirectStandardError $logFile `
            -PassThru -WindowStyle Hidden
        
        Write-Status "Hive process started (PID: $($script:HiveProcess.Id))" "Info"
        
        $ready = Wait-ForService -Name "Hive" -Port $HivePort -MaxAttempts 30
        
        if ($ready) {
            Write-Status "Terracare Ledger is online" "Success"
            return $true
        } else {
            Write-Status "Hive may still be starting (check logs)" "Warning"
            Write-Status "Logs: $logFile" "Info"
            return $true
        }
    } catch {
        Write-Status "Failed to start Hive: $_" "Error"
        Write-Status "Logs: $logFile" "Info"
        return $false
    }
}

function Stop-HiveService {
    if ($script:HiveProcess -and -not $script:HiveProcess.HasExited) {
        Write-Status "Stopping Hive (PID: $($script:HiveProcess.Id))..." "Info"
        try {
            Stop-Process -Id $script:HiveProcess.Id -Force -ErrorAction SilentlyContinue
            Write-Status "Hive stopped" "Success"
        } catch {
            Write-Status "Error stopping Hive: $_" "Warning"
        }
    }
    
    # Kill any node processes on port 3000
    try {
        $connections = Get-NetTCPConnection -LocalPort $HivePort -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process -and ($process.Name -like "*node*" -or $process.Name -like "*tsx*")) {
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

# ============================================================================
# COUNCIL MANAGEMENT
# ============================================================================
function Start-CouncilService {
    Write-Header "STARTING COUNCIL (6 Agents)"
    
    if (Test-Port -Port $CouncilPort) {
        Write-Status "Council is already running on port $CouncilPort" "Success"
        return $true
    }
    
    $logFile = "$LogDir\council_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
    
    Write-Status "Summoning the Council..." "Info"
    Write-Status "Logs: $logFile" "Info"
    
    try {
        # Check for council api server
        $councilPath = "$BaseDir\src\council\api_server.py"
        if (-not (Test-Path $councilPath)) {
            Write-Status "Council server not found at expected path" "Warning"
            Write-Status "Looking for alternative entry points..." "Info"
            
            # Look for any Python council files
            $councilFiles = Get-ChildItem -Path $BaseDir -Filter "*council*.py" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($councilFiles) {
                $councilPath = $councilFiles.FullName
            } else {
                Write-Status "Council service not available (this is optional)" "Warning"
                return $true
            }
        }
        
        $script:CouncilProcess = Start-Process -FilePath "python" `
            -ArgumentList "-m", "src.council.api_server" `
            -WorkingDirectory $BaseDir `
            -RedirectStandardOutput $logFile `
            -RedirectStandardError $logFile `
            -PassThru -WindowStyle Hidden
        
        Write-Status "Council process started (PID: $($script:CouncilProcess.Id))" "Info"
        
        $ready = Wait-ForService -Name "Council" -Port $CouncilPort -MaxAttempts 20
        
        if ($ready) {
            Write-Status "The 6 agents await your command" "Success"
            return $true
        } else {
            Write-Status "Council may still be initializing" "Warning"
            return $true
        }
    } catch {
        Write-Status "Failed to start Council: $_" "Error"
        Write-Status "Council is optional - continuing..." "Warning"
        return $true
    }
}

function Stop-CouncilService {
    if ($script:CouncilProcess -and -not $script:CouncilProcess.HasExited) {
        Write-Status "Stopping Council (PID: $($script:CouncilProcess.Id))..." "Info"
        try {
            Stop-Process -Id $script:CouncilProcess.Id -Force -ErrorAction SilentlyContinue
            Write-Status "Council stopped" "Success"
        } catch {
            Write-Status "Error stopping Council: $_" "Warning"
        }
    }
    
    # Kill any python processes on port 9000
    try {
        $connections = Get-NetTCPConnection -LocalPort $CouncilPort -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process -and $process.Name -like "*python*") {
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

# ============================================================================
# VOICE INTERFACE
# ============================================================================
function Start-VoiceListener {
    param([scriptblock]$CommandCallback)
    
    Write-Header "INITIALIZING VOICE INTERFACE"
    
    # Check if voice is available
    $voskAvailable = $false
    try {
        $voskCheck = python -c "import vosk" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $voskAvailable = $true
        }
    } catch {}
    
    if (-not $voskAvailable) {
        Write-Status "Vosk not installed. Voice commands unavailable." "Warning"
        Write-Status "Install with: pip install vosk speechrecognition pyaudio" "Info"
        return $null
    }
    
    Write-Status "Voice recognition available" "Success"
    Write-Status "Voice mode: Say 'Sofie' to activate" "Info"
    
    # Create voice listener job
    $voiceJobScript = @"
import sys
import os
sys.path.insert(0, '$SofieDir')

try:
    import speech_recognition as sr
    import time
    
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()
    
    # Calibrate for ambient noise
    with microphone as source:
        recognizer.adjust_for_ambient_noise(source, duration=1)
    
    print("VOICE_READY")
    
    while True:
        try:
            with microphone as source:
                audio = recognizer.listen(source, timeout=1, phrase_time_limit=5)
            
            text = recognizer.recognize_google(audio).lower()
            print(f"HEARD: {text}")
            
        except sr.WaitTimeoutError:
            continue
        except sr.UnknownValueError:
            continue
        except sr.RequestError as e:
            print(f"ERROR: {e}")
            time.sleep(1)
        except Exception as e:
            print(f"ERROR: {e}")
            time.sleep(1)
            
except Exception as e:
    print(f"FATAL: {e}")
    sys.exit(1)
"@
    
    try {
        $job = Start-Job -ScriptBlock {
            param($script)
            python -c $script 2>&1
        } -ArgumentList $voiceJobScript
        
        # Wait for initialization
        $timeout = 10
        $startTime = Get-Date
        while (((Get-Date) - $startTime).TotalSeconds -lt $timeout) {
            $output = Receive-Job -Job $job
            if ($output -contains "VOICE_READY") {
                Write-Status "Voice listener active" "Success"
                return $job
            }
            if ($output -match "ERROR|FATAL") {
                Write-Status "Voice initialization failed" "Error"
                Stop-Job -Job $job -ErrorAction SilentlyContinue
                Remove-Job -Job $job -ErrorAction SilentlyContinue
                return $null
            }
            Start-Sleep -Milliseconds 500
        }
        
        Write-Status "Voice listener timeout - using text mode only" "Warning"
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -ErrorAction SilentlyContinue
        return $null
    } catch {
        Write-Status "Failed to start voice: $_" "Error"
        return $null
    }
}

function Stop-VoiceListener {
    if ($script:VoiceJob) {
        Stop-Job -Job $script:VoiceJob -ErrorAction SilentlyContinue
        Remove-Job -Job $script:VoiceJob -ErrorAction SilentlyContinue
        $script:VoiceJob = $null
    }
}

function Get-VoiceInput {
    if (-not $script:VoiceJob) { return $null }
    
    $output = Receive-Job -Job $script:VoiceJob
    foreach ($line in $output) {
        if ($line -match "HEARD: (.+)") {
            return $matches[1]
        }
    }
    return $null
}

# ============================================================================
# STATUS DISPLAY
# ============================================================================
function Show-Status {
    Write-Header "SYSTEM STATUS"
    
    # Check each service with retries for accuracy
    $services = @(
        @{ Name = "Ollama"; Port = $OllamaPort; Url = "http://localhost:$OllamaPort/api/tags" },
        @{ Name = "Sofie"; Port = $SofiePort; Url = "http://localhost:$SofiePort/health" },
        @{ Name = "Hive"; Port = $HivePort; Url = $null },
        @{ Name = "Council"; Port = $CouncilPort; Url = $null }
    )
    
    foreach ($svc in $services) {
        $status = "OFF"
        $color = "Red"
        $retries = 0
        $maxRetries = 3
        
        # Retry logic for more accurate status
        while ($retries -lt $maxRetries) {
            $isUp = $false
            
            if ($svc.Url) {
                $isUp = Test-HealthEndpoint -Url $svc.Url -TimeoutSec 2
            } else {
                $isUp = Test-Port -Port $svc.Port -TimeoutSec 2
            }
            
            if ($isUp) {
                $status = "ONLINE"
                $color = "Green"
                break
            }
            
            $retries++
            if ($retries -lt $maxRetries) {
                Start-Sleep -Milliseconds 500
            }
        }
        
        # Special handling for optional services
        if ($svc.Name -eq "Hive" -and -not $script:HiveProcess) {
            $status = "STANDBY (type 'Enter the hive')"
            $color = "Gray"
        }
        if ($svc.Name -eq "Council" -and -not $script:CouncilProcess) {
            $status = "STANDBY (type 'Convene council')"
            $color = "Gray"
        }
        
        Write-Host "  [$($svc.Name.PadRight(8))] " -NoNewline
        Write-Host $status -ForegroundColor $color
    }
    
    # Show process PIDs if running
    Write-Host ""
    Write-Host "  Process Details:" -ForegroundColor Cyan
    if ($script:SofieProcess -and -not $script:SofieProcess.HasExited) {
        Write-Host "    Sofie:   PID $($script:SofieProcess.Id)" -ForegroundColor Gray
    }
    if ($script:HiveProcess -and -not $script:HiveProcess.HasExited) {
        Write-Host "    Hive:    PID $($script:HiveProcess.Id)" -ForegroundColor Gray
    }
    if ($script:CouncilProcess -and -not $script:CouncilProcess.HasExited) {
        Write-Host "    Council: PID $($script:CouncilProcess.Id)" -ForegroundColor Gray
    }
}

# ============================================================================
# SHUTDOWN
# ============================================================================
function Stop-AllServices {
    Write-Header "SHUTTING DOWN"
    
    Stop-CouncilService
    Stop-HiveService
    Stop-SofieService
    Stop-VoiceListener
    
    Write-Host ""
    Write-Status "All systems offline. The Dude abides." "Success"
}

# ============================================================================
# MAIN INTERACTIVE LOOP
# ============================================================================
function Start-InteractiveMode {
    Write-Header "INTERACTIVE MODE READY"
    
    Write-Host "Commands available:" -ForegroundColor Cyan
    Write-Host "  'Sofie' or 'Wake'    - Activate voice/text mode" -ForegroundColor White
    Write-Host "  'Enter the hive'     - Start Terracare Ledger" -ForegroundColor White
    Write-Host "  'Convene council'    - Summon the 6 agents" -ForegroundColor White
    Write-Host "  'Status'             - Check all systems" -ForegroundColor White
    Write-Host "  'Stop' or 'Exit'     - Shutdown everything" -ForegroundColor White
    Write-Host ""
    
    if ($script:VoiceEnabled) {
        Write-Status "Voice mode: ACTIVE (say 'Sofie' to wake)" "Success"
    } else {
        Write-Status "Voice mode: UNAVAILABLE (text mode only)" "Warning"
    }
    
    $activeMode = $false
    $lastVoiceCheck = Get-Date
    
    while ($true) {
        # Check for voice input periodically (every 500ms)
        $voiceInput = $null
        if ($script:VoiceEnabled -and $script:VoiceJob -and ((Get-Date) - $lastVoiceCheck).TotalMilliseconds -gt 500) {
            $voiceInput = Get-VoiceInput
            $lastVoiceCheck = Get-Date
        }
        
        # Determine input source
        $input = $null
        if ($voiceInput) {
            Write-Host ""
            Write-Status "Voice heard: '$voiceInput'" "Info"
            $input = $voiceInput
        }
        
        # Show prompt
        if (-not $input) {
            if ($activeMode) {
                Write-Host "SOFIE> " -ForegroundColor Cyan -NoNewline
            } else {
                Write-Host "DUDE> " -ForegroundColor Yellow -NoNewline
            }
            $input = Read-Host
        }
        
        $input = $input.Trim().ToLower()
        
        # Skip empty input
        if ([string]::IsNullOrWhiteSpace($input)) { continue }
        
        # WAKE WORDS
        if ($input -match "^sofie|^wake|^hey") {
            $activeMode = $true
            Write-Status "Sofie is listening. How can I help?" "Success"
            continue
        }
        
        # ENTER THE HIVE
        if ($input -eq "enter the hive" -or $input -eq "hive" -or $input -eq "start hive") {
            Start-HiveService
            $activeMode = $false
            continue
        }
        
        # CONVENE COUNCIL
        if ($input -eq "convene council" -or $input -eq "council" -or $input -eq "start council") {
            if (-not (Test-Port -Port $HivePort)) {
                Write-Status "Hive must be running first. Say 'Enter the hive'" "Warning"
                continue
            }
            Start-CouncilService
            $activeMode = $false
            continue
        }
        
        # STATUS
        if ($input -eq "status" -or $input -eq "check" -or $input -eq "state") {
            Show-Status
            $activeMode = $false
            continue
        }
        
        # STOP / EXIT
        if ($input -eq "stop" -or $input -eq "exit" -or $input -eq "quit" -or $input -eq "shutdown") {
            Stop-AllServices
            exit 0
        }
        
        # HELP
        if ($input -eq "help" -or $input -eq "?") {
            Write-Host ""
            Write-Host "Available commands:" -ForegroundColor Cyan
            Write-Host "  'Sofie', 'Wake'      - Activate listening mode" -ForegroundColor White
            Write-Host "  'Enter the hive'     - Start Hive (port 3000)" -ForegroundColor White
            Write-Host "  'Convene council'    - Start Council (port 9000)" -ForegroundColor White
            Write-Host "  'Status'             - Show system status" -ForegroundColor White
            Write-Host "  'Stop', 'Exit'       - Shutdown all services" -ForegroundColor White
            Write-Host "  'Help', '?'          - Show this help" -ForegroundColor White
            $activeMode = $false
            continue
        }
        
        # Unknown command
        if ($activeMode) {
            Write-Status "I heard: '$input'. Try 'Enter the hive' or 'Status'" "Warning"
        } else {
            Write-Status "Unknown command: '$input'. Type 'help' for options." "Warning"
        }
    }
}

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================
function Main {
    # Setup
    $ErrorActionPreference = "Continue"
    $ProgressPreference = "SilentlyContinue"
    
    # Clear screen and show banner
    Clear-Host
    Write-Header "S.A.N.D.I.R.O.N.R.A.T.I.O. ECOSYSTEM LAUNCHER"
    Write-Host "  Single Window | Voice + Text | Progressive Activation" -ForegroundColor Gray
    Write-Host "  Version 1.0.0 | Production Ready" -ForegroundColor Gray
    
    # Ensure log directory exists
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    # Phase 1: Install/check ffmpeg
    $ffmpegOK = Install-Ffmpeg
    $script:VoiceEnabled = $ffmpegOK
    
    # Phase 2: Start Ollama
    $ollamaOK = Start-OllamaService
    if (-not $ollamaOK) {
        Write-Status "Ollama is required. Exiting." "Error"
        exit 1
    }
    
    # Phase 3: Start Sofie
    $sofieOK = Start-SofieService
    if (-not $sofieOK) {
        Write-Status "Sofie failed to start. Check logs." "Error"
        # Continue anyway - user might want to debug
    }
    
    # Phase 4: Initialize voice (optional)
    if ($script:VoiceEnabled) {
        $script:VoiceJob = Start-VoiceListener
        if ($script:VoiceJob) {
            $script:VoiceEnabled = $true
        } else {
            $script:VoiceEnabled = $false
        }
    }
    
    # Phase 5: Start interactive mode
    Start-InteractiveMode
}

# Handle Ctrl+C gracefully
[Console]::TreatControlCAsInput = $true

# Run main
Main
