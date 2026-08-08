"""声音克隆 API - 上传语音样本触发克隆 + 查询克隆状态。

Protected Region: 声音克隆文件处理逻辑。
TODO(015): 接入火山引擎声音克隆 API，将 voice_status 推进到 ready/failed。
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.characters import _get_owned
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/voice", tags=["voice"])

VOICE_DIR = Path("uploads/voices")
ALLOWED_TYPES = {"audio/wav", "audio/mpeg", "audio/mp3"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB
EXT_MAP = {"audio/wav": "wav", "audio/mpeg": "mp3", "audio/mp3": "mp3"}


@router.post("/clone/{character_id}")
async def clone_voice(
    character_id: str,
    file: UploadFile = File(...),
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """上传语音样本并触发声音克隆，返回克隆状态与 voice_id。"""
    character = await _get_owned(db, character_id, current.id)

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "请上传 WAV/MP3 格式的语音")
    content = await file.read()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "语音文件为空")
    if len(content) > MAX_SIZE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "语音文件大小不能超过 10MB")

    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    ext = EXT_MAP.get(file.content_type, "wav")
    filename = f"{character_id}-{uuid.uuid4().hex}.{ext}"
    (VOICE_DIR / filename).write_bytes(content)

    if settings.VOLC_TTS_TOKEN:
        # TODO(015): 调用火山引擎声音克隆 API，成功后写入 voice_id 并置 ready/failed
        character.voice_status = "training"
    else:
        # 降级：无火山 key，使用浏览器 TTS
        character.voice_status = "none"
    await db.commit()

    return {"voice_status": character.voice_status, "voice_id": character.voice_id}


@router.get("/status/{character_id}")
async def get_voice_status(
    character_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """查询指定角色的声音克隆状态。"""
    character = await _get_owned(db, character_id, current.id)
    return {"voice_status": character.voice_status, "voice_id": character.voice_id}
