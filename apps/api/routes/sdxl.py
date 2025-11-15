"""
SDXL image generation endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import torch
import io
import base64
import numpy as np
from PIL import Image

from diffsynth.models import ModelManager
from diffsynth.pipelines import SDXLImagePipeline

router = APIRouter()

# Global model cache
_model_cache = {}

class GenerateRequest(BaseModel):
    """Request model for text-to-image generation"""
    prompt: str = Field(..., description="Text prompt for image generation")
    negative_prompt: str = Field(
        default="nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
        description="Negative prompt"
    )
    width: int = Field(default=1024, ge=512, le=2048, description="Image width")
    height: int = Field(default=1024, ge=512, le=2048, description="Image height")
    num_images: int = Field(default=1, ge=1, le=4, description="Number of images to generate")
    steps: int = Field(default=20, ge=10, le=50, description="Number of inference steps")
    cfg_scale: float = Field(default=7.5, ge=1.0, le=15.0, description="CFG scale")
    seed: Optional[int] = Field(default=None, description="Random seed (optional)")

class ImageResponse(BaseModel):
    """Response model for generated images"""
    images: List[str] = Field(..., description="Base64 encoded images")
    seed: int = Field(..., description="Seed used for generation")
    generation_time: float = Field(..., description="Generation time in seconds")

def get_pipeline():
    """Get or create SDXL pipeline (cached)"""
    if "sdxl_pipeline" not in _model_cache:
        # Unload FLUX if loaded to free VRAM
        if "flux_pipeline" in _model_cache:
            print("Unloading FLUX to free VRAM for SDXL...")
            del _model_cache["flux_pipeline"]
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
        
        print("Loading SDXL model...")
        model_path = "models/stable_diffusion_xl/sd_xl_base_1.0.safetensors"
        model_manager = ModelManager()
        model_manager.load_model(model_path)
        pipeline = SDXLImagePipeline.from_model_manager(model_manager)
        _model_cache["sdxl_pipeline"] = pipeline
        print("SDXL model loaded successfully")
    return _model_cache["sdxl_pipeline"]

def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

@router.post("/generate", response_model=ImageResponse)
async def generate_images(request: GenerateRequest):
    """
    Generate images from text prompt (Text-to-Image)
    """
    try:
        import time
        start_time = time.time()
        
        # Get pipeline
        pipeline = get_pipeline()
        
        # Set seed
        if request.seed is None:
            seed = np.random.randint(0, 10**9)
        else:
            seed = request.seed
        
        # Generate images
        images = []
        for i in range(request.num_images):
            torch.manual_seed(seed + i)
            
            image = pipeline(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                cfg_scale=request.cfg_scale,
                num_inference_steps=request.steps,
                height=request.height,
                width=request.width
            )
            
            # Convert to base64
            img_base64 = image_to_base64(image)
            images.append(img_base64)
        
        generation_time = time.time() - start_time
        
        return ImageResponse(
            images=images,
            seed=seed,
            generation_time=generation_time
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transform", response_model=ImageResponse)
async def transform_image(
    prompt: str = Form(...),
    negative_prompt: str = Form(
        default="nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
    ),
    width: int = Form(default=1024),
    height: int = Form(default=1024),
    num_images: int = Form(default=1),
    steps: int = Form(default=20),
    cfg_scale: float = Form(default=7.5),
    denoising_strength: float = Form(default=0.75),
    seed: Optional[int] = Form(default=None),
    image: UploadFile = File(...)
):
    """
    Transform an existing image (Image-to-Image)
    """
    try:
        import time
        start_time = time.time()
        
        # Get pipeline
        pipeline = get_pipeline()
        
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
                negative_prompt=negative_prompt,
                cfg_scale=cfg_scale,
                num_inference_steps=steps,
                height=height,
                width=width,
                input_image=input_image,
                denoising_strength=denoising_strength
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


