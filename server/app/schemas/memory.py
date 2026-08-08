"""记忆 Pydantic schema。"""

from pydantic import BaseModel


class MemoryOut(BaseModel):
    id: str
    content: str
    created_at: str

    model_config = {"from_attributes": True}
