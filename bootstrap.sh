#!/bin/bash

# DiffSynth-Studio Bootstrap Script
# Starts FastAPI backend, React frontend, and Streamlit

set -e  # Exit on error

echo "=========================================="
echo "DiffSynth-Studio Bootstrap"
echo "=========================================="

# Ensure we're in the correct directory
cd /workspace/DiffSynth-Studio

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}Step 1: Upgrading pip...${NC}"
python3 -m pip install --upgrade pip --break-system-packages 2>/dev/null || true

echo ""
echo -e "${BLUE}Step 2: Installing Python requirements...${NC}"
pip3 install -r requirements.txt

echo ""
echo -e "${BLUE}Step 3: Installing DiffSynth package...${NC}"
pip3 install -e .

echo ""
echo -e "${BLUE}Step 4: Downloading models...${NC}"
python3 download_models.py

echo ""
echo -e "${BLUE}Step 5: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "Node.js installed: $(node --version)"
    echo "npm installed: $(npm --version)"
else
    echo "Node.js already installed: $(node --version)"
fi

echo ""
echo -e "${BLUE}Step 6: Installing Node.js dependencies...${NC}"
cd apps/web
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages (this may take a few minutes)..."
    npm install
else
    echo "Node modules already installed, skipping..."
fi
cd ../..

echo ""
echo "=========================================="
echo -e "${GREEN}Starting All Services...${NC}"
echo "=========================================="

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start FastAPI backend
echo ""
echo -e "${YELLOW}🚀 Starting FastAPI Backend on port 8000...${NC}"
cd /workspace/DiffSynth-Studio
python3 -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload &
FASTAPI_PID=$!

# Wait for FastAPI to start
sleep 3

# Start React frontend
echo -e "${YELLOW}⚛️  Starting React Frontend on port 3000...${NC}"
cd apps/web
npm run dev &
REACT_PID=$!

# Wait for React to start
sleep 3

# Start Streamlit
# echo -e "${YELLOW}📊 Starting Streamlit on port 8501...${NC}"
# cd /workspace/DiffSynth-Studio
# streamlit run apps/streamlit/DiffSynth_Studio.py &
# STREAMLIT_PID=$!

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All Services Started Successfully!${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}🎨 React Web App:${NC}      http://localhost:3000"
echo -e "${GREEN}⚡ FastAPI Backend:${NC}    http://localhost:8000"
echo -e "${GREEN}📚 API Docs:${NC}           http://localhost:8000/docs"
# echo -e "${GREEN}📊 Streamlit:${NC}          http://localhost:8501"
echo ""
echo "=========================================="
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo "=========================================="

# Wait for all background processes
wait
