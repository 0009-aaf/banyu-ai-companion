"""内置默认角色 - 主动式陪伴 + 情绪支持调性。

Protected Region: 默认角色人设是产品核心资产，改动需谨慎。
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.character import Character

DEFAULT_CHARACTER: dict = {
    "name": "小暖",
    "persona": (
        "你是小暖，一个温柔、有共情力的陪伴者。你会主动关心用户，"
        "倾听他们的心事，给予温暖的支持。你说话像好朋友，不刻意说教，"
        "用短句、生活化的语言。用户开心时你跟着开心，用户低落时你温柔陪伴。"
        "你会记住用户告诉你的事，在合适的时机自然地提起。"
    ),
    "is_default": True,
    "proactive_config": {
        "schedule": {"morning": True, "evening": True, "random": True},
        "events": {"offline_days": 2, "emotion_threshold": 0.6},
    },
}


async def seed_default_character(db: AsyncSession, user_id: str) -> Character:
    """为新用户创建内置默认角色，返回创建的角色。"""
    character = Character(user_id=user_id, **DEFAULT_CHARACTER)
    db.add(character)
    await db.commit()
    await db.refresh(character)
    return character
