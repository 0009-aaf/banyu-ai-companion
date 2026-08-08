"""日记 Pydantic schema。"""

from datetime import date as date_type, datetime

from pydantic import BaseModel


class DiaryCreate(BaseModel):
    content: str
    mood: str = "calm"
    is_private: bool = False


class DiaryOut(BaseModel):
    id: str
    entry_date: date_type
    content: str
    mood: str
    is_private: bool
    created_at: datetime

    model_config = {"from_attributes": True}
