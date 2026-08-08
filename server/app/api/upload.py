"""文件上传 API - 图片上传 + 静态文件服务。

Protected Region: 文件处理逻辑。
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = Path("uploads/avatars")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB
EXT_MAP = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    current: User = Depends(get_current_user),
) -> dict:
    """上传图片，返回可访问的 URL。"""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "请上传 JPG/PNG/WebP 格式")
    content = await file.read()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "图片文件为空")
    if len(content) > MAX_SIZE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "图片大小不能超过 5MB")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = EXT_MAP[file.content_type]
    filename = f"{uuid.uuid4().hex}.{ext}"
    (UPLOAD_DIR / filename).write_bytes(content)
    return {"url": f"/uploads/avatars/{filename}"}
