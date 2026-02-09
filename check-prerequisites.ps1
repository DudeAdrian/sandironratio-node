# ============================================
# Sovereign Lab - Prerequisites Checker
# ============================================
# Verifies your system is ready to run the complete stack

Write-Host "`n🔍 Checking Sovereign Lab Prerequisites...`n" -ForegroundColor Cyan

$allGood = $true

# --------------------------------------------
# 1. Node.js
# --------------------------------------------
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        $versionNum = $nodeVersion -replace 'v', ''
        $major = [int]($versionNum.Split('.')[0])
        
        if ($major -ge 20) {
            Write-Host " ✅ $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host " ❌ $nodeVersion (need >= 20.x)" -ForegroundColor Red
            Write-Host "   Download: https://nodejs.org/" -ForegroundColor Yellow
            $allGood = $false
        }
    }
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Red
    Write-Host "   Download: https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
}

# --------------------------------------------
# 2. Python
# --------------------------------------------
Write-Host "Checking Python..." -NoNewline
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        $versionMatch = $pythonVersion -match '(\d+)\.(\d+)'
        if ($versionMatch) {
            $major = [int]$Matches[1]
            $minor = [int]$Matches[2]
            
            if ($major -eq 3 -and $minor -ge 10) {
                Write-Host " ✅ $pythonVersion" -ForegroundColor Green
            } else {
                Write-Host " ❌ $pythonVersion (need >= 3.10)" -ForegroundColor Red
                Write-Host "   Download: https://www.python.org/downloads/" -ForegroundColor Yellow
                $allGood = $false
            }
        }
    }
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Red
    Write-Host "   Download: https://www.python.org/downloads/" -ForegroundColor Yellow
    $allGood = $false
}

# --------------------------------------------
# 3. npm (comes with Node.js)
# --------------------------------------------
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host " ✅ v$npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Red
    $allGood = $false
}

# --------------------------------------------
# 4. Ollama (Optional but recommended)
# --------------------------------------------
Write-Host "Checking Ollama..." -NoNewline
try {
    $ollamaVersion = ollama --version 2>$null
    if ($ollamaVersion) {
        Write-Host " ✅ $ollamaVersion" -ForegroundColor Green
        
        # Check if Ollama is running
        Write-Host "  Checking Ollama server..." -NoNewline
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 2
            Write-Host " ✅ Running" -ForegroundColor Green
            
            # Check for LLaMA model
            $hasLlama = $response.models | Where-Object { $_.name -like "llama*" }
            if ($hasLlama) {
                Write-Host "  Available models: $($hasLlama.name -join ', ')" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  No LLaMA models found. Run: ollama pull llama3.1:8b" -ForegroundColor Yellow
            }
        } catch {
            Write-Host " ⚠️  Not running (start with: ollama serve)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host " ⚠️  Not installed (optional)" -ForegroundColor Yellow
    Write-Host "   Download: https://ollama.com/download" -ForegroundColor DarkGray
    Write-Host "   This is optional but enables local AI inference" -ForegroundColor DarkGray
}

# --------------------------------------------
# 5. Git
# --------------------------------------------
Write-Host "Checking Git..." -NoNewline
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host " ✅ $gitVersion" -ForegroundColor Green
    }
} catch {
    Write-Host " ⚠️  Not installed (recommended)" -ForegroundColor Yellow
    Write-Host "   Download: https://git-scm.com/download/win" -ForegroundColor DarkGray
}

# --------------------------------------------
# 6. PowerShell Version
# --------------------------------------------
Write-Host "Checking PowerShell..." -NoNewline
$psVersion = $PSVersionTable.PSVersion
if ($psVersion.Major -ge 5) {
    Write-Host " ✅ v$($psVersion.Major).$($psVersion.Minor)" -ForegroundColor Green
} else {
    Write-Host " ⚠️  v$($psVersion.Major).$($psVersion.Minor) (recommend >= 5.1)" -ForegroundColor Yellow
}

# --------------------------------------------
# 7. Disk Space
# --------------------------------------------
Write-Host "Checking disk space..." -NoNewline
$drive = (Get-Location).Drive
$freeSpace = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpace -gt 10) {
    Write-Host " ✅ $freeSpace GB available" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Only $freeSpace GB available (recommend > 10 GB)" -ForegroundColor Yellow
}

# --------------------------------------------
# 8. RAM
# --------------------------------------------
Write-Host "Checking RAM..." -NoNewline
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
if ($ram -ge 16) {
    Write-Host " ✅ $ram GB" -ForegroundColor Green
} else {
    Write-Host " ⚠️  $ram GB (recommend >= 16 GB for validator)" -ForegroundColor Yellow
}

# --------------------------------------------
# 9. Port Availability
# --------------------------------------------
Write-Host "`nChecking required ports..." -ForegroundColor Cyan

