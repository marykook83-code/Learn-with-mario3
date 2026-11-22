import hashlib
import os
import re
from pathlib import Path

from config.voices import MODEL_NAME, VOICES

ARABIC_PATTERN = re.compile(r"[\u0600-\u06FF]")
CACHE_DIR = Path(os.getenv("TTS_CACHE_DIR", Path(__file__).resolve().parent.parent / "cache"))

_client = None


class TextToSpeechError(Exception):
    pass


def _get_client():
    global _client
    if _client is None:
        from google.cloud import texttospeech

        _client = texttospeech.TextToSpeechClient()
    return _client


def synthesize(text: str, voice_key: str) -> bytes:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        raise TextToSpeechError("There is no text to read.")

    voice = VOICES[voice_key]
    language = "ar-EG" if ARABIC_PATTERN.search(normalized) else "en-US"
    cache_key = hashlib.sha256(
        f"{MODEL_NAME}|{voice['voice_name']}|{language}|{voice['prompt']}|{normalized}".encode("utf-8")
    ).hexdigest()
    cache_file = CACHE_DIR / f"{cache_key}.mp3"
    if cache_file.exists():
        return cache_file.read_bytes()

    try:
        from google.cloud import texttospeech

        response = _get_client().synthesize_speech(
            input=texttospeech.SynthesisInput(text=normalized, prompt=voice["prompt"]),
            voice=texttospeech.VoiceSelectionParams(
                language_code=language,
                name=voice["voice_name"],
                model_name=MODEL_NAME,
            ),
            audio_config=texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3),
        )
    except Exception as error:
        raise TextToSpeechError(f"Google Cloud could not create the audio: {error}") from error

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file.write_bytes(response.audio_content)
    return response.audio_content
