import torch
import os
import io
import numpy as np
from PIL import Image
import streamlit as st

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


def generate_images(pipeline, prompt, negative_prompt, width, height, num_images, steps, cfg_scale, seed, use_fixed_seed):
    """Generate images with the given parameters"""
    images = []
    progress_bar = st.progress(0, text="🎨 Starting generation...")
    
    for i in range(num_images):
        # Set seed
        if use_fixed_seed:
            torch.manual_seed(seed + i)
        else:
            torch.manual_seed(np.random.randint(0, 10**9))
        
        # Update progress
        progress_bar.progress((i) / num_images, text=f"🎨 Generating image {i+1}/{num_images}...")
        
        # Generate image
        image = pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            cfg_scale=cfg_scale,
            num_inference_steps=steps,
            height=height,
            width=width
        )
        images.append(image)
    
    progress_bar.progress(1.0, text="✨ Generation complete!")
    return images


# Custom CSS for better styling
st.markdown("""
<style>
    .stButton>button {
        font-weight: 600;
    }
    .stDownloadButton>button {
        width: 100%;
    }
    div[data-testid="stExpander"] {
        background-color: rgba(240, 242, 246, 0.5);
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

# Main UI
st.title("🎨 SDXL Image Generator", anchor=False)
st.markdown("Generate high-quality images using Stable Diffusion XL")

# Load model
pipeline = load_sdxl_model()
st.success("✅ Model loaded successfully!", icon="✅")

st.divider()

# Create layout
col_settings, col_output = st.columns([1, 2], gap="large")

with col_settings:
    st.subheader("⚙️ Generation Settings", anchor=False)
    
    # Prompt section
    with st.container(border=True):
        st.markdown("**📝 Prompts**")
        prompt = st.text_area(
            "Describe what you want to generate",
            placeholder="A beautiful landscape with mountains and a lake at sunset...",
            height=100,
            label_visibility="collapsed",
            key="prompt_input"
        )
        
        with st.expander("🚫 Negative Prompt (Optional)", expanded=False):
            negative_prompt = st.text_area(
                "What to avoid in the image",
                value=DEFAULT_NEGATIVE_PROMPT,
                height=80,
                label_visibility="collapsed",
                key="negative_prompt_input"
            )
    
    # Image settings
    with st.container(border=True):
        st.markdown("**🖼️ Image Settings**")
        
        size_options = {
            "Square 512×512": (512, 512),
            "Square 768×768": (768, 768),
            "Square 1024×1024": (1024, 1024),
            "Portrait 768×1024": (768, 1024),
            "Landscape 1024×768": (1024, 768),
            "Wide 1280×768": (1280, 768),
        }
        
        selected_size = st.selectbox(
            "📐 Image Size",
            options=list(size_options.keys()),
            index=2,
            key="size_select"
        )
        width, height = size_options[selected_size]
        
        num_images = st.slider(
            "🖼️ Number of Images",
            min_value=1,
            max_value=4,
            value=1,
            help="Generate multiple images at once",
            key="num_images_slider"
        )
    
    # Advanced settings
    with st.container(border=True):
        st.markdown("**🎛️ Advanced Settings**")
        
        steps = st.slider(
            "⚡ Inference Steps",
            min_value=10,
            max_value=50,
            value=20,
            help="More steps = better quality but slower generation",
            key="steps_slider"
        )
        
        cfg_scale = st.slider(
            "🎯 CFG Scale",
            min_value=1.0,
            max_value=15.0,
            value=7.5,
            step=0.5,
            help="How closely to follow the prompt (7-8 is usually good)",
            key="cfg_slider"
        )
        
        use_fixed_seed = st.toggle("🎲 Use Fixed Seed", value=False, key="seed_toggle")
        if use_fixed_seed:
            seed = st.number_input(
                "Seed Value",
                min_value=0,
                max_value=999999999,
                value=42,
                help="Same seed = same image",
                key="seed_input"
            )
        else:
            seed = 0
    
    # Generate button
    st.markdown("")  # Spacing
    generate_btn = st.button(
        "🚀 Generate Images",
        type="primary",
        use_container_width=True,
        disabled=not prompt.strip(),
        key="generate_button"
    )
    
    if not prompt.strip():
        st.warning("⚠️ Please enter a prompt to generate images", icon="⚠️")

# Output section
with col_output:
    st.subheader("🖼️ Generated Images", anchor=False)
    
    if generate_btn and prompt.strip():
        # Generate images
        with st.spinner("🎨 Generating your images..."):
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
                use_fixed_seed=use_fixed_seed
            )
        
        # Store in session state
        st.session_state["generated_images"] = images
        st.session_state["generation_params"] = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "size": selected_size,
            "steps": steps,
            "cfg_scale": cfg_scale,
            "seed": seed if use_fixed_seed else "Random"
        }
        
        st.success(f"✨ Generated {len(images)} image(s) successfully!", icon="✨")
        st.rerun()
    
    # Display images
    if "generated_images" in st.session_state and len(st.session_state["generated_images"]) > 0:
        images = st.session_state["generated_images"]
        params = st.session_state.get("generation_params", {})
        
        # Show generation info in a nice card
        with st.expander("ℹ️ Generation Details", expanded=False):
            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f"**📝 Prompt:**")
                st.caption(params.get('prompt', 'N/A'))
                st.markdown(f"**📐 Size:** {params.get('size', 'N/A')}")
                st.markdown(f"**⚡ Steps:** {params.get('steps', 'N/A')}")
            with col2:
                st.markdown(f"**🎯 CFG Scale:** {params.get('cfg_scale', 'N/A')}")
                st.markdown(f"**🎲 Seed:** {params.get('seed', 'N/A')}")
                st.markdown(f"**🖼️ Count:** {len(images)}")
        
        st.divider()
        
        # Display images in grid
        num_cols = min(2, len(images))
        cols = st.columns(num_cols, gap="medium")
        
        for idx, image in enumerate(images):
            col_idx = idx % num_cols
            with cols[col_idx]:
                # Display image with container
                with st.container(border=True):
                    st.image(image, use_container_width=True)
                    
                    # Download button
                    st.download_button(
                        label=f"⬇️ Download Image {idx+1}",
                        data=image_to_bytes(image),
                        file_name=f"sdxl_image_{idx+1}.png",
                        mime="image/png",
                        use_container_width=True,
                        key=f"download_{idx}"
                    )
                    
                    # Image info
                    st.caption(f"📐 {image.size[0]} × {image.size[1]} pixels")
    else:
        # Placeholder with helpful tips
        st.info("👆 Configure your settings and click 'Generate Images' to start creating!", icon="💡")
        
        with st.container(border=True):
            st.markdown("### 💡 Tips for Better Results")
            st.markdown("""
            - **Be specific and descriptive** in your prompts
            - **Use 20-30 steps** for good quality (more steps = better quality)
            - **CFG Scale of 7-8** works well for most images
            - **Try different seeds** to get variations of the same prompt
            - **Use negative prompts** to avoid unwanted elements
            """)

# Footer
st.divider()
col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    st.markdown(
        """
        <div style='text-align: center; color: #666; font-size: 0.9em;'>
        ⚡ Powered by <strong>DiffSynth Studio</strong> • Stable Diffusion XL
        </div>
        """,
        unsafe_allow_html=True
    )
