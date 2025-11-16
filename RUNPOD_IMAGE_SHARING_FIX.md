# RunPod Image Sharing Fix

## Problem
When clicking "Share Link", the URL was pointing to the React app instead of the actual image file on the FastAPI server (port 8000).

## Root Causes

1. **Route Order**: The React static files mount was catching all routes before the `/images` route could be processed
2. **Proxy Configuration**: Vite dev server wasn't proxying `/images` requests to the API server
3. **URL Construction**: Frontend was using `window.location.origin` which pointed to the React dev server (port 3000) instead of the API server (port 8000)

## Fixes Applied

### 1. Backend - Fixed Route Order (`apps/api/main.py`)
```python
# Routes must be registered in this order:
1. @app.get("/") - Root endpoint
2. app.include_router() - API routes
3. app.mount("/images", ...) - Image static files
4. app.mount("/", ...) - React app (LAST - catches all remaining)
```

**Why**: FastAPI processes routes in order. The React app mount with `html=True` acts as a catch-all, so it must be last.

### 2. Frontend - Added Vite Proxy (`apps/web/vite.config.ts`)
```typescript
proxy: {
  '/api': { target: 'http://0.0.0.0:8000', changeOrigin: true },
  '/images': { target: 'http://0.0.0.0:8000', changeOrigin: true }
}
```

**Why**: In development, React runs on port 3000 and API on port 8000. The proxy forwards `/images` requests to the API server.

### 3. Frontend - Environment Configuration (`apps/web/.env`)
```bash
VITE_API_URL=https://szwbe7z8laly4o-8000.proxy.runpod.net
```

**Why**: In production (RunPod), we need to use the full proxy URL so shareable links work from anywhere.

### 4. Frontend - API Base URL Helper (`apps/web/src/services/api.ts`)
```typescript
export const getApiBaseUrl = () => {
  if (API_BASE_URL) return API_BASE_URL  // Production
  return window.location.origin          // Development
}
```

**Why**: Dynamically determines the correct base URL for constructing shareable image links.

### 5. Frontend - Updated Share Handler (`apps/web/src/components/ImageGallery.tsx`)
```typescript
const baseUrl = getApiBaseUrl()
const shareUrl = `${baseUrl}${img.url}`
```

**Why**: Uses the API base URL instead of the React app URL.

## How It Works Now

### Development (Local)
1. React dev server runs on `http://localhost:3000`
2. FastAPI server runs on `http://localhost:8000`
3. Vite proxy forwards `/images/*` to port 8000
4. Share URL: `http://localhost:8000/images/flux_abc123.png`

### Production (RunPod)
1. Both servers accessible via RunPod proxy URLs
2. React: `https://szwbe7z8laly4o-3000.proxy.runpod.net`
3. API: `https://szwbe7z8laly4o-8000.proxy.runpod.net`
4. Share URL: `https://szwbe7z8laly4o-8000.proxy.runpod.net/images/flux_abc123.png`

## Testing

### 1. Start the API Server
```bash
cd /workspace/DiffSynth-Studio
python apps/api/main.py
```

### 2. Start the React Dev Server
```bash
cd apps/web
npm run dev
```

### 3. Generate an Image
- Open the React app
- Generate an image
- Click "Share Link"
- Paste the URL in a new browser tab
- Should see the image directly (not the React app)

### 4. Test Direct Access
```bash
# Should return the image file
curl -I https://szwbe7z8laly4o-8000.proxy.runpod.net/images/test.txt
```

## Troubleshooting

### Issue: Share link still shows React app
**Solution**: Restart the FastAPI server to apply route order changes

### Issue: 404 on image URL
**Solution**: Check that `outputs/images/` directory exists and contains the image file

### Issue: CORS errors
**Solution**: Verify CORS middleware allows your RunPod proxy domain

### Issue: Images not saving
**Solution**: Check write permissions on `outputs/images/` directory

## File Structure
```
outputs/
  images/
    sdxl_uuid1.png
    flux_uuid2.png
    flux_img2img_uuid3.png
```

## Important Notes

1. **Restart Required**: After changing `apps/api/main.py`, restart the FastAPI server
2. **Restart Required**: After changing `apps/web/.env`, restart the Vite dev server
3. **Production**: Update `VITE_API_URL` in `.env` for your specific RunPod URL
4. **Security**: In production, consider adding authentication to the `/images` endpoint
5. **Storage**: Images persist on disk - consider cleanup policy for old images
