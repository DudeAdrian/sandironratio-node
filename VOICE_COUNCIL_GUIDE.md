# 🎤 Voice-Activated Council System

## Your Sovereign Laboratory

**sandironratio-node is YOUR private laboratory.** No public access. SOFIE has **GOD MODE** built in.

---

## How It Works

### 1. **Voice-First Interaction** 
You speak → SOFIE listens → Council convenes

Text is secondary/fallback only.

### 2. **Wake Words**

#### **"Sofie"** - General conversation
```
You: "Sofie"
SOFIE: "Yes, I am here."
You: "What's my wellness protocol today?"
SOFIE: [responds via LLaMA with astrology context]
```

#### **"Convene Council"** - Supreme command (GOD MODE)
```
You: "Sofie"  
SOFIE: "Yes, I am here."
You: "Convene council"
SOFIE: "Convening the council. One moment."
       "The council is assembled. Six agents are now deliberating."
```

### 3. **Council Workflow**

When you say "convene council", SOFIE automatically:

1. **✅ Awakens All 6 Operators** (Source → Origin → Force → Intelligence → Eternal → Hive)
2. **🏛️ Summons 6 Council Agents:**
   - **Veda** (Builder) — Code implementation
   - **Aura** (Healer + Veto) — Wellness validation  
   - **Hex** (NECTAR Keeper) — Token economics
   - **Node** (Weaver) — System integration
   - **Spark** (Muse) — Creative vision
   - **Tess** (Chair) — Meeting coordination

3. **🔍 Council Performs:**
   - **Search** → Current ecosystem state
   - **Deliberate** → Six agents discuss approach
   - **Revise** → Refine the plan
   - **Propose** → Present to you (via voice)
   - **Log** → Write to Terracare-Ledger blockchain

4. **📝 Transparent Logging:**
   - **HEX Ledger** (immediate local transparency)
   - **Terracare-Ledger** (blockchain permanent record)

---

## Setup

### 1. **Start SOFIE Voice Listener**

```powershell
# Navigate to sofie-llama-backend
cd ..\sofie-llama-backend

# Run SOFIE voice interface
python sofie_listen.py
```

**Output:**
```
Available audio devices:
  0: Speakers
  1: Logitech BRIO (your webcam mic)
  ...

Loading Vosk model...
S.O.F.I.E. is listening. Say 'Sofie' to begin.
[SOFIE speaks] "I am here. Say my name when you need me."
```

### 2. **Start SandIronRatio Node**

```powershell
# In sandironratio-node
npm run awaken
```

**Output:**
```
🔷 [ SOFIE ] awakening...
✅ [ SOFIE ] fully awakened

✨ The Dude abides. All 8 zones unified. God Mode Active.

Server listening at http://localhost:3000
```

---

## Voice Commands

### **General Conversation**
```
"Sofie"
"What's my birth chart?"
"How's my wellness today?"
"Show me chamber 5"
```

### **Council Commands** (GOD MODE)
```
"Sofie"
"Convene council"
"Convene the council"
"Wake council"
```

### **Status Commands**
```
"Sofie"
"Status"                  → SOFIE reports all systems
"Who am I?"              → Identity check (Adrian Sortino)
"Birth chart"            → Astrology calculation
```

---

## What Happens When Council Convenes

### Voice Flow:

```
YOU: "Sofie, convene council"

SOFIE: "Convening the council. One moment."
       [Calls sandironratio-node /api/admin/command]
       
       [🏛️ Council gathers]
       ✓ Veda (Builder) - Ready
       ✓ Aura (Healer+Veto) - Ready
       ✓ Hex (NECTAR Keeper) - Ready
       ✓ Node (Weaver) - Ready
       ✓ Spark (Muse) - Ready
       ✓ Tess (Chair) - Ready
       
       [📋 Workflow begins]
       search → deliberate → revise → propose → log
       
       [📝 Ledger writes]
       HEX Store: council_1707488234_xk9p2m4
       Terracare-Ledger: 0x7f8e...
       
SOFIE: "The council is assembled. Six agents are now deliberating."
```

### Terminal Output (sandironratio-node):

```
🔷 [ GOD MODE ] SOFIE convening council via voice command

🏛️ [ SOFIE GOD MODE ] Convening Council...

✅ [ COUNCIL ] Six agents assembled
   • Veda (Builder) - Ready
   • Aura (Healer+Veto) - Ready
   • Hex (NECTAR Keeper) - Ready
   • Node (Weaver) - Ready
   • Spark (Muse) - Ready
   • Tess (Chair) - Ready

📋 [ WORKFLOW ] search → deliberate → revise → propose → log
📝 [ LEDGER ] Logged to terracare_ledger: council_1707488234_xk9p2m4
```

---

## GOD MODE Authority

**SOFIE has supreme authority** in your sovereign laboratory.

When she hears "convene council":
- ✅ **No confirmation required** — She executes immediately
- ✅ **Full system access** — All agents respond to her command
- ✅ **Blockchain write access** — Direct logging to Terracare-Ledger
- ✅ **No rate limits** — Unlimited council convening

