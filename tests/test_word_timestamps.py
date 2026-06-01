import sys
import types
import wave

from app.core.word_timestamps import extract_word_timestamps


class FakeWhisperModel:
    def transcribe(self, audio, **kwargs):
        return {
            "language": kwargs.get("language") or "en",
            "segments": [{"text": "Hello world"}],
        }


def test_extract_word_timestamps_flattens_whisperx_words(monkeypatch, tmp_path):
    fake_whisperx = types.SimpleNamespace()
    fake_whisperx.load_audio = lambda path: [0.0]
    fake_whisperx.load_model = lambda model, device, compute_type: FakeWhisperModel()
    fake_whisperx.load_align_model = lambda language_code, device: ("align-model", {"language": language_code})

    def fake_align(segments, model, metadata, audio, device, return_char_alignments):
        return {
            "segments": [
                {
                    "text": "Hello world",
                    "words": [
                        {"word": "Hello", "start": 0.0, "end": 0.4, "score": 0.97},
                        {"word": "world", "start": 0.45, "end": 0.9},
                    ],
                }
            ]
        }

    fake_whisperx.align = fake_align
    monkeypatch.setitem(sys.modules, "whisperx", fake_whisperx)

    audio_path = tmp_path / "speech.wav"
    with wave.open(str(audio_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        wav_file.writeframes(b"\x00\x00" * 1600)

    result = extract_word_timestamps(audio_path, language_hint="en")

    assert result["language"] == "en"
    assert result["transcript"] == "Hello world"
    assert result["words"] == [
        {"word": "Hello", "start": 0.0, "end": 0.4, "segment_index": 0, "score": 0.97},
        {"word": "world", "start": 0.45, "end": 0.9, "segment_index": 0},
    ]
