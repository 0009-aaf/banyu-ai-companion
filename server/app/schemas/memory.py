"""记忆 Pydantic schema。"""

from datetime import datetime

from pydantic import BaseModel


class MemoryOut(BaseModel):
    id: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
