"""流式对话 SSE + 会话/消息查询。

SSE 事件格式：
  data: {"token": "..."}\n\n  - 逐 token
  data: {"error": "..."}\n\n  - 错误
  data: [DONE]\n\n          - 结束
"""

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import decrypt
from app.core.database import async_session, get_db
from app.core.deps import get_current_user
from app.models.character import Character
from app.models.conversation import Conversation, Message
from app.models.llm_key import LlmKey
from app.models.user import User
from app.schemas.chat import ConversationCreate, ConversationOut, MessageOut, SendBody
from app.services.chat.prompt import build_messages
from app.services.llm.providers import get_provider

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post(
    "/conversations",
    response_model=ConversationOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    payload: ConversationCreate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Conversation:
    r = await db.execute(
        select(Character).where(
            Character.id == payload.character_id, Character.user_id == current.id
        )
    )
    char = r.scalar_one_or_none()
    if char is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "角色不存在")
    conv = Conversation(
        user_id=current.id,
        character_id=payload.character_id,
        title=f"与{char.name}的对话",
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Conversation]:
    r = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current.id)
        .order_by(Conversation.created_at.desc())
    )
    return list(r.scalars().all())


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageOut])
async def list_messages(
    conv_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Message]:
    r = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current.id)
    )
    if r.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "会话不存在")
    mr = await db.execute(
        select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    )
    return list(mr.scalars().all())


@router.post("/conversations/{conv_id}/stream")
async def stream_chat(
    conv_id: str,
    payload: SendBody,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    r = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current.id)
    )
    conv = r.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "会话不存在")
    cr = await db.execute(select(Character).where(Character.id == conv.character_id))
    character = cr.scalar_one_or_none()
    if character is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "角色不存在")
    kr = await db.execute(
        select(LlmKey).where(LlmKey.user_id == current.id, LlmKey.provider == payload.provider)
    )
    key_row = kr.scalar_one_or_none()
    if key_row is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "请先在设置页配置 API key")
    api_key = decrypt(key_row.api_key_encrypted)
    provider = get_provider(payload.provider)
    if provider is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "不支持的 provider")

    mr = await db.execute(
        select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    )
    history = list(mr.scalars().all())
    user_msg = Message(conversation_id=conv_id, role="user", content=payload.content)
    db.add(user_msg)
    await db.commit()

    # 检索记忆注入 system prompt（失败降级为无记忆）
    memories: list[str] = []
    try:
        from app.services.memory.retrieve import retrieve_memories

        memories = await retrieve_memories(current.id, payload.content, key_row)
    except Exception:
        pass

    llm_messages = build_messages(character, history, payload.content, memories)

    async def generate() -> AsyncIterator[str]:
        full: list[str] = []
        try:
            async for token in provider.chat_stream(llm_messages, payload.model, api_key):
                full.append(token)
                yield f"data: {json.dumps({'token': token}, ensure_ascii=False)}\n\n"
        except Exception as e:
            # 流式异常通过 SSE error 通知前端（不吞，前端显示）
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
            return
        # 保存 assistant 回复（用新 session，避免原 session 已关闭）
        async with async_session() as s:
            s.add(
                Message(
                    conversation_id=conv_id,
                    role="assistant",
                    content="".join(full),
                )
            )
            await s.commit()

        # 异步提取记忆（不阻塞 SSE 响应）
        try:
            from app.models.memory import Memory as MemoryModel
            from app.services.memory.extract import embedding_to_json, extract_memory

            mem_result = await extract_memory(payload.content, key_row)
            if mem_result:
                mem_content, mem_embedding = mem_result
                async with async_session() as ms:
                    ms.add(
                        MemoryModel(
                            user_id=current.id,
                            conversation_id=conv_id,
                            content=mem_content,
                            embedding=embedding_to_json(mem_embedding),
                        )
                    )
                    await ms.commit()
        except Exception:
            pass  # 记忆提取失败不阻断对话

        # 异步情绪分析 + 触发主动关心
        try:
            from app.services.emotion.analyzer import analyze_emotion
            from app.services.emotion.trigger import should_trigger, trigger_care_message

            emotion_result = await analyze_emotion(payload.content, key_row)
            if emotion_result:
                emotion, score = emotion_result
                if await should_trigger(conv_id, emotion, score):
                    await trigger_care_message(current.id, conv_id, character, key_row)
        except Exception:
            pass  # 情绪分析失败不阻断对话

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
