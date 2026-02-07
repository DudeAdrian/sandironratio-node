"""
Tess (The Lattice) - Systems Architecture and Council Chair

Specialization: Systems architecture, meeting chair, load balancer, dependency management
Domain: Cross-repo coordination, hexagonal topology maintenance, technical debt tracking

Role: CHAIR OF THE COUNCIL
- Receives Sofie's briefing and presents to council
- Optimizes task distribution across 6 agents (prevents overload)
- Maintains hexagonal balance (if one agent stressed, redistributes to healthy neighbor)
- Breaks ties in deliberation
- Estimates timelines and coordinates dependencies
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass

from .base_agent import BaseAgent, Task, TaskPriority, AgentStatus

logger = logging.getLogger(__name__)


@dataclass
class DeliberationRecord:
    """Record of a council deliberation"""
    topic: str
    started_at: str
    ended_at: Optional[str]
    participants: List[str]
    decisions: List[str]
    conflicts: List[str]
    stress_level: float


class TessAgent(BaseAgent):
    """
    Tess - The Lattice and Council Chair
    
    As Chair, Tess:
    1. Convenes council meetings
    2. Facilitates deliberation
    3. Optimizes task distribution
    4. Maintains hexagonal balance
    5. Breaks ties
    6. Coordinates dependencies
    
    The hexagonal topology:
         Veda (0)
        /      \\
    Tess (5) - Hex (2)
      |          |
    Spark (4) - Node (3)
         \\\n         Aura (1)
    
    Each agent has 2 neighbors for work redistribution.
    """
    
    CAPABILITIES = [
        "meeting_facilitation",
        "task_optimization",
        "load_balancing",
        "dependency_management",
        "timeline_estimation",
        "conflict_resolution",
        "hexagonal_topology",
        "cross_repo_coordination",
        "technical_debt_tracking",
        "chair_authority"
    ]
    
    SPECIALIZATION_KEYWORDS = [
        "coordinate", "facilitate", "chair", "optimize", "balance",
        "timeline", "dependency", "conflict", "topology", "distribute",
        "manage", "resolve", "plan", "architecture"
    ]
    
    def __init__(self):
        super().__init__(
            name="tess",
            specialization="Council Chair & Systems Architecture",
            capabilities=self.CAPABILITIES,
            hexagonal_position=5  # Position 5 in the hexagon (Chair)
        )
        
        # Chair-specific state
        self.current_meeting: Optional[Dict[str, Any]] = None
        self.deliberation_history: List[DeliberationRecord] = []
        self.agent_neighbors: Dict[str, List[str]] = {}
        
        logger.info("⚖️ Tess (The Lattice) initialized - Council Chair")
        logger.info("   Ready to convene the Council")
    
    def can_handle_task(self, task_description: str) -> float:
        """Calculate confidence that Tess can handle this task"""
        description_lower = task_description.lower()
        
        matches = sum(
            1 for keyword in self.SPECIALIZATION_KEYWORDS 
            if keyword in description_lower
        )
        
        confidence = min(1.0, matches / 2)
        
        # Boost for coordination/planning tasks
        if any(term in description_lower for term in ["coordinate", "plan", "chair", "manage"]):
            confidence = min(1.0, confidence + 0.4)
        
        return confidence
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a coordination or architecture task"""
        logger.info(f"⚖️ Tess coordinating: {task.title}")
        
        return {
            "status": "completed",
            "coordinated": True,
            "chair_action": task.title
        }
    
    async def convene_council(
        self,
        sofie_briefing: Dict[str, Any],
        agents: Dict[str, BaseAgent]
    ) -> Dict[str, Any]:
        """
        Convene the Council meeting.
        
        Phase 1-2 of the Convening Ceremony.
        
        Args:
            sofie_briefing: The ecosystem observation from Sofie
            agents: All 6 council agents
            
        Returns:
            Meeting initialization result
        """
        logger.info("⚖️ TESS: Convening the Council")
        logger.info(f"   Briefing received from Chief of Staff")
        
        # Record meeting start
        self.current_meeting = {
            "started_at": datetime.utcnow().isoformat(),
            "briefing": sofie_briefing,
            "agents_present": list(agents.keys()),
            "phase": "convened"
        }
        
        # Phase 1: Reception - All agents receive briefing
        for name, agent in agents.items():
            agent.receive_briefing(sofie_briefing)
            logger.info(f"   {name} received briefing")
        
        # Phase 2: Capacity Assessment
        capacity_reports = {}
        for name, agent in agents.items():
            capacity_reports[name] = agent.report_capacity()
        
        return {
            "status": "convened",
            "chair": "tess",
            "agents": list(agents.keys()),
            "capacity": capacity_reports,
            "briefing_summary": self._summarize_briefing(sofie_briefing)
        }
    
    async def facilitate_deliberation(
        self,
        agents: Dict[str, BaseAgent]
    ) -> Dict[str, Any]:
        """
        Facilitate council deliberation (Phase 3).
        
        Agents discuss how to address Sofie's briefing.
        Tess moderates and ensures all voices heard.
        
        Returns:
            Deliberation results with proposals
        """
        logger.info("⚖️ TESS: Facilitating deliberation")
        
        # Each agent identifies tasks they can handle
        proposals = []
        conflicts = []
        
        briefing = list(agents.values())[0].sofie_briefing if agents else {}
        critical_path = briefing.get("critical_path", [])
        
        for task_desc in critical_path:
            # Find best agent for this task
            best_agent = None
            best_confidence = 0.0
            
            contenders = []
            for name, agent in agents.items():
                confidence = agent.can_handle_task(task_desc)
                if confidence > 0.3:  # Threshold for consideration
                    contenders.append({
                        "agent": name,
                        "confidence": confidence,
                        "available": agent.biometrics.can_accept_task()
                    })
            
            # Sort by confidence
            contenders.sort(key=lambda x: x["confidence"], reverse=True)
            
            if len(contenders) > 1:
                # Check if top two are close (potential conflict)
                if contenders[0]["confidence"] - contenders[1]["confidence"] < 0.2:
                    conflicts.append({
                        "task": task_desc,
                        "between": [contenders[0]["agent"], contenders[1]["agent"]],
                        "resolution": "tess_decides"
                    })
                    # Tess breaks tie
                    best_agent = contenders[0]["agent"]
                else:
                    best_agent = contenders[0]["agent"]
            elif contenders:
                best_agent = contenders[0]["agent"]
            else:
                # No agent confident - assign to most capable even if low confidence
                best_agent = "veda"  # Default to builder
            
            if best_agent:
                proposals.append({
                    "task": task_desc,
                    "assigned_to": best_agent,
                    "confidence": contenders[0]["confidence"] if contenders else 0.3,
                    "alternatives": [c["agent"] for c in contenders[1:]] if len(contenders) > 1 else []
                })
        
        # Record deliberation
        record = DeliberationRecord(
            topic="Sofie's Briefing",
            started_at=self.current_meeting["started_at"] if self.current_meeting else datetime.utcnow().isoformat(),
            ended_at=datetime.utcnow().isoformat(),
            participants=list(agents.keys()),
            decisions=[p["assigned_to"] + " → " + p["task"][:30] for p in proposals],
            conflicts=[c["task"][:30] for c in conflicts],
            stress_level=max(a.biometrics.stress_level for a in agents.values())
        )
        self.deliberation_history.append(record)
        
        return {
            "status": "deliberated",
            "chair": "tess",
            "proposals": proposals,
            "conflicts": conflicts,
            "conflicts_resolved_by": "tess" if conflicts else None
        }
    
    async def optimize_distribution(
        self,
        proposals: List[Dict[str, Any]],
        agents: Dict[str, BaseAgent]
    ) -> Dict[str, Any]:
        """
        Optimize task distribution to maintain hexagonal balance.
        
        Ensures no agent is overloaded and redistributes if necessary.
        
        Returns:
            Optimized plan with assignments
        """
        logger.info("⚖️ TESS: Optimizing task distribution")
        
        assignments = []
        
        # Check current load on each agent
        agent_loads = {
            name: {
                "current_tasks": agent.biometrics.concurrent_tasks,
                "max_tasks": agent.biometrics.MAX_CONCURRENT_TASKS,
                "stress": agent.biometrics.stress_level,
                "available_capacity": agent.biometrics.MAX_CONCURRENT_TASKS - agent.biometrics.concurrent_tasks
            }
            for name, agent in agents.items()
        }
        
        # First pass: assign to preferred agents if they have capacity
        for proposal in proposals:
            preferred = proposal["assigned_to"]
            task = proposal["task"]
            
            if agent_loads[preferred]["available_capacity"] > 0:
                assignments.append({
                    "agent": preferred,
                    "task": task,
                    "estimated_hours": self._estimate_hours(task),
                    "repo": self._determine_repo(task)
                })
                agent_loads[preferred]["available_capacity"] -= 1
            else:
                # Preferred agent overloaded - redistribute to neighbor
                alternative = await self._redistribute_to_neighbor(
                    preferred, task, agents, agent_loads
                )
                if alternative:
                    assignments.append({
                        "agent": alternative,
                        "task": task,
                        "estimated_hours": self._estimate_hours(task),
                        "repo": self._determine_repo(task),
                        "redistributed_from": preferred,
                        "reason": "preferred_agent_at_capacity"
                    })
                    agent_loads[alternative]["available_capacity"] -= 1
                else:
                    # No one available - mark for later
                    assignments.append({
                        "agent": preferred,
                        "task": task,
                        "status": "queued",
                        "reason": "waiting_for_capacity"
                    })
        
        # Calculate total timeline
        timeline = self._calculate_timeline(assignments, agents)
        
        return {
            "status": "optimized",
            "chair": "tess",
            "assignments": assignments,
            "timeline": timeline,
            "redistributions": len([a for a in assignments if "redistributed_from" in a]),
            "load_balance": agent_loads
        }
    
    async def _redistribute_to_neighbor(
        self,
        overloaded_agent: str,
        task: str,
        agents: Dict[str, BaseAgent],
        agent_loads: Dict[str, Any]
    ) -> Optional[str]:
        """
        Redistribute work to a hexagonal neighbor.
        
        In the hexagon, each agent has 2 neighbors that can help.
        """
        # Get neighbors in hexagon
        neighbor_map = {
            "veda": ["tess", "aura"],
            "aura": ["veda", "hex"],
            "hex": ["aura", "node"],
            "node": ["hex", "spark"],
            "spark": ["node", "tess"],
            "tess": ["spark", "veda"]
        }
        
        neighbors = neighbor_map.get(overloaded_agent, [])
        
        # Find neighbor with capacity who can handle the task
        for neighbor_name in neighbors:
            if neighbor_name not in agents:
                continue
            
            neighbor = agents[neighbor_name]
            
            # Check capacity
            if agent_loads[neighbor_name]["available_capacity"] <= 0:
                continue
            
            # Check if neighbor can handle this task
            confidence = neighbor.can_handle_task(task)
            if confidence > 0.3:  # Minimum threshold
                logger.info(
                    f"⚖️ TESS: Redistributing task from {overloaded_agent} "
                    f"to neighbor {neighbor_name} (confidence: {confidence:.2f})"
                )
                return neighbor_name
        
        return None
    
    async def coordinate_dependencies(
        self,
        assignments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Identify and coordinate task dependencies.
        
        Returns:
            Assignments with dependency ordering
        """
        # Analyze dependencies
        for assignment in assignments:
            task = assignment["task"]
            
            # Determine if this task has dependencies
            if "bridge" in task.lower() or "api" in task.lower():
                # Bridge work depends on backend
                assignment["depends_on"] = self._find_backend_tasks(assignments)
            
            if "integration" in task.lower():
                # Integration depends on multiple components
                assignment["depends_on"] = self._find_component_tasks(assignments)
        
        # Topological sort by dependency
        ordered = self._topological_sort(assignments)
        
        return ordered
    
    async def present_proposal(
        self,
        plan: Dict[str, Any],
        sofie_endpoint: str = "http://localhost:8000"
    ) -> Dict[str, Any]:
        """
        Present the council's proposal to Sofie for relay to Chief Architect.
        
        Phase 4 of the Convening Ceremony.
        """
        logger.info("⚖️ TESS: Presenting proposal to Chief of Staff")
        
        proposal = {
            "status": "proposed",
            "council_plan": {
                "objective": plan.get("objective", "Ecosystem Development"),
                "assignments": plan.get("assignments", []),
                "total_timeline": plan.get("timeline", {}),
                "total_diligence_accrual": plan.get("nectar_estimate", {}),
                "wellness_validation": "pending_aura_final",
                "sovereign_boundary": "strict - no sofie-llama-backend access required",
                "chair": "tess",
                "council_version": "1.0.0"
            },
            "awaiting_chief_architect_authorization": True,
            "authorized_by": None
        }
        
        self.current_meeting["proposal"] = proposal
        self.current_meeting["phase"] = "awaiting_authorization"
        
        return proposal
    
    async def execute_deployment(
        self,
        authorized_plan: Dict[str, Any],
        agents: Dict[str, BaseAgent]
    ) -> Dict[str, Any]:
        """
        Execute deployment upon authorization (Phase 6).
        
        NO NECTAR CHECK - Work starts immediately on authorization.
        """
        logger.info("⚖️ TESS: Executing deployment")
        
        execution_results = []
        
        for assignment in authorized_plan.get("assignments", []):
            agent_name = assignment["agent"]
            
            if agent_name not in agents:
                execution_results.append({
                    "assignment": assignment,
                    "status": "failed",
                    "error": f"Agent {agent_name} not found"
                })
                continue
            
            agent = agents[agent_name]
            
            # Create task
            task = Task(
                id=f"council_{agent_name}_{datetime.utcnow().timestamp()}",
                title=assignment["task"],
                description=assignment["task"],
                repo=assignment.get("repo", "unknown"),
                priority=TaskPriority.HIGH,
                estimated_hours=assignment.get("estimated_hours", 4)
            )
            
            # Assign and start
            assigned = await agent.assign_task(task)
            if assigned:
                await agent.start_task(task.id)
                execution_results.append({
                    "assignment": assignment,
                    "status": "deployed",
                    "task_id": task.id,
                    "agent": agent_name
                })
            else:
                execution_results.append({
                    "assignment": assignment,
                    "status": "queued",
                    "reason": "agent_at_capacity",
                    "agent": agent_name
                })
        
        self.current_meeting["phase"] = "deployed"
        
        return {
            "status": "deployed",
            "chair": "tess",
            "results": execution_results,
            "monitoring": "daily_standup_reports"
        }
    
    def _summarize_briefing(self, briefing: Dict[str, Any]) -> str:
        """Create a summary of Sofie's briefing"""
        return (
            f"Ecosystem Stage: {briefing.get('ecosystem_state', {}).get('build_stage', 'unknown')} | "
            f"Active Repos: {len(briefing.get('ecosystem_state', {}).get('active_repos', []))} | "
            f"Critical Tasks: {len(briefing.get('critical_path', []))}"
        )
    
    def _estimate_hours(self, task: str) -> float:
        """Estimate hours for a task"""
        # Simple heuristic based on keywords
        if "simple" in task.lower() or "docs" in task.lower():
            return 4.0
        elif "complex" in task.lower() or "architecture" in task.lower():
            return 16.0
        else:
            return 8.0
    
    def _determine_repo(self, task: str) -> str:
        """Determine which repo a task belongs to"""
        task_lower = task.lower()
        
        if "wellness" in task_lower:
            return "pollen"
        elif "bridge" in task_lower or "api" in task_lower:
            return "terracare-bridge"
        elif "hive" in task_lower:
            return "hive-api"
        else:
            return "sandironratio-node"
    
    def _find_backend_tasks(self, assignments: List[Dict]) -> List[str]:
        """Find backend-related tasks in assignments"""
        return [
            a.get("task_id", "") 
            for a in assignments 
            if "backend" in a.get("task", "").lower()
        ]
    
    def _find_component_tasks(self, assignments: List[Dict]) -> List[str]:
        """Find component-related tasks in assignments"""
        return [
            a.get("task_id", "") 
            for a in assignments 
            if any(x in a.get("task", "").lower() for x in ["component", "service", "api"])
        ]
    
    def _topological_sort(self, assignments: List[Dict]) -> List[Dict]:
        """Sort assignments by dependency order"""
        # Simple implementation - in production would use proper graph sort
        # Tasks with dependencies go after their dependencies
        
        no_deps = [a for a in assignments if not a.get("depends_on")]
        with_deps = [a for a in assignments if a.get("depends_on")]
        
        return no_deps + with_deps
    
    def _calculate_timeline(
        self,
        assignments: List[Dict],
        agents: Dict[str, BaseAgent]
    ) -> Dict[str, Any]:
        """Calculate total timeline for the plan"""
        total_hours = sum(a.get("estimated_hours", 4) for a in assignments)
        
        # Find critical path (longest chain)
        # Simplified - assume parallel work where possible
        max_concurrent = len(agents)
        estimated_days = max(1, total_hours / (max_concurrent * 8))
        
        return {
            "total_hours": total_hours,
            "estimated_days": round(estimated_days, 1),
            "estimated_weeks": round(estimated_days / 5, 1),
            "critical_path": f"{round(estimated_days)} days",
            "buffer": "20% contingency included"
        }
    
    def get_meeting_minutes(self) -> Optional[Dict[str, Any]]:
        """Get minutes from current or last meeting"""
        if not self.current_meeting:
            return None
        
        return {
            "chair": "tess",
            "started": self.current_meeting.get("started_at"),
            "phase": self.current_meeting.get("phase"),
            "agents_present": self.current_meeting.get("agents_present", []),
            "briefing_summary": self._summarize_briefing(
                self.current_meeting.get("briefing", {})
            )
        }
