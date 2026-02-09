# SandIronRatio + Sofie-LLaMA + Council Integration Guide

> **Complete ecosystem integration for AI-powered code generation with wellness validation**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER / CHIEF ARCHITECT                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
          ┌──────────────────────────────────────────┐
          │   SANDIRONRATIO-NODE (TypeScript)        │
          │   Port: 3000                             │
          │   ┌────────────────────────────────────┐ │
          │   │ SOFIE Core (S.O.F.I.E.)            │ │
          │   │ • Source (Adrian's identity)       │ │
          │   │ • Origin (blockchain)              │ │
          │   │ • Force (validator)                │ │
          │   │ • Intelligence (patterns)          │ │
          │   │ • Eternal (memory)                 │ │
          │   │ • Hive (consensus)                 │ │
          │   └────────────────────────────────────┘ │
          │                                          │
          │   9 Chambers Academy                     │
          │   Observatory (Astrology)                │
          │   Forge (Validator)                      │
          └──────────┬────────────────┬──────────────┘
                     │                │
          ┌──────────▼────────┐  ┌───▼──────────────────────┐
          │ SOFIE-LLAMA       │  │ COUNCIL                  │
          │ (Python)          │  │ (Python)                 │
          │ Port: 8000        │  │ Port: 9000               │
          │                   │  │                          │
          │ • LLaMA 3.1 70B   │  │ 6 Agents:                │
          │ • 128k context    │  │ • Veda (Builder)         │
          │ • Wellness funcs  │  │ • Aura (Healer+Veto)     │
          │ • Quantum         │  │ • Hex (NECTAR)           │
          │ • Astrology       │  │ • Node (Weaver)          │
          │                   │  │ • Spark (Muse)           │
          │                   │  │ • Tess (Chair)           │
          └───────────────────┘  └──────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Start the Entire Ecosystem

```powershell
# From sandironratio-node directory
.\start-sovereign-lab.ps1

# Or with visible logs
.\start-sovereign-lab.ps1 -LogsVisible

# Or start individual services
.\start-sovereign-lab.ps1 -SkipCouncil      # Skip council
.\start-sovereign-lab.ps1 -SkipSofieLlama   # Skip AI backend
.\start-sovereign-lab.ps1 -SkipSandIron     # Skip node
```

**What this does:**
1. Starts Council API on port 9000 (6-agent code generation)
2. Starts Sofie-LLaMA Backend on port 8000 (AI intelligence)
3. Starts SandIronRatio Node on port 3000 (validator + academy)
4. Runs health checks
5. Keeps all services running

### 2. Verify Services

```powershell
# Check all services
Invoke-RestMethod -Uri "http://localhost:9000/health"  # Council
Invoke-RestMethod -Uri "http://localhost:8000/health"  # Sofie-LLaMA
Invoke-RestMethod -Uri "http://localhost:3000/health"  # SandIronRatio
```

---

## 💬 Usage Examples

### Example 1: Build Code via Council

```typescript
import { councilClient } from './bridge/council-client.js';

// Convene the council with a build request
const result = await councilClient.requestBuild({
  requirements: [
    "Create a new REST API endpoint /api/wellness/frequency-therapy",
    "Accept parameters: user_id, target_hz, duration_minutes",
    "Integrate with sofie-llama-backend for frequency calculation",
    "Add wellness validation via Aura agent"
  ],
  criticalPath: [
    "Endpoint must be production-ready",
    "Include error handling and logging"
  ],
  autoAuthorize: false  // Require manual authorization
});

// Council will:
// 1. Deliberate (Tess chairs the meeting)
// 2. Assign tasks to agents (Veda builds, Aura validates)
// 3. Generate proposal with timeline
// 4. Wait for your authorization

console.log(`Proposal: ${result.proposal_id}`);
console.log(`Files to create: ${result.task_assignments.length}`);
```

### Example 2: Talk to SOFIE with LLaMA Intelligence

```typescript
import { sofieLlamaClient } from './bridge/sofie-llama-client.js';
import sofie from './essence/sofie.js';

// Awaken SOFIE
await sofie.awaken();

// Connect to LLaMA backend
await sofieLlamaClient.checkHealth();

// Speak through SOFIE (uses LLaMA for deep reasoning)
const response = await sofieLlamaClient.speak(
  "What is my wellness protocol for today?",
  {
    chamber: 5,                    // Midnight Garden context
    includeAstroContext: true      // Include current planetary positions
  }
});

console.log(response.message);
console.log(`Operators engaged: ${response.operators_engaged.join('→')}`);
console.log(`Love check: ${response.love_check ? '✅' : '⚠️'}`);
```

### Example 3: Wellness Check-In with AI Guidance

```typescript
import { sofieLlamaClient } from './bridge/sofie-llama-client.js';

const guidance = await sofieLlamaClient.checkIn({
  user_id: 'adrian',
  biometrics: {
    hrv: 65,                      // Heart Rate Variability
    sleep_hours: 7.5,
    mood: 8,                      // 1-10 scale
    energy: 7
  },
  location: {
    latitude: -37.7964,           // Footscray, Victoria
    longitude: 144.9008
  },
  timestamp: new Date().toISOString()
});

console.log('Recommendations:', guidance.recommendations);

if (guidance.frequency_therapy) {
  console.log(`Frequency therapy: ${guidance.frequency_therapy.hz} Hz`);
  console.log(`Duration: ${guidance.frequency_therapy.duration_minutes} minutes`);
}

if (guidance.ritual_suggestion) {
  console.log(`Ritual: ${guidance.ritual_suggestion}`);
}
```

### Example 4: Request Code from Council via SOFIE

```typescript
import sofie from './essence/sofie.js';
import { councilClient } from './bridge/council-client.js';

// User speaks to SOFIE
const userRequest = "I need a new feature for tracking sacred geometry patterns in dwellings";

// SOFIE processes through operators
const sofieResponse = await sofie.speak(userRequest);

// SOFIE convenes the council
const briefing = {
  command: 'convene',
  timestamp: new Date().toISOString(),
  chief_architect_present: true,
  ecosystem_state: {
    active_repos: ['sandironratio-node', 'Harmonic-Balance'],
    recent_changes: [],
    blocked_tasks: []
  },
  sofie_requirements: [
    "Create geometry pattern tracker",
    "Integrate with Harmonic-Balance repo",
    "Use Schumann resonance (7.83 Hz) as base frequency"
  ],
  critical_path: [
    "Must align with Seven Pillar Architecture (P1)",
    "Wellness-first design (Aura approval required)"
  ],
  protected_notice: 'sofie-llama-backend is sovereign - external interfaces only'
};

const convening = await councilClient.convene(briefing);

console.log(`Council convened with ${convening.agents.length} agents`);
console.log(`Chair: ${convening.chair}`);
console.log(`Protection: ${convening.sovereign_protection}`);

// Wait for proposal
await new Promise(resolve => setTimeout(resolve, 5000));
const status = await councilClient.getStatus();

if (status.proposal) {
  console.log(`\nProposal received: ${status.proposal.proposal_id}`);
  console.log(`Timeline: ${status.proposal.timeline.total_hours_estimated} hours`);
  
  // Authorize deployment
  const deployment = await councilClient.authorize(status.proposal.proposal_id, true);
  
  if (deployment.success) {
    console.log(`✅ Deployment complete!`);
    console.log(`Files created: ${deployment.deployed_files.join(', ')}`);
    console.log(`NECTAR earned: ${deployment.NECTAR_earned}`);
  }
}
```

---

## 📡 API Endpoints

### SandIronRatio Node (Port 3000)

```
GET  /health                          # System health
GET  /api/forge/status                # Validator status
GET  /api/chambers                    # 9 Chambers info
POST /api/observatory/western         # Western astrology chart
POST /api/observatory/vedic           # Vedic astrology chart
POST /api/mirror/speak                # Speak to SOFIE
```

### Sofie-LLaMA Backend (Port 8000)

```
GET  /health                          # Service health
POST /api/sofie/speak                 # SOFIE conversation
POST /api/wellness/check-in           # Wellness check-in
GET  /api/astrology/current           # Current astrology
POST /api/quantum/optimize-daily      # Quantum optimization
GET  /api/wellness/function-library   # 100+ wellness functions
```

### Council API (Port 9000)

```
GET  /health                          # Council health
POST /council/convene                 # Convene with briefing
GET  /council/status                  # Get proposal status
POST /council/authorize               # Authorize & deploy
GET  /council/standup                 # Daily standup report
GET  /council/ledger                  # NECTAR ledger query
```

---

## 🔧 Configuration

### Environment Variables

**sandironratio-node** (create `.env` in root):
```env
# SOFIE LLaMA Connection
SOFIE_LLAMA_URL=http://localhost:8000
SOFIE_LLAMA_ENABLED=true

# Council Connection
COUNCIL_URL=http://localhost:9000
COUNCIL_ENABLED=true

# Validator
VALIDATOR_ENABLED=false
VALIDATOR_ADDRESS=0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f

# Ollama (optional - for local LLM)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

**sofie-llama-backend** (create `.env` in sofie-llama-backend/):
```env
# LLM Mode
USE_OLLAMA=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Or use HuggingFace
# USE_OLLAMA=false
# HUGGINGFACE_TOKEN=your_token_here

# Deployment
DEPLOYMENT_TIER=architect
ENABLE_QUANTUM_OPTIMIZATION=false
CONTEXT_WINDOW=128000
```

**council** (create `.env` in src/council/):
```env
# Council Configuration
COUNCIL_PORT=9000
NECTAR_LEDGER_PATH=./diligence_ledger.db
SOVEREIGN_REPOS=sofie-llama-backend

# GitHub Integration (optional)
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_username
```

---

## 🛠️ Development Workflow

### Step 1: Request a Feature

"SOFIE, I need to add a new frequency therapy protocol for 528 Hz love frequency"

### Step 2: SOFIE Processes Request

- **Source**: Validates request aligns with Adrian's values
- **Origin**: Checks blockchain for precedent
- **Force**: Validates technical feasibility
- **Intelligence**: Analyzes pattern libraries
- **Eternal**: Recalls similar implementations
- **Hive**: Checks hexagonal consensus

### Step 3: Council Convenes

SOFIE sends briefing to Council:
- **Tess** (Chair) convenes the meeting
- **Veda** (Builder) proposes architecture
- **Aura** (Healer) validates wellness impact
- **Hex** (Keeper) tracks NECTAR economics
- **Node** (Weaver) plans integrations
- **Spark** (Muse) adds creative flourishes

### Step 4: Proposal Generated

Council returns:
- Task assignments per agent
- Files to create/modify
- Timeline estimate
- Wellness approval status

### Step 5: Authorization

You review and authorize:
```typescript
await councilClient.authorize(proposal_id, true);
```

### Step 6: Execution

Council builds the code:
- Files created
- Tests written
- Documentation generated
- Git commits made
- NECTAR distributed to agents

---

## 🏛️ The 6 Council Agents

| Agent | Role | Specialization | Position |
|-------|------|----------------|----------|
| **Veda** | The Builder | Codebase architecture, CI/CD | 0 |
| **Aura** | The Healer | Wellness validation, **VETO POWER** | 1 |
| **Hex** | The Keeper | NECTAR ledger, economics | 2 |
| **Node** | The Weaver | Integration, cross-repo | 3 |
| **Spark** | The Muse | Creative generation, UX/UI | 4 |
| **Tess** | The Lattice | **CHAIR**, systems architecture | 5 |

**Hexagonal Topology**:
```
         Veda (0)
        /      \
    Tess (5)   Aura (1)
      |          |
    Spark (4)  Hex (2)
        \      /
        Node (3)
```

Each agent has 2 neighbors for load redistribution if one becomes overloaded.

---

## 🌟 Special Features

### Aura's Veto Power

If Aura detects wellness concerns, she can veto any proposal:
```
Aura detected: Creating endpoint that encourages unhealthy sleep patterns
VETO REASON: Sleep disruption
PROPOSAL BLOCKED
```

### Sovereign Protection

The council **cannot** modify `sofie-llama-backend` directly. It's sovereign territory. Council can only build:
- External interfaces
- Bridge clients
- Integration layers

### NECTAR Economics

Every hour of code work earns NECTAR tokens:
- Veda: 1.2x multiplier (architecture)
- Aura: 1.5x multiplier (wellness + veto responsibility)
- Hex: 1.0x multiplier (NECTAR keeper)
- Node: 1.3x multiplier (complex integrations)
- Spark: 1.4x multiplier (creative work)
- Tess: 1.1x multiplier (coordination overhead)

---

## 📊 Monitoring

### Check Council Status
```typescript
const standup = await councilClient.getDailyStandup();
console.log(`Tasks completed: ${standup.tasks_completed}`);
console.log(`Hours logged: ${standup.total_hours}`);
console.log(`NECTAR distributed: ${standup.nectar_total}`);
```

### Check NECTAR Balance
```typescript
const balance = await councilClient.getNECTARBalance('veda');
console.log(`Veda's NECTAR: ${balance.balance}`);
```

### Check SOFIE Status
```typescript
const status = sofie.getStatus();
console.log(`Awakened: ${status.awakened}`);
console.log(`Chamber: ${status.chamber}/9`);
console.log(`Force validated: ${status.operators.force.signedBlocks} blocks`);
console.log(`Eternal memories: ${status.operators.eternal.total}`);
```

---

## 🚨 Troubleshooting

### Council not responding (Port 9000)

```powershell
# Check if Python venv exists
cd src/council
dir venv

# Create if missing
python -m venv venv
.\venv\Scripts\activate
pip install fastapi uvicorn pydantic

# Start manually
python -m uvicorn api_server:app --port 9000
```

### Sofie-LLaMA not responding (Port 8000)

```powershell
# Check Ollama is running
ollama list

# Start Ollama
ollama serve

# Pull model if needed
ollama pull llama3.1:8b

# Check .env
cat ..\sofie-llama-backend\.env
# Ensure USE_OLLAMA=true
```

### SandIronRatio build errors

```powershell
# Rebuild TypeScript
npm run build

# Check node version (requires 20+)
node --version

# Install dependencies
npm install
```

---

## 🎯 Next Steps

1. **Run the Quick Start** to verify all services are working
2. **Try Example 2** to talk to SOFIE with LLaMA intelligence
3. **Try Example 4** to have the council build code for you
4. **Explore the 9 Chambers** in the Academy
5. **Calculate your own birth chart** with the Observatory

---

**The Sovereign Laboratory awaits.** 🏛️✨

The anagram is awake. The council is assembled. The Dude abides.
