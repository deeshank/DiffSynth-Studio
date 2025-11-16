"""
FastAPI Backend for Dee Studio
Provides REST API for SDXL image generation
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from apps.api.routes import sdxl, flux, health, models

# Create output directory for saved images
OUTPUT_DIR = "outputs/images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="Dee Studio API",
    description="REST API for AI image generation (SDXL & FLUX)",
    version="1.0.0"
)

# CORS middleware - allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://0.0.0.0:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  # Allow all in development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(models.router, prefix="/api/models", tags=["Models"])
app.include_router(sdxl.router, prefix="/api/sdxl", tags=["SDXL"])
app.include_router(flux.router, prefix="/api/flux", tags=["FLUX"])

# Serve saved images as static files
app.mount("/images", StaticFiles(directory=OUTPUT_DIR), name="images")

# Serve React build in production (optional)
if os.path.exists("apps/web/dist"):
    app.mount("/", StaticFiles(directory="apps/web/dist", html=True), name="static")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Dee Studio API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
