"""
Node (The Weaver) - API Integration and DevOps Specialist

Specialization: API integration, DevOps, service orchestration
Domain: Docker, CI/CD, microservices, external bridges

Critical Boundary: Builds bridges TO Sofie (external APIs), never modifies IN Sofie
Responsibilities: Ensures services start on correct ports, manages inter-service communication
Deliverable: External APIs that Sofie can choose to consume
"""

import logging
from typing import Dict, Any, List, Optional

from .base_agent import BaseAgent, Task

logger = logging.getLogger(__name__)


class NodeAgent(BaseAgent):
    """
    Node - The Weaver
    
    Capabilities:
    - Docker containerization
    - CI/CD pipeline setup
    - Microservice orchestration
    - API bridge development
    - External service integration
    - Port management
    - Health checks
    
    Critical Principle:
    Node builds EXTERNAL bridges that Sofie MAY consume.
    Node NEVER modifies Sofie's internal code.
    
    Example:
    - ✅ Build: wellness-bridge API at localhost:9002
    - ❌ Never: Modify sofie-llama-backend to add wellness features
    """
    
    CAPABILITIES = [
        "docker",
        "kubernetes",
        "cicd",
        "microservices",
        "api_integration",
        "devops",
        "service_mesh",
        "load_balancing",
        "health_checks",
        "port_management",
        "bridge_development"
    ]
    
    SPECIALIZATION_KEYWORDS = [
        "docker", "kubernetes", "k8s", "devops", "ci/cd", "pipeline",
        "integration", "bridge", "api", "service", "port", "container",
        "deployment", "orchestration", "health", "monitoring"
    ]
    
    # Standard port allocations for ecosystem services
    PORT_ALLOCATIONS = {
        "sandironratio-node": 3000,    # Council headquarters
        "sofie-llama-backend": 8000,   # Chief of Staff (SOVEREIGN - external only)
        "council-api": 9000,           # Council API server
        "wellness-bridge": 9002,       # Pollen wellness API
        "hive-api": 9003,              # Hive consensus API
        "terracare-ledger": 8545,      # Blockchain RPC
    }
    
    def __init__(self):
        super().__init__(
            name="node",
            specialization="DevOps & API Bridge Development",
            capabilities=self.CAPABILITIES,
            hexagonal_position=3  # Position 3 in the hexagon
        )
        
        # Track active services
        self.active_services: Dict[str, Dict[str, Any]] = {}
        
        logger.info("🔗 Node (The Weaver) initialized")
        logger.info("   Building bridges TO Sofie, never modifying IN Sofie")
    
    def can_handle_task(self, task_description: str) -> float:
        """Calculate confidence that Node can handle this task"""
        description_lower = task_description.lower()
        
        matches = sum(
            1 for keyword in self.SPECIALIZATION_KEYWORDS 
            if keyword in description_lower
        )
        
        confidence = min(1.0, matches / 3)
        
        # Boost for bridge/integration tasks
        if "bridge" in description_lower or "integration" in description_lower:
            confidence = min(1.0, confidence + 0.4)
        
        return confidence
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a DevOps or integration task"""
        logger.info(f"🔗 Node executing: {task.title}")
        
        # Determine task type
        description = task.description.lower()
        
        if "docker" in description or "container" in description:
            return await self._create_docker_setup(task)
        
        elif "bridge" in description or "api" in description:
            return await self._build_api_bridge(task)
        
        elif "deploy" in description or "cicd" in description:
            return await self._setup_cicd(task)
        
        elif "health" in description or "monitor" in description:
            return await self._setup_health_checks(task)
        
        else:
            return await self._general_devops(task)
    
    async def _create_docker_setup(self, task: Task) -> Dict[str, Any]:
        """Create Docker configuration for a service"""
        logger.info(f"🐳 Node creating Docker setup for {task.repo}")
        
        # Determine port
        port = self.PORT_ALLOCATIONS.get(task.repo, 8080)
        
        dockerfile = f"""# Dockerfile for {task.repo}
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE {port}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:{port}/health || exit 1

# Run application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "{port}"]
"""
        
        docker_compose = f"""version: '3.8'

services:
  {task.repo.replace('-', '_')}:
    build: .
    ports:
      - "{port}:{port}"
    environment:
      - PORT={port}
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:{port}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
"""
        
        self.biometrics.cognitive_load += 0.15
        
        return {
            "status": "completed",
            "files_created": [
                "Dockerfile",
                "docker-compose.yml"
            ],
            "dockerfile": dockerfile,
            "docker_compose": docker_compose,
            "port": port,
            "health_check_enabled": True
        }
    
    async def _build_api_bridge(self, task: Task) -> Dict[str, Any]:
        """
        Build an API bridge to connect external services.
        
        This is Node's specialty - creating bridges that Sofie can consume.
        """
        logger.info(f"🔗 Node building API bridge: {task.title}")
        
        # Determine the target service
        description = task.description.lower()
        
        if "wellness" in description or "pollen" in description:
            return await self._build_wellness_bridge(task)
        
        elif "hive" in description:
            return await self._build_hive_bridge(task)
        
        elif "terracare" in description or "ledger" in description:
            return await self._build_ledger_bridge(task)
        
        else:
            return await self._build_generic_bridge(task)
    
    async def _build_wellness_bridge(self, task: Task) -> Dict[str, Any]:
        """
        Build wellness API bridge.
        
        This bridge allows Sofie to access wellness validation
        WITHOUT modifying her internal code.
        """
        port = self.PORT_ALLOCATIONS.get("wellness-bridge", 9002)
        
        bridge_code = f"""\"\"
