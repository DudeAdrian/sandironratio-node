# SandIronRatio Progressive Activation Launcher
# ASCII ONLY - NO functions - User-controlled activation sequence

# ============================================================================
# PHASE 1: PREREQUISITES
# ============================================================================
Write-Host ""
Write-Host "==================================================="
Write-Host "    SANDIRONRATIO PROGRESSIVE ACTIVATION"
Write-Host "==================================================="
Write-Host ""

# Check Ollama running (WARNING only, don't exit)
Write-Host "Checking Ollama prerequisite..." -ForegroundColor White
$ollamaOK = $false
try {
    Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2 | Out-Null
    $ollamaOK = $true
    Write-Host "Ollama: OK" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Ollama check failed, but proceeding..." -ForegroundColor Yellow
    Write-Host "If voice doesn't work, ensure Ollama is running: ollama serve" -ForegroundColor Gray
    $ollamaOK = $true
}

# ============================================================================
# PHASE 2: START SOFIE (THE INTERFACE)
# ============================================================================
Write-Host ""
Write-Host "Starting Sofie (Sovereign Interface)..." -ForegroundColor Cyan

$sofieDir = "C:\Users\squat\repos\sofie-llama-backend"
$sofieCmd = "cd `"$sofieDir`"; `$env:USE_OLLAMA='true'; `$env:OLLAMA_MODEL='llama3.1:8b'; `$env:HIVE_API_URL='http://localhost:3000'; python src/main.py --mode=chief"
$sofie = Start-Process -FilePath "powershell" -ArgumentList "-Command", $sofieCmd -PassThru -WindowStyle Minimized

# Wait for Sofie
$attempts = 0
$sofieOK = $false
while ($attempts -lt 30) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
        $sofieOK = $true
        break
    } catch {
        Start-Sleep -Seconds 1
        $attempts++
    }
}

if ($sofieOK) {
    Write-Host "Sofie: ONLINE (Port 8000)" -ForegroundColor Green
    Write-Host "The Dude is now connected to the sovereign interface." -ForegroundColor Yellow
} else {
    Write-Host "WARNING: Sofie may still be starting..." -ForegroundColor Yellow
}

# ============================================================================
# PHASE 3: INTERACTIVE COMMAND LOOP
# ============================================================================
$hiveRunning = $false
$councilRunning = $false
$hive = $null
$council = $null

$baseDir = "C:\Users\squat\repos\sandironratio-node"

