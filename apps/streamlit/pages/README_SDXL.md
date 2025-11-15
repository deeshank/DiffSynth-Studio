# SDXL Image Generator Page

## Overview
A clean, modern, and simple interface for generating images using Stable Diffusion XL.

## Features
- ✨ Modern, intuitive UI with clean layout
- 🎨 Simple prompt-based image generation
- 🖼️ Multiple image size presets (512×512 to 1280×768)
- 🎛️ Essential controls: steps, CFG scale, seed
- 📥 Easy image download
- 💾 Session state management for generated images
- 🚀 Optimized with model caching

## Usage
1. Enter your prompt describing what you want to generate
2. (Optional) Adjust negative prompt to avoid unwanted elements
3. Select image size and number of images
4. Adjust advanced settings if needed (steps, CFG scale, seed)
5. Click "Generate Images"
6. Download your generated images

## Requirements
- SDXL model must be downloaded at: `models/stable_diffusion_xl/sd_xl_base_1.0.safetensors`
- Run `python download_models.py` to download the model

## Tips
- Use 20-30 inference steps for good quality
- CFG Scale of 7-8 works well for most images
- Be specific and descriptive in prompts
- Use fixed seed to reproduce the same image

## Future Enhancements
This page serves as a template for adding more model-specific pages in the future.
