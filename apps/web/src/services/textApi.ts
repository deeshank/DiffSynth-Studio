import { api } from './api'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface TextGenerateRequest {
  prompt: string
  max_length?: number
  temperature?: number
  top_p?: number
  top_k?: number
  repetition_penalty?: number
}

export interface ChatRequest {
  messages: Message[]
  max_length?: number
  temperature?: number
  top_p?: number
  top_k?: number
  repetition_penalty?: number
}

export interface TextResponse {
  text: string
  prompt: string
}

export interface ChatResponse {
  message: Message
  messages: Message[]
}

export interface TextConfig {
  available: boolean
  model_name: string
  model_path: string
  parameters: Record<string, any>
}

export const getTextConfig = async (): Promise<TextConfig> => {
  const response = await api.get<TextConfig>('/api/text/config')
  return response.data
}

export const generateText = async (data: TextGenerateRequest): Promise<TextResponse> => {
  const response = await api.post<TextResponse>('/api/text/generate', data)
  return response.data
}

export const chat = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/api/text/chat', data)
  return response.data
}
