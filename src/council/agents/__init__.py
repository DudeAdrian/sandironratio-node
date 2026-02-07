"""
Council Agents Module - The Six Council Members

Hexagonal Council Structure:
        Veda (0) - The Builder
       /        \\
   Tess (5)    Aura (1) - The Healer
   (Chair)      (Veto Power)
      |          |
   Spark (4)  Hex (2) - The Keeper
   (Muse)      (NECTAR)
       \\\n       Node (3) - The Weaver

All agents inherit from BaseAgent and implement:
- can_handle_task(): Return confidence for task assignment
- execute_task(): Execute assigned task
"""

from .base_agent import BaseAgent, Task, TaskPriority, AgentStatus, AgentBiometrics
from .veda import VedaAgent
from .aura import AuraAgent, VetoReason
from .hex import HexAgent
from .node import NodeAgent
from .spark import SparkAgent
from .tess import TessAgent

__all__ = [
    # Base
    'BaseAgent',
    'Task',
    'TaskPriority',
    'AgentStatus',
    'AgentBiometrics',
    
    # The Six
    'VedaAgent',
    'AuraAgent',
    'VetoReason',
    'HexAgent',
    'NodeAgent',
    'SparkAgent',
    'TessAgent',
]


def create_council() -> Dict[str, BaseAgent]:
    """
    Factory function to create all 6 council agents.
    
    Returns:
        Dictionary of agent instances keyed by name
    """
    return {
        "veda": VedaAgent(),      # Position 0
        "aura": AuraAgent(),      # Position 1
        "hex": HexAgent(),        # Position 2
        "node": NodeAgent(),      # Position 3
        "spark": SparkAgent(),    # Position 4
        "tess": TessAgent(),      # Position 5 (Chair)
    }
