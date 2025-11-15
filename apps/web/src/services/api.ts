import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  seed?: number
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

export const generateImages = async (data: GenerateRequest): Promise<ImageResponse> => {
  const response = await api.post<ImageResponse>('/api/sdxl/generate', data)
  return response.data
}

export const transformImage = async (
  data: TransformRequest,
  imageFile: File
): Promise<ImageResponse> => {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('prompt', data.prompt)
  if (data.negative_prompt) formData.append('negative_prompt', data.negative_prompt)
  if (data.width) formData.append('width', data.width.toString())
  if (data.height) formData.append('height', data.height.toString())
  if (data.num_images) formData.append('num_images', data.num_images.toString())
  if (data.steps) formData.append('steps', data.steps.toString())
  if (data.cfg_scale) formData.append('cfg_scale', data.cfg_scale.toString())
  if (data.denoising_strength) formData.append('denoising_strength', data.denoising_strength.toString())
  if (data.seed) formData.append('seed', data.seed.toString())

  const response = await api.post<ImageResponse>('/api/sdxl/transform', formData, {
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
