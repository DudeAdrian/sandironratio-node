# SandIronRatio Ecosystem Launcher
# Simple inline script - NO functions, NO Unicode, ASCII only

# ============================================================================
# CONFIGURATION
# ============================================================================
$BaseDir = "C:\Users\squat\repos\sandironratio-node"
$SofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$GitHubToken = $env:GITHUB_TOKEN

# Process trackers
$ollamaProc = $null
$hiveProc = $null
$sofieProc = $null
$councilProc = $null

# ============================================================================
# CLEAR SCREEN AND SHOW HEADER
# ============================================================================
Clear-Host
Write-Host "==================================================="
Write-Host "    SANDIRONRATIO ECOSYSTEM LAUNCHER"
Write-Host "    The Dude <-> Council <-> Sofie <-> Hive"
Write-Host "==================================================="
Write-Host ""

# ============================================================================
# CHECK OLLAMA
# ============================================================================
Write-Host "Checking Ollama... " -NoNewline
$ollamaOK = $false
try {
    Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2 | Out-Null
    $ollamaOK = $true
    Write-Host "ALREADY RUNNING" -ForegroundColor Green
} catch {
    Write-Host "STARTING..." -ForegroundColor Yellow
    try {
        $ollamaProc = Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden -PassThru
        Start-Sleep -Seconds 3
        Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2 | Out-Null
        $ollamaOK = $true
        Write-Host "  Ollama ready" -ForegroundColor Green
    } catch {
        Write-Host "  FAILED to start Ollama" -ForegroundColor Red
    }
}

# ============================================================================
# START HIVE
# ============================================================================
Write-Host "Starting Hive... " -NoNewline
$hiveOK = $false
try {
    Invoke-RestMethod -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
    $hiveOK = $true
    Write-Host "ALREADY RUNNING" -ForegroundColor Green
} catch {
    $hiveCmd = "cd `"$BaseDir`"; `$env:NODE_ENV='development'; npm run dev"
    $hiveProc = Start-Process -FilePath "powershell" -ArgumentList "-Command", $hiveCmd -WindowStyle Hidden -PassThru
    
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            Invoke-RestMethod -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
            $hiveOK = $true
            break
        } catch {}
    }
    
    if ($hiveOK) {
        Write-Host "READY on port 3000" -ForegroundColor Green
    } else {
        Write-Host "TIMEOUT" -ForegroundColor Red
    }
}

# ============================================================================
# START SOFIE
# ============================================================================
Write-Host "Starting Sofie... " -NoNewline
$sofieOK = $false
try {
    Invoke-RestMethod -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
    $sofieOK = $true
    Write-Host "ALREADY RUNNING" -ForegroundColor Green
} catch {
    $sofieCmd = "cd `"$SofieDir`"; `$env:USE_OLLAMA='true'; `$env:OLLAMA_MODEL='llama3.1:8b'; `$env:HIVE_API_URL='http://localhost:3000'; `$env:GITHUB_TOKEN='$GitHubToken'; python src/main.py --mode=chief"
    $sofieProc = Start-Process -FilePath "powershell" -ArgumentList "-Command", $sofieCmd -WindowStyle Hidden -PassThru
    
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            Invoke-RestMethod -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
            $sofieOK = $true
            break
        } catch {}
    }
    
    if ($sofieOK) {
        Write-Host "READY on port 8000" -ForegroundColor Green
    } else {
        Write-Host "TIMEOUT" -ForegroundColor Red
    }
}

# ============================================================================
# START COUNCIL
# ============================================================================
Write-Host "Starting Council... " -NoNewline
$councilOK = $false
try {
    $test = Invoke-RestMethod -Uri "http://localhost:9000/council/status" -UseBasicParsing -TimeoutSec 2
    $councilOK = $true
    Write-Host "ALREADY RUNNING" -ForegroundColor Green
} catch {
    $councilCmd = "cd `"$BaseDir`"; `$env:HIVE_API_URL='http://localhost:3000'; `$env:GITHUB_TOKEN='$GitHubToken'; python -m src.council.api_server"
    $councilProc = Start-Process -FilePath "powershell" -ArgumentList "-Command", $councilCmd -WindowStyle Hidden -PassThru
    
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            $test = Invoke-RestMethod -Uri "http://localhost:9000/council/status" -UseBasicParsing -TimeoutSec 2
            $councilOK = $true
            break
        } catch {}
    }
    
    if ($councilOK) {
        Write-Host "READY on port 9000" -ForegroundColor Green
    } else {
        Write-Host "TIMEOUT" -ForegroundColor Red
    }
}

# ============================================================================
# SHOW INITIAL STATUS
# ============================================================================
Write-Host ""
Write-Host "==================================================="
Write-Host "                 SERVICE STATUS"
Write-Host "==================================================="

if ($ollamaOK) {
    Write-Host "Ollama  (11434): ONLINE   http://localhost:11434" -ForegroundColor Green
} else {
    Write-Host "Ollama  (11434): OFFLINE  http://localhost:11434" -ForegroundColor Red
}

if ($hiveOK) {
    Write-Host "Hive    (3000):  ONLINE   http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "Hive    (3000):  OFFLINE  http://localhost:3000" -ForegroundColor Red
}

