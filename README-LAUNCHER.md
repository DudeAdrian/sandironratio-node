# SANDIRONRATIO Ecosystem Launcher

## Quick Start

```powershell
cd C:\Users\squat\repos\sandironratio-node
.\start-dude-final.ps1
```

## What This Launcher Does

### Single PowerShell Window
- No more multiple windows
- All services managed from one interface

### Automatic Setup
1. **FFmpeg Check/Install** - Required for voice recognition
   - If missing, automatically installs via Chocolatey
2. **Ollama Check** - Verifies Ollama is running (port 11434)
3. **Sofie Start** - Launches Sofie API (port 8000)
4. **Voice/Text Interface** - Dual-mode input ready

### Commands

| Command | Action |
|---------|--------|
| `Sofie` or `Wake` | Activate listening mode |
| `Enter the hive` | Start Hive/Terracare Ledger (port 3000) |
| `Convene council` | Start Council (port 9000) |
| `Status` | Check all service states |
| `Stop` or `Exit` | Shutdown everything |
| `Help` or `?` | Show available commands |

### Features

**Voice Interface (if FFmpeg installed):**
- Say "Sofie" to activate
- Speak commands naturally
- Falls back to text if voice unavailable

**Text Interface:**
- Type commands at prompt
- Works even without voice dependencies

**Accurate Status:**
- Real port checks (not just process tracking)
- Retry logic for reliability
- Shows actual service states

**Proper Shutdown:**
- Kills all started processes
- Cleans up ports
- Releases resources

## Prerequisites

1. **PowerShell** (Windows default)
2. **Chocolatey** (auto-installed if missing)
3. **Node.js 20+** and **npm**
4. **Python 3.10+**
5. **Ollama** with llama3.1:8b model

## File Locations

- **Script:** `C:\Users\squat\repos\sandironratio-node\start-dude-final.ps1`
- **Logs:** `C:\Users\squat\repos\sandironratio-node\logs\`
- **Sofie:** `C:\Users\squat\repos\sofie-llama-backend\`

## Ports Used

| Service | Port | Purpose |
|---------|------|---------|
| Ollama | 11434 | AI Model |
| Sofie | 8000 | Voice/Text Interface |
| Hive | 3000 | Terracare Ledger |
| Council | 9000 | 6-Agent System |

## Troubleshooting

### FFmpeg Not Found
The script will auto-install FFmpeg. If it fails:
```powershell
choco install ffmpeg -y
```

### Ollama Not Running
Start Ollama manually:
```powershell
ollama serve
```

### Service Won't Start
Check logs in `logs\` directory for error details.

### Port Already in Use
The script will try to kill existing processes, but you may need to manually free ports:
```powershell
# Kill process on port 8000
Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Verification Checklist

Before using, verify:
- [ ] Script runs in ONE window
- [ ] FFmpeg installed (for voice)
- [ ] Ollama responds on port 11434
- [ ] Sofie starts and responds on port 8000
- [ ] "Enter the hive" starts Hive on port 3000
- [ ] "Convene council" starts Council on port 9000
- [ ] Status shows accurate information
- [ ] Stop command kills all processes
