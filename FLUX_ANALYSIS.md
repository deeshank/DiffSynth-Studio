# 🔍 FLUX.1-dev Complete Deep Dive Analysis

## 📊 Core Parameters

### **Basic Parameters (Required/Common)**
```python
FluxImagePipeline(
    # Text Input
    prompt: str,                          # REQUIRED - Main text prompt
    negative_prompt: str = "",            # Optional - What to avoid (only works with cfg_scale > 1.0)
    
    # Image Dimensions
    height: int = 1024,                   # Image height (must be divisible by 16)
    width: int = 1024,                    # Image width (must be divisible by 16)
    
    # Generation Control
    num_inference_steps: int = 30,        # Number of denoising steps (default: 30, recommended: 28-50)
    seed: int = None,                     # Random seed for reproducibility
    
    # Guidance
    cfg_scale: float = 1.0,               # Classifier-free guidance (default: 1.0, FLUX typically uses 1.0)
    embedded_guidance: float = 3.5,       # FLUX-specific guidance (default: 3.5, range: 1.0-5.0)
    
    # Image-to-Image
    input_image: Image.Image = None,      # Input image for img2img
    denoising_strength: float = 1.0,      # How much to change input (0.0-1.0, 1.0 = full denoise)
)
```

### **Key Differences from SDXL**

| Feature | SDXL | FLUX |
|---------|------|------|
| **Data Type** | float16 | **bfloat16** |
| **CFG Scale** | 1.0-15.0 (default: 7.5) | **1.0 (fixed)** |
| **Guidance** | cfg_scale only | **embedded_guidance (3.5)** |
| **Negative Prompt** | Always used | Only with cfg_scale > 1.0 |
| **Default Steps** | 20 | **28-30** |
| **Resolution Step** | 8 pixels | **16 pixels** |
| **Text Encoder** | CLIP | **CLIP + T5** |

---

## 🎨 Feature Support Matrix

### ✅ **Supported Features**

#### 1. **Text-to-Image** ✅
```python
image = pipe(
    prompt="a beautiful landscape",
    height=1024,
    width=1024,
    num_inference_steps=28,
    embedded_guidance=3.5,
    seed=42
)
```

#### 2. **Image-to-Image** ✅
```python
image = pipe(
    prompt="turn this into a painting",
    input_image=input_img,
    denoising_strength=0.75,
    height=1024,
    width=1024,
    num_inference_steps=28,
    embedded_guidance=3.5
)
```

#### 3. **Classifier-Free Guidance (Optional)** ✅
```python
# Standard FLUX (no CFG)
image = pipe(
    prompt="a cat",
    cfg_scale=1.0,  # Default
    embedded_guidance=3.5
)

# With CFG (non-standard but supported)
image = pipe(
    prompt="a cat",
    negative_prompt="ugly, blurry",
    cfg_scale=2.0,  # Enable CFG
    embedded_guidance=3.5
)
```

#### 4. **High-Resolution Generation** ✅
```python
# Direct high-res
image = pipe(
    prompt="detailed landscape",
    height=2048,
    width=2048,
    tiled=True  # For VRAM efficiency
)

# Highres-fix (upscale with img2img)
image = pipe(
    prompt="detailed landscape",
    input_image=low_res_image.resize((2048, 2048)),
    height=2048,
    width=2048,
    denoising_strength=0.6,
    tiled=True
)
```

---

## 🚀 Advanced Features (Not for Initial Implementation)

### **ControlNet** 🎛️
```python
controlnet_inputs=[
    ControlNetInput(
        image=control_image,
        scale=0.5
    )
]
```

### **IP-Adapter** 🖼️
```python
ipadapter_images=reference_image,
ipadapter_scale=1.0
```

### **Inpainting (Flex)** 🎨
```python
flex_inpaint_image=image,
flex_inpaint_mask=mask,
flex_control_image=control,
flex_control_strength=0.5
```

### **Multi-Diffusion (Regional Prompts)** 🗺️
```python
multidiffusion_prompts=["sky", "ground"],
multidiffusion_masks=[sky_mask, ground_mask],
multidiffusion_scales=[1.0, 1.0]
```

### **Tiling (for large images)** 🧩
```python
tiled=True,
tile_size=128,
tile_stride=64
```

---

## 📋 Parameter Specifications

### **Prompt Parameters**
- **prompt**: `str` (required)
  - Main text description
  - No length limit but T5 encoder uses 512 tokens by default
  
- **negative_prompt**: `str` (optional, default: "")
  - Only effective when `cfg_scale > 1.0`
  - FLUX typically doesn't use negative prompts
  
- **t5_sequence_length**: `int` (default: 512)
  - Max tokens for T5 text encoder
  - Advanced parameter, usually not exposed

### **Image Parameters**
- **height**: `int` (default: 1024)
  - Must be divisible by 16
  - Range: 512-2048 (practical)
  
- **width**: `int` (default: 1024)
  - Must be divisible by 16
  - Range: 512-2048 (practical)
  
- **input_image**: `PIL.Image.Image` (optional)
  - For image-to-image generation
  - Will be resized to match height/width
  
- **denoising_strength**: `float` (default: 1.0)
  - Range: 0.0-1.0
  - 1.0 = full denoise (like text-to-image)
  - 0.7-0.8 = good for img2img
  - 0.5-0.6 = good for highres-fix

