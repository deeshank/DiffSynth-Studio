"""
FLUX image generation endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import torch
import io
import os
import base64
import numpy as np
from PIL import Image

from diffsynth.models import ModelManager
from diffsynth.pipelines import FluxImagePipeline

router = APIRouter()

# Global model cache
_model_cache = {}

class FluxGenerateRequest(BaseModel):
    """Request model for FLUX text-to-image generation"""
    prompt: str = Field(..., description="Text prompt for image generation")
    width: int = Field(default=1024, ge=512, le=2048, description="Image width (must be divisible by 16)")
    height: int = Field(default=1024, ge=512, le=2048, description="Image height (must be divisible by 16)")
    num_images: int = Field(default=1, ge=1, le=4, description="Number of images to generate")
    steps: int = Field(default=28, ge=10, le=50, description="Number of inference steps")
    guidance: float = Field(default=3.5, ge=1.0, le=5.0, description="FLUX guidance (embedded_guidance)")
    seed: Optional[int] = Field(default=None, description="Random seed (optional)")
    tiled: bool = Field(default=False, description="Enable tiled generation for large images")

class ImageResponse(BaseModel):
    """Response model for generated images"""
    images: List[str] = Field(..., description="Base64 encoded images")
    seed: int = Field(..., description="Seed used for generation")
    generation_time: float = Field(..., description="Generation time in seconds")

def get_flux_pipeline():
    """Get or create FLUX pipeline (cached)"""
    if "flux_pipeline" not in _model_cache:
        # Force clear all cached models
        print("Clearing all cached models...")
        _model_cache.clear()
        
        # Check VRAM before loading
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated(0) / 1024**3
            reserved = torch.cuda.memory_reserved(0) / 1024**3
            print(f"VRAM before cleanup: Allocated={allocated:.2f}GB, Reserved={reserved:.2f}GB")
        
        # Aggressive VRAM cleanup
        import gc
        gc.collect()
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
        torch.cuda.reset_peak_memory_stats()
        
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated(0) / 1024**3
            reserved = torch.cuda.memory_reserved(0) / 1024**3
            print(f"VRAM after cleanup: Allocated={allocated:.2f}GB, Reserved={reserved:.2f}GB")
            
            if allocated > 1.0:  # More than 1GB still allocated
                raise HTTPException(
                    status_code=503,
                    detail=f"GPU memory not freed. {allocated:.2f}GB still allocated. Please restart the server or switch from SDXL first."
                )
        
        model_path = "models/FLUX/FLUX.1-dev"
        
        # Check if model exists
        if not os.path.exists(f"{model_path}/flux1-dev.safetensors"):
            raise HTTPException(status_code=404, detail="FLUX model not found. Please download it first.")
        
        print("Loading FLUX model to CPU (to save VRAM)...")
        model_manager = ModelManager(torch_dtype=torch.bfloat16, device="cpu")
        model_manager.load_models([
            f"{model_path}/text_encoder/model.safetensors",
            f"{model_path}/text_encoder_2",
            f"{model_path}/ae.safetensors",
            f"{model_path}/flux1-dev.safetensors",
        ])
        print("Creating FLUX pipeline with CPU offload...")
        pipeline = FluxImagePipeline.from_model_manager(model_manager, device="cuda")
        pipeline.enable_cpu_offload()
        print("FLUX pipeline ready with CPU offload enabled")
        _model_cache["flux_pipeline"] = pipeline
        print("FLUX model loaded successfully")
    
    return _model_cache["flux_pipeline"]

def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

@router.post("/generate", response_model=ImageResponse)
async def generate_images(request: FluxGenerateRequest):
    """
    Generate images from text prompt using FLUX (Text-to-Image)
    """
    try:
        import time
        import os
        start_time = time.time()
        
        # Validate dimensions (must be divisible by 16)
        if request.width % 16 != 0 or request.height % 16 != 0:
            raise HTTPException(
                status_code=400,
                detail="Width and height must be divisible by 16 for FLUX"
            )
        
        # Get pipeline
        pipeline = get_flux_pipeline()
        
        # Set seed
        if request.seed is None:
            seed = np.random.randint(0, 10**9)
        else:
            seed = request.seed
        
        # Generate images
        images = []
        for i in range(request.num_images):
            torch.manual_seed(seed + i)
            
            print(f"Generating image {i+1}/{request.num_images}...")
            image = pipeline(
                prompt=request.prompt,
                embedded_guidance=request.guidance,
                num_inference_steps=request.steps,
                height=request.height,
                width=request.width,
                tiled=request.tiled,
                cfg_scale=1.0  # FLUX default
            )
            
            # Convert to base64
            print(f"Converting image {i+1} to base64...")
            img_base64 = image_to_base64(image)
            images.append(img_base64)
        
        generation_time = time.time() - start_time
        print(f"Generation complete in {generation_time:.2f}s")
        
        return ImageResponse(
            images=images,
            seed=seed,
            generation_time=generation_time
        )
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error during generation: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transform", response_model=ImageResponse)
async def transform_image(
    prompt: str = Form(...),
    width: int = Form(default=1024),
    height: int = Form(default=1024),
    num_images: int = Form(default=1),
    steps: int = Form(default=28),
    guidance: float = Form(default=3.5),
    denoising_strength: float = Form(default=0.75),
    seed: Optional[int] = Form(default=None),
    tiled: bool = Form(default=False),
    image: UploadFile = File(...)
):
    """
    Transform an existing image using FLUX (Image-to-Image)
    """
    try:
        import time
        import os
        start_time = time.time()
        
        # Validate dimensions
        if width % 16 != 0 or height % 16 != 0:
            raise HTTPException(
                status_code=400,
                detail="Width and height must be divisible by 16 for FLUX"
            )
        
        # Get pipeline
        pipeline = get_flux_pipeline()
        
        # Load input image
        input_image = Image.open(image.file).convert("RGB")
        input_image = input_image.resize((width, height))
        
        # Set seed
        if seed is None:
            seed = np.random.randint(0, 10**9)
        
        # Generate images
        images = []
        for i in range(num_images):
            torch.manual_seed(seed + i)
            
            output_image = pipeline(
                prompt=prompt,
                embedded_guidance=guidance,
                num_inference_steps=steps,
                height=height,
                width=width,
                input_image=input_image,
                denoising_strength=denoising_strength,
                tiled=tiled,
                cfg_scale=1.0  # FLUX default
            )
            
            # Convert to base64
            img_base64 = image_to_base64(output_image)
            images.append(img_base64)
        
        generation_time = time.time() - start_time
        
        return ImageResponse(
            images=images,
            seed=seed,
            generation_time=generation_time
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
