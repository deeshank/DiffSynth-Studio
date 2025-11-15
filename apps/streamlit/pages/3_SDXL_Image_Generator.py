import torch
import os
import io
import numpy as np
from PIL import Image
import streamlit as st
import time

st.set_page_config(
    page_title="SDXL Image Generator",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="expanded"
)

from diffsynth.models import ModelManager
from diffsynth.pipelines import SDXLImagePipeline


# Constants
MODEL_PATH = "models/stable_diffusion_xl/sd_xl_base_1.0.safetensors"
DEFAULT_NEGATIVE_PROMPT = "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"

# Preset prompts for quick start
PRESET_PROMPTS = {
    "🌅 Landscape": "A breathtaking landscape with mountains, a serene lake reflecting the sunset, dramatic clouds, golden hour lighting, photorealistic, 8k, highly detailed",
    "🎭 Portrait": "Professional portrait photography, a person with striking features, studio lighting, bokeh background, sharp focus, high quality, detailed skin texture",
    "🏙️ Cityscape": "Futuristic cyberpunk city at night, neon lights, rain-soaked streets, flying cars, towering skyscrapers, cinematic lighting, highly detailed",
    "🐉 Fantasy": "Majestic dragon perched on a mountain peak, fantasy art, magical atmosphere, epic scale, detailed scales, dramatic lighting, concept art style",
    "🎨 Abstract": "Abstract art, vibrant colors, flowing shapes, dynamic composition, modern art style, high contrast, artistic masterpiece",
    "🌸 Nature": "Beautiful cherry blossom tree in full bloom, spring season, soft pink petals, peaceful garden, natural lighting, macro photography",
}


@st.cache_resource(show_spinner="🔄 Loading SDXL model...")
def load_sdxl_model():
    """Load SDXL model and cache it"""
    if not os.path.exists(MODEL_PATH):
        st.error(f"❌ Model not found at: {MODEL_PATH}", icon="🚨")
        st.info("Please run the download_models.py script first to download the SDXL model.")
        st.stop()
    
    model_manager = ModelManager()
    model_manager.load_model(MODEL_PATH)
    pipeline = SDXLImagePipeline.from_model_manager(model_manager)
    return pipeline


def image_to_bytes(image):
    """Convert PIL Image to bytes for download"""
    img_byte = io.BytesIO()
    image.save(img_byte, format="PNG")
    return img_byte.getvalue()


def generate_images(pipeline, prompt, negative_prompt, width, height, num_images, steps, cfg_scale, seed, use_fixed_seed, input_image=None, denoising_strength=0.75):
    """Generate images with the given parameters"""
    images = []
    progress_container = st.empty()
    
    for i in range(num_images):
        # Set seed
        if use_fixed_seed:
            torch.manual_seed(seed + i)
        else:
            torch.manual_seed(np.random.randint(0, 10**9))
        
        # Update progress
        with progress_container:
            progress_val = (i) / num_images
            mode = "Transforming" if input_image else "Generating"
            st.progress(progress_val, text=f"🎨 {mode} image {i+1}/{num_images}...")
        
        # Prepare input image if provided
        processed_input = None
        if input_image is not None:
            processed_input = input_image.resize((width, height))
        
        # Generate image
        image = pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            cfg_scale=cfg_scale,
            num_inference_steps=steps,
            height=height,
            width=width,
            input_image=processed_input,
            denoising_strength=denoising_strength if processed_input else 1.0
        )
        images.append(image)
    
    with progress_container:
        st.progress(1.0, text="✨ Generation complete!")
        time.sleep(0.5)
    progress_container.empty()
    
    return images


