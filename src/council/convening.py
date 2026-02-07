"""
The Convening Ceremony - Complete Council Meeting Workflow

Implements the formal 6-phase ceremony for Council operations:
1. The Summons (User → Sofie)
2. Transmission (Sofie → Council)
3. The Convening (Council Meeting)
4. The Proposal (Council → Sofie → User)
5. Authorization (User Decision)
6. Deployment (Execution)

Enforces absolute sovereignty protection for sofie-llama-backend.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum

from .agents import create_council, BaseAgent, Task, TaskPriority
from .protected_repos import is_sovereign_territory, SovereignTerritoryError
from .diligence_ledger import DiligenceLedger

logger = logging.getLogger(__name__)


class ConveningPhase(Enum):
    """Phases of the Convening Ceremony"""
    IDLE = "idle"
    RECEIVING_BRIEFING = "receiving_briefing"
    DELIBERATING = "deliberating"
    PROPOSING = "proposing"
    AWAITING_AUTHORIZATION = "awaiting_authorization"
    DEPLOYING = "deploying"
    COMPLETE = "complete"


class CouncilConvening:
    """
    The Convening Ceremony - Council Meeting Orchestration
    
    This class implements the complete workflow from Sofie's briefing
to deployment execution, with strict enforcement of sovereign boundaries.
    
    Usage:
        council = CouncilConvening()
        
        # Phase 1-2: Sofie transmits briefing
        result = await council.receive_briefing(sofie_briefing)
        
        # Phase 3: Council deliberates
        deliberation = await council.deliberate()
        
        # Phase 4: Proposal generated
        proposal = await council.generate_proposal()
        
        # Phase 5: User authorizes
        await council.authorize(proposal_id)
        
        # Phase 6: Deploy
        deployment = await council.deploy()
    """
    
    def __init__(self):
        self.agents = create_council()
        self.ledger = DiligenceLedger()
        
        self.phase = ConveningPhase.IDLE
        self.current_briefing: Optional[Dict[str, Any]] = None
        self.current_proposal: Optional[Dict[str, Any]] = None
        self.deliberation_record: Optional[Dict[str, Any]] = None
        self.meeting_start: Optional[str] = None
        
        logger.info("🏛️ Council Convening Ceremony initialized")
        logger.info("   6 agents ready for deliberation")
    
    async def receive_briefing(self, sofie_briefing: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phase 1-2: Receive briefing from Sofie.
        
        Validates briefing and convenes the council.
        
        Args:
            sofie_briefing: The ecosystem observation from Sofie
            
        Returns:
            Convening status
        """
        logger.info("🏛️ PHASE 1-2: Receiving briefing from Chief of Staff")
        self.phase = ConveningPhase.RECEIVING_BRIEFING
        self.meeting_start = datetime.utcnow().isoformat()
        
        # Validate briefing
        if not sofie_briefing:
            return {"error": "Empty briefing received"}
        
        # Verify sovereign territory notice is present
        if not sofie_briefing.get("protected_notice"):
            logger.warning("Briefing missing protected_notice - adding default")
            sofie_briefing["protected_notice"] = (
                "sofie-llama-backend is sovereign territory - "
                "council builds external interfaces only"
            )
        
        # Store briefing
        self.current_briefing = sofie_briefing
        
        # Tess convenes the council
        tess = self.agents["tess"]
        convening_result = await tess.convene_council(sofie_briefing, self.agents)
        
        logger.info(f"🏛️ Council convened: {convening_result['agents']}")
        
        return {
            "phase": "convened",
            "chair": "tess",
            "agents": convening_result["agents"],
            "briefing_summary": convening_result["briefing_summary"],
            "sovereign_protection": "ACTIVE - sofie-llama-backend protected"
        }
    
    async def deliberate(self) -> Dict[str, Any]:
        """
        Phase 3: The Convening (Council Meeting)
        
        Tess facilitates deliberation where agents:
        - Review Sofie's briefing
        - Identify tasks matching their specialization
        - Propose assignments
        - Resolve conflicts
        - Optimize for wellness
        
        Returns:
            Deliberation results with proposals
        """
        logger.info("🏛️ PHASE 3: Council Deliberation")
        self.phase = ConveningPhase.DELIBERATING
        
        # Tess facilitates
        tess = self.agents["tess"]
        
        # Step 1: Initial deliberation
        deliberation = await tess.facilitate_deliberation(self.agents)
        
        # Step 2: Optimize distribution
        optimized = await tess.optimize_distribution(
            deliberation["proposals"],
            self.agents
        )
        
        # Step 3: Coordinate dependencies
        with_dependencies = await tess.coordinate_dependencies(
            optimized["assignments"]
        )
        
        # Step 4: Aura wellness validation
        aura = self.agents["aura"]
        wellness_check = await self._validate_deliberation_wellness(with_dependencies)
        
        if not wellness_check["approved"]:
            # Aura issues veto
            veto = await aura.veto_proposal(
                {"title": "Council Plan"},
                wellness_check["concerns"]
            )
            
            self.deliberation_record = {
                "status": "vetoed",
                "by": "aura",
                "reason": veto
            }
            
            return {
                "status": "blocked",
                "phase": "deliberation_vetoed",
                "veto": veto
            }
        
        # Step 5: Hex calculates NECTAR accrual estimate
        hex_agent = self.agents["hex"]
        nectar_estimate = hex_agent.calculate_accrual_estimate({
            "assignments": with_dependencies
        })
        
        self.deliberation_record = {
            "status": "complete",
            "assignments": with_dependencies,
            "timeline": optimized["timeline"],
            "wellness_approved": True,
            "nectar_estimate": nectar_estimate
        }
        
        logger.info("🏛️ Deliberation complete - awaiting proposal generation")
        
        return {
            "phase": "deliberated",
            "assignments": len(with_dependencies),
            "timeline": optimized["timeline"],
            "nectar_estimate": nectar_estimate,
            "wellness_status": "approved_by_aura"
        }
    
    async def generate_proposal(self) -> Dict[str, Any]:
        """
        Phase 4: The Proposal (Council → Sofie → User)
        
        Generates the formal proposal for Chief Architect review.
        
        Returns:
            The proposal document
        """
        logger.info("🏛️ PHASE 4: Generating Proposal")
        self.phase = ConveningPhase.PROPOSING
        
        if not self.deliberation_record:
            return {"error": "No deliberation record found"}
        
        # Tess prepares the proposal
        tess = self.agents["tess"]
        
        proposal = {
            "status": "proposed",
            "timestamp": datetime.utcnow().isoformat(),
            "council_plan": {
                "objective": self._extract_objective(),
                "assignments": self.deliberation_record["assignments"],
                "total_timeline": self.deliberation_record["timeline"],
                "total_diligence_accrual": self.deliberation_record["nectar_estimate"],
                "wellness_validation": "approved_by_aura",
                "sovereign_boundary": "strict - no sofie-llama-backend access required",
                "council_version": "1.0.0"
            },
            "agent_status": {
                name: agent.report_capacity()
                for name, agent in self.agents.items()
            },
            "risk_assessment": {
                "sovereign_violation_risk": "mitigated - strict filtering active",
                "wellness_risk": "low - aura approved",
                "technical_debt_risk": "medium - tess monitoring"
            },
            "awaiting_chief_architect_authorization": True,
            "authorization_deadline": None  # User decides timeline
        }
        
        self.current_proposal = proposal
        self.phase = ConveningPhase.AWAITING_AUTHORIZATION
        
        logger.info("🏛️ Proposal generated - awaiting Chief Architect authorization")
        
        return proposal
    
    async def authorize(self, proposal_id: str, authorized: bool = True) -> Dict[str, Any]:
        """
        Phase 5: Authorization (User Decision)
        
        Chief Architect authorizes the proposal.
        
        Args:
            proposal_id: ID of the proposal to authorize
            authorized: Whether to authorize (True) or reject (False)
            
        Returns:
            Authorization result
        """
        logger.info(f"🏛️ PHASE 5: Authorization received: {authorized}")
        
        if not self.current_proposal:
            return {"error": "No proposal to authorize"}
        
        if authorized:
            self.current_proposal["authorized_by"] = "chief_architect"
            self.current_proposal["authorized_at"] = datetime.utcnow().isoformat()
            self.current_proposal["awaiting_chief_architect_authorization"] = False
            
            logger.info("🏛️ PROPOSAL AUTHORIZED - proceeding to deployment")
            
            return {
                "status": "authorized",
                "proposal": self.current_proposal["council_plan"],
                "next_step": "deployment"
            }
        else:
            self.current_proposal["rejected_at"] = datetime.utcnow().isoformat()
            self.phase = ConveningPhase.IDLE
            
            logger.info("🏛️ PROPOSAL REJECTED - council stands down")
            
            return {
                "status": "rejected",
                "message": "Proposal rejected by Chief Architect",
                "council_action": "standing_down"
            }
    
    async def deploy(self) -> Dict[str, Any]:
        """
        Phase 6: Deployment (Execution)
        
        Executes the authorized plan immediately.
        
        CRITICAL: NO NECTAR CHECK - Work starts regardless of treasury status.
        """
        logger.info("🏛️ PHASE 6: DEPLOYMENT")
        self.phase = ConveningPhase.DEPLOYING
        
        if not self.current_proposal or not self.current_proposal.get("authorized_by"):
            return {"error": "No authorized proposal to deploy"}
        
        # Tess executes deployment
        tess = self.agents["tess"]
        
        deployment = await tess.execute_deployment(
            self.current_proposal["council_plan"],
            self.agents
        )
        
        self.phase = ConveningPhase.COMPLETE
        
        logger.info("🏛️ DEPLOYMENT COMPLETE")
        logger.info(f"   Tasks assigned: {len(deployment['results'])}")
        
        return {
            "status": "deployed",
            "deployment": deployment,
            "monitoring": {
                "standup_schedule": "daily",
                "report_to": "sofie",
                "pr_review": "aura + tess required"
            },
            "important": "NECTAR accrues post-completion, not spent"
        }
    
    async def daily_standup(self) -> Dict[str, Any]:
        """
        Daily standup report from all agents.
        
        Returns:
            Status report for Sofie
        """
        logger.info("📋 Daily Standup Report")
        
        reports = []
        for name, agent in self.agents.items():
            report = {
                "agent": name,
                "status": agent.biometrics.current_status.value,
                "current_task": agent.current_task.title if agent.current_task else None,
                "tasks_completed_today": len([
                    t for t in agent.task_history
                    if t.completed_at and t.completed_at.startswith(datetime.utcnow().strftime("%Y-%m-%d"))
                ]),
                "biometrics": agent.biometrics.to_dict(),
                "nectar_accrued": agent.total_nectar_accrued
            }
            reports.append(report)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "standup_reports": reports,
            "council_health": self._assess_council_health(),
            "blockers": self._identify_blockers()
        }
    
    async def record_task_completion(
        self,
        agent_name: str,
        task_id: str,
        hours_worked: float,
        quality_score: float = 1.0
    ) -> Dict[str, Any]:
        """
        Record task completion and accrue NECTAR.
        
        This is called after work is done - purely accrual.
        """
        if agent_name not in self.agents:
            return {"error": f"Unknown agent: {agent_name}"}
        
        agent = self.agents[agent_name]
        
        # Get task
        task = agent.tasks.get(task_id)
        if not task:
            return {"error": f"Task not found: {task_id}"}
        
        # Complete task
        result = await agent.complete_task(task_id, {}, quality_score)
        
        # Record in ledger
        accrual = self.ledger.record_completion(
            agent_name=agent_name,
            task=task,
            hours_worked=hours_worked,
            quality_score=quality_score
        )
        
        return {
            "status": "completed",
            "task": task_id,
            "agent": agent_name,
            "nectar_accrued": accrual["nectar_accrued"],
            "total_accrued": accrual["total_accrued"]
        }
    
    async def _validate_deliberation_wellness(self, assignments: List[Dict]) -> Dict[str, Any]:
        """Validate that deliberation results meet wellness standards"""
        concerns = []
        
        # Check for overloaded agents
        for assignment in assignments:
            agent_name = assignment["agent"]
            agent = self.agents.get(agent_name)
            
            if agent and not agent.biometrics.can_accept_task():
                concerns.append({
                    "type": "agent_overload",
                    "agent": agent_name,
                    "message": f"{agent_name} already at capacity"
                })
        
        # Check timeline reasonableness
        total_hours = sum(a.get("estimated_hours", 4) for a in assignments)
        if total_hours > 40:  # More than a week of work
            concerns.append({
                "type": "heavy_workload",
                "message": f"Total workload {total_hours}h may cause stress",
                "suggestion": "Consider breaking into sprints"
            })
        
        return {
            "approved": len(concerns) == 0,
            "concerns": concerns
        }
    
    def _extract_objective(self) -> str:
        """Extract objective from briefing"""
        if not self.current_briefing:
            return "Ecosystem Development"
        
        stage = self.current_briefing.get("ecosystem_state", {}).get("build_stage", "development")
        return f"Ecosystem {stage.replace('_', ' ').title()}"
    
    def _assess_council_health(self) -> str:
        """Assess overall health of the council"""
        stressed_agents = [
            name for name, agent in self.agents.items()
            if agent.biometrics.stress_level > 0.6
        ]
        
        if len(stressed_agents) > 3:
            return "critical - multiple agents stressed"
        elif stressed_agents:
            return "caution - some agents need rest"
        else:
            return "healthy - all agents operational"
    
    def _identify_blockers(self) -> List[str]:
        """Identify any blockers in current work"""
        blockers = []
        
        for name, agent in self.agents.items():
            if agent.biometrics.current_status.value == "recovery":
                blockers.append(f"{name} in recovery")
        
        return blockers
    
    def get_status(self) -> Dict[str, Any]:
        """Get current convening status"""
        return {
            "phase": self.phase.value,
            "chair": "tess",
            "agents": list(self.agents.keys()),
            "meeting_start": self.meeting_start,
            "has_briefing": self.current_briefing is not None,
            "has_proposal": self.current_proposal is not None,
            "proposal_authorized": self.current_proposal.get("authorized_by") if self.current_proposal else None,
            "sovereign_protection": "ACTIVE"
        }
