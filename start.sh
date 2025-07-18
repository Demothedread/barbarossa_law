#!/usr/bin/env bash
# Startup script to launch the Flask API and serve the LawQuizzer front-end

# Launch Flask API on port 5001 in the background
echo "Starting Flask API on port 5001..."
python3 scripts/flask_api.py &
API_PID=$!

# Give API a moment to start
sleep 1

# Serve static files from src/ (default npx serve port 3000)
echo "Serving static files from src/ on http://localhost:3000..."
npx serve src

# When the static server stops, kill the Flask API
echo "Shutting down Flask API (PID $API_PID)..."
kill $API_PID
