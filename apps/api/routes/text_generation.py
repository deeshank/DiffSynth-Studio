"""
Text generation endpoints using LLM
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import torch
import os

router = APIRouter()

# Global model cache
_model_cache = {}

class Message(BaseModel):
    """Chat message"""
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")

class TextGenerateRequest(BaseModel):
    """Request model for text generation"""
    prompt: str = Field(..., description="Text prompt")
    max_length: int = Field(default=512, ge=50, le=2048, description="Maximum length of generated text")
    temperature: float = Field(default=0.7, ge=0.1, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.9, ge=0.1, le=1.0, description="Nucleus sampling probability")
    top_k: int = Field(default=50, ge=1, le=100, description="Top-k sampling")
    repetition_penalty: float = Field(default=1.1, ge=1.0, le=2.0, description="Repetition penalty")

class ChatRequest(BaseModel):
    """Request model for chat"""
    messages: List[Message] = Field(..., description="Conversation history")
    max_length: int = Field(default=512, ge=50, le=2048)
    temperature: float = Field(default=0.7, ge=0.1, le=2.0)
    top_p: float = Field(default=0.9, ge=0.1, le=1.0)
    top_k: int = Field(default=50, ge=1, le=100)
    repetition_penalty: float = Field(default=1.1, ge=1.0, le=2.0)

class TextResponse(BaseModel):
    """Response model for text generation"""
    text: str = Field(..., description="Generated text")
    prompt: str = Field(..., description="Original prompt")

class ChatResponse(BaseModel):
    """Response model for chat"""
    message: Message = Field(..., description="Assistant's response")
    messages: List[Message] = Field(..., description="Full conversation history")

def get_text_model():
    """Get or create text generation model (cached)"""
    if "text_model" not in _model_cache:
        try:
            from llama_cpp import Llama
            
            model_path = "models/text_generation/MistralRP-NSFW/mistralrp-noromaid-nsfw-mistral-7b.Q4_K_M.gguf"
            
            # Check if model exists
            if not os.path.exists(model_path):
                raise HTTPException(
                    status_code=404, 
                    detail="Text generation model not found. Please download it first using download_models.py"
                )
            
            print(f"Loading text generation model from {model_path}...")
            
            # Load GGUF model with llama-cpp-python
            model = Llama(
                model_path=model_path,
                n_ctx=4096,  # Context window
                n_gpu_layers=-1,  # Offload all layers to GPU
                n_threads=8,
                verbose=False
            )
            
            _model_cache["text_model"] = model
            
            print("Text generation model loaded successfully")
            
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="llama-cpp-python not installed. Install with: pip install llama-cpp-python"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")
    
    return _model_cache["text_model"]

@router.post("/generate", response_model=TextResponse)
async def generate_text(request: TextGenerateRequest):
    """
    Generate text from a prompt
    """
    try:
        model = get_text_model()
        
        # Generate using llama-cpp-python
        output = model(
            request.prompt,
            max_tokens=request.max_length,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k,
            repeat_penalty=request.repetition_penalty,
            stop=["User:", "\n\n\n"],
            echo=False
        )
        
        generated_text = output['choices'][0]['text'].strip()
        
        return TextResponse(
            text=generated_text,
            prompt=request.prompt
        )
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error during text generation: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat-style conversation with message history
    """
    try:
        model = get_text_model()
        
        # Build conversation prompt
        conversation = ""
        for msg in request.messages:
            if msg.role == "user":
                conversation += f"User: {msg.content}\n"
            elif msg.role == "assistant":
                conversation += f"Assistant: {msg.content}\n"
        
        conversation += "Assistant:"
        
        # Generate using llama-cpp-python
        output = model(
            conversation,
            max_tokens=request.max_length,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k,
            repeat_penalty=request.repetition_penalty,
            stop=["User:", "\n\n\n"],
            echo=False
        )
        
        assistant_response = output['choices'][0]['text'].strip()
        
        # Create response message
        response_message = Message(role="assistant", content=assistant_response)
        
        # Update conversation history
        updated_messages = request.messages + [response_message]
        
        return ChatResponse(
            message=response_message,
            messages=updated_messages
        )
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error during chat: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config")
async def get_text_config():
    """Get text generation configuration"""
    model_path = "models/text_generation/MistralRP-NSFW/mistralrp-noromaid-nsfw-mistral-7b.Q4_K_M.gguf"
    model_available = os.path.exists(model_path)
    
    return {
        "available": model_available,
        "model_name": "MistralRP-NSFW-7B",
        "model_path": model_path,
        "parameters": {
            "max_length": {
                "type": "number",
                "label": "Max Length",
                "min": 50,
                "max": 2048,
                "default": 512,
                "help": "Maximum length of generated text"
            },
            "temperature": {
                "type": "number",
                "label": "Temperature",
                "min": 0.1,
                "max": 2.0,
                "default": 0.7,
                "step": 0.1,
                "help": "Higher = more creative, Lower = more focused"
            },
            "top_p": {
                "type": "number",
                "label": "Top P",
                "min": 0.1,
                "max": 1.0,
                "default": 0.9,
                "step": 0.05,
                "help": "Nucleus sampling threshold"
            },
            "top_k": {
                "type": "number",
                "label": "Top K",
                "min": 1,
                "max": 100,
                "default": 50,
                "help": "Limits vocabulary to top K tokens"
            },
            "repetition_penalty": {
                "type": "number",
                "label": "Repetition Penalty",
                "min": 1.0,
                "max": 2.0,
                "default": 1.1,
                "step": 0.1,
                "help": "Penalizes repeated tokens"
            }
        }
    }