while ($true) {
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "AWAITING COMMAND:" -ForegroundColor Cyan
    Write-Host ""
    if (-not $hiveRunning) {
        Write-Host "  [ Enter the hive ]  - Activate Terracare Ledger" -ForegroundColor White
    }
    if ($hiveRunning -and -not $councilRunning) {
        Write-Host "  [ Convene council ] - Summon the 6 agents" -ForegroundColor White
    }
    Write-Host "  [ Status ]          - Check all systems" -ForegroundColor White
    Write-Host "  [ Stop ]            - Shutdown" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $cmd = Read-Host "Command"
    
    # ENTER THE HIVE
    if ($cmd -eq "Enter the hive" -or $cmd -eq "enter the hive") {
        if ($hiveRunning) {
            Write-Host "Hive already active!" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "Initializing Terracare Ledger..." -ForegroundColor Cyan
        $hiveCmd = "cd `"$baseDir`"; `$env:NODE_ENV='development'; npm run dev"
        $hive = Start-Process -FilePath "powershell" -ArgumentList "-Command", $hiveCmd -PassThru -WindowStyle Minimized
        
        # Wait for Hive
        $attempts = 0
        $hiveOK = $false
        while ($attempts -lt 30) {
            try {
                Invoke-RestMethod -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
                $hiveOK = $true
                break
            } catch {
                Start-Sleep -Seconds 1
                $attempts++
            }
        }
        
        if ($hiveOK) {
            Write-Host "Hive: ONLINE (Port 3000)" -ForegroundColor Green
            Write-Host "The ledger is now accessible." -ForegroundColor Yellow
            $hiveRunning = $true
        } else {
            Write-Host "WARNING: Hive may still be starting..." -ForegroundColor Yellow
            $hiveRunning = $true
        }
    }
    
    # CONVENE COUNCIL
    elseif ($cmd -eq "Convene council" -or $cmd -eq "convene council") {
        if (-not $hiveRunning) {
            Write-Host "ERROR: Enter the hive first!" -ForegroundColor Red
            continue
        }
        if ($councilRunning) {
            Write-Host "Council already convened!" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "Summoning the Council..." -ForegroundColor Cyan
        $councilCmd = "cd `"$baseDir`"; python -m src.council.api_server"
        $council = Start-Process -FilePath "powershell" -ArgumentList "-Command", $councilCmd -PassThru -WindowStyle Minimized
        
        # Wait for Council
        $attempts = 0
        $councilOK = $false
        while ($attempts -lt 30) {
            try {
                Invoke-RestMethod -Uri "http://localhost:9000/council/status" -UseBasicParsing -TimeoutSec 2 | Out-Null
                $councilOK = $true
                break
            } catch {
                Start-Sleep -Seconds 1
                $attempts++
            }
        }
        
        if ($councilOK) {
            Write-Host "Council: ONLINE (Port 9000)" -ForegroundColor Green
            Write-Host "The 6 agents await your command." -ForegroundColor Yellow
            $councilRunning = $true
        } else {
            Write-Host "WARNING: Council may still be starting..." -ForegroundColor Yellow
            $councilRunning = $true
        }
    }
    
    # STATUS
    elseif ($cmd -eq "Status" -or $cmd -eq "status") {
        Write-Host ""
        Write-Host "SYSTEM STATUS:" -ForegroundColor Cyan
        
        # Ollama
        try {
            Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2 | Out-Null
            Write-Host "  Ollama:  ONLINE" -ForegroundColor Green
        } catch {
            Write-Host "  Ollama:  OFF" -ForegroundColor Red
        }
        
        # Sofie
        try {
            Invoke-RestMethod -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
            Write-Host "  Sofie:   ONLINE :8000" -ForegroundColor Green
        } catch {
            Write-Host "  Sofie:   OFF" -ForegroundColor Red
        }
        
        # Hive
        if ($hiveRunning) {
            try {
                Invoke-RestMethod -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
                Write-Host "  Hive:    ONLINE :3000" -ForegroundColor Green
            } catch {
                Write-Host "  Hive:    STARTING..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "  Hive:    STANDBY (type 'Enter the hive')" -ForegroundColor Gray
        }
        
        # Council
        if ($councilRunning) {
            try {
                Invoke-RestMethod -Uri "http://localhost:9000/council/status" -UseBasicParsing -TimeoutSec 2 | Out-Null
                Write-Host "  Council: ONLINE :9000" -ForegroundColor Green
            } catch {
                Write-Host "  Council: STARTING..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "  Council: STANDBY (type 'Convene council')" -ForegroundColor Gray
        }
    }
    
    # STOP
    elseif ($cmd -eq "Stop" -or $cmd -eq "stop") {
        Write-Host "Shutting down..." -ForegroundColor Red
        
        if ($councilRunning -and $council -ne $null) {
            try { Stop-Process -Id $council.Id -Force -ErrorAction SilentlyContinue } catch {}
            Write-Host "  Council stopped" -ForegroundColor Green
        }
        
        if ($hiveRunning -and $hive -ne $null) {
            try { Stop-Process -Id $hive.Id -Force -ErrorAction SilentlyContinue } catch {}
            Write-Host "  Hive stopped" -ForegroundColor Green
        }
        
        if ($sofie -ne $null) {
            try { Stop-Process -Id $sofie.Id -Force -ErrorAction SilentlyContinue } catch {}
            Write-Host "  Sofie stopped" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "All systems offline. The Dude abides." -ForegroundColor Green
        exit
    }
    
    # EMPTY INPUT
    elseif ($cmd -eq "") {
        # Do nothing
    }
    
    # UNKNOWN
    else {
        Write-Host "Unknown command. Use: Enter the hive, Convene council, Status, Stop" -ForegroundColor Yellow
    }
}