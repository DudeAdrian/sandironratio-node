#!/bin/bash
#
# ═══════════════════════════════════════════════════════════════════════════════
# sofie.sh - DudeAdrian God Mode Launcher
# ═══════════════════════════════════════════════════════════════════════════════
#
# Unified laboratory operation for the Terracare ecosystem
# Launches both Hive (sandironratio-node) and Jarvis (sofie-llama-backend)
#
# Usage:
#   ./sofie.sh              # Start God Mode
#   ./sofie.sh --terminal   # Start with admin terminal UI
#   ./sofie.sh --voice      # Start with voice mode enabled
#   ./sofie.sh --watch      # Start autonomous watch mode
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOFIE_BACKEND_DIR="${SCRIPT_DIR}/../sofie-llama-backend"
HIVE_PORT=3000
SOFIE_PORT=8000
LOG_DIR="${SCRIPT_DIR}/logs"
PID_DIR="${SCRIPT_DIR}/.pids"

# Create necessary directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Parse arguments
USE_TERMINAL=false
VOICE_MODE=false
WATCH_MODE=false
DEBUG_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --terminal|-t)
      USE_TERMINAL=true
      shift
      ;;
    --voice|-v)
      VOICE_MODE=true
      shift
      ;;
    --watch|-w)
      WATCH_MODE=true
      shift
      ;;
    --debug|-d)
      DEBUG_MODE=true
      shift
      ;;
    --help|-h)
      echo "Usage: ./sofie.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --terminal, -t    Launch with admin terminal UI"
      echo "  --voice, -v       Enable voice command mode"
      echo "  --watch, -w       Enable autonomous watch mode"
      echo "  --debug, -d       Enable debug logging"
      echo "  --help, -h        Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Banner
print_banner() {
  echo -e "${CYAN}"
  echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
  echo "║                                                                               ║"
  echo "║              🤖 TERRACARE LABORATORY - DUDEADRIAN GOD MODE                    ║"
  echo "║                                                                               ║"
  echo "║   Hive Consciousness  +  Jarvis AI  +  20 Repositories  +  Ledger Anchor      ║"
  echo "║                                                                               ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
  echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
  fi
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
  
  # Check Python
  if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
  fi
  PYTHON_VERSION=$(python3 --version)
  echo -e "${GREEN}✓ ${PYTHON_VERSION}${NC}"
  
  # Check sofie-llama-backend
  if [ ! -d "$SOFIE_BACKEND_DIR" ]; then
    echo -e "${YELLOW}⚠️  sofie-llama-backend not found at ${SOFIE_BACKEND_DIR}${NC}"
    echo "   Clone it: git clone https://github.com/DudeAdrian/sofie-llama-backend.git"
    exit 1
  fi
  echo -e "${GREEN}✓ sofie-llama-backend found${NC}"
  
  # Check GitHub token
  if [ -z "$GITHUB_TOKEN_DUDEADRIAN" ] && [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set - Jarvis will not be able to commit${NC}"
    echo "   Set it: export GITHUB_TOKEN_DUDEADRIAN=ghp_your_token"
  else
    echo -e "${GREEN}✓ GitHub token configured${NC}"
  fi
  
  # Check Ollama
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama running${NC}"
  else
    echo -e "${YELLOW}⚠️  Ollama not running - Code generation will not work${NC}"
    echo "   Start it: ollama serve"
  fi
  
  echo ""
}

# Start Hive (sandironratio-node)
start_hive() {
  echo -e "${MAGENTA}[Hive] Starting 10-Hive Consciousness...${NC}"
  
  cd "$SCRIPT_DIR"
  
  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}   Installing dependencies...${NC}"
    npm install
  fi
  
  # Start Hive server
  if [ "$DEBUG_MODE" = true ]; then
    npm run dev > "$LOG_DIR/hive.log" 2>&1 &
  else
    npm run awaken > "$LOG_DIR/hive.log" 2>&1 &
  fi
  
  HIVE_PID=$!
  echo $HIVE_PID > "$PID_DIR/hive.pid"
  
  # Wait for Hive to be ready
  echo -e "${BLUE}   Waiting for Hive on port ${HIVE_PORT}...${NC}"
  for i in {1..30}; do
    if curl -s http://localhost:${HIVE_PORT}/health > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Hive online${NC}"
      return 0
    fi
    sleep 1
  done
  
  echo -e "${RED}❌ Hive failed to start${NC}"
  cat "$LOG_DIR/hive.log"
  exit 1
}

