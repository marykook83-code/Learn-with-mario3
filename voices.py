import os

MODEL_NAME = os.getenv("TTS_MODEL", "gemini-2.5-flash-tts")

VOICES = {
    "mario": {
        "voice_name": os.getenv("MARIO_VOICE", "Puck"),
        "prompt": (
            "Speak as a friendly, cheerful young cartoon fox who loves teaching. "
            "Warm, lively and youthful, with clear pronunciation, at a calm pace "
            "so students can follow. Pronounce English grammar words in a clear "
            "English accent and Arabic in natural Egyptian Arabic."
        ),
    },
    "student": {
        "voice_name": os.getenv("STUDENT_VOICE", "Leda"),
        "prompt": (
            "Speak as a curious, friendly teenager asking a teacher a question. "
            "Natural, clear and slightly softer than a teacher. Pronounce English "
            "words clearly and Arabic in natural Egyptian Arabic."
        ),
    },
}
