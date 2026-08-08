"""主动陪伴调度 - APScheduler 定时触发。

Protected Region: 调度逻辑（定时/事件触发）。
"""

from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import func, select

from app.core.database import async_session
from app.models.character import Character
from app.models.conversation import Conversation, Message
from app.models.llm_key import LlmKey
from app.models.push import PushSubscription
from app.services.proactive.generator import generate_proactive_message, get_fallback
from app.services.proactive.push import send_push

# 夜间时段不推送（23:00-7:00）
QUIET_HOURS_START = 23
QUIET_HOURS_END = 7

# 同日主动消息上限
DAILY_LIMIT = 3


def _is_quiet_hours() -> bool:
    """检查当前是否在夜间静默时段。"""
    hour = datetime.now().hour
    return hour >= QUIET_HOURS_START or hour < QUIET_HOURS_END


class ProactiveScheduler:
    """主动陪伴调度器 - 定时触发主动消息。"""

    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()

    def start(self) -> None:
        """注册定时任务并启动调度器。"""
        # 早安 8:00
        self.scheduler.add_job(
            self._morning_job,
            CronTrigger(hour=8, minute=0),
            id="morning_greeting",
            replace_existing=True,
        )
        # 晚安 22:00
        self.scheduler.add_job(
            self._evening_job,
            CronTrigger(hour=22, minute=0),
            id="evening_greeting",
            replace_existing=True,
        )
        # 随机问候 14:00
        self.scheduler.add_job(
            self._random_job,
            CronTrigger(hour=14, minute=0),
            id="random_greeting",
            replace_existing=True,
        )
        self.scheduler.start()

    def shutdown(self) -> None:
        """关闭调度器。"""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    async def _morning_job(self) -> None:
        await self._send_to_all("morning")

    async def _evening_job(self) -> None:
        await self._send_to_all("evening")

    async def _random_job(self) -> None:
        await self._send_to_all("random")

    async def _send_to_all(self, period: str) -> None:
        """对所有有订阅的用户发送主动消息。"""
        if _is_quiet_hours():
            return

        async with async_session() as db:
            sub_result = await db.execute(select(PushSubscription))
            subscriptions = list(sub_result.scalars().all())

            for sub in subscriptions:
                try:
                    await self._send_to_user(db, sub, period)
                except Exception:
                    # 单用户失败不影响其他用户（异常不吞，但不阻断）
                    continue

    async def _send_to_user(self, db, sub: PushSubscription, period: str) -> None:
        """为单个用户生成 + 推送主动消息。"""
        # 查用户默认角色
        char_result = await db.execute(
            select(Character).where(
                Character.user_id == sub.user_id,
                Character.is_default == True,  # noqa: E712
            )
        )
        character = char_result.scalar_one_or_none()
        if character is None:
            return

        # 查或创建会话
        conv_result = await db.execute(
            select(Conversation)
            .where(
                Conversation.user_id == sub.user_id,
                Conversation.character_id == character.id,
            )
            .order_by(Conversation.created_at.desc())
        )
        conv = conv_result.scalars().first()
        if conv is None:
            conv = Conversation(
                user_id=sub.user_id,
                character_id=character.id,
                title=f"与{character.name}的对话",
            )
            db.add(conv)
            await db.commit()
            await db.refresh(conv)

        # 查当日 proactive 消息数（<=3 限制）
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        count_result = await db.execute(
            select(func.count())
            .select_from(Message)
            .where(
                Message.conversation_id == conv.id,
                Message.role == "proactive",
                Message.created_at >= today_start,
            )
        )
        count = count_result.scalar() or 0
        if count >= DAILY_LIMIT:
            return

        # 查 LLM key（用于生成消息）
        key_result = await db.execute(select(LlmKey).where(LlmKey.user_id == sub.user_id))
        key_row = key_result.scalars().first()

        # 生成消息
        if key_row is not None:
            content = await generate_proactive_message(character, period, key_row)
        else:
            content = get_fallback(period)

        # 落库
        msg = Message(
            conversation_id=conv.id,
            role="proactive",
            content=content,
        )
        db.add(msg)
        await db.commit()

        # Web Push 推送（失败则仅应用内展示）
        send_push(
            endpoint=sub.endpoint,
            p256dh=sub.p256dh,
            auth=sub.auth,
            payload={
                "title": character.name,
                "body": content,
                "conversation_id": conv.id,
            },
        )
