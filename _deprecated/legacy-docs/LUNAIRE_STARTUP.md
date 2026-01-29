# Lunaire Country Club - Startup Guide

## Overview

The Lunaire version of the Law Quizzer starts both the Flask backend API and the static frontend server with a single command. Environment variables are automatically loaded from the `.env` file.

## Quick Start

### Using Bash Script (Recommended for macOS/Linux)

```bash
cd /Users/jreback/Projects/barbarossa_law
bash start-lunaire.sh
```

This will:

- ✓ Load environment variables from `.env`
- ✓ Start the Flask API on port 5001
- ✓ Start the static server on port 3000
- ✓ Display startup information with links

### URLs

Once running, access the Lunaire site at:

- **Lunaire Theme**: http://localhost:3000/index-lunaire.html
- **Backend API**: http://localhost:5001/api
- **Full network**: http://192.168.0.245:3000 (if accessing from another machine)

## Environment Configuration

The `.env` file contains all configuration needed:

```dotenv
# OpenAI API key
OPENAI_API_KEY=sk-proj-...

# Vector Store configurations
VECTOR_STORE_INSTRUCTIONS="vs_..."
VECTOR_STORE_GENERAL_KNOWLEDGE="vs_..."
VECTOR_STORE_MULTICHOICE="vs_..."
VECTOR_STORE_ESSAY_INSTRUCT="vs_..."
VECTOR_STORE_ESSAY_ANSWERS="vs_..."

# Database
DB_PATH=law_quiz.db

# Server settings
HOST=localhost
PORT=5001
DEBUG=True
```

**Note**: Environment variables are loaded when the startup script runs. No spaces should appear after the `=` sign in `.env`.

## Services

### Flask Backend (Port 5001)

- Serves the API at `/api`
- Handles quiz logic, database operations, and AI explanations
- Requires OpenAI API key for AI features
- Status: Check health at `http://localhost:5001/api/health`

### Static Server (Port 3000)

- Serves the Lunaire frontend files
- Single Page Application (SPA) routing enabled
- Auto-routes unknown paths to `index-lunaire.html`

## Stopping Services

Press `Ctrl+C` in the terminal running the startup script to cleanly shut down both services.

The script will:

- Stop the Flask API process
- Stop the static server process
- Display "Cleanup complete"

## Troubleshooting

### Port Already in Use

If port 3000 or 5001 is already in use:

- Kill the process: `pkill -f "python3 backend/server.py"` or `pkill -f "npx serve"`
- Or modify ports in the script and restart

### OpenAI API Key Not Configured

If the OpenAI API key is missing:

- Edit `.env` and add your key
- Restart the startup script
- The app will still work without it (AI features disabled)

### .env File Parsing Error

Ensure there are no spaces after the `=` sign in `.env`:

- ✓ Correct: `OPENAI_API_KEY=sk-proj-...`
- ✗ Wrong: `OPENAI_API_KEY= sk-proj-...` (extra space)

## Architecture

```
Lunaire Country Club
├── Frontend (Port 3000)
│   ├── index-lunaire.html
│   ├── CSS (lunaire-design-system, lunaire-components, etc.)
│   └── JavaScript (lq-lunaire-main.js with ES modules)
└── Backend (Port 5001)
    ├── Flask API (/api)
    ├── Database (law_quiz.db)
    └── AI Services (OpenAI, Vector Store)
```

## Features Loaded from .env

- **AI Explanations**: Uses OpenAI API key
- **Vector Store**: Initializes with vector store IDs for knowledge retrieval
- **Database**: Uses law_quiz.db path from .env
- **Debug Mode**: Enabled by DEBUG=True

## Scripts Location

Both startup scripts are in the project root:

- `start-lunaire.sh` - Bash version (primary)
- `start-lunaire.js` - Node.js version (alternative, requires dotenv package)

## Development Notes

The startup script automatically:

- Checks for Python 3, Node.js, and NPM
- Installs NPM dependencies if needed
- Loads `.env` before starting services
- Sets proper environment for Flask (FLASK_ENV=development)
- Enables SPA routing for the frontend

To stop: Press `Ctrl+C` once - the script will gracefully shut down both services.