if ($sofieOK) {
    Write-Host "Sofie   (8000):  ONLINE   http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "Sofie   (8000):  OFFLINE  http://localhost:8000" -ForegroundColor Red
}

if ($councilOK) {
    Write-Host "Council (9000):  ONLINE   http://localhost:9000" -ForegroundColor Green
} else {
    Write-Host "Council (9000):  OFFLINE  http://localhost:9000" -ForegroundColor Red
}

Write-Host "==================================================="
Write-Host ""

# ============================================================================
# INTERACTIVE LOOP
# ============================================================================
while ($true) {
    Write-Host ""
    $cmd = Read-Host "Command (status/convene/stop)"
    
    if ($cmd -eq "status") {
        Write-Host ""
        Write-Host "==================================================="
        Write-Host "                 SERVICE STATUS"
        Write-Host "==================================================="
        
        try {
            Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2 | Out-Null
            Write-Host "Ollama  (11434): ONLINE   http://localhost:11434" -ForegroundColor Green
        } catch {
            Write-Host "Ollama  (11434): OFFLINE  http://localhost:11434" -ForegroundColor Red
        }
        
        try {
            Invoke-RestMethod -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
            Write-Host "Hive    (3000):  ONLINE   http://localhost:3000" -ForegroundColor Green
        } catch {
            Write-Host "Hive    (3000):  OFFLINE  http://localhost:3000" -ForegroundColor Red
        }
        
        try {
            Invoke-RestMethod -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
            Write-Host "Sofie   (8000):  ONLINE   http://localhost:8000" -ForegroundColor Green
        } catch {
            Write-Host "Sofie   (8000):  OFFLINE  http://localhost:8000" -ForegroundColor Red
        }
        
        try {
            $test = Invoke-RestMethod -Uri "http://localhost:9000/council/status" -UseBasicParsing -TimeoutSec 2
            Write-Host "Council (9000):  ONLINE   http://localhost:9000" -ForegroundColor Green
        } catch {
            Write-Host "Council (9000):  OFFLINE  http://localhost:9000" -ForegroundColor Red
        }
        
        Write-Host "==================================================="
    }
    
    elseif ($cmd -eq "convene") {
        Write-Host ""
        Write-Host "==================================================="
        Write-Host "                 CONVENING COUNCIL"
        Write-Host "==================================================="
        
        try {
            $body = @{
                command = "convene"
                timestamp = (Get-Date -Format "o")
                chief_architect_present = $true
                ecosystem_state = @{
                    sofie_status = "awakened"
                    hive_connected = $hiveOK
                }
                sofie_requirements = @("Build CalmInterface bridge")
                critical_path = @("API Gateway", "WebSocket Bridge")
                protected_notice = "Sovereign territory protected"
            } | ConvertTo-Json -Depth 3
            
            $response = Invoke-RestMethod -Uri "http://localhost:9000/council/convene" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
            Write-Host "SUCCESS: Council convened!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Response:"
            $response | ConvertTo-Json -Depth 2 | Write-Host
        } catch {
            Write-Host "ERROR: Failed to convene - $_" -ForegroundColor Red
        }
        
        Write-Host "==================================================="
    }
    
    elseif ($cmd -eq "stop" -or $cmd -eq "quit" -or $cmd -eq "exit") {
        Write-Host ""
        Write-Host "Stopping all services..." -ForegroundColor Red
        
        if ($councilProc -ne $null) {
            try { Stop-Process -Id $councilProc.Id -Force -ErrorAction SilentlyContinue } catch {}
            Write-Host "  Council stopped" -ForegroundColor Green
        }
        
        if ($sofieProc -ne $null) {
            try { Stop-Process -Id $sofieProc.Id -Force -ErrorAction SilentlyContinue } catch {}
            Write-Host "  Sofie stopped" -ForegroundColor Green
        }
        
        if ($hiveProc -ne $null) {
            try { Stop-Process -Id $hiveProc.Id -Force -ErrorAction SilentlyContinue } catch {}
            Write-Host "  Hive stopped" -ForegroundColor Green
        }
        
        if ($ollamaProc -ne $null) {
            try { Stop-Process -Id $ollamaProc.Id -Force -ErrorAction SilentlyContinue } catch {}
            Write-Host "  Ollama stopped" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Goodbye, Dude." -ForegroundColor Green
        exit 0
    }
    
    elseif ($cmd -eq "help") {
        Write-Host ""
        Write-Host "==================================================="
        Write-Host "                 AVAILABLE COMMANDS"
        Write-Host "==================================================="
        Write-Host ""
        Write-Host "  status  - Show service status dashboard"
        Write-Host "  convene - Convene the Council"
        Write-Host "  stop    - Stop all services and exit"
        Write-Host "  help    - Show this help"
        Write-Host ""
        Write-Host "==================================================="
    }
    
    elseif ($cmd -eq "") {
        # Do nothing for empty input
    }
    
    else {
        Write-Host "Unknown command: $cmd" -ForegroundColor Red
        Write-Host "Type 'help' for available commands" -ForegroundColor Yellow
    }
}
