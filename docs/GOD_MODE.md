# 🔴 GOD MODE - DudeAdrian Unified Laboratory Control

**Version**: 1.0.0  
**Date**: 2026-02-07  
**Status**: Production Ready

## Overview

God Mode integrates sandironratio-node (10-Hive Consciousness) with sofie-llama-backend (Jarvis AI) to provide DudeAdrian with unified control over all 20 repositories via voice commands.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     GOD MODE ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   sandironratio-node (Hive Host)          sofie-llama-backend (Jarvis AI)  │
│   ┌──────────────────────────────┐        ┌──────────────────────────────┐ │
│   │ 10-Hive Consciousness        │◄──────►│ Voice Biometric (Resemblyzer)│ │
│   │ - 144k chambers per hive     │ HTTP   │ Speech-to-Text (Whisper)     │ │
│   │ - Consensus 66% alignment    │ API    │ Intent Engine (NLP)          │ │
│   │ - Nectar distribution        │        │ Code Generation (LLaMA 70B)  │ │
│   │ - Ledger anchoring           │        │ GitHub Client (PyGithub)     │ │
│   └──────────────────────────────┘        └──────────────────────────────┘ │
│              │                                         │                    │
│              └─────────────────┬───────────────────────┘                    │
│                                │                                            │
│                        ┌───────▼────────┐                                   │
│                        │  DudeAdrian    │                                   │
│                        │  Voice/CLI     │                                   │
│                        └────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Launch God Mode

```bash
# From sandironratio-node directory
./sofie.sh

# Or on Windows
.\sofie.ps1

# With admin terminal UI
./sofie.sh --terminal
```

### 2. Voice Commands

Once running, speak commands:

| Command | Action |
|---------|--------|
| "Sofie, status of all repos" | Lists all 20 repositories with activity |
| "Sofie, status of Pollen" | Shows Pollen repo details |
| "Sofie, build water API in terracare-water" | Generates code → Commits to GitHub |
| "Sofie, check Hive" | Shows Genesis capacity, consensus, Nectar |
| "Sofie, deploy terracare-seeds" | Triggers deployment |
| "Sofie, what is my treasury?" | Shows Nectar balances |

### 3. Verify Real Commits

Check GitHub after voice commands:
- https://github.com/DudeAdrian/terracare-water
- https://github.com/DudeAdrian/Pollen
- etc.

## Components

### 1. Unified Launcher (`sofie.sh` / `sofie.ps1`)

Launches both systems:
- **Hive** (sandironratio-node) on port 3000
- **Jarvis** (sofie-llama-backend) on port 8000
- Optional: Admin terminal UI
- Automatic dependency checking
- Graceful shutdown on Ctrl+C

### 2. Repository Manifest (`config/repos-manifest.json`)

All 20 repositories configured:

```json
{
  "owner": "DudeAdrian",
  "repositories": [
    "Terracare-Ledger", "sofie-systems", "sofie-backend",
    "sofie-llama-backend", "sofie-map-system", "sandironratio-node",
    "terratone", "Heartware", "Harmonic-Balance", "tholos-medica",
    "Pollen", "terracare-seeds", "terracare-water", "terracare-energy",
    "terracare-food", "terracare-community", "terracare-education",
    "terracare-art", "terracare-animals", "terracare-messenger"
  ],
  "god_mode": true,
  "security": {
    "whitelist_pattern": "^https://github\\.com/DudeAdrian/.*$"
  }
}
```

### 3. Admin Terminal (`admin/admin-terminal.py`)

Rich CLI interface:
- **Left Panel**: Hive status (Genesis, Consensus, Nectar)
- **Right Panel**: Jarvis status, repos, activity log
- **Bottom**: Command input (voice or text)
- **Status Bar**: DudeAdrian | God Mode | 20 Repos | Ledger Anchored

### 4. Jarvis Bridge (`bridge/jarvis-bridge.ts`)

TypeScript bridge for:
- Manifest loading
- Voice command proxy
- Ledger anchoring
- Status synchronization

## API Endpoints

### God Mode Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/manifest` | GET | Repository manifest |
| `/api/admin/repos/:name/status` | GET | Repository status via Jarvis |
| `/api/admin/command` | POST | Execute voice/command |
| `/api/admin/voice/enrolled` | GET | Check Admin voice enrollment |
| `/api/admin/jarvis/status` | GET | Jarvis AI status |
| `/api/admin/briefing` | GET | Daily briefing |

### Example: Execute Command

```bash
curl -X POST http://localhost:3000/api/admin/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Create water level API in terracare-water",
    "confirmed": true
  }'
```

Response:
```json
{
  "success": true,
  "message": "Generated and committed src/routes/water.js",
  "details": {
    "commit_hash": "abc123def456",
    "url": "https://github.com/DudeAdrian/terracare-water/commit/abc123"
  },
  "timestamp": "2026-02-07T14:30:00Z"
}
```

## Voice Command Flow