### **Generation Parameters**
- **num_inference_steps**: `int` (default: 30)
  - Range: 10-50 (practical)
  - Recommended: 28-30 for quality
  - More steps = better quality but slower
  
- **seed**: `int` (optional)
  - Random seed for reproducibility
  - If None, uses random seed
  
- **rand_device**: `str` (default: "cpu")
  - Device for random number generation
  - Usually "cpu" for reproducibility

### **Guidance Parameters**
- **cfg_scale**: `float` (default: 1.0)
  - Classifier-free guidance scale
  - FLUX default: 1.0 (no CFG)
  - Can use 1.5-3.0 for stronger prompt following
  - Requires negative_prompt when > 1.0
  
- **embedded_guidance**: `float` (default: 3.5)
  - FLUX-specific guidance embedding
  - Range: 1.0-5.0
  - Recommended: 3.5
  - Higher = stronger prompt adherence
  
- **sigma_shift**: `float` (optional)
  - Scheduler parameter
  - Advanced, usually auto-calculated

---

## 🎯 Recommended Settings for Web UI

### **Basic (Essential)**
```json
{
  "prompt": { "type": "text", "required": true },
  "height": { "type": "number", "min": 512, "max": 2048, "default": 1024, "step": 16 },
  "width": { "type": "number", "min": 512, "max": 2048, "default": 1024, "step": 16 },
  "num_images": { "type": "number", "min": 1, "max": 4, "default": 1 },
  "steps": { "type": "number", "min": 10, "max": 50, "default": 28 },
  "guidance": { "type": "number", "min": 1.0, "max": 5.0, "default": 3.5, "step": 0.1 },
  "seed": { "type": "number", "optional": true }
}
```

### **Image-to-Image (Additional)**
```json
{
  "input_image": { "type": "file", "accept": "image/*" },
  "denoising_strength": { "type": "number", "min": 0.0, "max": 1.0, "default": 0.75, "step": 0.05 }
}
```

### **Advanced (Optional, Collapsible)**
```json
{
  "cfg_scale": { "type": "number", "min": 1.0, "max": 3.0, "default": 1.0, "step": 0.1 },
  "negative_prompt": { "type": "text", "optional": true, "note": "Only works with cfg_scale > 1.0" },
  "tiled": { "type": "boolean", "default": false, "note": "For large images" }
}
```

---

## 🔧 Model Loading

### **Required Files**
```
models/FLUX/FLUX.1-dev/
├── text_encoder/model.safetensors          # CLIP text encoder (~1GB)
├── text_encoder_2/                         # T5 text encoder (~10GB)
│   ├── config.json
│   ├── model-00001-of-00002.safetensors
│   ├── model-00002-of-00002.safetensors
│   └── model.safetensors.index.json
├── ae.safetensors                          # VAE (~335MB)
└── flux1-dev.safetensors                   # Main DiT model (~12GB)
```

### **Loading Code**
```python
model_manager = ModelManager(torch_dtype=torch.bfloat16)
model_manager.load_models([
    "models/FLUX/FLUX.1-dev/text_encoder/model.safetensors",
    "models/FLUX/FLUX.1-dev/text_encoder_2",
    "models/FLUX/FLUX.1-dev/ae.safetensors",
    "models/FLUX/FLUX.1-dev/flux1-dev.safetensors",
])
pipe = FluxImagePipeline.from_model_manager(model_manager)
```

---

## 💾 VRAM Requirements

| Configuration | VRAM | Notes |
|--------------|------|-------|
| **Full FP16** | ~24GB | All models in VRAM |
| **FP8 DiT** | ~16GB | DiT in FP8, others in BF16 |
| **CPU Offload** | ~8GB | Models loaded on demand |
| **Quantized** | ~6GB | With quantization + offload |

---

## ✅ Implementation Recommendations

### **For Web UI - Phase 1 (Essential)**
1. ✅ Text-to-Image
2. ✅ Image-to-Image
3. ✅ Basic parameters: prompt, size, steps, guidance, seed
4. ✅ Denoising strength for img2img

### **For Web UI - Phase 2 (Nice to Have)**
1. ⏳ CFG scale + negative prompt (optional)
2. ⏳ Tiled generation for large images
3. ⏳ Multiple image generation

### **Not for Web UI (Too Advanced)**
1. ❌ ControlNet
2. ❌ IP-Adapter
3. ❌ Inpainting (Flex)
4. ❌ Multi-diffusion
5. ❌ LoRA
6. ❌ TeaCache

---

## 🎯 Final Parameter List for API

### **Common with SDXL**
- prompt ✅
- width ✅
- height ✅
- num_images ✅
- steps ✅
- seed ✅
- input_image ✅ (img2img)
- denoising_strength ✅ (img2img)

### **FLUX-Specific**
- guidance (embedded_guidance) ✅
- ~~negative_prompt~~ (optional, only with cfg_scale > 1.0)
- ~~cfg_scale~~ (optional, default 1.0)

### **SDXL-Specific**
- negative_prompt ✅
- cfg_scale ✅

---

## 📝 Notes

1. **FLUX uses bfloat16** - Important for model loading
2. **No negative prompts by default** - FLUX is trained without CFG
3. **embedded_guidance is key** - This is FLUX's main guidance mechanism
4. **Resolution must be divisible by 16** - Not 8 like SDXL
5. **Default steps: 28-30** - Not 20 like SDXL
6. **T5 text encoder is large** - ~10GB, much bigger than CLIP
