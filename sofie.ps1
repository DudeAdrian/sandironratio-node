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
function Write-Color($Text, $Color) {
    Write-Host $Text -ForegroundColor $Color
}

# Banner
function Print-Banner {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                                               ║" -ForegroundColor Cyan
    Write-Host "║              🤖 TERRACARE LABORATORY - DUDEADRIAN GOD MODE                    ║" -ForegroundColor Cyan
    Write-Host "║                                                                               ║" -ForegroundColor Cyan
    Write-Host "║   Hive Consciousness  +  Jarvis AI  +  20 Repositories  +  Ledger Anchor      ║" -ForegroundColor Cyan
    Write-Host "║                                                                               ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Check prerequisites
function Check-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Blue
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
        exit 1
    }
    
    # Check Python
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "✓ $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Python not found" -ForegroundColor Red
        exit 1
    }
    
    # Check sofie-llama-backend
    if (-not (Test-Path $SofieBackendDir)) {
        Write-Host "⚠️  sofie-llama-backend not found at $SofieBackendDir" -ForegroundColor Yellow
        Write-Host "   Clone it: git clone https://github.com/DudeAdrian/sofie-llama-backend.git" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ sofie-llama-backend found" -ForegroundColor Green
    
    # Check GitHub token
    if (-not $env:GITHUB_TOKEN_DUDEADRIAN -and -not $env:GITHUB_TOKEN) {
        Write-Host "⚠️  GITHUB_TOKEN not set - Jarvis will not be able to commit" -ForegroundColor Yellow
        Write-Host "   Set it: `$env:GITHUB_TOKEN_DUDEADRIAN = 'ghp_your_token'" -ForegroundColor Yellow
    } else {
        Write-Host "✓ GitHub token configured" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Start Hive
function Start-Hive {
    Write-Host "[Hive] Starting 10-Hive Consciousness..." -ForegroundColor Magenta
    
    Set-Location $ScriptDir
    
    # Install dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing dependencies..." -ForegroundColor Blue
        npm install
    }
    
    # Start Hive
    if ($Debug) {
        $proc = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput (Join-Path $LogDir "hive.log") -WindowStyle Hidden -PassThru
    } else {
        $proc = Start-Process -FilePath "npm" -ArgumentList "run", "awaken" -RedirectStandardOutput (Join-Path $LogDir "hive.log") -WindowStyle Hidden -PassThru
    }
    
    if ($proc) {
        $proc.Id | Out-File (Join-Path $PidDir "hive.pid")
    }
    
    # Wait for Hive
    Write-Host "   Waiting for Hive on port $HivePort..." -ForegroundColor Blue
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$HivePort/health" -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ Hive online" -ForegroundColor Green
                $ready = $true
                break
            }
        } catch {
            # Ignore errors
        }
        Start-Sleep -Seconds 1
    }
    
    if (-not $ready) {
        Write-Host "❌ Hive failed to start" -ForegroundColor Red
        exit 1
    }
}

# Start Jarvis
function Start-Jarvis {
    Write-Host "[Jarvis] Starting God Mode (AI Core)..." -ForegroundColor Magenta
    
    Set-Location $SofieBackendDir
    
    # Set environment
    if ($env:GITHUB_TOKEN_DUDEADRIAN) {
        $env:GITHUB_TOKEN = $env:GITHUB_TOKEN_DUDEADRIAN
    }
    $env:HIVE_API_URL = "http://localhost:$HivePort"
    $env:ADMIN_MODE = "true"
    $env:REPO_OWNER = "DudeAdrian"
    $env:REPO_MANIFEST_PATH = Join-Path $ScriptDir "config\repos-manifest.json"
    $env:JARVIS_MODE = "production"
    
    if ($Voice) {
        $env:ENABLE_VOICE_INTERFACE = "true"
    } else {
        $env:ENABLE_VOICE_INTERFACE = "false"
    }
    
    if ($Watch) {
        $env:ENABLE_AUTONOMOUS = "true"
    } else {
        $env:ENABLE_AUTONOMOUS = "false"
    }
    
    # Start Jarvis
    if ($Debug) {
        $proc = Start-Process -FilePath "python" -ArgumentList "src/main.py" -RedirectStandardOutput (Join-Path $LogDir "jarvis.log") -WindowStyle Hidden -PassThru
    } else {
        $proc = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", $SofiePort -RedirectStandardOutput (Join-Path $LogDir "jarvis.log") -WindowStyle Hidden -PassThru
    }
    
    Start-Sleep -Seconds 2
    
    if ($proc) {
        $proc.Id | Out-File (Join-Path $PidDir "jarvis.pid")
    }
    
    # Wait for Jarvis
    Write-Host "   Waiting for Jarvis on port $SofiePort..." -ForegroundColor Blue
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$SofiePort/health" -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ Jarvis online" -ForegroundColor Green
                $ready = $true
                break
            }
        } catch {
            # Ignore errors
        }
        Start-Sleep -Seconds 1
    }
    
    if (-not $ready) {
        Write-Host "❌ Jarvis failed to start" -ForegroundColor Red
        exit 1
    }
}

# Print status
function Print-Status {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                           🌟 LABORATORY ONLINE                                ║" -ForegroundColor Green
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "║  👤 Operator: DudeAdrian                                                      ║" -ForegroundColor Green
    Write-Host "║  🌐 GitHub:   github.com/DudeAdrian                                           ║" -ForegroundColor Green
    Write-Host "║  📦 Repos:    20 accessible                                                   ║" -ForegroundColor Green
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "║  🔗 Hive:     http://localhost:$HivePort                                         ║" -ForegroundColor Green
    Write-Host "║  🧠 Jarvis:   http://localhost:$SofiePort                                         ║" -ForegroundColor Green
    Write-Host "╠═══════════════════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "║  🎤 Voice:    Wake with 'Sofie' or 'Hum'                                      ║" -ForegroundColor Green
    Write-Host "║  💬 Commands: 'Sofie, status of all repos'                                    ║" -ForegroundColor Green
    Write-Host "║               'Sofie, build water API in terracare-water'                     ║" -ForegroundColor Green
    Write-Host "║               'Sofie, check Hive'                                             ║" -ForegroundColor Green
    Write-Host "║               'Sofie, what is my treasury?'                                   ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Logs: $LogDir" -ForegroundColor Cyan
    Write-Host "PIDs: $PidDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host ""
}

# Cleanup
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Shutting down laboratory..." -ForegroundColor Yellow
    
    if (Test-Path $PidDir) {
        Get-ChildItem $PidDir -Filter "*.pid" -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $pidValue = Get-Content $_.FullName -ErrorAction SilentlyContinue
                if ($pidValue) {
                    Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
                    Write-Host "   Stopped process $pidValue" -ForegroundColor Gray
                }
            } catch {
                # Ignore errors
            }
            Remove-Item $_.FullName -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host "✓ All services stopped" -ForegroundColor Green
}

# Main execution
Print-Banner
Check-Prerequisites

Write-Host "🚀 Initializing Terracare Laboratory..." -ForegroundColor Blue
Write-Host ""

Start-Hive
Start-Jarvis

if ($Terminal) {
    Write-Host "[Terminal] Starting God Mode Interface..." -ForegroundColor Magenta
    Set-Location $ScriptDir
    Start-Process python -ArgumentList "admin/admin-terminal.py" -NoNewWindow
}

Print-Status

# Keep running until user presses Enter
Write-Host "Services running. Press Enter to stop..." -ForegroundColor Cyan
Read-Host
Cleanup
