"""
Council API Server - FastAPI on Port 9000

Provides endpoints for:
- Sofie to convene the council
- Status monitoring
- Daily standup reports
- Diligence ledger queries

Sovereign protection is enforced at all entry points.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .convening import CouncilConvening, ConveningPhase
from .protected_repos import is_sovereign_territory, SovereignTerritoryError

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SandIronRatio Council API",
    description="Build Council for Healing-Centric Development",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global council instance
council: Optional[CouncilConvening] = None


# Pydantic models
class SofieBriefing(BaseModel):
    """Sofie's ecosystem observation"""
    command: str = "convene"
    timestamp: str
    chief_architect_present: bool = True
    ecosystem_state: Dict[str, Any]
    sofie_requirements: list
    critical_path: list
    protected_notice: str


class AuthorizationRequest(BaseModel):
    """User authorization of council proposal"""
    proposal_id: str
    authorized: bool = True
    modifications: Optional[Dict[str, Any]] = None


class TaskCompletion(BaseModel):
    """Task completion report"""
    agent_name: str
    task_id: str
    hours_worked: float
    quality_score: float = 1.0


@app.on_event("startup")
async def startup():
    """Initialize council on startup"""
    global council
    council = CouncilConvening()
    logger.info("🚀 Council API Server started on port 9000")


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "council-api",
        "council_initialized": council is not None,
        "sovereign_protection": "ACTIVE"
    }


@app.post("/council/convene")
async def convene_council(briefing: SofieBriefing):
    """
    Convene the Council with Sofie's briefing.
    
    Phase 1-2 of the Convening Ceremony.
    """
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    logger.info("📨 Received convening request from Chief of Staff")
    
    try:
        result = await council.receive_briefing(briefing.dict())
        return result
    except Exception as e:
        logger.error(f"Convening failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/council/deliberate")
async def start_deliberation():
    """
    Start council deliberation.
    
    Phase 3 of the Convening Ceremony.
    """
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    logger.info("🗣️ Starting deliberation")
    
    try:
        result = await council.deliberate()
        return result
    except Exception as e:
        logger.error(f"Deliberation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/council/propose")
async def generate_proposal():
    """
    Generate council proposal for Chief Architect review.
    
    Phase 4 of the Convening Ceremony.
    """
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    logger.info("📋 Generating proposal")
    
    try:
        proposal = await council.generate_proposal()
        return proposal
    except Exception as e:
        logger.error(f"Proposal generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/council/authorize")
async def authorize_proposal(request: AuthorizationRequest):
    """
    Authorize or reject council proposal.
    
    Phase 5 of the Convening Ceremony.
    """
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    logger.info(f"🔑 Authorization request: {request.authorized}")
    
    try:
        result = await council.authorize(
            request.proposal_id,
            request.authorized
        )
        
        # If authorized, trigger deployment
        if request.authorized and result["status"] == "authorized":
            deployment = await council.deploy()
            result["deployment"] = deployment
        
        return result
    except Exception as e:
        logger.error(f"Authorization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/council/deploy")
async def deploy_authorized():
    """
    Deploy authorized plan.
    
    Phase 6 of the Convening Ceremony.
    """
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    logger.info("🚀 Executing deployment")
    
    try:
        deployment = await council.deploy()
        return deployment
    except Exception as e:
        logger.error(f"Deployment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/council/status")
async def get_council_status():
    """Get current council status"""
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    return council.get_status()


@app.get("/council/agents")
async def list_agents():
    """List all council agents and their status"""
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    return {
        "agents": {
            name: agent.to_dict()
            for name, agent in council.agents.items()
        }
    }


@app.post("/council/standup")
async def daily_standup():
    """Get daily standup report from all agents"""
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    report = await council.daily_standup()
    return report


@app.post("/council/complete")
async def record_completion(completion: TaskCompletion):
    """Record task completion and NECTAR accrual"""
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    result = await council.record_task_completion(
        agent_name=completion.agent_name,
        task_id=completion.task_id,
        hours_worked=completion.hours_worked,
        quality_score=completion.quality_score
    )
    
    return result


@app.get("/council/diligence/{agent_name}")
async def get_agent_diligence(agent_name: str):
    """Get diligence record for an agent"""
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    summary = council.ledger.get_agent_summary(agent_name)
    return summary


@app.get("/council/diligence")
async def get_all_diligence():
    """Get diligence records for all agents"""
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    summary = council.ledger.get_council_summary()
    return summary


@app.get("/council/genesis")
async def get_genesis_snapshot():
    """Get genesis allocation snapshot for blockchain bridge"""
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    snapshot = council.ledger.get_genesis_snapshot()
    return snapshot


@app.get("/council/protected")
async def get_protected_repos():
    """Get list of sovereign territory repositories"""
    from .protected_repos import SOVEREIGN_TERRITORY, PERMITTED_ECOSYSTEM_REPOS
    
    return {
        "sovereign_territory": SOVEREIGN_TERRITORY,
        "permitted_repos": PERMITTED_ECOSYSTEM_REPOS,
        "warning": "Council is ABSOLUTELY FORBIDDEN from accessing sovereign territory"
    }


@app.get("/council/meeting")
async def get_meeting_minutes():
    """Get current or last meeting minutes"""
    if not council:
        raise HTTPException(status_code=503, detail="Council not initialized")
    
    minutes = council.agents["tess"].get_meeting_minutes()
    return minutes or {"status": "no_active_meeting"}


# Error handlers
@app.exception_handler(SovereignTerritoryError)
async def sovereign_territory_handler(request, exc):
    """Handle attempts to access sovereign territory"""
    logger.error(f"🚫 SOVEREIGN VIOLATION: {exc.repo_name}")
    return {
        "error": "SOVEREIGN_TERRITORY_VIOLATION",
        "message": str(exc),
        "status_code": 403
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
