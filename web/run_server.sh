#!/bin/bash

PORT=5179

# Kill any process running on the port
echo "Killing any process on port $PORT..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

# Start the dev server
echo "Starting dev server on port $PORT..."
npm run dev -- --port $PORT
