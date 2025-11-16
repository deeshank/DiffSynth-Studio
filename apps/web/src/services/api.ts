import axios from 'axios'

// Use relative URL to avoid mixed-content issues (proxied by Vite)
// In production, set VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface GenerateRequest {
  prompt: string
  negative_prompt?: string
  width?: number
  height?: number
  num_images?: number
  steps?: number
  cfg_scale?: number
  guidance?: number
  seed?: number
  tiled?: boolean
}

export interface TransformRequest extends GenerateRequest {
  denoising_strength?: number
}

export interface ImageResponse {
  images: string[]
  seed: number
  generation_time: number
}

export interface HealthResponse {
  status: string
  cuda_available: boolean
  gpu_count: number
  gpu_name: string | null
  model_loaded: boolean
  model_path: string
}

export interface ModelParameter {
  type: string
  label: string
  required?: boolean
  default?: any
  min?: number
  max?: number
  step?: number
  placeholder?: string
  rows?: number
  help?: string
  collapsible?: boolean
  img2img_only?: boolean
  advanced?: boolean
  presets?: number[]
}

export interface ModelConfig {
  id: string
  name: string
  description: string
  available: boolean
  features: string[]
  parameters: Record<string, ModelParameter>
}

export interface ModelsConfigResponse {
  models: ModelConfig[]
  default_model: string
}

export const getModelsConfig = async (): Promise<ModelsConfigResponse> => {
  const response = await api.get<ModelsConfigResponse>('/api/models/config')
  return response.data
}

export const generateImages = async (modelId: string, data: GenerateRequest): Promise<ImageResponse> => {
  const endpoint = modelId === 'flux' ? '/api/flux/generate' : '/api/sdxl/generate'
  const response = await api.post<ImageResponse>(endpoint, data)
  return response.data
}

export const transformImage = async (
  modelId: string,
  data: TransformRequest,
  imageFile: File
): Promise<ImageResponse> => {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('prompt', data.prompt)
  
  // Model-specific parameters
  if (modelId === 'sdxl') {
    if (data.negative_prompt) formData.append('negative_prompt', data.negative_prompt)
    if (data.cfg_scale) formData.append('cfg_scale', data.cfg_scale.toString())
  } else if (modelId === 'flux') {
    if (data.guidance) formData.append('guidance', data.guidance.toString())
    if (data.cfg_scale) formData.append('cfg_scale', data.cfg_scale.toString())
    if (data.negative_prompt) formData.append('negative_prompt', data.negative_prompt)
    if (data.tiled !== undefined) formData.append('tiled', data.tiled.toString())
  }
  
  // Common parameters
  if (data.width) formData.append('width', data.width.toString())
  if (data.height) formData.append('height', data.height.toString())
  if (data.num_images) formData.append('num_images', data.num_images.toString())
  if (data.steps) formData.append('steps', data.steps.toString())
  if (data.denoising_strength) formData.append('denoising_strength', data.denoising_strength.toString())
  if (data.seed) formData.append('seed', data.seed.toString())

  const endpoint = modelId === 'flux' ? '/api/flux/transform' : '/api/sdxl/transform'
  const response = await api.post<ImageResponse>(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/api/health')
  return response.data
}
