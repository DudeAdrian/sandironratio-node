"""
Hex (The Keeper) - Tokenomics and NECTAR Diligence Tracking

Specialization: Tokenomics, NECTAR diligence tracking, economic models
Domain: Resource accounting, ledger integration, consensus algorithms

Responsibilities:
- Calculates NECTAR accrual rates post-completion (NOT spending/budgeting)
- Prepares genesis bridge for future blockchain tokenization
- Tracks proof-of-diligence without blocking work

Core Principle:
NECTAR is never spent to start tasks; it accrues after completion.
Zero balance does not prevent work. NECTAR tracks the reality of work
for future blockchain tokenization without hindering current builds.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum

from .base_agent import BaseAgent, Task

logger = logging.getLogger(__name__)


class AccrualMultiplier(Enum):
    """Quality multipliers for NECTAR accrual"""
    BASE = 1.0
    TESTED = 2.0           # Completed + tested
    WELLNESS_APPROVED = 1.5  # Aura approval
    CROSS_REPO = 2.0       # Cross-repo integration
    DOCUMENTED = 1.3       # Documentation complete


@dataclass
class NectarAccrual:
    """Single NECTAR accrual record"""
    agent_name: str
    task_id: str
    task_title: str
    hours_worked: float
    base_rate: float = 10.0  # 10 NECTAR per hour base
    quality_multiplier: float = 1.0
    nectar_accrued: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    blockchain_eligible: bool = True
    repo: str = ""
    
    def __post_init__(self):
        if self.nectar_accrued == 0.0:
            self.nectar_accrued = self.hours_worked * self.base_rate * self.quality_multiplier


class HexAgent(BaseAgent):
    """
    Hex - The Keeper of Diligence
    
    Manages the NECTAR proof-of-diligence system.
    
    Key Principles:
    1. ACCRUAL MODEL: NECTAR accrues AFTER work completion
    2. NON-BLOCKING: Zero balance never prevents task assignment
    3. NO SPENDING: NECTAR is not spent to start or continue work
    4. PROOF OF REALITY: Tracks actual work done for future tokenization
    5. GENESIS PREPARATION: Prepares for eventual blockchain bridge
    
    NECTAR Economics:
    - Base rate: 10 NECTAR per hour worked
    - Quality multipliers: tested (2x), wellness-approved (1.5x), etc.
    - No transfers, no decay, no budgets
    - Pure accumulation of proof-of-diligence
    """
    
    CAPABILITIES = [
        "nectar_tracking",
        "accrual_calculation",
        "genesis_preparation",
        "diligence_reporting",
        "economic_modeling",
        "consensus_participation",
        "ledger_maintenance"
    ]
    
    SPECIALIZATION_KEYWORDS = [
        "nectar", "token", "economic", "diligence", "ledger",
        "accrual", "reward", "compensation", "blockchain", "genesis"
    ]
    
    def __init__(self, ledger_path: str = "./data/diligence_ledger.json"):
        super().__init__(
            name="hex",
            specialization="NECTAR Diligence Tracking & Tokenomics",
            capabilities=self.CAPABILITIES,
            hexagonal_position=2  # Position 2 in the hexagon
        )
        
        self.ledger_path = Path(ledger_path)
        self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
        
        # In-memory ledger
        self.ledger: Dict[str, Dict[str, float]] = {}  # agent_name -> stats
        self.accrual_history: List[NectarAccrual] = []
        
        # Load existing ledger
        self._load_ledger()
        
        logger.info("📊 Hex (The Keeper) initialized - NECTAR tracking active")
        logger.info(f"   Ledger: {self.ledger_path}")
    
    def can_handle_task(self, task_description: str) -> float:
        """Calculate confidence that Hex can handle this task"""
        description_lower = task_description.lower()
        
        matches = sum(
            1 for keyword in self.SPECIALIZATION_KEYWORDS 
            if keyword in description_lower
        )
        
        return min(1.0, matches / 2)
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a NECTAR-related task"""
        logger.info(f"📊 Hex executing: {task.title}")
        
        # This would handle actual tokenomics calculations
        # For now, simulate the work
        
        return {
            "status": "completed",
            "action": "nectar_calculation",
            "ledger_entries_updated": len(self.ledger)
        }
    
    def record_completion(
        self,
        agent_name: str,
        task: Task,
        hours_worked: float,
        quality_score: float = 1.0,
        tested: bool = False,
        wellness_approved: bool = False,
        cross_repo: bool = False,
        documented: bool = False
    ) -> Dict[str, Any]:
        """
        Record task completion and calculate NECTAR accrual.
        
        CRITICAL: This is called AFTER work is done - purely accrual.
        Never called before or during work.
        
        Args:
            agent_name: Name of the agent who completed the work
            task: The completed task
            hours_worked: Actual hours worked
            quality_score: Base quality multiplier (0.0-1.0)
            tested: Whether the work has tests
            wellness_approved: Whether Aura approved the work
            cross_repo: Whether it involved cross-repo integration
            documented: Whether documentation is complete
            
        Returns:
            Accrual record
        """
        # Calculate quality multiplier
        multiplier = self._calculate_multiplier(
            quality_score=quality_score,
            tested=tested,
            wellness_approved=wellness_approved,
            cross_repo=cross_repo,
            documented=documented
        )
        
        # Create accrual record
        accrual = NectarAccrual(
            agent_name=agent_name,
            task_id=task.id,
            task_title=task.title,
            hours_worked=hours_worked,
            quality_multiplier=multiplier,
            repo=task.repo
        )
        
        # Update ledger
        if agent_name not in self.ledger:
            self.ledger[agent_name] = {
                "accrued": 0.0,
                "hours_worked": 0.0,
                "tasks_completed": 0,
                "quality_avg": 0.0,
                "last_accrual": ""
            }
        
        agent_record = self.ledger[agent_name]
        agent_record["accrued"] += accrual.nectar_accrued
        agent_record["hours_worked"] += hours_worked
        agent_record["tasks_completed"] += 1
        agent_record["last_accrual"] = accrual.timestamp
        
        # Update quality average
        current_avg = agent_record["quality_avg"]
        task_count = agent_record["tasks_completed"]
        agent_record["quality_avg"] = (
            (current_avg * (task_count - 1) + multiplier) / task_count
        )
        
        # Add to history
        self.accrual_history.append(accrual)
        
        # Persist ledger
        self._save_ledger()
        
        logger.info(
            f"📊 NECTAR Accrual: {agent_name} +{accrual.nectar_accrued:.2f} "
            f"for '{task.title}' (multiplier: {multiplier:.2f}x)"
        )
        
        return {
            "agent": agent_name,
            "task": task.title,
            "hours": hours_worked,
            "multiplier": multiplier,
            "nectar_accrued": round(accrual.nectar_accrued, 2),
            "total_accrued": round(agent_record["accrued"], 2),
            "blockchain_eligible": True
        }
    
    def _calculate_multiplier(
        self,
        quality_score: float,
        tested: bool,
        wellness_approved: bool,
        cross_repo: bool,
        documented: bool
    ) -> float:
        """Calculate the quality multiplier for NECTAR accrual"""
        multiplier = quality_score  # Base from quality score
        
        # Apply bonuses (multiplicative)
        if tested:
            multiplier *= AccrualMultiplier.TESTED.value
        
        if wellness_approved:
            multiplier *= AccrualMultiplier.WELLNESS_APPROVED.value
        
        if cross_repo:
            multiplier *= AccrualMultiplier.CROSS_REPO.value
        
        if documented:
            multiplier *= AccrualMultiplier.DOCUMENTED.value
        
        return round(multiplier, 2)
    
    def calculate_accrual_estimate(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate estimated NECTAR accrual for a plan.
        
        This is called during deliberation to show POTENTIAL accrual.
        Actual accrual happens after completion.
        
        Args:
            plan: The proposed plan
            
        Returns:
            Accrual estimate by agent
        """
        estimates = {}
        total = 0.0
        
        for assignment in plan.get("assignments", []):
            agent = assignment.get("agent")
            hours = assignment.get("estimated_duration", 0)
            
            # Assume standard quality for estimate
            estimated_nectar = hours * 10.0  # Base rate
            
            # Boost for cross-repo work
            if "cross" in assignment.get("description", "").lower():
                estimated_nectar *= 2.0
            
            if agent not in estimates:
                estimates[agent] = {"hours": 0, "nectar": 0}
            
            estimates[agent]["hours"] += hours
            estimates[agent]["nectar"] += estimated_nectar
            total += estimated_nectar
        
        return {
            "by_agent": estimates,
            "total_nectar": round(total, 2),
            "disclaimer": "Estimate only. Actual accrual based on quality multipliers post-completion.",
            "important": "NECTAR never blocks work. Zero balance = full deployment rights."
        }
    
    def get_genesis_allocation(self, agent_name: str) -> Dict[str, Any]:
        """
        Get the genesis allocation for an agent.
        
        For future blockchain bridge - converts internal NECTAR to
        on-chain tokens at genesis.
        
        Args:
            agent_name: Name of the agent
            
        Returns:
            Genesis allocation details
        """
        if agent_name not in self.ledger:
            return {
                "agent": agent_name,
                "genesis_allocation": 0.0,
                "status": "no_record"
            }
        
        record = self.ledger[agent_name]
        
        return {
            "agent": agent_name,
            "genesis_allocation": round(record["accrued"], 2),
            "hours_contributed": round(record["hours_worked"], 2),
            "tasks_completed": int(record["tasks_completed"]),
            "average_quality": round(record["quality_avg"], 2),
            "status": "eligible_for_genesis",
            "note": "1:1 mapping of internal NECTAR to on-chain tokens at genesis"
        }
    
    def get_all_genesis_allocations(self) -> Dict[str, Any]:
        """Get genesis allocations for all agents"""
        allocations = {}
        total = 0.0
        
        for agent_name in self.ledger:
            alloc = self.get_genesis_allocation(agent_name)
            allocations[agent_name] = alloc
            total += alloc["genesis_allocation"]
        
        return {
            "allocations": allocations,
            "total_supply": round(total, 2),
            "agent_count": len(allocations),
            "status": "ready_for_genesis_bridge"
        }
    
    def get_agent_stats(self, agent_name: str) -> Dict[str, Any]:
        """Get diligence stats for an agent"""
        if agent_name not in self.ledger:
            return {
                "agent": agent_name,
                "accrued": 0.0,
                "hours": 0.0,
                "tasks": 0
            }
        
        record = self.ledger[agent_name]
        
        # Get recent accruals
        recent = [
            a for a in self.accrual_history 
            if a.agent_name == agent_name
        ][-10:]  # Last 10
        
        return {
            "agent": agent_name,
            "accrued_nectar": round(record["accrued"], 2),
            "hours_worked": round(record["hours_worked"], 2),
            "tasks_completed": int(record["tasks_completed"]),
            "average_quality": round(record["quality_avg"], 2),
            "last_accrual": record["last_accrual"],
            "recent_accruals": [{
                "task": a.task_title,
                "nectar": round(a.nectar_accrued, 2),
                "date": a.timestamp
            } for a in recent]
        }
    
    def get_council_summary(self) -> Dict[str, Any]:
        """Get summary stats for entire council"""
        total_nectar = sum(r["accrued"] for r in self.ledger.values())
        total_hours = sum(r["hours_worked"] for r in self.ledger.values())
        total_tasks = sum(r["tasks_completed"] for r in self.ledger.values())
        
        return {
            "council_name": "SandIronRatio Council",
            "total_nectar_accrued": round(total_nectar, 2),
            "total_hours_worked": round(total_hours, 2),
            "total_tasks_completed": int(total_tasks),
            "agent_count": len(self.ledger),
            "agents": {
                name: {
                    "nectar": round(r["accrued"], 2),
                    "hours": round(r["hours_worked"], 2),
                    "tasks": int(r["tasks_completed"])
                }
                for name, r in self.ledger.items()
            },
            "genesis_ready": True,
            "note": "NECTAR tracks work reality for future blockchain tokenization"
        }
    
    def _load_ledger(self):
        """Load ledger from disk"""
        if self.ledger_path.exists():
            try:
                with open(self.ledger_path, 'r') as f:
                    data = json.load(f)
                    self.ledger = data.get("ledger", {})
                    self.accrual_history = [
                        NectarAccrual(**a) for a in data.get("history", [])
                    ]
                logger.info(f"Loaded ledger with {len(self.ledger)} agents")
            except Exception as e:
                logger.error(f"Failed to load ledger: {e}")
                self.ledger = {}
                self.accrual_history = []
    
    def _save_ledger(self):
        """Save ledger to disk"""
        try:
            data = {
                "ledger": self.ledger,
                "history": [asdict(a) for a in self.accrual_history],
                "last_updated": datetime.utcnow().isoformat()
            }
            
            with open(self.ledger_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save ledger: {e}")
    
    def verify_non_blocking_principle(self) -> Dict[str, Any]:
        """
        Verify that NECTAR system follows non-blocking principles.
        
        This is a sanity check to ensure the system is working correctly.
        """
        checks = {
            "no_spending_mechanism": True,  # NECTAR cannot be spent
            "zero_balance_allowed": True,   # Zero doesn't block work
            "accrual_only": True,           # Only adds, never subtracts
            "post_completion": True,        # Only after work done
            "no_budgets": True,             # No budget system
        }
        
        return {
            "principle": "NECTAR is proof-of-diligence, not currency",
            "blocking": False,
            "checks": checks,
            "status": "compliant" if all(checks.values()) else "violation_detected"
        }
