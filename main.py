import os
import time
from collections import defaultdict, deque
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from config.voices import VOICES
from services.auth import verify_student
from services.text_to_speech import TextToSpeechError, synthesize

MAX_REQUESTS_PER_MINUTE = 40

app = FastAPI(title="Mario Grammar API")

origins = [item.strip() for item in os.getenv("ALLOWED_ORIGINS", "http://localhost:5500").split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

recent_requests: dict[str, deque] = defaultdict(deque)


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1800)
    voice: str = "mario"


def enforce_rate_limit(student_id: str) -> None:
    now = time.monotonic()
    window = recent_requests[student_id]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Too many requests. Wait a moment and try again.")
    window.append(now)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/tts")
def text_to_speech(body: SpeechRequest, authorization: str | None = Header(default=None)):
    student_id = verify_student(authorization)
    enforce_rate_limit(student_id)
    if body.voice not in VOICES:
        raise HTTPException(status_code=400, detail="Unknown voice.")
    try:
        audio = synthesize(body.text, body.voice)
    except TextToSpeechError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=86400"})
