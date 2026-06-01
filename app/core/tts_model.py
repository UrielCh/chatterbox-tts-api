"""
TTS model initialization and management
"""

import os
import asyncio
from enum import Enum
from typing import Optional, Dict, Any

# Register safe globals for PyTorch 2.6+ to support OmegaConf models like WhisperX
try:
    import torch
    if hasattr(torch, "serialization") and hasattr(torch.serialization, "add_safe_globals"):
        try:
            from omegaconf.listconfig import ListConfig
            torch.serialization.add_safe_globals([ListConfig])
        except ImportError:
            pass
        try:
            from omegaconf.dictconfig import DictConfig
            torch.serialization.add_safe_globals([DictConfig])
        except ImportError:
            pass
        try:
            from omegaconf.nodes import AnyNode
            torch.serialization.add_safe_globals([AnyNode])
        except ImportError:
            pass
        try:
            from omegaconf.base import ContainerMetadata
            torch.serialization.add_safe_globals([ContainerMetadata])
        except ImportError:
            pass
except Exception:
    pass

# Patch torch.load globally at import time so third party imports also get the patched version
try:
    import torch
    if not hasattr(torch, "_original_load_patched"):
        original_load = torch.load
        torch._original_load_patched = original_load
        
        def robust_torch_load(f, map_location=None, **kwargs):
            print(f"[DEBUG PATCH] robust_torch_load called for: {f}, kwargs: {kwargs}", flush=True)
            # Check dynamically if we should force CPU mapping
            force_cpu = False
            try:
                from app.core.tts_model import get_device
                from app.config import detect_device
                dev = get_device() or detect_device()
                force_cpu = dev in ('cpu', 'mps') or not torch.cuda.is_available()
            except Exception:
                pass
            
            target_map = 'cpu' if force_cpu else map_location
            
            # Try to load using the passed kwargs
            try:
                if "weights_only" not in kwargs:
                    return original_load(f, map_location=target_map, weights_only=True, **kwargs)
                return original_load(f, map_location=target_map, **kwargs)
            except Exception as e:
                # Fallback to weights_only=False if not explicitly False
                if kwargs.get("weights_only") is not False:
                    print(f"[DEBUG PATCH] Falling back to weights_only=False for {f}", flush=True)
                    # Reset the file stream if it has been partially read
                    try:
                        if hasattr(f, "seek"):
                            f.seek(0)
                    except Exception as seek_err:
                        print(f"[DEBUG PATCH] Failed to seek(0) on file object: {seek_err}", flush=True)
                    
                    new_kwargs = kwargs.copy()
                    new_kwargs["weights_only"] = False
                    return original_load(f, map_location=target_map, **new_kwargs)
                raise e
                
        torch.load = robust_torch_load
        try:
            import torch.serialization
            torch.serialization.load = robust_torch_load
        except Exception:
            pass
except Exception:
    pass

from chatterbox.tts import ChatterboxTTS
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from app.core.mtl import SUPPORTED_LANGUAGES
from app.config import Config, detect_device

# Global model instance
_model = None
_device = None
_initialization_state = "not_started"
_initialization_error = None
_initialization_progress = ""
_is_multilingual = None
_supported_languages = {}


class InitializationState(Enum):
    NOT_STARTED = "not_started"
    INITIALIZING = "initializing"
    READY = "ready"
    ERROR = "error"


async def initialize_model():
    """Initialize the Chatterbox TTS model"""
    global _model, _device, _initialization_state, _initialization_error, _initialization_progress, _is_multilingual, _supported_languages
    
    try:
        _initialization_state = InitializationState.INITIALIZING.value
        _initialization_progress = "Validating configuration..."
        
        Config.validate()
        _device = detect_device()
        
        print(f"Initializing Chatterbox TTS model...")
        print(f"Device: {_device}")
        print(f"Voice sample: {Config.VOICE_SAMPLE_PATH}")
        print(f"Model cache: {Config.MODEL_CACHE_DIR}")
        
        _initialization_progress = "Creating model cache directory..."
        # Ensure model cache directory exists
        os.makedirs(Config.MODEL_CACHE_DIR, exist_ok=True)
        
        _initialization_progress = "Checking voice sample..."
        # Check voice sample exists
        if not os.path.exists(Config.VOICE_SAMPLE_PATH):
            raise FileNotFoundError(f"Voice sample not found: {Config.VOICE_SAMPLE_PATH}")
        
        _initialization_progress = "Configuring device compatibility..."
        # Safetensors device mapping
        try:
            import safetensors.torch
            original_load_file = safetensors.torch.load_file
            force_cpu = _device in ('cpu', 'mps') or not torch.cuda.is_available()
            if force_cpu:
                def force_cpu_load_file(filename, device=None):
                    return original_load_file(filename, device='cpu')
                safetensors.torch.load_file = force_cpu_load_file
        except ImportError:
            pass
        
        # Determine if we should use multilingual model
        use_multilingual = Config.USE_MULTILINGUAL_MODEL
        
        _initialization_progress = "Loading TTS model (this may take a while)..."
        # Initialize model with run_in_executor for non-blocking
        loop = asyncio.get_event_loop()
        
        if use_multilingual:
            print(f"Loading Chatterbox Multilingual TTS model...")
            _model = await loop.run_in_executor(
                None, 
                lambda: ChatterboxMultilingualTTS.from_pretrained(device=_device)
            )
            _is_multilingual = True
            _supported_languages = SUPPORTED_LANGUAGES.copy()
            print(f"✓ Multilingual model initialized with {len(_supported_languages)} languages")
        else:
            print(f"Loading standard Chatterbox TTS model...")
            _model = await loop.run_in_executor(
                None, 
                lambda: ChatterboxTTS.from_pretrained(device=_device)
            )
            _is_multilingual = False
            _supported_languages = {"en": "English"}  # Standard model only supports English
            print(f"✓ Standard model initialized (English only)")
        
        _initialization_state = InitializationState.READY.value
        _initialization_progress = "Model ready"
        _initialization_error = None
        print(f"✓ Model initialized successfully on {_device}")
        return _model
        
    except Exception as e:
        _initialization_state = InitializationState.ERROR.value
        _initialization_error = str(e)
        _initialization_progress = f"Failed: {str(e)}"
        print(f"✗ Failed to initialize model: {e}")
        raise e


def get_model():
    """Get the current model instance"""
    return _model


def get_device():
    """Get the current device"""
    return _device


def get_initialization_state():
    """Get the current initialization state"""
    return _initialization_state


def get_initialization_progress():
    """Get the current initialization progress message"""
    return _initialization_progress


def get_initialization_error():
    """Get the initialization error if any"""
    return _initialization_error


def is_ready():
    """Check if the model is ready for use"""
    return _initialization_state == InitializationState.READY.value and _model is not None


def is_initializing():
    """Check if the model is currently initializing"""
    return _initialization_state == InitializationState.INITIALIZING.value 


def is_multilingual():
    """Check if the loaded model supports multilingual generation"""
    return _is_multilingual


def get_supported_languages():
    """Get the dictionary of supported languages"""
    return _supported_languages.copy()


def supports_language(language_id: str):
    """Check if the model supports a specific language"""
    return language_id in _supported_languages


def get_model_info() -> Dict[str, Any]:
    """Get comprehensive model information"""
    return {
        "model_type": "multilingual" if _is_multilingual else "standard",
        "is_multilingual": _is_multilingual,
        "supported_languages": _supported_languages,
        "language_count": len(_supported_languages),
        "device": _device,
        "is_ready": is_ready(),
        "initialization_state": _initialization_state
    }