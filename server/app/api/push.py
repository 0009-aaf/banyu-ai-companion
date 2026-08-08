"""Web Push 订阅路由 - 订阅/取消/测试。"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.database import get_db
from app.models.character import Character
from app.models.push import PushSubscription
from app.models.user import User
from app.schemas.push import PushSubscriptionCreate, PushSubscriptionOut
from app.services.proactive.push import send_push

router = APIRouter(prefix="/push", tags=["push"])


@router.post(
    "/subscribe",
    response_model=PushSubscriptionOut,
    status_code=status.HTTP_201_CREATED,
)
async def subscribe(
    payload: PushSubscriptionCreate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PushSubscription:
    """注册 Web Push 订阅端点。

    前端调用 PushSubscription.toJSON() 后提交到此端点。
    """
    p256dh = payload.keys.get("p256dh", "")
    auth = payload.keys.get("auth", "")
    if not payload.endpoint or not p256dh or not auth:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "订阅信息不完整")

    # 幂等：同 endpoint 更新而非重复创建
    existing = await db.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == current.id,
            PushSubscription.endpoint == payload.endpoint,
        )
    )
    row = existing.scalar_one_or_none()
    if row is not None:
        row.p256dh = p256dh
        row.auth = auth
        await db.commit()
        await db.refresh(row)
        return row

    sub = PushSubscription(
        user_id=current.id,
        endpoint=payload.endpoint,
        p256dh=p256dh,
        auth=auth,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


@router.delete("/subscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """取消当前用户的所有 Web Push 订阅。"""
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == current.id)
    )
    for sub in result.scalars().all():
        await db.delete(sub)
    await db.commit()


@router.post("/test")
async def test_push(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """发送一条测试推送（验证 Web Push 配置）。"""
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == current.id)
    )
    subs = list(result.scalars().all())
    if not subs:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "未找到推送订阅，请先在浏览器订阅")

    sub = subs[0]
    ok = send_push(
        endpoint=sub.endpoint,
        p256dh=sub.p256dh,
        auth=sub.auth,
        payload={
            "title": "伴语测试",
            "body": "这是一条测试推送，如果你看到了说明配置成功~",
            "conversation_id": "",
        },
    )
    if not ok:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "推送失败，请检查 VAPID 配置")
    return {"status": "sent"}


@router.post("/trigger/{period}")
async def trigger_proactive(
    period: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """手动触发一条主动消息（开发/测试用，不走定时调度）。

    period: morning / evening / random
    """
    if period not in ("morning", "evening", "random"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "period 必须是 morning/evening/random")

    # 查默认角色
    char_result = await db.execute(
        select(Character).where(
            Character.user_id == current.id,
            Character.is_default == True,  # noqa: E712
        )
    )
    character = char_result.scalar_one_or_none()
    if character is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "未找到默认角色")

    # 查 LLM key
    from app.models.conversation import Conversation, Message
    from app.models.llm_key import LlmKey
    from app.services.proactive.generator import generate_proactive_message, get_fallback

    key_result = await db.execute(select(LlmKey).where(LlmKey.user_id == current.id))
    key_row = key_result.scalars().first()

    if key_row is not None:
        content = await generate_proactive_message(character, period, key_row)
    else:
        content = get_fallback(period)

    # 查或创建会话
    conv_result = await db.execute(
        select(Conversation)
        .where(
            Conversation.user_id == current.id,
            Conversation.character_id == character.id,
        )
        .order_by(Conversation.created_at.desc())
    )
    conv = conv_result.scalars().first()
    if conv is None:
        conv = Conversation(
            user_id=current.id,
            character_id=character.id,
            title=f"与{character.name}的对话",
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)

    # 落库
    msg = Message(conversation_id=conv.id, role="proactive", content=content)
    db.add(msg)
    await db.commit()

    # 尝试推送
    sub_result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == current.id)
    )
    for sub in sub_result.scalars().all():
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

    return {"status": "ok", "content": content, "conversation_id": conv.id}
