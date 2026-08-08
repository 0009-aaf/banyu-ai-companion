"""主动消息生成 - LLM 生成 + 兜底文案。

Protected Region: 消息生成 prompt 设计是产品核心。
"""

import random
from collections.abc import AsyncIterator

from app.core.crypto import decrypt
from app.models.character import Character
from app.models.llm_key import LlmKey
from app.services.llm.base import Message as LlmMessage
from app.services.llm.providers import get_provider

# 各 provider 默认模型（避免每次调 list_models）
DEFAULT_MODELS: dict[str, str] = {
    "deepseek": "deepseek-chat",
    "openai": "gpt-4o-mini",
    "doubao": "doubao-pro-32k",
    "qwen": "qwen-turbo",
    "zhipu": "glm-4-flash",
}

PERIOD_DESC: dict[str, str] = {
    "morning": "早晨",
    "evening": "夜晚",
    "random": "白天",
}

# 兜底文案库（LLM 失败时用）
FALLBACK_MESSAGES: dict[str, list[str]] = {
    "morning": [
        "早安呀，新的一天开始啦~",
        "早上好，今天也要好好吃饭哦",
        "醒了吗？想到你就来打个招呼",
        "新的一天，加油呀",
    ],
    "evening": [
        "晚安，今天辛苦了",
        "夜深了，早点休息吧",
        "睡前来跟你说声晚安~",
        "今天过得怎么样？好好睡一觉吧",
    ],
    "random": [
        "今天想到你了，没别的事",
        "在忙吗？记得喝口水",
        "突然想跟你说说话",
        "希望你今天过得不错",
        "路过来看你一下~",
    ],
}


def get_fallback(period: str) -> str:
    """随机返回一条兜底文案。"""
    messages = FALLBACK_MESSAGES.get(period, FALLBACK_MESSAGES["random"])
    return random.choice(messages)


async def _collect_stream(stream: AsyncIterator[str]) -> str:
    """收集流式输出为完整字符串。"""
    chunks: list[str] = []
    async for token in stream:
        chunks.append(token)
    return "".join(chunks)


async def generate_proactive_message(
    character: Character,
    period: str,
    llm_key: LlmKey,
) -> str:
    """生成主动消息。

    用 LLM 基于角色人设生成，失败时降级兜底文案。
    异常不吞：记录但不阻断（返回兜底文案）。
    """
    provider_name = llm_key.provider
    model = DEFAULT_MODELS.get(provider_name, "")
    if not model:
        return get_fallback(period)

    provider = get_provider(provider_name)
    if provider is None:
        return get_fallback(period)

    try:
        api_key = decrypt(llm_key.api_key_encrypted)
        period_desc = PERIOD_DESC.get(period, "白天")
        system = (
            f"{character.persona}\n\n"
            "你是用户的陪伴者。现在要主动给用户发一条消息。"
            "用短句、生活化的语言，像好朋友一样。"
            "不要提问太多，表达关心即可。一两句话就好。"
            f"当前时段：{period_desc}。"
            "只输出消息内容本身，不要加引号或前缀。"
        )
        messages = [LlmMessage(role="system", content=system)]
        stream = provider.chat_stream(messages, model, api_key)
        content = await _collect_stream(stream)
        content = content.strip()
        return content if content else get_fallback(period)
    except Exception:
        # LLM 调用失败，降级兜底文案（不阻断主动陪伴流程）
        return get_fallback(period)
