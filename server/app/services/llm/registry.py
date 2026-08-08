"""LLM 注册表 - provider 获取 + /models 聚合入口。"""

from app.services.llm.providers import get_provider, list_provider_names


async def list_available_models(provider: str, api_key: str) -> list[str]:
    """返回指定 provider 下该 key 可用的模型列表。

    key 无效会抛 httpx 异常，由 API 层转为 401/502。
    """
    p = get_provider(provider)
    if p is None:
        raise ValueError(f"不支持的 provider: {provider}")
    return await p.list_models(api_key)


def available_providers() -> list[str]:
    return list_provider_names()
