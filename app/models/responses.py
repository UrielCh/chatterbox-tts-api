"""
Response models for API validation
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response model"""
    
    status: str
    model_loaded: bool
    device: str
    config: Dict[str, Any]
    memory_info: Optional[Dict[str, float]] = None
    initialization_state: Optional[str] = None
    initialization_progress: Optional[str] = None
    initialization_error: Optional[str] = None


class ModelInfo(BaseModel):
    """Individual model information"""
    
    id: str
    object: str
    created: int
    owned_by: str


class ModelsResponse(BaseModel):
    """Models listing response"""
    
    object: str
    data: List[ModelInfo]


class ConfigResponse(BaseModel):
    """Configuration response model"""
    
    api_info: Dict[str, Any]
    server: Dict[str, Any]
    model: Dict[str, Any]
    defaults: Dict[str, Any]
    memory_management: Dict[str, Any]


class ErrorResponse(BaseModel):
    """Error response model"""
    
    error: Dict[str, str]


# SSE Response Models for OpenAI compatibility
class SSEUsageInfo(BaseModel):
    """Usage information for SSE completion event"""
    
    input_tokens: int
    output_tokens: int  
    total_tokens: int


class SSEAudioInfo(BaseModel):
    """SSE audio metadata event model"""
    
    type: str = "speech.audio.info"
    sample_rate: int
    channels: int
    bits_per_sample: int


class SSEAudioDelta(BaseModel):
    """SSE audio delta event model"""
    
    type: str = "speech.audio.delta"
    audio: str  # Base64 encoded audio chunk


class SSEAudioDone(BaseModel):
    """SSE audio completion event model"""
    
    type: str = "speech.audio.done"
    usage: SSEUsageInfo


class WordTimestamp(BaseModel):
    """Single aligned word timing returned by WhisperX"""

    word: str
    start: Optional[float] = None
    end: Optional[float] = None
    segment_index: int
    score: Optional[float] = None


class WordTimestampsInfo(BaseModel):
    """Generated audio word timing metadata"""

    language: str
    transcript: str
    words: List[WordTimestamp]
    segments: List[Dict[str, Any]]


class SSEWordTimestamps(BaseModel):
    """SSE word timestamp event model"""

    type: str = "speech.audio.word_timestamps"
    language: str
    transcript: str
    words: List[WordTimestamp]
    segments: List[Dict[str, Any]]


class TTSWithTimestampsResponse(BaseModel):
    """JSON response containing generated audio and word timings"""

    audio: str
    audio_format: str = "wav"
    sample_rate: int
    channels: int
    bits_per_sample: int
    duration_seconds: float
    word_timestamps: WordTimestampsInfo


class TTSProgressResponse(BaseModel):
    """TTS progress response model"""
    
    current_chunk: int
    total_chunks: int
    current_step: str
    progress_percentage: float
    estimated_completion: Optional[float] = None


class TTSStatusResponse(BaseModel):
    """TTS status response model"""
    
    status: str
    is_processing: bool
    request_id: Optional[str] = None
    start_time: Optional[float] = None
    duration_seconds: Optional[float] = None
    text_length: Optional[int] = None
    text_preview: Optional[str] = None
    voice_source: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    progress: Optional[TTSProgressResponse] = None
    error_message: Optional[str] = None
    memory_usage: Optional[Dict[str, float]] = None
    total_requests: int = 0
    message: Optional[str] = None


class TTSStatisticsResponse(BaseModel):
    """TTS statistics response model"""
    
    total_requests: int
    completed_requests: int
    error_requests: int
    success_rate: float
    average_duration_seconds: float
    average_text_length: float
    is_processing: bool


class APIInfoResponse(BaseModel):
    """API information response model"""
    
    api_name: str
    version: str
    status: str
    tts_status: TTSStatusResponse
    statistics: TTSStatisticsResponse
    memory_info: Optional[Dict[str, float]] = None
    recent_requests: Optional[List[Dict[str, Any]]] = None
    uptime_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class VoiceLibraryItem(BaseModel):
    """Voice library item response model"""
    
    name: str
    filename: str
    original_filename: str
    file_extension: str
    file_size: int
    upload_date: str
    path: str
    language: str = "en"
    aliases: List[str] = []
    exists: bool = True


class VoiceLibraryResponse(BaseModel):
    """Voice library listing response"""
    
    voices: List[VoiceLibraryItem]
    count: int


class SupportedLanguageItem(BaseModel):
    """Individual supported language information"""
    
    code: str
    name: str


class SupportedLanguagesResponse(BaseModel):
    """Supported languages response"""
    
    languages: List[SupportedLanguageItem]
    count: int
    model_type: str


class DefaultVoiceResponse(BaseModel):
    """Default voice information response"""
    
    default_voice: Optional[str]
    source: str
    voice_info: Optional[VoiceLibraryItem] = None
    path: Optional[str] = None
