"""向量检索 - 余弦相似度 top-k 检索。

Protected Region: 检索逻辑（相似度计算 + 去重）。
"""

import numpy as np
from sqlalchemy import select

from app.core.crypto import decrypt
from app.core.database import async_session
from app.models.llm_key import LlmKey
from app.models.memory import Memory
from app.services.llm.providers import get_provider
from app.services.memory.extract import (
    DEFAULT_EMBEDDING_MODELS,
    json_to_embedding,
)

TOP_K = 5
SIMILARITY_THRESHOLD = 0.5


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """计算两个向量的余弦相似度。"""
    if not a or not b or len(a) != len(b):
        return 0.0
    vec_a = np.array(a, dtype=np.float32)
    vec_b = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))


async def retrieve_memories(
    user_id: str,
    query_text: str,
    llm_key: LlmKey,
) -> list[str]:
    """检索与当前消息最相关的 top-K 记忆。

    向量检索失败时降级为空列表（不阻断对话）。
    """
    provider_name = llm_key.provider
    embed_model = DEFAULT_EMBEDDING_MODELS.get(provider_name, "")
    if not embed_model:
        # provider 不支持 embedding，降级为空
        return []

    provider = get_provider(provider_name)
    if provider is None:
        return []

    try:
        api_key = decrypt(llm_key.api_key_encrypted)
        query_embedding = await provider.embed(query_text, embed_model, api_key)
        if not query_embedding:
            return []
    except Exception:
        return []

    # 查用户所有记忆
    async with async_session() as db:
        result = await db.execute(select(Memory).where(Memory.user_id == user_id))
        memories = list(result.scalars().all())

    if not memories:
        return []

    # 计算相似度并排序
    scored: list[tuple[float, str]] = []
    for mem in memories:
        mem_embedding = json_to_embedding(mem.embedding)
        if not mem_embedding:
            continue
        sim = cosine_similarity(query_embedding, mem_embedding)
        if sim >= SIMILARITY_THRESHOLD:
            scored.append((sim, mem.content))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [content for _, content in scored[:TOP_K]]


async def retrieve_memories_fallback(user_id: str) -> list[str]:
    """降级检索：无向量时返回最近 N 条记忆（纯文本）。"""
    async with async_session() as db:
        result = await db.execute(
            select(Memory)
            .where(Memory.user_id == user_id)
            .order_by(Memory.created_at.desc())
            .limit(TOP_K)
        )
        memories = list(result.scalars().all())
    return [m.content for m in memories]
