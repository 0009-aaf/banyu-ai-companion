"""日记 CRUD 路由 - 创建/查看/删除。"""

from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session, get_db
from app.core.deps import get_current_user
from app.models.diary import Diary
from app.models.user import User
from app.schemas.diary import DiaryCreate, DiaryOut

router = APIRouter(prefix="/diary", tags=["diary"])
MAX_CONTENT = 1000


@router.get("", response_model=list[DiaryOut])
async def list_diaries(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Diary]:
    result = await db.execute(
        select(Diary).where(Diary.user_id == current.id).order_by(Diary.entry_date.desc())
    )
    return list(result.scalars().all())


@router.get("/today", response_model=DiaryOut | None)
async def get_today_diary(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Diary | None:
    today = date_type.today()
    result = await db.execute(
        select(Diary).where(Diary.user_id == current.id, Diary.entry_date == today)
    )
    return result.scalar_one_or_none()


@router.post("", response_model=DiaryOut, status_code=status.HTTP_201_CREATED)
async def create_or_update_diary(
    payload: DiaryCreate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Diary:
    if len(payload.content) > MAX_CONTENT:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"日记不能超过{MAX_CONTENT}字")
    today = date_type.today()
    result = await db.execute(
        select(Diary).where(Diary.user_id == current.id, Diary.entry_date == today)
    )
    diary = result.scalar_one_or_none()
    if diary is None:
        diary = Diary(
            user_id=current.id,
            entry_date=today,
            content=payload.content,
            mood=payload.mood,
            is_private=payload.is_private,
        )
        db.add(diary)
    else:
        diary.content = payload.content
        diary.mood = payload.mood
        diary.is_private = payload.is_private
    await db.commit()
    await db.refresh(diary)
    # 非私密日记提取记忆（有 LLM key 时）
    if not payload.is_private:
        try:
            from app.models.llm_key import LlmKey
            from app.models.memory import Memory as MemoryModel
            from app.services.memory.extract import embedding_to_json, extract_memory

            kr = await db.execute(select(LlmKey).where(LlmKey.user_id == current.id))
            key_row = kr.scalars().first()
            if key_row is not None:
                mr = await extract_memory(payload.content, key_row)
                if mr:
                    mc, me = mr
                    async with async_session() as ms:
                        ms.add(
                            MemoryModel(
                                user_id=current.id,
                                conversation_id=None,
                                content=mc,
                                embedding=embedding_to_json(me),
                            )
                        )
                        await ms.commit()
        except Exception:
            pass
    return diary


@router.get("/{entry_date}", response_model=DiaryOut)
async def get_diary_by_date(
    entry_date: date_type,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Diary:
    result = await db.execute(
        select(Diary).where(Diary.user_id == current.id, Diary.entry_date == entry_date)
    )
    diary = result.scalar_one_or_none()
    if diary is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "该日期无日记")
    return diary


@router.delete("/{diary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diary(
    diary_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Diary).where(Diary.id == diary_id, Diary.user_id == current.id)
    )
    diary = result.scalar_one_or_none()
    if diary is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "日记不存在")
    await db.delete(diary)
    await db.commit()
