"""应用配置 - 通过环境变量 / .env 注入。"""

import logging
import os

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_DEFAULT = "change-me-in-production"

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 数据库：开发用 SQLite，生产/记忆切片改 postgresql+asyncpg
    DATABASE_URL: str = "sqlite+aiosqlite:///./banyu.db"

    # JWT
    JWT_SECRET: str = _INSECURE_DEFAULT
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 天

    # 跨域
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # API key 加密主密钥（002 切片用）
    ENCRYPT_KEY: str = _INSECURE_DEFAULT

    # Web Push VAPID（006 切片用）
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""  # PEM 格式，.env 中 \n 转义

    # 火山引擎 TTS（015 声音克隆用，非 ARK LLM key）
    VOLC_TTS_TOKEN: str = ""

    @field_validator("VAPID_PRIVATE_KEY")
    @classmethod
    def decode_pem(cls, v: str) -> str:
        """将 .env 中的 \\n 转为实际换行。"""
        return v.replace("\\n", "\n") if v else v

    @field_validator("JWT_SECRET", "ENCRYPT_KEY")
    @classmethod
    def check_insecure_default(cls, v: str) -> str:
        """生产环境禁止使用默认密钥（防 JWT 伪造 + API key 解密泄露）。"""
        if v == _INSECURE_DEFAULT:
            if os.getenv("ENV") == "production":
                raise ValueError("生产环境必须通过环境变量设置 JWT_SECRET / ENCRYPT_KEY")
            logger.warning("JWT_SECRET/ENCRYPT_KEY 使用默认值，仅限开发！生产请配置环境变量。")
        return v


settings = Settings()
