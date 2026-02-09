# Archived Launcher Scripts

**Date Archived**: February 9, 2026

These launcher scripts were archived as part of the Sovereign Laboratory consolidation.

## Why Archived

The repository had **13 different launcher scripts** that were redundant, outdated, or superseded by the unified `sovereign.ps1` launcher:

- Multiple approaches to the same problem
- Voice system split across repos
- Text-only launchers masquerading as voice launchers
- Incorrect paths to external repositories
- Deprecated markers

## New Unified Approach

**Instead of 13 scripts, use ONE:**

```powershell
npm run sovereign
```

This single command:
- ✅ Auto-detects/starts Ollama
- ✅ Launches SOFIE Voice (Vosk STT + Piper TTS)
- ✅ Starts SandIronRatio Node (port 3000)
- ✅ Enables GOD MODE authority
- ✅ Activates council convening

## Archived Files

1. **SANDIRONRATIO-WORKING.ps1** (450 lines) - Text-only chat, no voice output
2. **sofie-complete.ps1** (193 lines) - Used Windows SAPI instead of Piper
3. **sofie-voice.ps1** (171 lines) - Used speech_recognition instead of Vosk
4. **sofie-chat.ps1** - Redundant chat interface
5. **start-dude-final.ps1** - DEPRECATED (marked in file)
6. **start-ecosystem.ps1** - Outdated ecosystem launcher
7. **start-ecosystem-aligned.ps1** - Outdated aligned ecosystem
8. **start-sofie-interface.ps1** - Redundant interface
9. **start-sovereign-lab.ps1** - Wrong paths to external repos
10. **start-voice-lab.ps1** - Launched from separate repo
11. **voice-ai.ps1** - Redundant voice attempt
12. **launch.ps1** - Created during bugfixing, untested
13. **sandironratio-launcher.ps1** - Old version

## If You Need These

These files are preserved here for reference. If you need any specific functionality from them, check the new unified architecture:

- **Voice**: `voice/sofie_listen.py` (integrated)
- **Main Server**: `server.ts` (all zones unified)
- **Council**: `src/council/` (Python agents)
- **SOFIE**: `essence/sofie.ts` (GOD MODE)

## Documentation

See root directory files:
- `README.md` - Main documentation
- `VOICE_COUNCIL_GUIDE.md` - Voice command reference
- `QUICKSTART.md` - Quick start guide
