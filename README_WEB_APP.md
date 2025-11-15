# DiffSynth Studio - Web Application

Modern web interface for SDXL image generation with FastAPI backend and React frontend.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DiffSynth Studio                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React      │  │   FastAPI    │  │  Streamlit   │  │
│  │   Frontend   │  │   Backend    │  │   (Legacy)   │  │
│  │              │  │              │  │              │  │
│  │  Port 3000   │  │  Port 8000   │  │  Port 8501   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
│         │                 │                              │
│         └────────┬────────┘                              │
│                  │                                       │
│         ┌────────▼────────┐                             │
│         │  SDXL Pipeline  │                             │
│         │  (DiffSynth)    │                             │
│         └─────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### One Command Setup
```bash
bash bootstrap.sh
```

This will:
1. Install Python dependencies
2. Install Node.js dependencies
3. Download SDXL model
4. Start all services (FastAPI, React, Streamlit)

### Access Points
- **React Web App**: http://0.0.0.0:3000 (Modern UI)
- **FastAPI Backend**: http://0.0.0.0:8000
- **API Documentation**: http://0.0.0.0:8000/docs
- **Streamlit**: http://0.0.0.0:8501 (Legacy UI)

## 📁 Project Structure

```
DiffSynth-Studio/
├── apps/
│   ├── api/                    # FastAPI Backend
│   │   ├── main.py            # Main FastAPI app
│   │   └── routes/
│   │       ├── health.py      # Health & system info
│   │       └── sdxl.py        # SDXL generation endpoints
│   │
│   ├── web/                    # React Frontend
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── services/      # API client
│   │   │   ├── App.tsx        # Main app
│   │   │   └── main.tsx       # Entry point
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── streamlit/              # Streamlit UI (Legacy)
│       └── pages/
│
├── bootstrap.sh                # Startup script
└── requirements.txt            # Python dependencies
```

## 🎨 Features

### Text-to-Image
- Generate images from text descriptions
- Adjustable parameters: size, steps, CFG scale, seed
- Multiple image generation
- Negative prompts

### Image-to-Image
- Transform existing images
- Drag & drop upload
- Adjustable transformation strength
- All text-to-image parameters

### Gallery
- View generated images
- Zoom functionality
- Download individual or all images
- Generation metadata (seed, time)

## 🔧 API Endpoints

### Health & Info
- `GET /api/health` - System health check
- `GET /api/models` - List available models

### Generation
- `POST /api/sdxl/generate` - Text-to-image generation
- `POST /api/sdxl/transform` - Image-to-image transformation

### Example Request
```bash
curl -X POST "http://0.0.0.0:8000/api/sdxl/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "width": 1024,
    "height": 1024,
    "num_images": 1,
    "steps": 20,
    "cfg_scale": 7.5
  }'
```

## 🛠️ Development

### Run Services Individually

**FastAPI Backend:**
```bash
cd /workspace/DiffSynth-Studio
python3 -m uvicorn apps.api.main:app --reload --port 8000
```

**React Frontend:**
```bash
cd apps/web
npm run dev
```

**Streamlit:**
```bash
streamlit run apps/streamlit/DiffSynth_Studio.py
```

### Build React for Production
```bash
cd apps/web
npm run build
```

The built files will be in `apps/web/dist/` and can be served by FastAPI.

## 📦 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **DiffSynth** - SDXL pipeline
- **PyTorch** - Deep learning framework

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Chakra UI** - Component library
- **React Query** - Data fetching
- **Axios** - HTTP client
- **React Dropzone** - File upload

## 🎯 Model Parameters

### Common Parameters
- **prompt**: Text description (required)
- **negative_prompt**: What to avoid (optional)
- **width**: Image width (512-2048)
- **height**: Image height (512-2048)
- **num_images**: Number of images (1-4)
- **steps**: Inference steps (10-50)
- **cfg_scale**: Guidance scale (1-15)
- **seed**: Random seed (optional)

### Image-to-Image Only
- **denoising_strength**: Transformation strength (0-1)
  - 0.0-0.4: Light touch
  - 0.4-0.7: Balanced
  - 0.7-1.0: Heavy transformation

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Node Modules Issues
```bash
cd apps/web
rm -rf node_modules package-lock.json
npm install
```

### Python Dependencies
```bash
pip3 install -r requirements.txt --force-reinstall
```

## 📝 Notes

- The React app proxies API requests to FastAPI (configured in `vite.config.ts`)
- Model is cached after first load for faster subsequent generations
- All services run in the same pod/container
- Streamlit is kept for backward compatibility

## 🔮 Future Enhancements

- [ ] WebSocket support for real-time progress
- [ ] Image history/gallery persistence
- [ ] Batch processing
- [ ] More models (SD3, FLUX, etc.)
- [ ] User presets/favorites
- [ ] Image editing tools

## 📄 License

Same as DiffSynth Studio main project.