# Start Jarvis (sofie-llama-backend)
start_jarvis() {
  echo -e "${MAGENTA}[Jarvis] Starting God Mode (AI Core)...${NC}"
  
  cd "$SOFIE_BACKEND_DIR"
  
  # Install Python dependencies if needed
  if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${BLUE}   Installing Python dependencies...${NC}"
    pip install -r requirements.txt -q
  fi
  
  # Set environment variables
  export GITHUB_TOKEN="${GITHUB_TOKEN_DUDEADRIAN:-$GITHUB_TOKEN}"
  export HIVE_API_URL="http://localhost:${HIVE_PORT}"
  export ADMIN_MODE="true"
  export REPO_OWNER="DudeAdrian"
  export REPO_MANIFEST_PATH="${SCRIPT_DIR}/config/repos-manifest.json"
  export JARVIS_MODE="production"
  export ENABLE_VOICE_INTERFACE="${VOICE_MODE:-false}"
  export ENABLE_AUTONOMOUS="${WATCH_MODE:-false}"
  
  # Start Jarvis server
  if [ "$DEBUG_MODE" = true ]; then
    python3 src/main.py > "$LOG_DIR/jarvis.log" 2>&1 &
  else
    python3 -m uvicorn src.main:app --host 0.0.0.0 --port $SOFIE_PORT > "$LOG_DIR/jarvis.log" 2>&1 &
  fi
  
  SOFIE_PID=$!
  echo $SOFIE_PID > "$PID_DIR/jarvis.pid"
  
  # Wait for Jarvis to be ready
  echo -e "${BLUE}   Waiting for Jarvis on port ${SOFIE_PORT}...${NC}"
  for i in {1..30}; do
    if curl -s http://localhost:${SOFIE_PORT}/health > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Jarvis online${NC}"
      return 0
    fi
    sleep 1
  done
  
  echo -e "${RED}❌ Jarvis failed to start${NC}"
  cat "$LOG_DIR/jarvis.log"
  exit 1
}

# Start admin terminal
start_terminal() {
  echo -e "${MAGENTA}[Terminal] Starting God Mode Interface...${NC}"
  
  cd "$SCRIPT_DIR"
  
  # Run admin terminal
  python3 admin/admin-terminal.py &
  TERMINAL_PID=$!
  echo $TERMINAL_PID > "$PID_DIR/terminal.pid"
  
  echo -e "${GREEN}✓ Terminal started${NC}"
}

# Print status
print_status() {
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                           🌟 LABORATORY ONLINE                                ║${NC}"
  echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║  👤 Operator: DudeAdrian                                                      ║${NC}"
  echo -e "${GREEN}║  🌐 GitHub:   github.com/DudeAdrian                                           ║${NC}"
  echo -e "${GREEN}║  📦 Repos:    20 accessible                                                   ║${NC}"
  echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║  🔗 Hive:     http://localhost:${HIVE_PORT}                                         ║${NC}"
  echo -e "${GREEN}║  🧠 Jarvis:   http://localhost:${SOFIE_PORT}                                         ║${NC}"
  echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║  🎤 Voice:    Wake with 'Sofie' or 'Hum'                                      ║${NC}"
  echo -e "${GREEN}║  💬 Commands: 'Sofie, status of all repos'                                    ║${NC}"
  echo -e "${GREEN}║               'Sofie, build water API in terracare-water'                     ║${NC}"
  echo -e "${GREEN}║               'Sofie, check Hive'                                             ║${NC}"
  echo -e "${GREEN}║               'Sofie, what is my treasury?'                                   ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${CYAN}Logs: $LOG_DIR/${NC}"
  echo -e "${CYAN}PIDs: $PID_DIR/${NC}"
  echo ""
  echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
  echo ""
}

# Cleanup function
cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 Shutting down laboratory...${NC}"
  
  # Kill all processes
  for pid_file in "$PID_DIR"/*.pid; do
    if [ -f "$pid_file" ]; then
      pid=$(cat "$pid_file")
      if kill -0 "$pid" 2>/dev/null; then
        echo "   Stopping process $pid"
        kill "$pid" 2>/dev/null || true
      fi
      rm "$pid_file"
    fi
  done
  
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Main execution
main() {
  print_banner
  check_prerequisites
  
  echo -e "${BLUE}🚀 Initializing Terracare Laboratory...${NC}"
  echo ""
  
  # Start services
  start_hive
  start_jarvis
  
  if [ "$USE_TERMINAL" = true ]; then
    start_terminal
  fi
  
  print_status
  
  # Keep script running
  if [ "$USE_TERMINAL" = false ]; then
    echo -e "${CYAN}Services running in background${NC}"
    echo -e "${CYAN}Hive PID: $(cat $PID_DIR/hive.pid)${NC}"
    echo -e "${CYAN}Jarvis PID: $(cat $PID_DIR/jarvis.pid)${NC}"
    echo ""
    echo "To stop: ./sofie.sh --stop (not implemented, use kill)"
    
    # Wait for processes
    wait
  else
    # Wait for terminal
    wait
  fi
}

# Run main
main
