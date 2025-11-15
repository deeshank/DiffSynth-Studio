#!/bin/bash

# DiffSynth-Studio Bootstrap Script

set -e  # Exit on error

echo "=================================="
echo "DiffSynth-Studio Bootstrap"
echo "=================================="

# Ensure we're in the correct directory
cd /workspace/DiffSynth-Studio

echo ""
echo "Step 1: Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv git wget curl

echo ""
echo "Step 2: Setting up Python..."
# Create symlinks if they don't exist
if [ ! -f /usr/bin/python ]; then
    ln -s /usr/bin/python3 /usr/bin/python
fi
if [ ! -f /usr/bin/pip ]; then
    ln -s /usr/bin/pip3 /usr/bin/pip
fi

echo ""
echo "Step 3: Upgrading pip..."
python3 -m pip install --upgrade pip

echo ""
echo "Step 4: Uninstalling old PyTorch (if exists)..."
pip3 uninstall -y torch torchvision torchaudio 2>/dev/null || true

echo ""
echo "Step 5: Installing PyTorch 2.5+ with CUDA 12.1 for RTX 5090..."
pip3 install torch>=2.5.0 torchvision>=0.20.0 --index-url https://download.pytorch.org/whl/cu121

echo ""
echo "Step 6: Installing other requirements..."
pip3 install -q -r requirements.txt

echo ""
echo "Step 7: Installing DiffSynth package..."
pip3 install -q -e .

echo ""
echo "Step 8: Downloading models..."
python3 download_models.py

echo ""
echo "=================================="
echo "Starting Streamlit App..."
echo "=================================="
streamlit run apps/streamlit/DiffSynth_Studio.py
