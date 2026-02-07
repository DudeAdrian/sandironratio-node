#
# ═══════════════════════════════════════════════════════════════════════════════
# sofie.ps1 - DudeAdrian God Mode Launcher (Windows)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Unified laboratory operation for the Terracare ecosystem
# Launches both Hive (sandironratio-node) and Jarvis (sofie-llama-backend)
#
# Usage:
#   .\sofie.ps1              # Start God Mode
#   .\sofie.ps1 -Terminal    # Start with admin terminal UI
#   .\sofie.ps1 -Voice       # Start with voice mode enabled
#   .\sofie.ps1 -Watch       # Start autonomous watch mode
#
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$Terminal,
    [switch]$Voice,
    [switch]$Watch,
    [switch]$Debug,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\sofie.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Terminal    Launch with admin terminal UI"
    Write-Host "  -Voice       Enable voice command mode"
    Write-Host "  -Watch       Enable autonomous watch mode"
    Write-Host "  -Debug       Enable debug logging"
    Write-Host "  -Help        Show this help"
    exit 0
}

# Configuration
$ScriptDir = $PSScriptRoot
$SofieBackendDir = Join-Path $ScriptDir "..\sofie-llama-backend"
$HivePort = 3000
$SofiePort = 8000
$LogDir = Join-Path $ScriptDir "logs"
$PidDir = Join-Path $ScriptDir ".pids"

# Create directories
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $PidDir | Out-Null

# Colors
function Write-Color($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

# Banner
function Print-Banner {
    Write-Color @"
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║              🤖 TERRACARE LABORATORY - DUDEADRIAN GOD MODE                    ║
║                                                                               ║
║   Hive Consciousness  +  Jarvis AI  +  20 Repositories  +  Ledger Anchor      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"@ "Cyan"
}

# Check prerequisites
function Check-Prerequisites {
    Write-Color "🔍 Checking prerequisites..." "Blue"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Color "✓ Node.js $nodeVersion" "Green"
    } catch {
        Write-Color "❌ Node.js not found" "Red"
        exit 1
    }
    
    # Check Python
    try {
        $pythonVersion = python --version 2>&1
        Write-Color "✓ $pythonVersion" "Green"
    } catch {
        Write-Color "❌ Python not found" "Red"
        exit 1
    }
    
    # Check sofie-llama-backend
    if (-not (Test-Path $SofieBackendDir)) {
        Write-Color "⚠️  sofie-llama-backend not found at $SofieBackendDir" "Yellow"
        Write-Color "   Clone it: git clone https://github.com/DudeAdrian/sofie-llama-backend.git" "Yellow"
        exit 1
    }
    Write-Color "✓ sofie-llama-backend found" "Green"
    
    # Check GitHub token
    if (-not $env:GITHUB_TOKEN_DUDEADRIAN -and -not $env:GITHUB_TOKEN) {
        Write-Color "⚠️  GITHUB_TOKEN not set - Jarvis will not be able to commit" "Yellow"
        Write-Color "   Set it: `$env:GITHUB_TOKEN_DUDEADRIAN = 'ghp_your_token'" "Yellow"
    } else {
        Write-Color "✓ GitHub token configured" "Green"
    }
    
    Write-Host ""
}

# Start Hive
function Start-Hive {
    Write-Color "[Hive] Starting 10-Hive Consciousness..." "Magenta"
    
    Set-Location $ScriptDir
    
    # Install dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Color "   Installing dependencies..." "Blue"
        npm install
    }
    
    # Start Hive
    if ($Debug) {
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput (Join-Path $LogDir "hive.log") -WindowStyle Hidden
    } else {
        Start-Process -FilePath "npm" -ArgumentList "run", "awaken" -RedirectStandardOutput (Join-Path $LogDir "hive.log") -WindowStyle Hidden
    }
    
    $hivePid = (Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object -First 1).Id
    if ($hivePid) {
        $hivePid | Out-File (Join-Path $PidDir "hive.pid")
    }
    
    # Wait for Hive
    Write-Color "   Waiting for Hive on port $HivePort..." "Blue"
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$HivePort/health" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Color "✓ Hive online" "Green"
                return
            }
        } catch {}
        Start-Sleep -Seconds 1
    }
    
    Write-Color "❌ Hive failed to start" "Red"
    exit 1
}

