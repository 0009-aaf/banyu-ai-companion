"""TTS API - 文字转语音端点。

POST /api/tts        接收 {text, voice}，返回 MP3 音频流
GET  /api/tts/voices 返回可用语音包列表
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.models.user import User
from app.services.tts.edge_tts_service import (
    DEFAULT_VOICE,
    VOICE_OPTIONS,
    synthesize_stream,
)

router = APIRouter(prefix="/tts", tags=["tts"])


class TtsRequest(BaseModel):
    text: str
    voice: str = DEFAULT_VOICE


@router.get("/voices")
async def list_voices(
    current: User = Depends(get_current_user),
) -> dict:
    """返回可用语音包列表。"""
    return {"voices": VOICE_OPTIONS, "default": DEFAULT_VOICE}


@router.post("/synthesize")
async def synthesize(
    payload: TtsRequest,
    current: User = Depends(get_current_user),
) -> StreamingResponse:
    """将文字合成为 MP3 音频流。"""
    return StreamingResponse(
        synthesize_stream(payload.text, payload.voice),
        media_type="audio/mpeg",
    )
