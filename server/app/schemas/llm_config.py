"""LLM 配置 Pydantic schema。"""

from pydantic import BaseModel, Field


class KeySet(BaseModel):
    provider: str = Field(min_length=1, max_length=32)
    api_key: str = Field(min_length=1, max_length=256)


class ProviderOut(BaseModel):
    provider: str
    has_key: bool


class ModelsOut(BaseModel):
    provider: str
    models: list[str]
