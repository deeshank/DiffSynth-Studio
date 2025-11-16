#!/usr/bin/env python3
"""
Model downloader for DiffSynth-Studio
Downloads models to /workspace/DiffSynth-Studio/models/
"""

import os
import sys

# Ensure we're in the correct directory
os.chdir('/workspace/DiffSynth-Studio')

from diffsynth import download_models

# List of models to download
# Uncomment the models you want to download
MODELS_TO_DOWNLOAD = [
    # Stable Diffusion XL (recommended for beginners, ~6.5GB)
    "StableDiffusionXL_v1",
    
    # FLUX.1-dev (high quality, ~24GB total)
    "FLUX.1-dev",
    
    # FLUX LoRA - NSFW v2 (~500MB)
    "FLUX_LoRA_NSFW_v2",
    
    # Text Generation Model - MistralRP NSFW 7B (~5GB, GGUF Q5)
    "MistralRP_NSFW_7B",
    
    # Stable Diffusion XL Turbo (fast generation, ~6.5GB)
    # "StableDiffusionXL_Turbo",
    
    # Stable Diffusion v1.5 (~4GB)
    # "StableDiffusion_v15",
    
    # DreamShaper 8 (popular SD1.5 model, ~2GB)
    # "DreamShaper_8",
    
    # Stable Diffusion 3 (~10GB)
    # "StableDiffusion3",
    
    # AnimateDiff for video (if using video features)
    # "AnimateDiff_v2",
    # "AnimateDiff_xl_beta",
]

def check_model_exists(model_name):
    """Check if model files already exist"""
    model_dirs = {
        "StableDiffusionXL_v1": "models/stable_diffusion_xl/sd_xl_base_1.0.safetensors",
        "StableDiffusionXL_Turbo": "models/stable_diffusion_xl_turbo/sd_xl_turbo_1.0_fp16.safetensors",
        "StableDiffusion_v15": "models/stable_diffusion/v1-5-pruned-emaonly.safetensors",
        "DreamShaper_8": "models/stable_diffusion/dreamshaper_8.safetensors",
        "StableDiffusion3": "models/stable_diffusion_3/sd3_medium_incl_clips_t5xxlfp16.safetensors",
        "AnimateDiff_v2": "models/AnimateDiff/mm_sd_v15_v2.ckpt",
        "AnimateDiff_xl_beta": "models/AnimateDiff/mm_sdxl_v10_beta.ckpt",
        "FLUX.1-dev": "models/FLUX/FLUX.1-dev/flux1-dev.safetensors",
        "FLUX_LoRA_NSFW_v2": "models/lora/flux/sldr_flux_nsfw_v2-studio.safetensors",
        "MistralRP_NSFW_7B": "models/text_generation/MistralRP-NSFW/MistralRP-Noromaid-NSFW-7B-Q5_K_M.gguf",
    }
    
    if model_name in model_dirs:
        return os.path.exists(model_dirs[model_name])
    return False

def main():
    print("=" * 60)
    print("DiffSynth-Studio Model Downloader")
    print("=" * 60)
    print(f"Working directory: {os.getcwd()}")
    print(f"Models will be downloaded to: {os.path.abspath('models/')}")
    print()
    
    # Filter out models that already exist
    models_to_download = []
    for model in MODELS_TO_DOWNLOAD:
        if check_model_exists(model):
            print(f"✓ {model} already exists, skipping...")
        else:
            print(f"→ {model} will be downloaded")
            models_to_download.append(model)
    
    if not models_to_download:
        print("\n✓ All models already downloaded!")
        return 0
    
    print(f"\nDownloading {len(models_to_download)} model(s)...")
    print("-" * 60)
    
    try:
        download_models(models_to_download)
        print("\n" + "=" * 60)
        print("✓ All models downloaded successfully!")
        print("=" * 60)
        return 0
    except Exception as e:
        print(f"\n✗ Error downloading models: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
