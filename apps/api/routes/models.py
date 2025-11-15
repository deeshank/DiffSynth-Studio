"""
Model configuration endpoints
"""
from fastapi import APIRouter
import os

router = APIRouter()

DEFAULT_NEGATIVE_PROMPT = "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"

@router.get("/config")
async def get_models_config():
    """Get configuration for all available models"""
    
    # Check model availability
    sdxl_available = os.path.exists("models/stable_diffusion_xl/sd_xl_base_1.0.safetensors")
    flux_available = os.path.exists("models/FLUX/FLUX.1-dev/flux1-dev.safetensors")
    
    models = []
    
    # SDXL Configuration
    if sdxl_available:
        models.append({
            "id": "sdxl",
            "name": "Stable Diffusion XL",
            "description": "High-quality image generation, 7GB VRAM",
            "available": True,
            "features": ["text2img", "img2img"],
            "parameters": {
                "prompt": {
                    "type": "text",
                    "label": "Prompt",
                    "required": True,
                    "placeholder": "A beautiful landscape with mountains and a lake at sunset...",
                    "rows": 4
                },
                "negative_prompt": {
                    "type": "text",
                    "label": "Negative Prompt",
                    "required": False,
                    "default": DEFAULT_NEGATIVE_PROMPT,
                    "placeholder": "What to avoid in the image...",
                    "rows": 3,
                    "collapsible": True
                },
                "width": {
                    "type": "number",
                    "label": "Width",
                    "min": 512,
                    "max": 2048,
                    "default": 1024,
                    "step": 8,
                    "presets": [512, 768, 1024, 1280, 1536, 2048]
                },
                "height": {
                    "type": "number",
                    "label": "Height",
                    "min": 512,
                    "max": 2048,
                    "default": 1024,
                    "step": 8,
                    "presets": [512, 768, 1024, 1280, 1536, 2048]
                },
                "num_images": {
                    "type": "number",
                    "label": "Number of Images",
                    "min": 1,
                    "max": 4,
                    "default": 1,
                    "help": "Generate multiple images at once"
                },
                "steps": {
                    "type": "number",
                    "label": "Inference Steps",
                    "min": 10,
                    "max": 50,
                    "default": 20,
                    "help": "More steps = better quality but slower"
                },
                "cfg_scale": {
                    "type": "number",
                    "label": "CFG Scale",
                    "min": 1.0,
                    "max": 15.0,
                    "default": 7.5,
                    "step": 0.5,
                    "help": "How closely to follow the prompt (7-8 recommended)"
                },
                "seed": {
                    "type": "number",
                    "label": "Seed",
                    "required": False,
                    "min": 0,
                    "max": 999999999,
                    "help": "Random seed for reproducibility"
                },
                "denoising_strength": {
                    "type": "number",
                    "label": "Denoising Strength",
                    "min": 0.0,
                    "max": 1.0,
                    "default": 0.75,
                    "step": 0.05,
                    "img2img_only": True,
                    "help": "Higher = more changes, Lower = closer to original"
                }
            }
        })
    
    # FLUX Configuration
    if flux_available:
        models.append({
            "id": "flux",
            "name": "FLUX.1-dev",
            "description": "State-of-the-art quality, 24GB VRAM (or 8GB with offload)",
            "available": True,
            "features": ["text2img", "img2img"],
            "parameters": {
                "prompt": {
                    "type": "text",
                    "label": "Prompt",
                    "required": True,
                    "placeholder": "A beautiful landscape with mountains and a lake at sunset...",
                    "rows": 4
                },
                "width": {
                    "type": "number",
                    "label": "Width",
                    "min": 512,
                    "max": 2048,
                    "default": 1024,
                    "step": 16,
                    "presets": [512, 768, 1024, 1280, 1536, 2048]
                },
                "height": {
                    "type": "number",
                    "label": "Height",
                    "min": 512,
                    "max": 2048,
                    "default": 1024,
                    "step": 16,
                    "presets": [512, 768, 1024, 1280, 1536, 2048]
                },
                "num_images": {
                    "type": "number",
                    "label": "Number of Images",
                    "min": 1,
                    "max": 4,
                    "default": 1,
                    "help": "Generate multiple images at once"
                },
                "steps": {
                    "type": "number",
                    "label": "Inference Steps",
                    "min": 10,
                    "max": 50,
                    "default": 28,
                    "help": "More steps = better quality but slower (28-30 recommended)"
                },
                "guidance": {
                    "type": "number",
                    "label": "Guidance",
                    "min": 1.0,
                    "max": 5.0,
                    "default": 3.5,
                    "step": 0.1,
                    "help": "FLUX guidance strength (3.5 recommended)"
                },
                "seed": {
                    "type": "number",
                    "label": "Seed",
                    "required": False,
                    "min": 0,
                    "max": 999999999,
                    "help": "Random seed for reproducibility"
                },
                "denoising_strength": {
                    "type": "number",
                    "label": "Denoising Strength",
                    "min": 0.0,
                    "max": 1.0,
                    "default": 0.75,
                    "step": 0.05,
                    "img2img_only": True,
                    "help": "Higher = more changes, Lower = closer to original"
                },
                "tiled": {
                    "type": "boolean",
                    "label": "Tiled Generation",
                    "default": False,
                    "advanced": True,
                    "help": "Enable for large images to reduce VRAM usage"
                }
            }
        })
    
    return {
        "models": models,
        "default_model": "flux" if flux_available else "sdxl"
    }