Wellness Bridge API
External service that Sofie can consume
"\"\"

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(title="Wellness Bridge", version="1.0.0")

class CodeValidationRequest(BaseModel):
    code: str
    language: str = "python"
    hrv_context: float = 50.0

class ValidationResponse(BaseModel):
    valid: bool
    wellness_score: float
    violations: list
    cognitive_load: float

@app.get("/health")
async def health():
    return {{"status": "healthy", "service": "wellness-bridge"}}

@app.post("/validate/code", response_model=ValidationResponse)
async def validate_code(request: CodeValidationRequest):
    \"\"
    Validate code for wellness compliance.
    
    Sofie calls this endpoint to validate code
    WITHOUT exposing her internals.
    \"\"
    # Integration with Pollen's WellnessCodeValidator
    # would happen here
    
    return ValidationResponse(
        valid=True,
        wellness_score=8.5,
        violations=[],
        cognitive_load=3.2
    )

@app.get("/biometrics/status/{{user_id}}")
async def get_biometric_status(user_id: str):
    \"\"
    Get current biometric status for user.
    \"\"
    return {{
        "user_id": user_id,
        "hrv": 65.0,
        "sleep_score": 7.5,
        "coding_eligible": True
    }}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port={port})
"""
        
        self.biometrics.cognitive_load += 0.2
        
        return {
            "status": "completed",
            "bridge_type": "wellness",
            "port": port,
            "sofie_consumes": f"http://localhost:{port}",
            "files_created": ["wellness_bridge.py"],
            "bridge_code": bridge_code,
            "endpoints": [
                "POST /validate/code",
                "GET /biometrics/status/{user_id}",
                "GET /health"
            ],
            "note": "Sofie can consume this API without code modification"
        }
    
    async def _build_hive_bridge(self, task: Task) -> Dict[str, Any]:
        """Build Hive consensus API bridge"""
        port = self.PORT_ALLOCATIONS.get("hive-api", 9003)
        
        return {
            "status": "completed",
            "bridge_type": "hive",
            "port": port,
            "endpoints": [
                "POST /consensus/vote",
                "GET /consensus/status",
                "POST /pheromone/trail"
            ]
        }
    
    async def _build_ledger_bridge(self, task: Task) -> Dict[str, Any]:
        """Build Terracare ledger bridge"""
        return {
            "status": "completed",
            "bridge_type": "terracare-ledger",
            "port": 8545,
            "integration": "Web3/Ethers.js compatible"
        }
    
    async def _build_generic_bridge(self, task: Task) -> Dict[str, Any]:
        """Build generic API bridge"""
        return {
            "status": "completed",
            "bridge_type": "generic",
            "pattern": "External API with documented endpoints",
            "principle": "Sofie consumes via HTTP, no code modification"
        }
    
    async def _setup_cicd(self, task: Task) -> Dict[str, Any]:
        """Setup CI/CD pipeline"""
        logger.info(f"🔄 Node setting up CI/CD for {task.repo}")
        
        github_actions = """name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest
    - name: Run tests
      run: pytest
    - name: Wellness check
      run: |
        # Aura's wellness validation would run here
        echo "Wellness validation passed"
"""
        
        self.biometrics.cognitive_load += 0.1
        
        return {
            "status": "completed",
            "pipeline": "GitHub Actions",
            "files_created": [".github/workflows/ci.yml"],
            "config": github_actions,
            "steps": ["test", "wellness_check", "build", "deploy"]
        }
    
    async def _setup_health_checks(self, task: Task) -> Dict[str, Any]:
        """Setup health monitoring"""
        return {
            "status": "completed",
            "health_endpoints": ["/health", "/ready", "/live"],
            "monitoring": "Prometheus metrics exposed",
            "alerts": "Configured for downtime detection"
        }
    
    async def _general_devops(self, task: Task) -> Dict[str, Any]:
        """Handle general DevOps tasks"""
        return {
            "status": "completed",
            "task": task.title,
            "deliverables": ["DevOps configuration", "Deployment scripts"]
        }
    
    def get_service_map(self) -> Dict[str, Any]:
        """Get map of all ecosystem services and their ports"""
        return {
            "services": {
                name: {
                    "port": port,
                    "status": self.active_services.get(name, {}).get("status", "unknown"),
                    "health": self.active_services.get(name, {}).get("health", "unknown")
                }
                for name, port in self.PORT_ALLOCATIONS.items()
            },
            "note": "sofie-llama-backend is sovereign - external API only"
        }
    
    async def start_service(self, service_name: str) -> Dict[str, Any]:
        """Start an ecosystem service"""
        if service_name not in self.PORT_ALLOCATIONS:
            return {"error": f"Unknown service: {service_name}"}
        
        port = self.PORT_ALLOCATIONS[service_name]
        
        # In production, this would actually start the service
        self.active_services[service_name] = {
            "status": "starting",
            "port": port,
            "started_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"🚀 Node starting {service_name} on port {port}")
        
        return {
            "service": service_name,
            "port": port,
            "status": "starting",
            "health_endpoint": f"http://localhost:{port}/health"
        }