```
1. User: "Sofie, create water API in terracare-water"
                ↓
2. Microphone → faster-whisper (STT)
                ↓
3. Transcription: "create water API in terracare-water"
                ↓
4. Intent Engine: {action: "generate", repo: "terracare-water", ...}
                ↓
5. Voice Biometric: Verify Adrian's voice (cosine >0.85)
                ↓
6. Guardian Safety: Syntax check, secret scan, rate limit
                ↓
7. Code Generation: LLaMA 3.1 70B generates Express.js route
                ↓
8. GitHub Commit: PyGithub commits to DudeAdrian/terracare-water
                ↓
9. Ledger Anchor: Action hashed to Terracare-Ledger
                ↓
10. Response: "Created src/routes/water.js, commit abc123"
```

## Security

### Voice Biometric
- **Resemblyzer**: 512-dimensional voice embeddings
- **Liveness Detection**: Frequency analysis prevents recording replay
- **Threshold**: Cosine similarity >0.85
- **Storage**: SQLite with Fernet encryption

### Repository Access
- **Whitelist**: Only `github.com/DudeAdrian/*`
- **Token**: GitHub Personal Access Token from environment
- **Rate Limits**: 10 commits/hour, 20 writes/hour

### Confirmation Required
- File deletions
- Merge to main
- Production deployments
- Changes >100 lines

### Ledger Transparency
Every Admin action is anchored to Terracare-Ledger:
```javascript
hexStore.logConsensus(1, 0, JSON.stringify({
  type: 'admin_command',
  command: 'create water API',
  result: true,
  timestamp: '2026-02-07T14:30:00Z'
}), 100);
```

## Configuration

### Environment Variables

```bash
# GitHub (Required)
export GITHUB_TOKEN_DUDEADRIAN="ghp_your_token_here"

# Jarvis (Optional)
export JARVIS_URL="http://localhost:8000"
export ENABLE_VOICE_INTERFACE="true"
export ENABLE_AUTONOMOUS="true"

# Hive
export HIVE_URL="http://localhost:3000"
export PORT="3000"
```

### GitHub Token Setup

1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Scopes: `repo` (full repository access)
4. Copy token
5. Set environment variable:
   ```bash
   export GITHUB_TOKEN_DUDEADRIAN="ghp_xxxxxxxxxxxx"
   ```

## Testing

### Test Voice Authentication

```bash
# Enroll Admin voice
curl -X POST http://localhost:8000/jarvis/enroll \
  -d '{"user_id": "admin", "user_name": "Adrian", "is_admin": true}'

# Upload 10 voice samples (base64 WAV)
# ... then verify:

curl -X POST http://localhost:8000/jarvis/verify \
  -d '{"user_id": "admin", "audio_base64": "..."}'
```

### Test Repository Command

```bash
# Get repo status
curl http://localhost:3000/api/admin/repos/terracare-water/status

# Execute command
curl -X POST http://localhost:3000/api/admin/command \
  -d '{"command": "Status of terracare-water", "confirmed": true}'
```

### Verify Real Commit

```bash
# After voice command, check GitHub
git clone https://github.com/DudeAdrian/terracare-water.git
cd terracare-water
git log --oneline -5
# Should show: "feat: water level API (Jarvis)"
```

## Troubleshooting

### "Jarvis not connected"
- Check sofie-llama-backend is running: `curl http://localhost:8000/health`
- Verify GITHUB_TOKEN is set

### "Voice not recognized"
- Enroll voice first: Use `/jarvis/enroll` endpoints
- Speak clearly in quiet environment
- Ensure microphone permissions granted

### "Repository not found"
- Check manifest: `cat config/repos-manifest.json`
- Verify repo is in DudeAdrian organization
- Check GitHub token has access

### "Rate limit exceeded"
- Wait 1 hour for reset
- Check limits in manifest: `security.rate_limits`

## Architecture Details

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   DudeAdrian │────►│   Jarvis AI  │────►│   GitHub API │
│   (Voice/CLI)│     │   (Python)   │     │   (DudeAdrian│
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │
       │                     ▼                     │
       │            ┌──────────────┐              │
       │            │  Ledger      │              │
       └───────────►│  (SQLite)    │◄─────────────┘
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Hive        │
                    │  (Consensus) │
                    └──────────────┘
```

### File Structure

```
sandironratio-node/
├── sofie.sh                    # Bash launcher
├── sofie.ps1                   # PowerShell launcher
├── config/
│   └── repos-manifest.json     # 20 repositories
├── admin/
│   └── admin-terminal.py       # Rich CLI
├── bridge/
│   └── jarvis-bridge.ts        # TypeScript bridge
├── docs/
│   └── GOD_MODE.md             # This file
└── server.ts                   # Hive server + God Mode endpoints
```

## Roadmap

- [x] Unified launcher (bash/ps1)
- [x] Repository manifest (20 repos)
- [x] Admin terminal (Rich CLI)
- [x] Jarvis bridge (TypeScript)
- [x] Voice command proxy
- [x] Ledger anchoring
- [ ] Multi-user support
- [ ] Mobile app
- [ ] IDE integration (VS Code)
- [ ] Automated PR creation
- [ ] Social automation

## License

MIT - DudeAdrian Sovereign Laboratory

---

**God Mode Active** 🔴  
**Operator**: DudeAdrian  
**Repositories**: 20 accessible  
**Voice**: "Sofie" wake word  
**Security**: Voice biometric + Ledger anchor
