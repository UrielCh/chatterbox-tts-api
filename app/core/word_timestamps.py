"""
WhisperX-based word timestamp extraction for generated TTS audio.
"""

import gc
import logging
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch

from app.config import Config

logger = logging.getLogger(__name__)


class WordTimestampError(Exception):
    """Raised when word timestamp extraction fails."""


def _resolve_device() -> str:
    configured_device = Config.WHISPERX_DEVICE.lower()
    if configured_device != "auto":
        return configured_device

    if torch.cuda.is_available():
        return "cuda"

    # Faster-whisper/WhisperX do not use PyTorch MPS for inference.
    return "cpu"


def _resolve_compute_type(device: str) -> str:
    configured_compute_type = Config.WHISPERX_COMPUTE_TYPE.lower()
    if configured_compute_type != "auto":
        return configured_compute_type

    return "float16" if device == "cuda" else "int8"


def _cleanup_memory() -> None:
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


def _flatten_words(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    words: List[Dict[str, Any]] = []

    for segment_index, segment in enumerate(segments):
        for word in segment.get("words", []):
            item = {
                "word": word.get("word", "").strip(),
                "start": word.get("start"),
                "end": word.get("end"),
                "segment_index": segment_index,
            }

            if "score" in word:
                item["score"] = word["score"]

            words.append(item)

    return words


def extract_word_timestamps(
    audio_path: str | Path,
    language_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Transcribe and align generated audio with WhisperX, returning word timings.
    """
    try:
        import whisperx
    except ImportError as exc:
        raise WordTimestampError(
            "WhisperX is not installed. Install the project dependencies or run "
            "`pip install whisperx==3.3.1`."
        ) from exc

    device = _resolve_device()
    compute_type = _resolve_compute_type(device)
    audio_path = Path(audio_path)

    if not audio_path.exists():
        raise WordTimestampError(f"Audio file not found: {audio_path}")

    model = None
    align_model = None

    try:
        logger.info(
            "Extracting word timestamps with WhisperX model=%s device=%s compute_type=%s",
            Config.WHISPERX_MODEL,
            device,
            compute_type,
        )

        audio = whisperx.load_audio(str(audio_path))
        model = whisperx.load_model(
            Config.WHISPERX_MODEL,
            device,
            compute_type=compute_type,
        )

        transcribe_kwargs: Dict[str, Any] = {"batch_size": Config.WHISPERX_BATCH_SIZE}
        if language_hint:
            transcribe_kwargs["language"] = language_hint

        try:
            result = model.transcribe(audio, **transcribe_kwargs)
        except TypeError:
            transcribe_kwargs.pop("language", None)
            result = model.transcribe(audio, **transcribe_kwargs)

        language = result.get("language") or language_hint
        if not language:
            raise WordTimestampError("WhisperX did not detect an audio language")

        align_model, metadata = whisperx.load_align_model(
            language_code=language,
            device=device,
        )
        aligned = whisperx.align(
            result.get("segments", []),
            align_model,
            metadata,
            audio,
            device,
            return_char_alignments=False,
        )

        segments = aligned.get("segments", [])
        transcript = aligned.get("text") or " ".join(
            segment.get("text", "").strip() for segment in segments
        ).strip()

        return {
            "language": language,
            "transcript": transcript,
            "segments": segments,
            "words": _flatten_words(segments),
        }

    except WordTimestampError:
        raise
    except Exception as exc:
        raise WordTimestampError(f"WhisperX timestamp extraction failed: {exc}") from exc
    finally:
        if model is not None:
            del model
        if align_model is not None:
            del align_model
        _cleanup_memory()


def extract_word_timestamps_from_wav_bytes(
    wav_bytes: bytes,
    language_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """Write WAV bytes to a temporary file and extract word timings."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        tmp.write(wav_bytes)
        tmp.flush()
        return extract_word_timestamps(tmp.name, language_hint=language_hint)
