"""记忆提取 - 从用户消息中提取关键信息并生成向量。

Protected Region: 提取 prompt 设计是产品核心。
"""

import json
from collections.abc import AsyncIterator

from app.core.crypto import decrypt
from app.models.llm_key import LlmKey
from app.services.llm.base import Message as LlmMessage
from app.services.llm.providers import get_provider

# 各 provider 默认 embedding 模型（空字符串表示不支持）
DEFAULT_EMBEDDING_MODELS: dict[str, str] = {
    "openai": "text-embedding-3-small",
    "qwen": "text-embedding-v2",
    "zhipu": "embedding-2",
    "doubao": "",  # 需要 endpoint ID
    "deepseek": "",  # 不支持 embedding
}

# 各 provider 默认 chat 模型（用于提取记忆）
DEFAULT_CHAT_MODELS: dict[str, str] = {
    "deepseek": "deepseek-chat",
    "openai": "gpt-4o-mini",
    "doubao": "doubao-pro-32k",
    "qwen": "qwen-turbo",
    "zhipu": "glm-4-flash",
}

EXTRACT_PROMPT = """从以下用户消息中提取关键信息（如用户姓名、喜好、重要事件、关系等）。
只输出提取的关键信息，用一句话概括。如果没有有价值的信息，只输出"无"。
用户消息：{message}"""


async def _collect_stream(stream: AsyncIterator[str]) -> str:
    chunks: list[str] = []
    async for token in stream:
        chunks.append(token)
    return "".join(chunks)


async def extract_memory(
    user_message: str,
    llm_key: LlmKey,
) -> tuple[str, list[float]] | None:
    """从用户消息中提取关键信息 + 生成向量。

    返回 (content, embedding) 或 None（提取失败/无有价值信息）。
    异常不吞：失败时返回 None，调用方降级为无记忆。
    """
    provider_name = llm_key.provider
    chat_model = DEFAULT_CHAT_MODELS.get(provider_name, "")
    embed_model = DEFAULT_EMBEDDING_MODELS.get(provider_name, "")
    if not chat_model:
        return None

    provider = get_provider(provider_name)
    if provider is None:
        return None

    try:
        api_key = decrypt(llm_key.api_key_encrypted)
        prompt = EXTRACT_PROMPT.format(message=user_message)
        messages = [
            LlmMessage(role="system", content="你是信息提取助手。"),
            LlmMessage(role="user", content=prompt),
        ]
        stream = provider.chat_stream(messages, chat_model, api_key)
        content = (await _collect_stream(stream)).strip()

        # 无有价值信息
        if not content or content == "无" or len(content) < 2:
            return None

        # 生成 embedding（如果 provider 支持）
        embedding: list[float] = []
        if embed_model:
            try:
                embedding = await provider.embed(content, embed_model, api_key)
            except Exception:
                # embedding 失败不阻断（降级为纯文本记忆）
                embedding = []

        return content, embedding
    except Exception:
        return None


def embedding_to_json(embedding: list[float]) -> str:
    """将向量转为 JSON 字符串存储。"""
    return json.dumps(embedding) if embedding else ""


def json_to_embedding(data: str | None) -> list[float]:
    """将 JSON 字符串转回向量。"""
    if not data:
        return []
    try:
        result = json.loads(data)
        return [float(x) for x in result] if isinstance(result, list) else []
    except (json.JSONDecodeError, TypeError):
        return []
