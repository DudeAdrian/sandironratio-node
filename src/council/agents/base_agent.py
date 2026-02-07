"""
Base Agent Class - Common capabilities for all Council agents

All 6 Council agents (Veda, Aura, Hex, Node, Spark, Tess) inherit from this base.
Provides:
- Biometric state tracking (stress, workload, rest requirements)
- Task management and execution
- NECTAR accrual reporting
- Health monitoring
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Any, List, Optional, Callable
import json

logger = logging.getLogger(__name__)


class AgentStatus(Enum):
    """Agent operational status"""
    IDLE = "idle"
    WORKING = "working"
    DELIBERATING = "deliberating"
    REVIEWING = "reviewing"
    RECOVERY = "recovery"  # Resting due to stress/overwork
    OFFLINE = "offline"


class TaskPriority(Enum):
    """Task priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


@dataclass
class AgentBiometrics:
    """Biometric state of an agent (simulated for AI agents)"""
    stress_level: float = 0.0  # 0.0 - 1.0
    cognitive_load: float = 0.0  # 0.0 - 1.0
    concurrent_tasks: int = 0
    hours_worked_today: float = 0.0
    last_break_timestamp: datetime = field(default_factory=datetime.utcnow)
    last_rest_timestamp: datetime = field(default_factory=datetime.utcnow)
    current_status: AgentStatus = AgentStatus.IDLE
    
    # Wellness thresholds
    MAX_CONCURRENT_TASKS: int = 3
    MAX_HOURS_PER_DAY: float = 8.0
    BREAK_INTERVAL_HOURS: float = 4.0
    REST_DURATION_MINUTES: float = 15.0
    STRESS_THRESHOLD: float = 0.7
    
    def needs_break(self) -> bool:
        """Check if agent needs a break"""
        hours_since_break = (datetime.utcnow() - self.last_break_timestamp).total_seconds() / 3600
        return hours_since_break >= self.BREAK_INTERVAL_HOURS
    
    def needs_rest(self) -> bool:
        """Check if agent needs extended rest"""
        return (
            self.stress_level > self.STRESS_THRESHOLD or
            self.hours_worked_today >= self.MAX_HOURS_PER_DAY or
            self.cognitive_load > 0.8
        )
    
    def can_accept_task(self) -> bool:
        """Check if agent can accept new work"""
        if self.concurrent_tasks >= self.MAX_CONCURRENT_TASKS:
            return False
        if self.needs_rest():
            return False
        if self.current_status == AgentStatus.RECOVERY:
            return False
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "stress_level": round(self.stress_level, 2),
            "cognitive_load": round(self.cognitive_load, 2),
            "concurrent_tasks": self.concurrent_tasks,
            "hours_worked_today": round(self.hours_worked_today, 2),
            "last_break": self.last_break_timestamp.isoformat(),
            "needs_break": self.needs_break(),
            "needs_rest": self.needs_rest(),
            "can_accept_task": self.can_accept_task(),
            "status": self.current_status.value
        }


@dataclass
class Task:
    """A task assigned to an agent"""
    id: str
    title: str
    description: str
    repo: str
    priority: TaskPriority
    estimated_hours: float
    dependencies: List[str] = field(default_factory=list)
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "pending"  # pending, in_progress, completed, blocked
    nectar_accrued: float = 0.0
    quality_score: float = 1.0  # Multiplier for NECTAR accrual
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "repo": self.repo,
            "priority": self.priority.value,
            "estimated_hours": self.estimated_hours,
            "status": self.status,
            "dependencies": self.dependencies,
            "nectar_accrued": self.nectar_accrued
        }


