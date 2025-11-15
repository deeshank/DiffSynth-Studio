#!/bin/bash

echo "=================================="
echo "Testing DiffSynth Studio API"
echo "=================================="

API_URL="http://localhost:8000"

echo ""
echo "1. Testing Health Check..."
curl -s "${API_URL}/api/health" | python3 -m json.tool

echo ""
echo ""
echo "2. Testing Models List..."
curl -s "${API_URL}/api/models" | python3 -m json.tool

echo ""
echo ""
echo "=================================="
echo "API Tests Complete!"
echo "=================================="
echo ""
echo "To test image generation, use the React frontend or:"
echo "curl -X POST '${API_URL}/api/sdxl/generate' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"prompt\": \"a beautiful sunset\", \"num_images\": 1}'"
