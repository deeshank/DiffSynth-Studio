#!/bin/bash

# DiffSynth-Studio Bootstrap Script

set -e  # Exit on error

echo "=================================="
echo "DiffSynth-Studio Bootstrap"
echo "=================================="

# Ensure we're in the correct directory
cd /workspace/DiffSynth-Studio

echo ""
echo "Step 1: Upgrading pip..."
python -m pip install --upgrade pip

echo ""
echo "Step 2: Uninstalling old PyTorch (if exists)..."
pip uninstall -y torch torchvision torchaudio 2>/dev/null || true

echo ""
echo "Step 3: Installing PyTorch 2.5+ with CUDA 12.1 for RTX 5090..."
pip install torch>=2.5.0 torchvision>=0.20.0 --index-url https://download.pytorch.org/whl/cu121

echo ""
echo "Step 4: Installing other requirements..."
pip install -q -r requirements.txt

echo ""
echo "Step 5: Installing DiffSynth package..."
pip install -q -e .

echo ""
echo "Step 6: Downloading models..."
python download_models.py

echo ""
echo "=================================="
echo "Starting Streamlit App..."
echo "=================================="
streamlit run apps/streamlit/DiffSynth_Studio.py
