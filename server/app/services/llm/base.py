"""LLM Provider 抽象接口（Protected Region - 契约层）。

所有 provider 适配器实现此接口，统一消息格式（OpenAI 兼容：role/content）。
改动此文件影响所有适配器，需谨慎。
"""

from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass
class Message:
    """统一消息格式。"""

    role: str  # "system" | "user" | "assistant"
    content: str


class LlmProvider:
    """Provider 抽象接口。子类需实现 list_models / chat_stream。"""

    async def list_models(self, api_key: str) -> list[str]:
        """返回该 key 下可用模型 id 列表。"""
        raise NotImplementedError

    def chat_stream(self, messages: list[Message], model: str, api_key: str) -> AsyncIterator[str]:
        """流式对话，逐 token yield。子类用 async def + yield 实现。"""
        raise NotImplementedError

    async def embed(self, text: str, model: str, api_key: str) -> list[float]:
        """生成文本的向量嵌入。不支持 embedding 的 provider 抛异常。"""
        raise NotImplementedError