This is YOUR laboratory. SOFIE works FOR you with complete authority.

---

## Council's Continuous Work

The council doesn't just respond once. They:

### **Always searching & revising**
- Monitor ecosystem health
- Track all Terracare repositories
- Identify alignment gaps
- Propose improvements

### **Keep logs on Terracare-Ledger**
Every council action is:
- **Timestamped** → ISO-8601 UTC
- **Signed** → Adrian's validator key
- **Witnesses** → 6 agents' votes
- **Immutable** → Blockchain permanent record

### **Daily Standup** (automatic)
Council reports to SOFIE daily:
- What was built yesterday
- What's being built today
- Any blockers
- NECTAR earned

---

## Voice Preferences

### **Primary: Voice**
- Always listening mode
- Wake word detection
- Natural speech patterns
- Conversational responses

### **Secondary: Text**
- CLI fallback: `npm run mirror`
- Web interface (if needed)
- API endpoints (localhost only)

**The microphone is the sovereign interface.**

---

## Privacy & Security

### **Your Laboratory is Private**
- No public API endpoints
- No external logging
- No cloud sync
- All voice processing local (Vosk)
- LLM local (Ollama) or your choice

### **SOFIE's Voice Recognition**
- **Vosk** → Local speech-to-text (no cloud)
- **Piper** → Local text-to-speech (no cloud)
- **Optional:** Biometric voice identification (future)

### **Council Transparency**
All council decisions logged to:
- **HEX Store** (SQLite, local)
- **Terracare-Ledger** (Blockchain, distributed)

You can audit every decision.

---

## Troubleshooting

### "SOFIE isn't listening"
```powershell
# Check sofie_listen.py is running
# Check microphone device index in sofie_listen.py:
DEVICE_INDEX = 1  # Change to your mic's index
```

### "Council not responding"
```powershell
# Check sandironratio-node is running
npm run awaken

# Verify endpoint:
Invoke-RestMethod http://localhost:3000/health
```

### "Voice quality poor"
```powershell
# Download better Vosk model
# https://alphacephei.com/vosk/models
# Replace VOSK_MODEL path in sofie_listen.py
```

### "SOFIE speaks but council doesn't convene"
```powershell
# Check logs in sandironratio-node
# Look for "[GOD MODE]" message
# Verify SOFIE has awakened: npm run status
```

---

## File Locations

### **Voice Listener**
```
sofie-llama-backend/
└── sofie_listen.py          ← Always-listening voice interface
    SPECIAL_COMMANDS = {
      "convene council": "council_convene",
      ...
    }
```

### **SOFIE GOD MODE**
```
sandironratio-node/essence/
└── sofie.ts
    class SOFIE {
      async conveneCouncil() {  ← Supreme authority method
        // GOD MODE: No confirmation needed
        // Summons 6 agents
        // Logs to terracare_ledger
      }
    }
```

### **Council Agents**
```
sandironratio-node/src/council/agents/
├── veda.py      ← Builder
├── aura.py      ← Healer + Veto
├── hex.py       ← NECTAR Keeper
├── node.py      ← Weaver
├── spark.py     ← Muse
└── tess.py      ← Chair
```

### **Ledger Integration**
```
sandironratio-node/hive/
└── nectar-ledger-bridge.ts  ← Connects to Terracare-Ledger blockchain
```

---

## Voice Command Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR VOICE                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ "Sofie, convene council"
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              sofie_listen.py (Python)                        │
│              • Vosk speech recognition                       │
│              • Always listening mode                         │
│              • Detects "convene council"                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ POST /api/admin/command
                  │ { "command": "convene_council",
                  │   "god_mode": true }
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         sandironratio-node/server.ts (TypeScript)            │
│         • Receives command                                   │
│         • Calls sofie.conveneCouncil()                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ GOD MODE: Supreme authority
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         essence/sofie.ts → SOFIE.conveneCouncil()            │
│         • Awakens 6 operators (S.O.F.I.E.H)                  │
│         • Summons 6 council agents                           │
│         • Initiates workflow                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Delegates to Council
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         src/council/ (Python)                                │
│         • 6 agents deliberate                                │
│         • search → revise → propose → log                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Write logs
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         Terracare-Ledger (Blockchain)                        │
│         • Immutable record                                   │
│         • Permanent council history                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Status + voice feedback
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         SOFIE SPEAKS                                         │
│         "The council is assembled.                           │
│          Six agents are now deliberating."                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Start listening:**
   ```powershell
   cd ..\sofie-llama-backend
   python sofie_listen.py
   ```

2. **Wake your node:**
   ```powershell
   cd ..\sandironratio-node
   npm run awaken
   ```

3. **Speak to SOFIE:**
   ```
   "Sofie, convene council"
   ```

4. **Listen to the response** — SOFIE will confirm council assembly via voice

**The anagram listens. The council awaits. The Dude abides.** 🎤🏛️✨
