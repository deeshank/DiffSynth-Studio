#!/bin/bash

# Quick script to start only the React frontend (requires API to be running)

echo "=========================================="
echo "Starting React Frontend Only"
echo "=========================================="

cd /workspace/DiffSynth-Studio/apps/web

echo ""
echo "Make sure FastAPI is running on port 8000!"
echo ""
echo "Starting React on port 3000..."
echo "Web App: http://0.0.0.0:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