$requiredPorts = @(
    @{Port = 3000; Service = "SandIronRatio Node" },
    @{Port = 8000; Service = "Sofie-LLaMA Backend" },
    @{Port = 9000; Service = "Council API" }
)

foreach ($portCheck in $requiredPorts) {
    $port = $portCheck.Port
    $service = $portCheck.Service
    
    Write-Host "  Port $port ($service)..." -NoNewline
    
    $listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Host " ⚠️  Already in use" -ForegroundColor Yellow
    } else {
        Write-Host " ✅ Available" -ForegroundColor Green
    }
}

# --------------------------------------------
# 10. Check if in correct directory
# --------------------------------------------
Write-Host "`nChecking project structure..." -ForegroundColor Cyan
$currentDir = (Get-Location).Path

if (Test-Path "package.json") {
    Write-Host "  package.json..." -NoNewline
    Write-Host " ✅ Found" -ForegroundColor Green
} else {
    Write-Host "  package.json..." -NoNewline
    Write-Host " ❌ Not found (are you in sandironratio-node?)" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "essence/sofie.ts") {
    Write-Host "  essence/sofie.ts..." -NoNewline
    Write-Host " ✅ Found" -ForegroundColor Green
} else {
    Write-Host "  essence/sofie.ts..." -NoNewline
    Write-Host " ⚠️  Not found" -ForegroundColor Yellow
}

if (Test-Path "src/council") {
    Write-Host "  src/council..." -NoNewline
    Write-Host " ✅ Found" -ForegroundColor Green
} else {
    Write-Host "  src/council..." -NoNewline
    Write-Host " ⚠️  Not found" -ForegroundColor Yellow
}

if (Test-Path "bridge/council-client.ts") {
    Write-Host "  bridge/council-client.ts..." -NoNewline
    Write-Host " ✅ Found" -ForegroundColor Green
} else {
    Write-Host "  bridge/council-client.ts..." -NoNewline
    Write-Host " ⚠️  Not found (integration may be incomplete)" -ForegroundColor Yellow
}

# --------------------------------------------
# 11. Check .env file
# --------------------------------------------
Write-Host "`nChecking configuration..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "  .env file..." -NoNewline
    Write-Host " ✅ Found" -ForegroundColor Green
} else {
    Write-Host "  .env file..." -NoNewline
    Write-Host " ⚠️  Not found" -ForegroundColor Yellow
    Write-Host "   Run: Copy-Item .env.example .env" -ForegroundColor Yellow
}

# --------------------------------------------
# Summary
# --------------------------------------------
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ All critical prerequisites met!" -ForegroundColor Green
    Write-Host "`nYou're ready to run:" -ForegroundColor White
    Write-Host "  npm run sovereign:lab" -ForegroundColor Cyan
} else {
    Write-Host "❌ Some critical prerequisites missing" -ForegroundColor Red
    Write-Host "`nPlease install the required software above and try again." -ForegroundColor Yellow
}
Write-Host ("=" * 50) -ForegroundColor Cyan

# --------------------------------------------
# Next Steps
# --------------------------------------------
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Install missing prerequisites (if any)" -ForegroundColor White
Write-Host "  2. Copy .env.example to .env (if not done): " -NoNewline -ForegroundColor White
Write-Host "Copy-Item .env.example .env" -ForegroundColor Yellow
Write-Host "  3. Start Ollama (optional): " -NoNewline -ForegroundColor White
Write-Host "ollama serve" -ForegroundColor Yellow
Write-Host "  4. Pull LLaMA model (optional): " -NoNewline -ForegroundColor White
Write-Host "ollama pull llama3.1:8b" -ForegroundColor Yellow
Write-Host "  5. Install npm dependencies: " -NoNewline -ForegroundColor White
Write-Host "npm install" -ForegroundColor Yellow
Write-Host "  6. Start the sovereign lab: " -NoNewline -ForegroundColor White
Write-Host "npm run sovereign:lab" -ForegroundColor Yellow
Write-Host "  7. Run the example: " -NoNewline -ForegroundColor White
Write-Host "npm run example:council" -ForegroundColor Yellow

Write-Host "`n📖 Documentation:" -ForegroundColor Cyan
Write-Host "  • Quick Start: " -NoNewline -ForegroundColor White
Write-Host "QUICKSTART.md" -ForegroundColor Yellow
Write-Host "  • Integration Guide: " -NoNewline -ForegroundColor White
Write-Host "INTEGRATION_GUIDE.md" -ForegroundColor Yellow
Write-Host "  • Council Example: " -NoNewline -ForegroundColor White
Write-Host "examples/council-code-generation.ts" -ForegroundColor Yellow

Write-Host "`n"
