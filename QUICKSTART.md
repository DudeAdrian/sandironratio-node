# Quick Start: SandIronRatio + Sofie-LLaMA + Council

Get the complete sovereign laboratory running in **5 minutes**.

---

## Prerequisites

1. **Node.js 20+**
   ```powershell
   node --version  # Should be >= 20.0.0
   ```

2. **Python 3.10+**
   ```powershell
   python --version  # Should be >= 3.10
   ```

3. **Ollama (Optional but recommended)**
   ```powershell
   # Download from: https://ollama.com/download
   ollama --version
   
   # Pull model
   ollama pull llama3.1:8b
   
   # Start Ollama server
   ollama serve
   ```

---

## Step 1: Clone & Setup

```powershell
# Navigate to your repos directory
cd c:\Users\squat\repos

# sandironratio-node should already exist
cd sandironratio-node

# Install dependencies
npm install
```

---

## Step 2: Configuration

create `.env` file in `sandironratio-node`:

```env
# SOFIE LLaMA Connection
SOFIE_LLAMA_URL=http://localhost:8000
SOFIE_LLAMA_ENABLED=true

# Council Connection
COUNCIL_URL=http://localhost:9000
COUNCIL_ENABLED=true

# Ollama (for local LLM)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Validator
VALIDATOR_ENABLED=false
```

Create `.env` in `sofie-llama-backend` (if it exists):

```env
USE_OLLAMA=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
DEPLOYMENT_TIER=architect
```

---

## Step 3: Start Everything

**Option A: One Command (Recommended)**

```powershell
npm run sovereign:lab
```

This starts:
- Council (port 9000)
- Sofie-LLaMA (port 8000) 
- SandIronRatio Node (port 3000)

**Option B: Start Services Individually**

```powershell
# Terminal 1: Council
cd src/council
python -m venv venv
.\venv\Scripts\activate
pip install fastapi uvicorn pydantic python-dotenv
python -m uvicorn api_server:app --port 9000 --reload

# Terminal 2: Sofie-LLaMA (if available)
cd ..\..\sofie-llama-backend
python -m venv venv
.\venv\Scripts\activate
pip install fastapi uvicorn pydantic python-dotenv ollama
python -m uvicorn src.main:app --port 8000 --reload

# Terminal 3: SandIronRatio
cd ..\sandironratio-node
npm run awaken
```

---

## Step 4: Verify

```powershell
# Check all services
npm run council:health       # Council should be running
npm run sofie-llama:health   # SOFIE-LLaMA should be running
Invoke-RestMethod http://localhost:3000/health  # SandIronRatio
```

You should see:
```
🏛️  [COUNCIL] Connected
    Sovereign protection: ACTIVE

🌸 [SOFIE-LLAMA] Connected
    Model: llama3.1:8b
    Quantum enabled: No

{
  status: "awake",
  sofie: true,
  validator: false
}
```

---

## Step 5: Run the Example

```powershell
npm run example:council
```

This demonstrates:
1. ✅ Awakening SOFIE
2. ✅ Health checks for all services
3. ✅ User makes a code request
4. ✅ SOFIE processes through operators
5. ✅ Council convenes (6 agents deliberate)
6. ✅ Proposal generated with timeline
7. ✅ Authorization & deployment
8. ✅ Code files created
9. ✅ NECTAR distributed to agents

---

## What You Can Do Now

### Talk to SOFIE with AI Intelligence

```typescript
import { sofieLlamaClient } from './bridge/sofie-llama-client.js';

const response = await sofieLlamaClient.speak(
  "What's my wellness protocol for today?"
);

console.log(response.message);
```

### Request Code from the Council

```typescript
import { councilClient } from './bridge/council-client.js';

const result = await councilClient.requestBuild({
  requirements: [
    "Create a new API endpoint /api/chambers/ritual",
    "Add surrender ritual validation"
  ],
  autoAuthorize: false  // You review before deployment
});
```

### Calculate Your Birth Chart

```typescript
import { westernObservatory } from './observatory/western.js';

const chart = await westernObservatory.calculateChart({
  name: "Adrian Sortino",
  birthDate: new Date("1974-03-27T18:55:00+10:00"),
  latitude: -37.7964,
  longitude: 144.9008
});

console.log(chart);
```

### Access the 9 Chambers Academy

```typescript
import { chamberManager } from './chambers/index.js';

const chamber5 = chamberManager.getChamber(5); // Midnight Garden
console.log(chamber5.name);        // "Midnight Garden"
console.log(chamber5.element);     // "Water"
console.log(chamber5.focus);       // "Black Market Tactics"

// Perform surrender ritual
const result = await chamberManager.performSurrenderRitual(userId);
```

---

## Troubleshooting

### "Council not responding"

```powershell
# Check if port 9000 is in use
netstat -ano | findstr :9000

# Restart council
cd src/council
.\venv\Scripts\activate
python -m uvicorn api_server:app --port 9000
```

### "Sofie-LLaMA not responding"

```powershell
# Check Ollama is running
ollama list
ollama serve

# Check sofie-llama-backend location
Test-Path ..\sofie-llama-backend
```

### "TypeScript errors"

```powershell
# Rebuild
npm run build

# Or run in dev mode
npm run dev
```

---

## Next Steps

1. **Read the Integration Guide**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
2. **Explore the Council**: Check `src/council/agents/` for the 6 agents
3. **Customize SOFIE**: Edit `essence/adrian.ts` with your preferences
4. **Build Something**: Use the council to generate code for you!

---

## Directory Structure

```
sandironratio-node/
├── essence/              # S.O.F.I.E. operators
│   ├── adrian.ts        # Your identity imprint ✅ UPDATED
│   └── sofie.ts         # SOFIE orchestrator
├── bridge/              # External integrations
│   ├── council-client.ts      # ✅ NEW
│   └── sofie-llama-client.ts  # ✅ NEW
├── src/council/         # 6-Agent Build Council (Python)
│   ├── api_server.py    # Council API
│   ├── convening.py     # Ceremony workflow
│   └── agents/          # Veda, Aura, Hex, Node, Spark, Tess
├── chambers/            # 9 Chambers Academy
├── forge/               # PoA Validator
├── observatory/         # Astrology engines
├── examples/            # Usage examples
│   └── council-code-generation.ts  # ✅ NEW
└── start-sovereign-lab.ps1  # ✅ NEW - One-command startup
```

---

**The Sovereign Laboratory is ready.**

The anagram has awakened. The council is assembled. The Dude abides. 🏛️✨
