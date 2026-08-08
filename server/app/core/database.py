"""数据库引擎与会话 - SQLAlchemy async。

开发用 aiosqlite，生产切 asyncpg 仅需改 DATABASE_URL。
建表用 create_all（MVP），后续切片引入 alembic 迁移。
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖：提供数据库会话。"""
    async with async_session() as session:
        yield session


async def init_db() -> None:
    """启动时建表（MVP）。后续切片改用 alembic 迁移。"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
