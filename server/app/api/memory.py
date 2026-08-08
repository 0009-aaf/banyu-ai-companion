"""记忆查看/删除路由。"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.database import get_db
from app.models.memory import Memory
from app.models.user import User
from app.schemas.memory import MemoryOut

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("", response_model=list[MemoryOut])
async def list_memories(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Memory]:
    """查看当前用户的所有记忆。"""
    result = await db.execute(
        select(Memory).where(Memory.user_id == current.id).order_by(Memory.created_at.desc())
    )
    return list(result.scalars().all())


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """删除单条记忆。"""
    result = await db.execute(
        select(Memory).where(Memory.id == memory_id, Memory.user_id == current.id)
    )
    mem = result.scalar_one_or_none()
    if mem is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "记忆不存在")
    await db.delete(mem)
    await db.commit()
