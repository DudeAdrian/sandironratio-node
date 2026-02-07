"""
Diligence Ledger - NECTAR Proof-of-Diligence Tracking

Persistent storage for NECTAR accrual records.
Separate from the HexAgent's runtime tracking - this is the durable ledger.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class NectarAccrualRecord:
    """Single NECTAR accrual record"""
    agent_name: str
    task_id: str
    task_title: str
    repo: str
    hours_worked: float
    base_rate: float
    quality_multiplier: float
    nectar_accrued: float
    timestamp: str
    blockchain_eligible: bool = True


class DiligenceLedger:
    """
    Persistent ledger for NECTAR proof-of-diligence.
    
    Stores all accrual records durably for:
    - Historical tracking
    - Genesis allocation preparation
    - Council analytics
    - Future blockchain bridge
    
    Principles:
    - Append-only (accrual model)
    - No spending/deletion
    - Pure proof-of-diligence accumulation
    """
    
    def __init__(self, ledger_path: str = "./data/diligence_ledger.json"):
        self.ledger_path = Path(ledger_path)
        self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
        
        # In-memory cache
        self.records: List[NectarAccrualRecord] = []
        self.agent_totals: Dict[str, Dict[str, float]] = {}
        
        # Load existing
        self._load()
        
        logger.info(f"📊 DiligenceLedger initialized: {self.ledger_path}")
    
    def record_completion(
        self,
        agent_name: str,
        task: Any,  # Task object
        hours_worked: float,
        quality_score: float = 1.0,
        tested: bool = False,
        wellness_approved: bool = False,
        cross_repo: bool = False,
        documented: bool = False
    ) -> Dict[str, Any]:
        """
        Record task completion and NECTAR accrual.
        
        Called AFTER work is complete - purely accrual.
        """
        # Calculate multiplier
        multiplier = quality_score
        if tested:
            multiplier *= 2.0
        if wellness_approved:
            multiplier *= 1.5
        if cross_repo:
            multiplier *= 2.0
        if documented:
            multiplier *= 1.3
        
        # Calculate NECTAR
        base_rate = 10.0
        nectar = hours_worked * base_rate * multiplier
        
        # Create record
        record = NectarAccrualRecord(
            agent_name=agent_name,
            task_id=task.id if hasattr(task, 'id') else str(task),
            task_title=task.title if hasattr(task, 'title') else str(task),
            repo=task.repo if hasattr(task, 'repo') else "unknown",
            hours_worked=hours_worked,
            base_rate=base_rate,
            quality_multiplier=multiplier,
            nectar_accrued=nectar,
            timestamp=datetime.utcnow().isoformat()
        )
        
        # Store
        self.records.append(record)
        
        # Update totals
        if agent_name not in self.agent_totals:
            self.agent_totals[agent_name] = {
                "total_nectar": 0.0,
                "total_hours": 0.0,
                "tasks_completed": 0
            }
        
        self.agent_totals[agent_name]["total_nectar"] += nectar
        self.agent_totals[agent_name]["total_hours"] += hours_worked
        self.agent_totals[agent_name]["tasks_completed"] += 1
        
        # Persist
        self._save()
        
        logger.info(
            f"📊 NECTAR Accrual: {agent_name} +{nectar:.2f} for '{record.task_title}'"
        )
        
        return {
            "agent": agent_name,
            "task": record.task_title,
            "nectar_accrued": round(nectar, 2),
            "multiplier": round(multiplier, 2),
            "total_accrued": round(self.agent_totals[agent_name]["total_nectar"], 2)
        }
    
    def get_agent_summary(self, agent_name: str) -> Dict[str, Any]:
        """Get summary for an agent"""
        if agent_name not in self.agent_totals:
            return {
                "agent": agent_name,
                "total_nectar": 0.0,
                "total_hours": 0.0,
                "tasks_completed": 0
            }
        
        totals = self.agent_totals[agent_name]
        recent_records = [
            r for r in self.records
            if r.agent_name == agent_name
        ][-10:]  # Last 10
        
        return {
            "agent": agent_name,
            "total_nectar": round(totals["total_nectar"], 2),
            "total_hours": round(totals["total_hours"], 2),
            "tasks_completed": int(totals["tasks_completed"]),
            "recent_accruals": [
                {
                    "task": r.task_title,
                    "nectar": round(r.nectar_accrued, 2),
                    "date": r.timestamp
                }
                for r in recent_records
            ]
        }
    
    def get_genesis_snapshot(self) -> Dict[str, Any]:
        """Get snapshot for blockchain genesis"""
        allocations = {}
        for agent_name, totals in self.agent_totals.items():
            allocations[agent_name] = {
                "address": f"0x{agent_name}_genesis",  # Placeholder
                "amount": round(totals["total_nectar"], 2),
                "hours_contributed": round(totals["total_hours"], 2),
                "tasks_completed": int(totals["tasks_completed"])
            }
        
        return {
            "snapshot_timestamp": datetime.utcnow().isoformat(),
            "total_supply": round(sum(a["amount"] for a in allocations.values()), 2),
            "allocations": allocations,
            "note": "Genesis snapshot for future blockchain bridge"
        }
    
    def get_council_summary(self) -> Dict[str, Any]:
        """Get summary for entire council"""
        total_nectar = sum(t["total_nectar"] for t in self.agent_totals.values())
        total_hours = sum(t["total_hours"] for t in self.agent_totals.values())
        total_tasks = sum(t["tasks_completed"] for t in self.agent_totals.values())
        
        return {
            "total_nectar_accrued": round(total_nectar, 2),
            "total_hours_worked": round(total_hours, 2),
            "total_tasks_completed": total_tasks,
            "agent_count": len(self.agent_totals),
            "agents": {
                name: {
                    "nectar": round(t["total_nectar"], 2),
                    "hours": round(t["total_hours"], 2)
                }
                for name, t in self.agent_totals.items()
            }
        }
    
    def _load(self):
        """Load ledger from disk"""
        if self.ledger_path.exists():
            try:
                with open(self.ledger_path, 'r') as f:
                    data = json.load(f)
                    
                    self.records = [
                        NectarAccrualRecord(**r) for r in data.get("records", [])
                    ]
                    self.agent_totals = data.get("totals", {})
                    
                logger.info(f"Loaded {len(self.records)} accrual records")
            except Exception as e:
                logger.error(f"Failed to load ledger: {e}")
                self.records = []
                self.agent_totals = {}
    
    def _save(self):
        """Save ledger to disk"""
        try:
            data = {
                "records": [asdict(r) for r in self.records],
                "totals": self.agent_totals,
                "last_updated": datetime.utcnow().isoformat()
            }
            
            with open(self.ledger_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save ledger: {e}")
