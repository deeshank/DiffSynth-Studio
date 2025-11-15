#!/bin/bash

# Quick script to start only the FastAPI backend for testing

echo "=========================================="
echo "Starting FastAPI Backend Only"
echo "=========================================="

cd /workspace/DiffSynth-Studio

echo ""
echo "Starting FastAPI on port 8000..."
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
