"""
Protected Repositories - Sovereign Territory Enforcement

ABSOLUTE PROTECTION - The Forbidden Zone:
- github.com/DudeAdrian/sofie-llama-backend is SOVEREIGN TERRITORY
- Council agents NEVER clone, read, modify, or reference this repository
- Sofie operates independently as Chief of Staff ABOVE the council
- Any attempt by council to access sofie-llama-backend triggers SovereignTerritoryError
- Council builds AROUND Sofie, never touches her internals
"""

from typing import List, Set


# SOVEREIGN TERRITORY - These repositories are ABSOLUTELY PROTECTED
# The Council is FORBIDDEN from accessing these in any way
SOVEREIGN_TERRITORY: List[str] = [
    "sofie-llama-backend",      # Chief of Staff's sovereign domain
    "sofie-backend",            # Legacy backend (also protected)
]

# Protected patterns - any repo matching these patterns is also protected
PROTECTED_PATTERNS: List[str] = [
    "sofie-*",                  # All Sofie-related repositories
    "*sofie*",                  # Any repo with 'sofie' in name
]

# The Council's workspace - where permitted repos are cloned
COUNCIL_WORKSPACE: str = "./workspace"

# API endpoints that Sofie exposes (Council can call these, but never modify internals)
SOFIE_EXTERNAL_APIS: List[str] = [
    "http://localhost:8000/health",
    "http://localhost:8000/api/mirror/speak",
    "http://localhost:8000/api/wellness/status",
    # Council builds bridges TO these endpoints, never modifies IN Sofie
]


class SovereignTerritoryError(Exception):
    """
    Raised when Council attempts to access sovereign territory.
    
    This is a CRITICAL error - the Council must NEVER access:
    - sofie-llama-backend repository
    - Any internal Sofie code or configuration
    - Any repository in SOVEREIGN_TERRITORY list
    
    The Council builds EXTERNAL interfaces that Sofie may choose to use.
    Sofie remains completely sovereign and independent.
    """
    
    def __init__(self, repo_name: str, attempted_action: str = "access"):
        self.repo_name = repo_name
        self.attempted_action = attempted_action
        
        message = (
            f"🚫 SOVEREIGN TERRITORY VIOLATION 🚫\\n"
            f"Repository: {repo_name}\\n"
            f"Attempted action: {attempted_action}\\n\\n"
            f"{repo_name} is sovereign territory of the Chief of Staff (Sofie).\\n"
            f"The Council is FORBIDDEN from accessing this repository.\\n\\n"
            f"Council agents must:\\n"
            f"  - NEVER clone this repository\\n"
            f"  - NEVER read its code\\n"
            f"  - NEVER modify its files\\n"
            f"  - NEVER reference its internals\\n\\n"
            f"Instead, the Council should:\\n"
            f"  - Build EXTERNAL services that expose APIs\\n"
            f"  - Create bridges TO Sofie's public interfaces\\n"
            f"  - Work in OTHER ecosystem repositories\\n"
            f"  - Respect Sofie's complete sovereignty\\n\\n"
            f"If Sofie needs functionality, she will observe it externally."
        )
        
        super().__init__(message)


def is_sovereign_territory(repo_name: str) -> bool:
    """
    Check if a repository is sovereign territory.
    
    Args:
        repo_name: Name of the repository (with or without owner prefix)
        
    Returns:
        True if the repository is sovereign territory and cannot be accessed
    """
    # Strip owner prefix if present
    if "/" in repo_name:
        repo_name = repo_name.split("/")[-1]
    
    # Check exact matches
    if repo_name in SOVEREIGN_TERRITORY:
        return True
    
    # Check patterns
    import fnmatch
    for pattern in PROTECTED_PATTERNS:
        if fnmatch.fnmatch(repo_name, pattern):
            return True
    
    return False


def validate_repo_access(repo_name: str, attempted_action: str = "access") -> None:
    """
    Validate that a repository can be accessed by the Council.
    
    Args:
        repo_name: Name of the repository
        attempted_action: Description of the attempted action
        
    Raises:
        SovereignTerritoryError: If the repository is sovereign territory
    """
    if is_sovereign_territory(repo_name):
        raise SovereignTerritoryError(repo_name, attempted_action)


def get_permitted_repos(all_repos: List[str]) -> List[str]:
    """
    Filter a list of repositories to only those permitted for Council access.
    
    Args:
        all_repos: List of all repository names
        
    Returns:
        List of repositories the Council is permitted to work with
    """
    return [repo for repo in all_repos if not is_sovereign_territory(repo)]


# Ecosystem repositories that the Council CAN work with
# These are built to serve Sofie's needs without modifying her core
PERMITTED_ECOSYSTEM_REPOS: List[str] = [
    "pollen",                   # Wellness validation (already implemented)
    "sandironratio-node",       # Council headquarters (this repo)
    "terracare-ledger",         # Blockchain integration
    "terracare-bridge",         # API bridges
    "hive-api",                 # Hive consensus services
    "heartware",                # Biometric data collection
    "harmonic-balance",         # Frequency therapy
    "terratrek",                # Geographic services
    "nectar-tracker",           # Diligence tracking (Hex's domain)
    "sofie-dashboard",          # External dashboard (separate from Sofie core)
    "wellness-bridge",          # Wellness API bridge
    # Add more as ecosystem grows
]


def get_ecosystem_build_targets() -> List[str]:
    """
    Get the list of ecosystem repositories the Council should build.
    
    These are the targets for Council development work.
    Sofie observes these externally but her core remains protected.
    
    Returns:
        List of repository names for Council development
    """
    return PERMITTED_ECOSYSTEM_REPOS.copy()
