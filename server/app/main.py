"""FastAPI 入口 - 挂载路由 + CORS + 启动建表。

后续切片在此追加 include_router（characters / chat / llm_config 等）。
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, characters, chat, diary, llm_config, memory, push, upload, voice
from app.core.config import settings
from app.core.database import init_db
from app.scheduler import shutdown_scheduler, start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(title="伴语 Banyu API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由挂载（后续切片追加）
app.include_router(auth.router, prefix="/api")
app.include_router(characters.router, prefix="/api")
app.include_router(llm_config.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(push.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(diary.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(voice.router, prefix="/api")

# 静态文件服务（上传的图片/语音）
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