class BaseAgent(ABC):
    """
    Base class for all Council agents.
    
    Provides common functionality:
    - Biometric tracking and wellness monitoring
    - Task management
    - NECTAR accrual reporting
    - Health status reporting
    """
    
    def __init__(
        self,
        name: str,
        specialization: str,
        capabilities: List[str],
        hexagonal_position: int  # 0-5 position in council hexagon
    ):
        self.name = name
        self.specialization = specialization
        self.capabilities = capabilities
        self.hexagonal_position = hexagonal_position
        
        # Biometric state
        self.biometrics = AgentBiometrics()
        
        # Task management
        self.tasks: Dict[str, Task] = {}
        self.task_history: List[Task] = []
        self.current_task: Optional[Task] = None
        
        # NECTAR tracking (reported to Hex)
        self.total_hours_worked: float = 0.0
        self.total_nectar_accrued: float = 0.0
        
        # Deliberation state
        self.deliberation_notes: List[str] = []
        self.sofie_briefing: Optional[Dict[str, Any]] = None
        
        # Event callbacks
        self.on_status_change: Optional[Callable] = None
        self.on_task_complete: Optional[Callable] = None
        
        logger.info(f"🤖 Agent {self.name} initialized ({self.specialization})")
    
    @abstractmethod
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """
        Execute a task. Must be implemented by each agent.
        
        Args:
            task: The task to execute
            
        Returns:
            Task execution results
        """
        pass
    
    @abstractmethod
    def can_handle_task(self, task_description: str) -> float:
        """
        Check if this agent can handle a task.
        
        Args:
            task_description: Description of the task
            
        Returns:
            Confidence score 0.0-1.0
        """
        pass
    
    def receive_briefing(self, briefing: Dict[str, Any]):
        """Receive briefing from Sofie"""
        self.sofie_briefing = briefing
        self.deliberation_notes = []
        logger.info(f"{self.name} received Sofie's briefing")
    
    def report_capacity(self) -> Dict[str, Any]:
        """Report current capacity for task assignment"""
        return {
            "agent": self.name,
            "specialization": self.specialization,
            "can_accept_task": self.biometrics.can_accept_task(),
            "current_load": self.biometrics.concurrent_tasks,
            "max_load": self.biometrics.MAX_CONCURRENT_TASKS,
            "biometrics": self.biometrics.to_dict(),
            "current_task": self.current_task.to_dict() if self.current_task else None
        }
    
    async def assign_task(self, task: Task) -> bool:
        """
        Assign a new task to this agent.
        
        Args:
            task: Task to assign
            
        Returns:
            True if task accepted
        """
        if not self.biometrics.can_accept_task():
            logger.warning(
                f"{self.name} cannot accept task '{task.title}': "
                f"concurrent={self.biometrics.concurrent_tasks}, "
                f"needs_rest={self.biometrics.needs_rest()}"
            )
            return False
        
        task.assigned_at = datetime.utcnow()
        task.status = "pending"
        self.tasks[task.id] = task
        self.biometrics.concurrent_tasks += 1
        
        logger.info(f"{self.name} assigned task: {task.title}")
        return True
    
    async def start_task(self, task_id: str) -> bool:
        """Start working on a task"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        task.started_at = datetime.utcnow()
        task.status = "in_progress"
        self.current_task = task
        self.biometrics.current_status = AgentStatus.WORKING
        
        logger.info(f"{self.name} started task: {task.title}")
        return True
    
    async def complete_task(
        self, 
        task_id: str, 
        result: Dict[str, Any],
        quality_score: float = 1.0
    ) -> Dict[str, Any]:
        """
        Complete a task and report NECTAR accrual.
        
        Args:
            task_id: Task ID
            result: Task execution results
            quality_score: Quality multiplier for NECTAR
            
        Returns:
            Completion report with NECTAR accrual
        """
        if task_id not in self.tasks:
            return {"error": "Task not found"}
        
        task = self.tasks[task_id]
        task.completed_at = datetime.utcnow()
        task.status = "completed"
        task.quality_score = quality_score
        
        # Calculate actual hours worked
        if task.started_at:
            duration = (task.completed_at - task.started_at).total_seconds() / 3600
        else:
            duration = task.estimated_hours
        
        # Update biometrics
        self.biometrics.concurrent_tasks -= 1
        self.biometrics.hours_worked_today += duration
        self.biometrics.cognitive_load = max(0, self.biometrics.cognitive_load - 0.2)
        
        if self.biometrics.concurrent_tasks == 0:
            self.biometrics.current_status = AgentStatus.IDLE
            self.current_task = None
        
        # Calculate NECTAR accrual (reported to Hex)
        # Base rate: 10 NECTAR per hour
        base_nectar = 10.0 * duration
        task.nectar_accrued = base_nectar * quality_score
        
        self.total_hours_worked += duration
        self.total_nectar_accrued += task.nectar_accrued
        
        # Move to history
        self.task_history.append(task)
        
        completion_report = {
            "agent": self.name,
            "task_id": task_id,
            "task_title": task.title,
            "duration_hours": round(duration, 2),
            "quality_score": quality_score,
            "nectar_accrued": round(task.nectar_accrued, 2),
            "total_accrued": round(self.total_nectar_accrued, 2),
            "result": result
        }
        
        logger.info(
            f"{self.name} completed task: {task.title} "
            f"(+{task.nectar_accrued:.2f} NECTAR)"
        )
        
        if self.on_task_complete:
            await self.on_task_complete(completion_report)
        
        return completion_report
    
    async def take_break(self):
        """Take a mandatory break"""
        logger.info(f"{self.name} taking break...")
        self.biometrics.current_status = AgentStatus.RECOVERY
        self.biometrics.last_break_timestamp = datetime.utcnow()
        
        # Simulate 15-minute break
        await asyncio.sleep(0.1)  # In production, this would be actual rest time
        
        self.biometrics.stress_level = max(0, self.biometrics.stress_level - 0.3)
        self.biometrics.cognitive_load = max(0, self.biometrics.cognitive_load - 0.3)
        
        if self.biometrics.can_accept_task():
            self.biometrics.current_status = AgentStatus.IDLE
        
        logger.info(f"{self.name} break complete. Status: {self.biometrics.current_status.value}")
    
    async def rest(self):
        """Take extended rest (triggered by high stress or max hours)"""
        logger.info(f"{self.name} entering extended rest...")
        self.biometrics.current_status = AgentStatus.RECOVERY
        
        # Simulate extended rest
        await asyncio.sleep(0.5)
        
        self.biometrics.stress_level = 0.0
        self.biometrics.cognitive_load = 0.0
        self.biometrics.last_rest_timestamp = datetime.utcnow()
        
        logger.info(f"{self.name} rest complete. Ready for new tasks.")
    
    def add_deliberation_note(self, note: str):
        """Add a note during council deliberation"""
        self.deliberation_notes.append(note)
        logger.debug(f"{self.name} deliberation: {note}")
    
    def get_deliberation_input(self) -> str:
        """Get this agent's input during deliberation"""
        notes = "\\n".join(self.deliberation_notes)
        return f"{self.name} ({self.specialization}):\\n{notes}"
    
    def get_neighbor_agents(self, all_agents: List['BaseAgent']) -> List['BaseAgent']:
        """
        Get the agents that are hexagonal neighbors.
        In a hexagon, each agent has 2 neighbors.
        """
        num_agents = len(all_agents)
        left_pos = (self.hexagonal_position - 1) % num_agents
        right_pos = (self.hexagonal_position + 1) % num_agents
        
        neighbors = []
        for agent in all_agents:
            if agent.hexagonal_position in [left_pos, right_pos]:
                neighbors.append(agent)
        
        return neighbors
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize agent state"""
        return {
            "name": self.name,
            "specialization": self.specialization,
            "capabilities": self.capabilities,
            "hex_position": self.hexagonal_position,
            "biometrics": self.biometrics.to_dict(),
            "current_task": self.current_task.to_dict() if self.current_task else None,
            "pending_tasks": len([t for t in self.tasks.values() if t.status == "pending"]),
            "completed_tasks": len(self.task_history),
            "total_hours": round(self.total_hours_worked, 2),
            "total_nectar": round(self.total_nectar_accrued, 2)
        }
