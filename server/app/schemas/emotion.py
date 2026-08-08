"""情绪 Pydantic schema。"""

from pydantic import BaseModel


class EmotionResult(BaseModel):
    emotion: str
    score: float
