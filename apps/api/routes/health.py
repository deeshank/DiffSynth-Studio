"""
Health check endpoints
"""
from fastapi import APIRouter
import torch
import os

router = APIRouter()

@router.get("/health")
async def health_check():
    """Check API health and GPU availability"""
    cuda_available = torch.cuda.is_available()
    gpu_count = torch.cuda.device_count() if cuda_available else 0
    
    model_path = "models/stable_diffusion_xl/sd_xl_base_1.0.safetensors"
    model_exists = os.path.exists(model_path)
    
    return {
        "status": "healthy",
        "cuda_available": cuda_available,
        "gpu_count": gpu_count,
        "gpu_name": torch.cuda.get_device_name(0) if cuda_available else None,
        "model_loaded": model_exists,
        "model_path": model_path
    }

@router.get("/models")
async def list_models():
    """List available models"""
    return {
        "models": [
            {
                "id": "sdxl",
                "name": "Stable Diffusion XL",
                "path": "models/stable_diffusion_xl/sd_xl_base_1.0.safetensors",
                "available": os.path.exists("models/stable_diffusion_xl/sd_xl_base_1.0.safetensors"),
                "features": ["text2img", "img2img"]
            }
        ]
    }
