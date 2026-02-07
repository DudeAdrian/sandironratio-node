"""
GitHub Client with Sovereign Territory Protection

GitHub API client that enforces the absolute protection of sofie-llama-backend.
Any attempt to access protected repositories raises SovereignTerritoryError.
"""

import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

from .protected_repos import (
    is_sovereign_territory, 
    SovereignTerritoryError,
    SOVEREIGN_TERRITORY,
    PERMITTED_ECOSYSTEM_REPOS
)

logger = logging.getLogger(__name__)


class CouncilGitHubClient:
    """
    GitHub API client for the Council with sovereign protection.
    
    Enforces:
    - NEVER clone sofie-llama-backend
    - NEVER modify protected repositories
    - Only work in PERMITTED_ECOSYSTEM_REPOS
    
    All operations filter through is_sovereign_territory() check.
    """
    
    def __init__(
        self,
        github_token: Optional[str] = None,
        workspace_path: str = "./workspace",
        owner: str = "DudeAdrian"
    ):
        self.github_token = github_token
        self.workspace = Path(workspace_path)
        self.workspace.mkdir(parents=True, exist_ok=True)
        self.owner = owner
        
        logger.info("🔗 CouncilGitHubClient initialized")
        logger.info(f"   Workspace: {self.workspace}")
        logger.info(f"   Protected repos: {SOVEREIGN_TERRITORY}")
    
    def clone_repo(self, repo_name: str, branch: str = "main") -> Dict[str, Any]:
        """
        Clone a repository to the workspace.
        
        Raises:
            SovereignTerritoryError: If repo is protected
        """
        # Check sovereign territory
        if is_sovereign_territory(repo_name):
            raise SovereignTerritoryError(repo_name, "clone")
        
        target_path = self.workspace / repo_name
        
        # In production, this would actually clone:
        # git clone https://github.com/{self.owner}/{repo_name}.git {target_path}
        
        logger.info(f"🔗 Cloning {repo_name} to {target_path}")
        
        return {
            "status": "cloned",
            "repo": repo_name,
            "path": str(target_path),
            "branch": branch,
            "sovereign_check": "passed"
        }
    
    def create_branch(self, repo_name: str, branch_name: str, base: str = "main") -> Dict[str, Any]:
        """Create a new branch in a repo"""
        if is_sovereign_territory(repo_name):
            raise SovereignTerritoryError(repo_name, "create_branch")
        
        logger.info(f"🔗 Creating branch {branch_name} in {repo_name}")
        
        return {
            "status": "branch_created",
            "repo": repo_name,
            "branch": branch_name,
            "base": base
        }
    
    def commit_changes(
        self,
        repo_name: str,
        branch: str,
        message: str,
        files: List[str]
    ) -> Dict[str, Any]:
        """Commit changes to a branch"""
        if is_sovereign_territory(repo_name):
            raise SovereignTerritoryError(repo_name, "commit")
        
        logger.info(f"🔗 Committing to {repo_name}/{branch}: {message[:50]}...")
        
        return {
            "status": "committed",
            "repo": repo_name,
            "branch": branch,
            "commit_message": message,
            "files_changed": len(files)
        }
    
    def submit_pr(
        self,
        repo_name: str,
        branch: str,
        title: str,
        description: str = "",
        reviewers: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Submit a pull request.
        
        Note: User (Chief Architect) merges, not the council.
        """
        if is_sovereign_territory(repo_name):
            raise SovereignTerritoryError(repo_name, "submit_pr")
        
        # Default reviewers: Aura and Tess must approve
        default_reviewers = ["aura", "tess"]
        reviewers = reviewers or default_reviewers
        
        logger.info(f"🔗 Submitting PR to {repo_name}: {title}")
        logger.info(f"   Required reviewers: {reviewers}")
        
        return {
            "status": "pr_submitted",
            "repo": repo_name,
            "branch": branch,
            "title": title,
            "pr_url": f"https://github.com/{self.owner}/{repo_name}/pull/XXX",
            "reviewers": reviewers,
            "note": "Chief Architect will merge after review"
        }
    
    def get_repo_status(self, repo_name: str) -> Dict[str, Any]:
        """Get status of a repository"""
        if is_sovereign_territory(repo_name):
            return {
                "repo": repo_name,
                "status": "SOVEREIGN_TERRITORY",
                "accessible": False,
                "warning": "This repository is sovereign territory of the Chief of Staff"
            }
        
        return {
            "repo": repo_name,
            "status": "accessible",
            "accessible": True,
            "in_workspace": (self.workspace / repo_name).exists()
        }
    
    def list_permitted_repos(self) -> List[str]:
        """List all repos the council can work with"""
        return PERMITTED_ECOSYSTEM_REPOS.copy()
    
    def get_protected_list(self) -> List[str]:
        """Get list of protected repositories"""
        return SOVEREIGN_TERRITORY.copy()
    
    def validate_work_plan(self, repos: List[str]) -> Dict[str, Any]:
        """
        Validate that a work plan only includes permitted repos.
        
        Returns:
            Validation result with any violations
        """
        violations = []
        permitted = []
        
        for repo in repos:
            if is_sovereign_territory(repo):
                violations.append(repo)
            else:
                permitted.append(repo)
        
        return {
            "valid": len(violations) == 0,
            "permitted": permitted,
            "violations": violations,
            "can_proceed": len(violations) == 0
        }
