"""应用配置 - 通过环境变量 / .env 注入。"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 数据库：开发用 SQLite，生产/记忆切片改 postgresql+asyncpg
    DATABASE_URL: str = "sqlite+aiosqlite:///./banyu.db"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 天

    # 跨域
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # API key 加密主密钥（002 切片用）
    ENCRYPT_KEY: str = "change-me-in-production"

    # Web Push VAPID（006 切片用）
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""  # PEM 格式，.env 中 \n 转义

    @field_validator("VAPID_PRIVATE_KEY")
    @classmethod
    def decode_pem(cls, v: str) -> str:
        """将 .env 中的 \\n 转为实际换行。"""
        return v.replace("\\n", "\n") if v else v


settings = Settings()
