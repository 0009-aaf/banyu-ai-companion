"""角色 Pydantic schema。"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class CharacterBase(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    persona: str = Field(min_length=1, max_length=2000)
    avatar_url: str | None = None
    voice_id: str | None = None
    voice_status: str = "none"
    voice_config: dict[str, Any] | None = None
    proactive_config: dict[str, Any] | None = None


class CharacterCreate(CharacterBase):
    pass


class CharacterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    persona: str | None = Field(default=None, min_length=1, max_length=2000)
    avatar_url: str | None = None
    voice_config: dict[str, Any] | None = None
    proactive_config: dict[str, Any] | None = None


class CharacterOut(CharacterBase):
    id: str
    user_id: str
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}
