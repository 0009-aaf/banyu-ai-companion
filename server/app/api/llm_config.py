"""LLM key 配置 + /models 路由。

key 加密存储，/models 解密后调 provider 拉取可用模型。
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import decrypt, encrypt
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.llm_key import LlmKey
from app.models.user import User
from app.schemas.llm_config import KeySet, ModelsOut, ProviderOut
from app.services.llm.registry import available_providers, list_available_models

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/providers", response_model=list[ProviderOut])
async def list_providers(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProviderOut]:
    result = await db.execute(select(LlmKey).where(LlmKey.user_id == current.id))
    keys = {k.provider for k in result.scalars().all()}
    return [ProviderOut(provider=p, has_key=p in keys) for p in available_providers()]


@router.put("/keys", response_model=ProviderOut)
async def set_key(
    payload: KeySet,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProviderOut:
    result = await db.execute(
        select(LlmKey).where(LlmKey.user_id == current.id, LlmKey.provider == payload.provider)
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        existing.api_key_encrypted = encrypt(payload.api_key)
    else:
        db.add(
            LlmKey(
                user_id=current.id,
                provider=payload.provider,
                api_key_encrypted=encrypt(payload.api_key),
            )
        )
    await db.commit()
    return ProviderOut(provider=payload.provider, has_key=True)


@router.get("/models/{provider}", response_model=ModelsOut)
async def get_models(
    provider: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ModelsOut:
    result = await db.execute(
        select(LlmKey).where(LlmKey.user_id == current.id, LlmKey.provider == provider)
    )
    key_row = result.scalar_one_or_none()
    if key_row is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "请先配置该 provider 的 API key")
    api_key = decrypt(key_row.api_key_encrypted)
    if not api_key:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "key 解密失败")
    try:
        models = await list_available_models(provider, api_key)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            f"key 无效或请求失败 ({e.response.status_code})",
        )
    except httpx.HTTPError:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "网络请求失败，请检查网络")
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return ModelsOut(provider=provider, models=models)
