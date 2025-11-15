#!/bin/bash

# DiffSynth-Studio Bootstrap Script

set -e  # Exit on error

echo "=================================="
echo "DiffSynth-Studio Bootstrap"
echo "=================================="

# Ensure we're in the correct directory
cd /workspace/DiffSynth-Studio

echo ""
echo "Step 1: Installing requirements..."
python -m pip install --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "Step 2: Installing DiffSynth package..."
pip install -q -e .

echo ""
echo "Step 3: Downloading models..."
python download_models.py

echo ""
echo "=================================="
echo "Starting Streamlit App..."
echo "=================================="
streamlit run apps/streamlit/DiffSynth_Studio.py
