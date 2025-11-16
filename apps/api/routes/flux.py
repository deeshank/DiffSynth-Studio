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
import uuid

from diffsynth.pipelines.flux_image_new import FluxImagePipeline, ModelConfig

router = APIRouter()

# Global model cache
_model_cache = {}

# Output directory for saved images
OUTPUT_DIR = "outputs/images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

class FluxGenerateRequest(BaseModel):
    """Request model for FLUX text-to-image generation"""
    prompt: str = Field(..., description="Text prompt for image generation")
    negative_prompt: str = Field(default="", description="Negative prompt (only works with cfg_scale > 1.0)")
    width: int = Field(default=1024, ge=512, le=2048, description="Image width (must be divisible by 16)")
    height: int = Field(default=1024, ge=512, le=2048, description="Image height (must be divisible by 16)")
    num_images: int = Field(default=1, ge=1, le=4, description="Number of images to generate")
    steps: int = Field(default=28, ge=10, le=50, description="Number of inference steps")
    guidance: float = Field(default=3.5, ge=1.0, le=5.0, description="FLUX guidance (embedded_guidance)")
    cfg_scale: float = Field(default=1.0, ge=1.0, le=3.0, description="CFG scale (1.0 = disabled)")
    seed: Optional[int] = Field(default=None, description="Random seed (optional)")
    tiled: bool = Field(default=False, description="Enable tiled generation for large images")

class ImageData(BaseModel):
    """Single image data"""
    base64: str = Field(..., description="Base64 encoded image")
    url: str = Field(..., description="Shareable URL to the saved image")
    filename: str = Field(..., description="Filename of the saved image")

class ImageResponse(BaseModel):
    """Response model for generated images"""
    images: List[ImageData] = Field(..., description="Generated images with URLs")
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
        
        # Check if LoRA exists
        lora_path = "models/lora/flux/sldr_flux_nsfw_v2-studio.safetensors"
        lora_available = os.path.exists(lora_path)
        
        print("Loading FLUX model with new pipeline...")
        
        # Build model configs (base FLUX only) - use 'path' for local files
        model_configs = [
            ModelConfig(path=f"{model_path}/text_encoder/model.safetensors"),
            ModelConfig(path=f"{model_path}/text_encoder_2"),
            ModelConfig(path=f"{model_path}/ae.safetensors"),
            ModelConfig(path=f"{model_path}/flux1-dev.safetensors"),
        ]
        
        # Load pipeline with new API
        pipeline = FluxImagePipeline.from_pretrained(
            torch_dtype=torch.bfloat16,
            device="cuda",
            model_configs=model_configs
        )
        
        # Load and apply LoRA if available
        if lora_available:
            print(f"LoRA found at {lora_path}, loading...")
            pipeline.enable_lora_magic()
            lora_config = ModelConfig(path=lora_path)
            pipeline.load_lora(pipeline.dit, lora_config, hotload=True)
            print("LoRA loaded and applied to pipeline")
        
        # Enable CPU offload for VRAM efficiency
        pipeline.enable_cpu_offload()
        print("FLUX pipeline ready with CPU offload enabled")
        
        _model_cache["flux_pipeline"] = pipeline
        _model_cache["lora_available"] = lora_available
        print("FLUX model loaded successfully")
    
    return _model_cache["flux_pipeline"]

def save_and_encode_image(image: Image.Image, model_name: str = "flux") -> ImageData:
    """Save image to disk and return both base64 and URL"""
    # Generate unique filename
    image_id = str(uuid.uuid4())
    filename = f"{model_name}_{image_id}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    # Save to disk
    image.save(filepath, format="PNG")
    
    # Convert to base64
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    base64_data = f"data:image/png;base64,{img_str}"
    
    # Create shareable URL
    url = f"/images/{filename}"
    
    return ImageData(
        base64=base64_data,
        url=url,
        filename=filename
    )

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
                negative_prompt=request.negative_prompt if request.cfg_scale > 1.0 else "",
                embedded_guidance=request.guidance,
                num_inference_steps=request.steps,
                height=request.height,
                width=request.width,
                tiled=request.tiled,
                cfg_scale=request.cfg_scale
            )
            
            # Save and encode image
            print(f"Saving and encoding image {i+1}...")
            image_data = save_and_encode_image(image, "flux")
            images.append(image_data)
        
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
    negative_prompt: str = Form(default=""),
    width: int = Form(default=1024),
    height: int = Form(default=1024),
    num_images: int = Form(default=1),
    steps: int = Form(default=28),
    guidance: float = Form(default=3.5),
    cfg_scale: float = Form(default=1.0),
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
                negative_prompt=negative_prompt if cfg_scale > 1.0 else "",
                embedded_guidance=guidance,
                num_inference_steps=steps,
                height=height,
                width=width,
                input_image=input_image,
                denoising_strength=denoising_strength,
                tiled=tiled,
                cfg_scale=cfg_scale
            )
            
            # Save and encode image
            image_data = save_and_encode_image(output_image, "flux_img2img")
            images.append(image_data)
        
        generation_time = time.time() - start_time
        
        return ImageResponse(
            images=images,
            seed=seed,
            generation_time=generation_time
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
