#!/bin/bash

# DiffSynth-Studio Bootstrap Script

echo "Installing requirements..."
pip install -r requirements.txt

echo "Starting DiffSynth-Studio Streamlit App..."

# Run Streamlit app
streamlit run apps/streamlit/DiffSynth_Studio.py