# Start Jarvis
function Start-Jarvis {
    Write-Color "[Jarvis] Starting God Mode (AI Core)..." "Magenta"
    
    Set-Location $SofieBackendDir
    
    # Set environment
    $env:GITHUB_TOKEN = if ($env:GITHUB_TOKEN_DUDEADRIAN) { $env:GITHUB_TOKEN_DUDEADRIAN } else { $env:GITHUB_TOKEN }
    $env:HIVE_API_URL = "http://localhost:$HivePort"
    $env:ADMIN_MODE = "true"
    $env:REPO_OWNER = "DudeAdrian"
    $env:REPO_MANIFEST_PATH = Join-Path $ScriptDir "config\repos-manifest.json"
    $env:JARVIS_MODE = "production"
    $env:ENABLE_VOICE_INTERFACE = if ($Voice) { "true" } else { "false" }
    $env:ENABLE_AUTONOMOUS = if ($Watch) { "true" } else { "false" }
    
    # Start Jarvis
    if ($Debug) {
        Start-Process -FilePath "python" -ArgumentList "src/main.py" -RedirectStandardOutput (Join-Path $LogDir "jarvis.log") -WindowStyle Hidden
    } else {
        Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", $SofiePort -RedirectStandardOutput (Join-Path $LogDir "jarvis.log") -WindowStyle Hidden
    }
    
    Start-Sleep -Seconds 2
    $jarvisPid = (Get-Process -Name "python" -ErrorAction SilentlyContinue | Select-Object -First 1).Id
    if ($jarvisPid) {
        $jarvisPid | Out-File (Join-Path $PidDir "jarvis.pid")
    }
    
    # Wait for Jarvis
    Write-Color "   Waiting for Jarvis on port $SofiePort..." "Blue"
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$SofiePort/health" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Color "✓ Jarvis online" "Green"
                return
            }
        } catch {}
        Start-Sleep -Seconds 1
    }
    
    Write-Color "❌ Jarvis failed to start" "Red"
    exit 1
}

# Print status
function Print-Status {
    Write-Host ""
    Write-Color "╔═══════════════════════════════════════════════════════════════════════════════╗" "Green"
    Write-Color "║                           🌟 LABORATORY ONLINE                                ║" "Green"
    Write-Color "╠═══════════════════════════════════════════════════════════════════════════════╣" "Green"
    Write-Color "║  👤 Operator: DudeAdrian                                                      ║" "Green"
    Write-Color "║  🌐 GitHub:   github.com/DudeAdrian                                           ║" "Green"
    Write-Color "║  📦 Repos:    20 accessible                                                   ║" "Green"
    Write-Color "╠═══════════════════════════════════════════════════════════════════════════════╣" "Green"
    Write-Color "║  🔗 Hive:     http://localhost:$HivePort                                         ║" "Green"
    Write-Color "║  🧠 Jarvis:   http://localhost:$SofiePort                                         ║" "Green"
    Write-Color "╠═══════════════════════════════════════════════════════════════════════════════╣" "Green"
    Write-Color "║  🎤 Voice:    Wake with 'Sofie' or 'Hum'                                      ║" "Green"
    Write-Color "║  💬 Commands: 'Sofie, status of all repos'                                    ║" "Green"
    Write-Color "║               'Sofie, build water API in terracare-water'                     ║" "Green"
    Write-Color "║               'Sofie, check Hive'                                             ║" "Green"
    Write-Color "║               'Sofie, what is my treasury?'                                   ║" "Green"
    Write-Color "╚═══════════════════════════════════════════════════════════════════════════════╝" "Green"
    Write-Host ""
    Write-Color "Logs: $LogDir" "Cyan"
    Write-Color "PIDs: $PidDir" "Cyan"
    Write-Host ""
    Write-Color "Press Ctrl+C to stop all services" "Yellow"
    Write-Host ""
}

# Cleanup
function Cleanup {
    Write-Host ""
    Write-Color "🛑 Shutting down laboratory..." "Yellow"
    
    Get-ChildItem $PidDir -Filter "*.pid" | ForEach-Object {
        $pidValue = Get-Content $_.FullName
        try {
            Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
            Write-Color "   Stopped process $pidValue" "Gray"
        } catch {}
        Remove-Item $_.FullName
    }
    
    Write-Color "✓ All services stopped" "Green"
}

# Main
Print-Banner
Check-Prerequisites

Write-Color "🚀 Initializing Terracare Laboratory..." "Blue"
Write-Host ""

Start-Hive
Start-Jarvis

if ($Terminal) {
    Write-Color "[Terminal] Starting God Mode Interface..." "Magenta"
    Set-Location $ScriptDir
    Start-Process python -ArgumentList "admin/admin-terminal.py" -NoNewWindow
}

Print-Status

# Keep running
Write-Color "Services running. Press Enter to stop..." "Cyan"
Read-Host
Cleanup
