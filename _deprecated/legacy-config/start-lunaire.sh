#!/usr/bin/env bash
# ============================================================================
# LUNAIRE COUNTRY CLUB - STARTUP SCRIPT
# "Where jurisprudential excellence meets lunar hospitality"
# ============================================================================
# Startup script to launch the Lunaire themed Law Quizzer
# - Loads environment variables from .env
# - Starts the Flask backend API on port 5001
# - Serves the Lunaire frontend on port 3000
# - Opens the Lunaire entry point in the browser

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
BACKEND_PORT=5001
FRONTEND_PORT=3000
LUNAIRE_ENTRY="index-lunaire.html"

# ============================================================================
# FUNCTIONS
# ============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[!]${NC} $1"
}

cleanup() {
  log_info "Shutting down services..."
  
  if [ -n "$API_PID" ]; then
    log_info "Stopping Flask API (PID $API_PID)..."
    kill $API_PID 2>/dev/null || true
  fi
  
  if [ -n "$SERVER_PID" ]; then
    log_info "Stopping static server (PID $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
  fi
  
  log_success "Cleanup complete"
  exit 0
}

# ============================================================================
# MAIN
# ============================================================================

log_info "=================================="
log_info "LUNAIRE COUNTRY CLUB"
log_info "Launching the Lunar Bar Exam Prep"
log_info "=================================="
echo ""

# Load environment variables
if [ -f "$ENV_FILE" ]; then
  log_success "Loading environment from .env"
  set -a
  source "$ENV_FILE"
  set +a
else
  log_warn "No .env file found at $ENV_FILE"
  log_info "Some features may not work without environment variables"
fi

# Verify required tools
log_info "Checking dependencies..."
if ! command -v python3 &> /dev/null; then
  log_error "Python 3 is not installed"
  exit 1
fi
log_success "Python 3 found: $(python3 --version)"

if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed"
  exit 1
fi
log_success "Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
  log_error "NPM is not installed"
  exit 1
fi
log_success "NPM found: $(npm --version)"

echo ""

# Install dependencies if needed
log_info "Installing dependencies..."
if [ ! -d "node_modules" ]; then
  log_info "Running npm install..."
  npm install > /dev/null 2>&1
  log_success "NPM dependencies installed"
else
  log_success "NPM dependencies already installed"
fi

echo ""

# Trap Ctrl+C to cleanup
trap cleanup SIGINT SIGTERM

# Start Flask API
log_info "Starting Flask API on port $BACKEND_PORT..."
python3 backend/server.py &
API_PID=$!
log_success "Flask API started (PID $API_PID)"

# Give the API a moment to initialize
sleep 2

# Check if API is running
if ! kill -0 $API_PID 2>/dev/null; then
  log_error "Flask API failed to start"
  exit 1
fi

echo ""

# Start static server
log_info "Starting static server on port $FRONTEND_PORT..."
echo "Serving files from: $SCRIPT_DIR/src/"
npx serve src -p $FRONTEND_PORT &
SERVER_PID=$!
log_success "Static server started (PID $SERVER_PID)"

# Give the server a moment to initialize
sleep 2

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
  log_error "Static server failed to start"
  kill $API_PID 2>/dev/null || true
  exit 1
fi

echo ""
log_success "=================================="
log_success "Lunaire Country Club is now live!"
log_success "=================================="
echo ""

# Display URLs
log_info "Backend API: ${BLUE}http://localhost:$BACKEND_PORT/api${NC}"
log_info "Frontend:    ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
log_info "Lunaire:     ${BLUE}http://localhost:$FRONTEND_PORT/$LUNAIRE_ENTRY${NC}"
echo ""

log_info "Environment Information:"
if [ -n "$OPENAI_API_KEY" ]; then
  log_success "OpenAI API Key: Configured"
else
  log_warn "OpenAI API Key: Not configured (AI features disabled)"
fi

echo ""
log_info "Database: $SCRIPT_DIR/law_quiz.db"
echo ""

log_info "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait

cleanup
