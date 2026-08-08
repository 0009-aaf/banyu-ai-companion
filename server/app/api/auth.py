"""注册/登录路由。

错误信息统一化：不泄漏是账号还是密码错误（防枚举）。
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import TokenOut, UserLogin, UserOut, UserRegister
from app.services.character.default import seed_default_character

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)) -> TokenOut:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "邮箱已注册")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        nickname=payload.nickname,
    )
    db.add(user)
    # 用户 + 默认角色同事务提交（失败回滚，避免孤儿账号）
    try:
        await db.flush()  # 让 user 获得 id
        await seed_default_character(db, user.id)
        await db.commit()
    except Exception:
        await db.rollback()
        logger.exception("注册失败 email=%s", payload.email)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "注册失败，请重试")
    await db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenOut:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    # 统一错误：不区分账号/密码错误，防邮箱枚举
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "账号或密码错误")
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(current: User = Depends(get_current_user)) -> User:
    return current
