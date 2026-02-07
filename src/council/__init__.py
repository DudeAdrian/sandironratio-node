"""
SandIronRatio Council System - Build Council for Healing-Centric Development

The Six Council Agents:
- Veda (The Builder): Backend architecture, complex algorithms
- Aura (The Healer): QA, wellness validation, ABSOLUTE VETO POWER
- Hex (The Keeper): NECTAR diligence tracking, tokenomics
- Node (The Weaver): DevOps, API bridges, integration
- Spark (The Muse): Frontend, UI/UX, Calm Architecture
- Tess (The Lattice): Council Chair, systems architecture

Sovereign Territory (ABSOLUTELY PROTECTED):
- sofie-llama-backend
- Any attempt to access triggers SovereignTerritoryError

The Convening Ceremony:
1. Summons (User → Sofie)
2. Transmission (Sofie → Council)
3. Convening (Council Meeting)
4. Proposal (Council → Sofie → User)
5. Authorization (User Decision)
6. Deployment (Execution)

NECTAR Principles:
- Accrues AFTER completion (never spent to start)
- Non-blocking (zero balance never prevents work)
- Proof-of-diligence for future blockchain genesis
"""

from .agents import (
    BaseAgent, Task, TaskPriority, AgentStatus,
    VedaAgent, AuraAgent, HexAgent,
    NodeAgent, SparkAgent, TessAgent,
    create_council
)
from .convening import CouncilConvening, ConveningPhase
from .diligence_ledger import DiligenceLedger
from .github_client import CouncilGitHubClient
from .protected_repos import (
    is_sovereign_territory,
    SovereignTerritoryError,
    SOVEREIGN_TERRITORY
)

__all__ = [
    # Agents
    'BaseAgent', 'Task', 'TaskPriority', 'AgentStatus',
    'VedaAgent', 'AuraAgent', 'HexAgent',
    'NodeAgent', 'SparkAgent', 'TessAgent',
    'create_council',
    
    # Convening
    'CouncilConvening', 'ConveningPhase',
    
    # Infrastructure
    'DiligenceLedger',
    'CouncilGitHubClient',
    
    # Protection
    'is_sovereign_territory',
    'SovereignTerritoryError',
    'SOVEREIGN_TERRITORY',
]

__version__ = "1.0.0-council"
