"""角色 CRUD 路由。

- 上限 20 个角色
- 默认角色不可删除
- 只能操作自己名下的角色
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.character import Character
from app.models.user import User
from app.schemas.character import CharacterCreate, CharacterOut, CharacterUpdate

router = APIRouter(prefix="/characters", tags=["characters"])

MAX_CHARACTERS = 20


@router.get("", response_model=list[CharacterOut])
async def list_characters(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Character]:
    result = await db.execute(
        select(Character).where(Character.user_id == current.id).order_by(Character.created_at)
    )
    return list(result.scalars().all())


@router.post("", response_model=CharacterOut, status_code=status.HTTP_201_CREATED)
async def create_character(
    payload: CharacterCreate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Character:
    count_result = await db.execute(
        select(func.count()).select_from(Character).where(Character.user_id == current.id)
    )
    if (count_result.scalar_one() or 0) >= MAX_CHARACTERS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "角色数量已达上限")
    character = Character(user_id=current.id, **payload.model_dump())
    db.add(character)
    await db.commit()
    await db.refresh(character)
    return character


@router.get("/{character_id}", response_model=CharacterOut)
async def get_character(
    character_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Character:
    return await _get_owned(db, character_id, current.id)


@router.put("/{character_id}", response_model=CharacterOut)
async def update_character(
    character_id: str,
    payload: CharacterUpdate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Character:
    character = await _get_owned(db, character_id, current.id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(character, key, value)
    await db.commit()
    await db.refresh(character)
    return character


@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    character_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    character = await _get_owned(db, character_id, current.id)
    if character.is_default:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "默认角色不可删除")
    await db.delete(character)
    await db.commit()


async def _get_owned(db: AsyncSession, character_id: str, user_id: str) -> Character:
    """获取属于该用户的角色，不存在或越权访问均返回 404。"""
    result = await db.execute(
        select(Character).where(Character.id == character_id, Character.user_id == user_id)
    )
    character = result.scalar_one_or_none()
    if character is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "角色不存在")
    return character
