"""对话 Pydantic schema。"""

from datetime import datetime

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    character_id: str


class ConversationOut(BaseModel):
    id: str
    character_id: str
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SendBody(BaseModel):
    """流式对话请求体。"""

    content: str = Field(min_length=1, max_length=4000)
    provider: str
    model: str
