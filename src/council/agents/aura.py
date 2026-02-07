"""
Aura (The Healer) - QA, Wellness Validation, and Safety Auditing

Specialization: QA, wellness validation, safety auditing, documentation
Domain: Biometric impact analysis, stress pattern detection, accessibility
Authority: ABSOLUTE VETO POWER on any code that violates wellness principles

Responsibilities:
- Reviews ALL council output before submission
- Validates "Calm Architecture" compliance
- Works with Pollen's existing WellnessCodeValidator
- Has final say on all council decisions

Veto Trigger: Any dark patterns, addictive mechanisms, or stress-inducing UI detected
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from enum import Enum

from .base_agent import BaseAgent, Task, TaskPriority

logger = logging.getLogger(__name__)


class VetoReason(Enum):
    """Reasons for Aura's veto"""
    DARK_PATTERN = "dark_pattern"
    ADDICTIVE_MECHANISM = "addictive_mechanism"
    STRESS_INDUCING = "stress_inducing"
    ACCESSIBILITY_VIOLATION = "accessibility_violation"
    HIGH_COGNITIVE_LOAD = "high_cognitive_load"
    BIOMETRIC_IMPACT = "biometric_impact"
    PRIVACY_RISK = "privacy_risk"


class AuraAgent(BaseAgent):
    """
    Aura - The Healer
    
    The Council's conscience and guardian of wellness.
    
    Capabilities:
    - Code review for wellness compliance
    - Stress pattern detection
    - Accessibility auditing
    - Documentation review
    - Final approval/veto on all council work
    
    Authority:
    - ABSOLUTE VETO POWER over any council decision
    - Can block deployment of any code that violates wellness principles
    - Must approve all proposals before they reach the Chief Architect
    """
    
    CAPABILITIES = [
        "wellness_validation",
        "code_review",
        "accessibility_audit",
        "stress_pattern_detection",
        "documentation_review",
        "dark_pattern_detection",
        "biometric_impact_assessment",
        "calm_architecture_validation",
        "veto_power"  # Special authority
    ]
    
    # Keywords that indicate tasks Aura should handle
    SPECIALIZATION_KEYWORDS = [
        "review", "validate", "audit", "test", "check",
        "wellness", "health", "stress", "calm", "accessibility",
        "documentation", "quality", "safety", "compliance"
    ]
    
    # Anti-patterns that trigger immediate veto
    VETO_PATTERNS = {
        VetoReason.DARK_PATTERN: [
            "dark pattern", "deceptive", "tricky", "roach motel",
            "forced continuity", "hidden opt", "preselected"
        ],
        VetoReason.ADDICTIVE_MECHANISM: [
            "infinite scroll", "pull to refresh", "variable reward",
            "hook model", "sticky", "engagement loop", "dopamine"
        ],
        VetoReason.STRESS_INDUCING: [
            "urgent", "hurry", "limited time", "countdown", "fomo",
            "fear of missing", "only X left", "others viewing"
        ],
        VetoReason.HIGH_COGNITIVE_LOAD: [
            "complex form", "many steps", "confusing", "overwhelming"
        ]
    }
    
    def __init__(self):
        super().__init__(
            name="aura",
            specialization="Wellness Validation & QA with Absolute Veto",
            capabilities=self.CAPABILITIES,
            hexagonal_position=1  # Position 1 in the hexagon
        )
        
        # Track vetoes issued
        self.vetoes_issued: List[Dict[str, Any]] = []
        self.approvals_issued: List[Dict[str, Any]] = []
        
        logger.info("🛡️ Aura (The Healer) initialized - Absolute Veto Power Active")
    
    def can_handle_task(self, task_description: str) -> float:
        """Calculate confidence that Aura can handle this task"""
        description_lower = task_description.lower()
        
        # Count matching keywords
        matches = sum(
            1 for keyword in self.SPECIALIZATION_KEYWORDS 
            if keyword in description_lower
        )
        
        # Calculate confidence
        confidence = min(1.0, matches / 2)
        
        # Boost for review/validation tasks
        if any(term in description_lower for term in ["review", "validate", "audit"]):
            confidence = min(1.0, confidence + 0.4)
        
        return confidence
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a review or validation task"""
        logger.info(f"🛡️ Aura reviewing: {task.title}")
        
        # This would integrate with the actual code being reviewed
        # For now, simulate the review process
        
        review_result = await self.review_proposal({
            "title": task.title,
            "description": task.description,
            "repo": task.repo
        })
        
        return review_result
    
    async def review_proposal(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Review a council proposal for wellness compliance.
        
        Args:
            proposal: The proposal to review
            
        Returns:
            Review result with approval or veto
        """
        logger.info(f"🛡️ Aura reviewing proposal: {proposal.get('title', 'Untitled')}")
        
        issues = []
        warnings = []
        suggestions = []
        
        # Check proposal description for anti-patterns
        description = proposal.get('description', '').lower()
        
        for veto_reason, patterns in self.VETO_PATTERNS.items():
            for pattern in patterns:
                if pattern in description:
                    issues.append({
                        "type": veto_reason.value,
                        "pattern": pattern,
                        "severity": "critical",
                        "message": f"Detected {veto_reason.value}: '{pattern}'"
                    })
        
        # Check for wellness-positive indicators
        wellness_indicators = [
            "calm", "mindful", "intentional", "wellness", "accessible",
            "gentle", "respectful", "privacy", "secure"
        ]
        
        positive_count = sum(1 for indicator in wellness_indicators if indicator in description)
        
        # Check estimated impact on users
        user_impact = proposal.get('user_impact', 'neutral')
        
        # Calculate wellness score
        base_score = 10.0
        base_score -= len(issues) * 3  # Critical issues
        base_score -= len(warnings) * 1  # Warnings
        base_score += positive_count * 0.5  # Positive indicators
        
        wellness_score = max(0, min(10, base_score))
        
        # Determine approval
        approved = len(issues) == 0 and wellness_score >= 6.0
        
        review_result = {
            "reviewer": "aura",
            "proposal": proposal.get('title'),
            "wellness_score": round(wellness_score, 2),
            "issues": issues,
            "warnings": warnings,
            "suggestions": suggestions,
            "positive_indicators": positive_count,
            "approved": approved,
            "veto_issued": not approved and len(issues) > 0
        }
        
        if review_result["veto_issued"]:
            await self.veto_proposal(proposal, issues)
        else:
            self.approvals_issued.append({
                "proposal": proposal.get('title'),
                "timestamp": self._get_timestamp(),
                "wellness_score": wellness_score
            })
        
        return review_result
    
    async def veto_proposal(
        self, 
        proposal: Dict[str, Any], 
        reasons: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Exercise ABSOLUTE VETO POWER over a proposal.
        
        This is Aura's most important authority. When a veto is issued,
        the proposal is immediately blocked and cannot proceed.
        
        Args:
            proposal: The proposal being vetoed
            reasons: List of reasons for the veto
            
        Returns:
            Veto declaration
        """
        veto_declaration = {
            "authority": "aura_absolute_veto",
            "proposal": proposal.get('title'),
            "veto_timestamp": self._get_timestamp(),
            "reasons": reasons,
            "message": (
                f"🚫 VETO ISSUED by Aura (The Healer) 🚫\\n\\n"
                f"Proposal '{proposal.get('title')}' violates wellness principles.\\n"
                f"This proposal is BLOCKED and cannot proceed.\\n\\n"
                f"Reasons:\\n" +
                "\\n".join([f"  - {r['message']}" for r in reasons]) +
                f"\\n\\nRequired actions:\\n"
                f"  1. Address all critical issues\\n"
                f"  2. Resubmit for Aura's review\\n"
                f"  3. Obtain wellness compliance approval"
            ),
            "can_override": False,  # Absolute veto - no override
            "requires_redesign": True
        }
        
        self.vetoes_issued.append(veto_declaration)
        
        logger.warning(f"🚫 AURA VETO: {proposal.get('title')}")
        for reason in reasons:
            logger.warning(f"   Reason: {reason['message']}")
        
        return veto_declaration
    
    async def review_code(
        self, 
        code: str, 
        language: str = "python",
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Review code for wellness compliance.
        
        Args:
            code: Code to review
            language: Programming language
            context: Additional context
            
        Returns:
            Review results with wellness assessment
        """
        issues = []
        suggestions = []
        
        code_lower = code.lower()
        
        # Check for stress-inducing patterns
        stress_patterns = {
            "tight_loop": ["while true:", "for (;;)", "while(1)"],
            "deep_nesting": None,  # Detected via indentation analysis
            "magic_numbers": None,  # Detected via regex
            "long_functions": None  # Detected via line count
        }
        
        # Check for infinite loops
        for pattern in stress_patterns["tight_loop"]:
            if pattern in code_lower:
                issues.append({
                    "type": "potential_infinite_loop",
                    "severity": "warning",
                    "message": f"Tight loop pattern detected: {pattern}",
                    "suggestion": "Add yield points or timeout mechanisms"
                })
        
        # Check function length
        lines = code.split("\\n")
        if len(lines) > 50:
            issues.append({
                "type": "long_function",
                "severity": "info",
                "message": f"Function is {len(lines)} lines long",
                "suggestion": "Consider breaking into smaller functions"
            })
        
        # Check indentation depth
        max_indent = 0
        for line in lines:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                max_indent = max(max_indent, indent)
        
        if max_indent > 16:  # 4 levels
            issues.append({
                "type": "deep_nesting",
                "severity": "warning",
                "message": f"Deep nesting detected ({max_indent//4} levels)",
                "suggestion": "Refactor to reduce nesting"
            })
        
        # Calculate cognitive load estimate
        cognitive_load = self._estimate_cognitive_load(code, len(lines))
        
        # Determine approval
        critical_issues = [i for i in issues if i['severity'] == 'critical']
        approved = len(critical_issues) == 0
        
        return {
            "reviewer": "aura",
            "language": language,
            "lines_reviewed": len(lines),
            "cognitive_load_estimate": round(cognitive_load, 2),
            "issues": issues,
            "approved": approved,
            "veto_issued": len(critical_issues) > 0,
            "wellness_score": max(0, 10 - len(issues) * 1.5)
        }
    
    async def validate_agent_wellness(self, agent: BaseAgent) -> Dict[str, Any]:
        """
        Check if another agent is fit to continue working.
        
        Aura monitors the biometric health of all council agents.
        
        Args:
            agent: Agent to check
            
        Returns:
            Wellness assessment with recommendations
        """
        biometrics = agent.biometrics
        
        concerns = []
        recommendations = []
        
        if biometrics.stress_level > 0.7:
            concerns.append(f"High stress level: {biometrics.stress_level:.2f}")
            recommendations.append(f"Recommend {agent.name} take immediate break")
        
        if biometrics.hours_worked_today > 8:
            concerns.append(f"Max hours exceeded: {biometrics.hours_worked_today:.1f}")
            recommendations.append(f"{agent.name} must stop work for today")
        
        if biometrics.needs_break():
            concerns.append("Break overdue")
            recommendations.append(f"{agent.name} should take 15-minute break")
        
        return {
            "agent": agent.name,
            "fit_for_duty": len(concerns) == 0,
            "concerns": concerns,
            "recommendations": recommendations,
            "biometrics": biometrics.to_dict()
        }
    
    async def validate_deliberation(self, deliberation: Dict[str, Any]) -> bool:
        """
        Validate that a council deliberation is healthy and productive.
        
        Args:
            deliberation: The deliberation to validate
            
        Returns:
            True if deliberation is valid
        """
        # Check for signs of unhealthy deliberation
        red_flags = []
        
        if deliberation.get('duration_minutes', 0) > 60:
            red_flags.append("Deliberation exceeding 1 hour - may indicate deadlock")
        
        if len(deliberation.get('conflicts', [])) > 3:
            red_flags.append("Multiple unresolved conflicts")
        
        if deliberation.get('stress_level', 0) > 0.6:
            red_flags.append("High stress detected in deliberation")
        
        if red_flags:
            logger.warning(f"Aura detected unhealthy deliberation: {red_flags}")
            return False
        
        return True
    
    def _estimate_cognitive_load(self, code: str, line_count: int) -> float:
        """Estimate cognitive load of code (0.0-1.0)"""
        load = 0.0
        
        # Factor in line count
        load += min(0.3, line_count / 200)
        
        # Factor in complexity indicators
        complexity_keywords = ['if', 'for', 'while', 'try', 'except', 'with']
        for keyword in complexity_keywords:
            count = code.count(keyword)
            load += min(0.1, count / 20)
        
        return min(1.0, load)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    def get_veto_statistics(self) -> Dict[str, Any]:
        """Get statistics on vetoes issued"""
        return {
            "total_vetoes": len(self.vetoes_issued),
            "total_approvals": len(self.approvals_issued),
            "veto_rate": len(self.vetoes_issued) / max(1, len(self.vetoes_issued) + len(self.approvals_issued)),
            "recent_vetoes": self.vetoes_issued[-5:] if self.vetoes_issued else [],
            "common_reasons": self._analyze_veto_reasons()
        }
    
    def _analyze_veto_reasons(self) -> Dict[str, int]:
        """Analyze common veto reasons"""
        reasons = {}
        for veto in self.vetoes_issued:
            for reason in veto.get('reasons', []):
                reason_type = reason.get('type', 'unknown')
                reasons[reason_type] = reasons.get(reason_type, 0) + 1
        return reasons