# Custom CSS for modern, interactive design
st.markdown("""
<style>
    /* Main container styling */
    .main {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        background-attachment: fixed;
    }
    
    /* Card styling */
    div[data-testid="stVerticalBlock"] > div[data-testid="stVerticalBlock"] {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
    }
    
    /* Button styling */
    .stButton>button {
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
    
    /* Download button styling */
    .stDownloadButton>button {
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .stDownloadButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    
    /* Expander styling */
    div[data-testid="stExpander"] {
        background: rgba(240, 242, 246, 0.8);
        border-radius: 10px;
        border: 1px solid rgba(102, 126, 234, 0.2);
        transition: all 0.3s ease;
    }
    
    div[data-testid="stExpander"]:hover {
        border-color: rgba(102, 126, 234, 0.5);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }
    
    /* Image container */
    div[data-testid="stImage"] {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
    }
    
    div[data-testid="stImage"]:hover {
        transform: scale(1.02);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    }
    
    /* Text area styling */
    .stTextArea textarea {
        border-radius: 8px;
        border: 2px solid rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
    }
    
    .stTextArea textarea:focus {
        border-color: rgba(102, 126, 234, 0.8);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    /* Slider styling */
    .stSlider {
        padding: 10px 0;
    }
    
    /* Success/Info messages */
    .stAlert {
        border-radius: 10px;
        border-left: 4px solid;
        animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    /* Header styling */
    h1, h2, h3 {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    /* Divider */
    hr {
        margin: 2rem 0;
        border: none;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent);
    }
</style>
""", unsafe_allow_html=True)

# Header with animation
st.markdown("""
<div style='text-align: center; padding: 20px 0;'>
    <h1 style='font-size: 3.5rem; margin-bottom: 0;'>🎨 SDXL Image Generator</h1>
    <p style='font-size: 1.2rem; color: #666; margin-top: 10px;'>
        Create stunning AI-generated images with Stable Diffusion XL
    </p>
</div>
""", unsafe_allow_html=True)

# Load model
pipeline = load_sdxl_model()
st.success("✅ Model loaded and ready to create!", icon="✅")

st.markdown("<br>", unsafe_allow_html=True)

# Create layout
col_settings, col_output = st.columns([1, 2], gap="large")

