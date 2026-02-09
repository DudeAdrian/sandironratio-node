# Voice Laboratory Testing Guide

## Current Status ✅
**OPERATIONAL**: Both systems are running and responding correctly.

### Running Services
1. **SandIronRatio Node Server** (port 3000) - ACTIVE
2. **SOFIE Voice Listener** (always-on) - LISTENING

## How to Use SOFIE Voice Commands

### Basic Conversation
```
Say: "Sofie"
SOFIE: "Yes, I am here. How can I assist?"
Say: "What time is it?"
SOFIE: [Responds with current time]
```

### GOD MODE: Council Convening

#### Wake Words (any of these will work)
- "convene council"
- "convene the council"
- "council convene"
- "wake council"
- "summon council"

#### Sample Session
```
You: "Sofie"
SOFIE: "Yes, I am here. How can I assist?"

You: "Convene council"
SOFIE: "Convening the council. One moment."
[6 agents assemble: Veda, Aura, Hex, Node, Spark, Tess]
[Council deliberates on recent context]
[Results logged to Terracare-Ledger]
SOFIE: "The council is assembled. Six agents are now deliberating."
```

## What GOD MODE Does

When you say "convene council", SOFIE:

1. **No Confirmation Needed** - GOD MODE bypasses all checks
2. **Summons 6 Agents** automatically:
   - **Veda** (Builder): Code structure and architecture
   - **Aura** (Healer + Veto): Ethics and harm prevention
   - **Hex** (NECTAR Keeper): Resource allocation and storage
   - **Node** (Weaver): Integration and connections
   - **Spark** (Muse): Creative solutions and innovation
   - **Tess** (Chair): Facilitation and consensus

3. **Council Workflow**:
   - Search recent context (last conversation, recent files)
   - Each agent deliberates from their perspective
   - Revise proposals based on collective wisdom
   - Chair (Tess) facilitates consensus
   - Log decision to blockchain (Terracare-Ledger)

4. **Logs Created**:
   - HEX Store (local SQLite): `data/hex.db`
   - Terracare-Ledger (blockchain transaction ID returned)

## Testing the Integration

### Test 1: Health Check
```powershell
Invoke-RestMethod http://localhost:3000/health
# Should return: status=awake, sofie=True, validator=True
```

### Test 2: Manual Council Trigger (HTTP)
```powershell
$body = @{
    command = "convene_council"
    god_mode = $true
    triggered_by = "voice"
    context = "Testing the voice-activated council system"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/command" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Test 3: Voice Command (Speak into microphone)
1. Ensure microphone is active
2. Say: "Sofie"
3. Wait for acknowledgment
4. Say: "Convene council"
5. Listen for confirmation

## Expected Outputs

### Terminal: SOFIE Listener
```
S.O.F.I.E. is listening. Say 'Sofie' to begin.
[You say "Sofie"]
Wake word detected!
Partial: convene council
Final: convene council
[ SPECIAL COMMAND DETECTED ] council_convene
convene_council detected!
Speaking: Convening the council. One moment.
[API call to http://localhost:3000/api/admin/command]
Council convened successfully
Speaking: The council is assembled. Six agents are now deliberating.
```

### Terminal: Node Server
```
[ GOD MODE ] Council convening requested by voice
Six agents assembled for council
Council deliberation: [recent context summary]
Logged to terracare_ledger with TX ID: terra_tx_[timestamp]
```

## Troubleshooting

### No response when I say "Sofie"
- **Check**: Is sofie_listen.py running?
- **Check**: Is your microphone working? (test in Windows Sound Settings)
- **Fix**: Look at the terminal - are you seeing "Partial: [text]"? If not, speak louder/clearer

### "Unable to connect to server"
- **Check**: Is the Node server running on port 3000?
- **Test**: `Invoke-RestMethod http://localhost:3000/health`
- **Fix**: Restart server: `npm run server`

### Council doesn't convene
- **Check**: Did you say the wake word "Sofie" first?
- **Check**: Did the listener detect "convene council"? (look for SPECIAL COMMAND DETECTED)
- **Fix**: Speak clearly and wait 1 second between "Sofie" and "convene council"

## Stopping the Services

```powershell
# Find the terminal windows and close them, or:
Get-Process | Where-Object {$_.ProcessName -match "(node|python)"} | Stop-Process
```

## Next Steps

1. **Test voice flow**: Speak commands and verify responses
2. **Check ledger**: Look for council logs in Terracare-Ledger
3. **Monitor hardware**: RAM warnings are expected (need 64GB for Llama 70B)
4. **Extend commands**: Add more GOD MODE voice triggers in sofie_listen.py

---

**Note**: This is a **private sovereign laboratory**. No external access, no public APIs. Voice is the primary interface, text is secondary. SOFIE has GOD MODE - she doesn't ask permission for council actions, she executes immediately.
