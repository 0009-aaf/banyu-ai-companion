"""情绪分析 - LLM 分类用户消息情绪。

Protected Region: 情绪分析 prompt 设计是产品核心。
"""

import json
from collections.abc import AsyncIterator

from app.core.crypto import decrypt
from app.models.llm_key import LlmKey
from app.services.llm.base import Message as LlmMessage
from app.services.llm.providers import get_provider
from app.services.memory.extract import DEFAULT_CHAT_MODELS

ANALYZE_PROMPT = """分析以下用户消息的情绪。只返回JSON，格式：{"emotion": "positive/neutral/negative", "score": 0.0到1.0}
- positive: 开心、满意、兴奋
- neutral: 平静、陈述
- negative: 难过、焦虑、愤怒、孤独
- score: 负面程度（0.0=完全不负面，1.0=极度负面）
用户消息：{message}"""


async def _collect_stream(stream: AsyncIterator[str]) -> str:
    chunks: list[str] = []
    async for token in stream:
        chunks.append(token)
    return "".join(chunks)


async def analyze_emotion(
    user_message: str,
    llm_key: LlmKey,
) -> tuple[str, float] | None:
    """分析用户消息情绪。返回 (emotion, score) 或 None。"""
    provider_name = llm_key.provider
    chat_model = DEFAULT_CHAT_MODELS.get(provider_name, "")
    if not chat_model:
        return None

    provider = get_provider(provider_name)
    if provider is None:
        return None

    try:
        api_key = decrypt(llm_key.api_key_encrypted)
        prompt = ANALYZE_PROMPT.format(message=user_message)
        messages = [
            LlmMessage(role="system", content="你是情绪分析助手，只返回JSON。"),
            LlmMessage(role="user", content=prompt),
        ]
        stream = provider.chat_stream(messages, chat_model, api_key)
        result = (await _collect_stream(stream)).strip()

        # 解析 JSON（LLM 可能返回带 markdown 的 JSON）
        if result.startswith("```"):
            result = result.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        data = json.loads(result)
        emotion = data.get("emotion", "neutral")
        score = float(data.get("score", 0.0))

        if emotion not in ("positive", "neutral", "negative"):
            emotion = "neutral"
        score = max(0.0, min(1.0, score))

        return emotion, score
    except Exception:
        return None