with col_settings:
    st.markdown("### ⚙️ Generation Settings")
    
    # Mode selection
    mode_tab1, mode_tab2 = st.tabs(["📝 Text to Image", "🖼️ Image to Image"])
    
    with mode_tab1:
        generation_mode = "text2img"
        st.caption("Generate images from text descriptions")
    
    with mode_tab2:
        generation_mode = "img2img"
        st.caption("Transform existing images with AI")
    
    # Image upload for img2img mode
    input_image = None
    denoising_strength = 0.75
    
    if generation_mode == "img2img":
        with st.container():
            st.markdown("**📤 Upload Image**")
            uploaded_file = st.file_uploader(
                "Choose an image to transform",
                type=["png", "jpg", "jpeg"],
                key="image_upload",
                label_visibility="collapsed"
            )
            
            if uploaded_file is not None:
                input_image = Image.open(uploaded_file).convert("RGB")
                st.image(input_image, caption="Input Image", use_container_width=True)
                
                denoising_strength = st.slider(
                    "🎨 Transformation Strength",
                    min_value=0.0,
                    max_value=1.0,
                    value=0.75,
                    step=0.05,
                    help="Higher = more changes, Lower = closer to original",
                    key="denoising_slider"
                )
                st.caption(f"{'🔥 Heavy transformation' if denoising_strength > 0.7 else '✨ Light touch' if denoising_strength < 0.4 else '⚖️ Balanced'}")
    
    # Quick presets
    with st.expander("⚡ Quick Start Presets", expanded=generation_mode == "text2img"):
        preset_choice = st.selectbox(
            "Choose a preset or write your own",
            options=["Custom"] + list(PRESET_PROMPTS.keys()),
            key="preset_select"
        )
        
        if preset_choice != "Custom":
            st.caption(f"💡 {PRESET_PROMPTS[preset_choice][:100]}...")
    
    # Prompt section
    with st.container():
        st.markdown("**📝 Your Prompt**")
        
        if preset_choice != "Custom":
            default_prompt = PRESET_PROMPTS[preset_choice]
        else:
            default_prompt = ""
        
        prompt = st.text_area(
            "Describe what you want to generate",
            value=default_prompt,
            placeholder="A beautiful landscape with mountains and a lake at sunset...",
            height=120,
            label_visibility="collapsed",
            key="prompt_input"
        )
        
        # Character counter
        char_count = len(prompt)
        st.caption(f"📊 {char_count} characters")
        
        with st.expander("🚫 Negative Prompt", expanded=False):
            negative_prompt = st.text_area(
                "What to avoid in the image",
                value=DEFAULT_NEGATIVE_PROMPT,
                height=80,
                label_visibility="collapsed",
                key="negative_prompt_input"
            )
    
    # Image settings
    with st.container():
        st.markdown("**🖼️ Image Settings**")
        
        col1, col2 = st.columns(2)
        
        with col1:
            size_options = {
                "512×512": (512, 512),
                "768×768": (768, 768),
                "1024×1024": (1024, 1024),
            }
            selected_size = st.selectbox(
                "📐 Size",
                options=list(size_options.keys()),
                index=2,
                key="size_select"
            )
        
        with col2:
            aspect_options = {
                "Square": (1, 1),
                "Portrait": (3, 4),
                "Landscape": (4, 3),
                "Wide": (16, 9),
            }
            aspect = st.selectbox(
                "📱 Aspect",
                options=list(aspect_options.keys()),
                index=0,
                key="aspect_select"
            )
        
        # Calculate dimensions
        base_size = int(selected_size.split('×')[0])
        aspect_w, aspect_h = aspect_options[aspect]
        
        if aspect == "Square":
            width, height = base_size, base_size
        elif aspect == "Portrait":
            width = int(base_size * aspect_w / aspect_h)
            height = base_size
        elif aspect == "Landscape":
            width = base_size
            height = int(base_size * aspect_h / aspect_w)
        else:  # Wide
            width = base_size
            height = int(base_size * aspect_h / aspect_w)
        
        st.caption(f"📐 Final size: {width}×{height} pixels")
        
        num_images = st.slider(
            "🖼️ Number of Images",
            min_value=1,
            max_value=4,
            value=1,
            help="Generate multiple variations",
            key="num_images_slider"
        )
    
    # Advanced settings
    with st.expander("🎛️ Advanced Settings", expanded=True):
        steps = st.slider(
            "⚡ Inference Steps",
            min_value=10,
            max_value=50,
            value=20,
            help="More steps = better quality but slower",
            key="steps_slider"
        )
        
        cfg_scale = st.slider(
            "🎯 CFG Scale",
            min_value=1.0,
            max_value=15.0,
            value=7.5,
            step=0.5,
            help="How closely to follow the prompt",
            key="cfg_slider"
        )
        
        col1, col2 = st.columns([1, 2])
        with col1:
            use_fixed_seed = st.checkbox("🎲 Fixed Seed", value=False, key="seed_toggle")
        with col2:
            if use_fixed_seed:
                seed = st.number_input(
                    "Seed",
                    min_value=0,
                    max_value=999999999,
                    value=42,
                    label_visibility="collapsed",
                    key="seed_input"
                )
            else:
                seed = 0
    
    # Generate button
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Check if ready to generate
    can_generate = prompt.strip() and (generation_mode == "text2img" or (generation_mode == "img2img" and input_image is not None))
    
    button_text = "🎨 Transform Image" if generation_mode == "img2img" else "🚀 Generate Images"
    generate_btn = st.button(
        button_text,
        type="primary",
        use_container_width=True,
        disabled=not can_generate,
        key="generate_button"
    )
    
    if not prompt.strip():
        st.warning("⚠️ Please enter a prompt", icon="⚠️")
    elif generation_mode == "img2img" and input_image is None:
        st.warning("⚠️ Please upload an image", icon="⚠️")
    
    # Quick actions
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🔄 Clear All", use_container_width=True):
            if "generated_images" in st.session_state:
                del st.session_state["generated_images"]
            if "generation_params" in st.session_state:
                del st.session_state["generation_params"]
            st.rerun()
    with col2:
        if st.button("🎲 Random Seed", use_container_width=True):
            st.session_state["random_seed"] = np.random.randint(0, 999999999)
            st.rerun()

