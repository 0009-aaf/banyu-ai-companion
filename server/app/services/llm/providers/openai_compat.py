"""OpenAI 兼容适配器 - 覆盖 OpenAI/豆包/通义/DeepSeek/智谱等。

主流国内厂商均提供 OpenAI 兼容 API，通过 base_url 区分，消息格式统一。
Protected Region: 含 key 处理与流式协议解析，易错。
"""

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.services.llm.base import LlmProvider, Message


class OpenAiCompatProvider(LlmProvider):
    def __init__(self, base_url: str, name: str):
        self._base_url = base_url.rstrip("/")
        self._name = name

    async def list_models(self, api_key: str) -> list[str]:
        if not api_key:
            return []
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.get(
                f"{self._base_url}/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            res.raise_for_status()
            data: Any = res.json()
        models = data.get("data", []) if isinstance(data, dict) else []
        ids = [m.get("id") for m in models if isinstance(m, dict)]
        return [i for i in ids if isinstance(i, str)]

    async def chat_stream(
        self, messages: list[Message], model: str, api_key: str
    ) -> AsyncIterator[str]:
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {api_key}"},
            ) as res:
                res.raise_for_status()
                async for line in res.aiter_lines():
                    token = _parse_sse_line(line)
                    if token:
                        yield token

    async def embed(self, text: str, model: str, api_key: str) -> list[float]:
        """调用 OpenAI 兼容 /embeddings 端点生成向量。"""
        if not api_key or not model:
            raise ValueError("embed 需要 api_key 和 model")
        payload = {"model": model, "input": text}
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                f"{self._base_url}/embeddings",
                json=payload,
                headers={"Authorization": f"Bearer {api_key}"},
            )
            res.raise_for_status()
            data: Any = res.json()
        items = data.get("data", []) if isinstance(data, dict) else []
        if not items:
            return []
        embedding = items[0].get("embedding", [])
        return [float(x) for x in embedding]


def _parse_sse_line(line: str) -> str | None:
    """解析 OpenAI SSE 行，返回 token 或 None。"""
    if not line or not line.startswith("data:"):
        return None
    data = line[5:].strip()
    if data == "[DONE]":
        return None
    try:
        obj = json.loads(data)
    except json.JSONDecodeError:
        return None
    choices = obj.get("choices") if isinstance(obj, dict) else None
    if not choices or not isinstance(choices, list):
        return None
    first = choices[0] if choices else None
    delta = first.get("delta", {}) if isinstance(first, dict) else {}
    content = delta.get("content") if isinstance(delta, dict) else None
    return content if isinstance(content, str) else None
