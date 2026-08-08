"""情绪触发逻辑 - 阈值判断 + 去重。

Protected Region: 触发逻辑（阈值 + 去重）。
"""

from sqlalchemy import func, select

from app.core.database import async_session
from app.models.character import Character
from app.models.conversation import Message
from app.models.emotion_log import EmotionLog
from app.models.llm_key import LlmKey
from app.services.proactive.generator import generate_proactive_message, get_fallback

TRIGGER_THRESHOLD = 0.6


async def should_trigger(
    conversation_id: str,
    emotion: str,
    score: float,
) -> bool:
    """判断是否应该触发主动关心。"""
    if emotion != "negative" or score < TRIGGER_THRESHOLD:
        return False

    # 去重：同会话已有触发记录
    async with async_session() as db:
        result = await db.execute(
            select(func.count())
            .select_from(EmotionLog)
            .where(
                EmotionLog.conversation_id == conversation_id,
                EmotionLog.triggered == True,  # noqa: E712
            )
        )
        count = result.scalar() or 0
    return count == 0


async def trigger_care_message(
    user_id: str,
    conversation_id: str,
    character: Character,
    llm_key: LlmKey | None,
) -> str | None:
    """触发主动关心消息，存入对话。返回消息内容或 None。"""
    if llm_key is not None:
        content = await generate_proactive_message(character, "random", llm_key)
    else:
        content = get_fallback("random")

    content = "感觉你今天心情不太好，" + content

    async with async_session() as db:
        db.add(Message(conversation_id=conversation_id, role="proactive", content=content))
        db.add(
            EmotionLog(
                user_id=user_id,
                conversation_id=conversation_id,
                emotion="negative",
                score=TRIGGER_THRESHOLD,
                triggered=True,
            )
        )
        await db.commit()

    return content