# Output section
with col_output:
    st.markdown("### 🖼️ Generated Images")
    
    if generate_btn and can_generate:
        # Generate images
        start_time = time.time()
        
        images = generate_images(
            pipeline=pipeline,
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_images=num_images,
            steps=steps,
            cfg_scale=cfg_scale,
            seed=seed,
            use_fixed_seed=use_fixed_seed,
            input_image=input_image,
            denoising_strength=denoising_strength
        )
        
        generation_time = time.time() - start_time
        
        # Store in session state
        st.session_state["generated_images"] = images
        st.session_state["generation_params"] = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "size": f"{width}×{height}",
            "steps": steps,
            "cfg_scale": cfg_scale,
            "seed": seed if use_fixed_seed else "Random",
            "time": generation_time,
            "mode": "Image-to-Image" if input_image else "Text-to-Image",
            "denoising": f"{denoising_strength:.2f}" if input_image else "N/A"
        }
        
        st.balloons()
        mode_text = "Transformed" if input_image else "Generated"
        st.success(f"✨ {mode_text} {len(images)} image(s) in {generation_time:.1f}s!", icon="✨")
        st.rerun()
    
    # Display images
    if "generated_images" in st.session_state and len(st.session_state["generated_images"]) > 0:
        images = st.session_state["generated_images"]
        params = st.session_state.get("generation_params", {})
        
        # Show generation info
        with st.expander("ℹ️ Generation Details", expanded=False):
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("📐 Size", params.get('size', 'N/A'))
                st.metric("⚡ Steps", params.get('steps', 'N/A'))
            with col2:
                st.metric("🎯 CFG Scale", params.get('cfg_scale', 'N/A'))
                st.metric("🎲 Seed", params.get('seed', 'N/A'))
            with col3:
                st.metric("🖼️ Images", len(images))
                st.metric("⏱️ Time", f"{params.get('time', 0):.1f}s")
            with col4:
                st.metric("🎨 Mode", params.get('mode', 'N/A'))
                if params.get('denoising', 'N/A') != 'N/A':
                    st.metric("🔥 Strength", params.get('denoising', 'N/A'))
            
            st.markdown("**📝 Prompt:**")
            st.caption(params.get('prompt', 'N/A'))
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # Display images in grid
        num_cols = min(2, len(images))
        cols = st.columns(num_cols, gap="medium")
        
        for idx, image in enumerate(images):
            col_idx = idx % num_cols
            with cols[col_idx]:
                # Display image
                st.image(image, use_container_width=True)
                
                # Action buttons
                col_dl, col_info = st.columns([2, 1])
                with col_dl:
                    st.download_button(
                        label=f"⬇️ Download #{idx+1}",
                        data=image_to_bytes(image),
                        file_name=f"sdxl_image_{idx+1}.png",
                        mime="image/png",
                        use_container_width=True,
                        key=f"download_{idx}"
                    )
                with col_info:
                    st.caption(f"📐 {image.size[0]}×{image.size[1]}")
                
                st.markdown("<br>", unsafe_allow_html=True)
    else:
        # Placeholder
        st.info("👆 Configure settings and generate your first image!", icon="💡")
        
        # Gallery of tips
        st.markdown("### 💡 Pro Tips")
        
        tip_cols = st.columns(2)
        with tip_cols[0]:
            st.markdown("""
            **🎨 Prompt Writing**
            - Be specific and detailed
            - Include style keywords
            - Mention lighting and mood
            - Add quality terms (8k, detailed)
            """)
        
        with tip_cols[1]:
            st.markdown("""
            **⚙️ Settings Guide**
            - Steps: 20-30 for quality
            - CFG: 7-8 for balanced results
            - Higher CFG = closer to prompt
            - Use seed for consistency
            """)

# Footer
st.markdown("<br><br>", unsafe_allow_html=True)
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; padding: 20px;'>
        <p style='color: #666; font-size: 0.9em; margin: 0;'>
            ⚡ Powered by <strong>DiffSynth Studio</strong> • Stable Diffusion XL
        </p>
        <p style='color: #999; font-size: 0.8em; margin-top: 5px;'>
            Create • Inspire • Innovate
        </p>
    </div>
    """,
    unsafe_allow_html=True
)
