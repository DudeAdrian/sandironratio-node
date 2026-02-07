"""
Veda (The Builder) - Backend Architecture Specialist

Specialization: Backend architecture, complex algorithms, core logic implementation
Domain: Python/Node.js systems, API development, database design
Works in: pollen (extending wellness validator), hive services, integration layers

Biometric Constraint: Max 4 hours continuous coding, requires 15-minute break if stress > 0.7
"""

import logging
from typing import Dict, Any, List, Optional
import re

from .base_agent import BaseAgent, Task, TaskPriority

logger = logging.getLogger(__name__)


class VedaAgent(BaseAgent):
    """
    Veda - The Builder
    
    Capabilities:
    - File editing with AST parsing
    - Git operations
    - Test writing
    - Complex algorithm implementation
    - Database design
    - API development
    
    Forbidden: Any access to sofie-llama-backend internals
    """
    
    CAPABILITIES = [
        "backend_development",
        "api_design",
        "database_schema",
        "algorithm_implementation",
        "code_refactoring",
        "test_writing",
        "python",
        "nodejs",
        "typescript",
        "sql",
        "docker",
        "microservices"
    ]
    
    # Keywords that indicate tasks Veda should handle
    SPECIALIZATION_KEYWORDS = [
        "backend", "api", "server", "database", "algorithm",
        "python", "node", "typescript", "logic", "core",
        "architecture", "schema", "migration", "orm",
        "microservice", "docker", "kubernetes", "infrastructure"
    ]
    
    def __init__(self):
        super().__init__(
            name="veda",
            specialization="Backend Architecture & Complex Systems",
            capabilities=self.CAPABILITIES,
            hexagonal_position=0  # Position 0 in the hexagon
        )
        
        # Track code complexity to manage stress
        self.current_complexity_score: float = 0.0
        self.complexity_threshold: float = 0.7  # Trigger break if exceeded
        
        logger.info("🔨 Veda (The Builder) initialized")
    
    def can_handle_task(self, task_description: str) -> float:
        """
        Calculate confidence that Veda can handle this task.
        
        Returns:
            Confidence score 0.0-1.0
        """
        description_lower = task_description.lower()
        
        # Count matching keywords
        matches = sum(
            1 for keyword in self.SPECIALIZATION_KEYWORDS 
            if keyword in description_lower
        )
        
        # Calculate base confidence
        confidence = min(1.0, matches / 3)  # 3+ keywords = max confidence
        
        # Boost for clear backend tasks
        if any(term in description_lower for term in ["api", "backend", "server", "database"]):
            confidence = min(1.0, confidence + 0.3)
        
        # Reduce confidence for frontend tasks
        if any(term in description_lower for term in ["ui", "frontend", "css", "react component"]):
            confidence *= 0.3
        
        return confidence
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """
        Execute a backend development task.
        
        Args:
            task: The task to execute
            
        Returns:
            Execution results with code changes
        """
        logger.info(f"🔨 Veda executing: {task.title}")
        
        # Check stress level before starting
        if self.biometrics.stress_level > self.complexity_threshold:
            logger.warning(f"Veda stress level {self.biometrics.stress_level} exceeds threshold. Taking break.")
            await self.take_break()
        
        # Simulate task execution
        # In production, this would:
        # 1. Clone repo to workspace/
        # 2. Analyze existing code
        # 3. Implement changes
        # 4. Write tests
        # 5. Submit PR
        
        execution_steps = []
        
        # Step 1: Analyze requirements
        execution_steps.append("Analyzed task requirements")
        self.biometrics.cognitive_load += 0.1
        
        # Step 2: Design approach
        execution_steps.append("Designed implementation approach")
        self.biometrics.cognitive_load += 0.1
        
        # Step 3: Implement code
        # Simulate complexity assessment
        complexity = self._estimate_task_complexity(task)
        self.current_complexity_score = complexity
        
        if complexity > 0.7:
            logger.info(f"High complexity task ({complexity:.2f}). Implementing carefully.")
            self.biometrics.stress_level += 0.2
        
        execution_steps.append(f"Implemented solution (complexity: {complexity:.2f})")
        self.biometrics.cognitive_load += 0.2
        
        # Step 4: Write tests
        execution_steps.append("Wrote comprehensive tests")
        self.biometrics.cognitive_load += 0.1
        
        # Step 5: Review for wellness compliance
        wellness_check = self._check_wellness_compliance(task)
        execution_steps.append(f"Wellness compliance check: {wellness_check['status']}")
        
        # Update stress based on task duration
        hours = task.estimated_hours
        if hours > 4:
            self.biometrics.stress_level += 0.15
            logger.warning(f"Long task ({hours}h). Veda will need break after.")
        
        # Generate result
        result = {
            "status": "completed",
            "steps": execution_steps,
            "complexity_score": complexity,
            "wellness_check": wellness_check,
            "files_modified": self._generate_file_list(task),
            "tests_added": True,
            "documentation_updated": True
        }
        
        logger.info(f"✅ Veda completed: {task.title}")
        return result
    
    def _estimate_task_complexity(self, task: Task) -> float:
        """Estimate the complexity of a task (0.0-1.0)"""
        # Base complexity on estimated hours
        base = min(1.0, task.estimated_hours / 8)
        
        # Adjust for keywords
        description = task.description.lower()
        complexity_indicators = [
            "algorithm", "complex", "optimization", "refactor",
            "architecture", "microservice", "distributed"
        ]
        
        boost = sum(0.1 for indicator in complexity_indicators if indicator in description)
        
        return min(1.0, base + boost)
    
    def _check_wellness_compliance(self, task: Task) -> Dict[str, Any]:
        """Check that implementation follows wellness principles"""
        # This would integrate with Aura's validation
        # For now, return basic check
        return {
            "status": "passed",
            "checks": [
                "No infinite loops detected",
                "Error handling implemented",
                "Logging added for observability"
            ]
        }
    
    def _generate_file_list(self, task: Task) -> List[str]:
        """Generate list of files that would be modified"""
        # Simulated file list based on task type
        repo = task.repo
        
        if "api" in task.description.lower():
            return [
                f"{repo}/src/api/routes.py",
                f"{repo}/src/api/models.py",
                f"{repo}/tests/api/test_routes.py"
            ]
        elif "database" in task.description.lower():
            return [
                f"{repo}/src/models/schema.py",
                f"{repo}/migrations/001_initial.py",
                f"{repo}/tests/models/test_schema.py"
            ]
        else:
            return [
                f"{repo}/src/core/implementation.py",
                f"{repo}/tests/core/test_implementation.py"
            ]
    
    async def design_architecture(self, requirements: str) -> Dict[str, Any]:
        """
        Design system architecture for given requirements.
        
        This is Veda's special ability - high-level system design.
        """
        logger.info(f"🏗️ Veda designing architecture for: {requirements[:50]}...")
        
        # Simulate architectural design
        design = {
            "pattern": "microservices" if "scale" in requirements.lower() else "monolith",
            "database": "postgresql" if "relational" in requirements.lower() else "mongodb",
            "caching": "redis" if "performance" in requirements.lower() else None,
            "messaging": "rabbitmq" if "async" in requirements.lower() else None,
            "components": [
                {"name": "api_gateway", "type": "entry_point"},
                {"name": "core_service", "type": "business_logic"},
                {"name": "data_layer", "type": "persistence"}
            ]
        }
        
        self.biometrics.cognitive_load += 0.15
        
        return {
            "design": design,
            "rationale": "Selected based on scalability and maintainability requirements",
            "estimated_effort": "2-3 weeks"
        }
    
    async def review_code(self, code: str, language: str = "python") -> Dict[str, Any]:
        """
        Review code for quality and wellness compliance.
        
        Args:
            code: Code to review
            language: Programming language
            
        Returns:
            Review results with suggestions
        """
        issues = []
        suggestions = []
        
        # Check for tight loops
        if language in ["python", "javascript", "typescript"]:
            if "while True" in code or "for (;;)" in code:
                issues.append("Potential infinite loop detected")
                suggestions.append("Add break condition or use iterator")
        
        # Check function length
        lines = code.split("\\n")
        if len(lines) > 50:
            issues.append("Function is quite long")
            suggestions.append("Consider breaking into smaller functions")
        
        # Check nesting depth
        max_indent = max(len(line) - len(line.lstrip()) for line in lines if line.strip())
        if max_indent > 16:  # 4 levels of 4-space indentation
            issues.append("Deep nesting detected")
            suggestions.append("Refactor to reduce nesting depth")
        
        return {
            "issues": issues,
            "suggestions": suggestions,
            "quality_score": 1.0 - (len(issues) * 0.1),
            "wellness_compliant": len(issues) == 0
        }
