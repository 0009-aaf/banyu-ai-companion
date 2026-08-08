"""Provider 注册表 - provider 名 -> OpenAI 兼容适配器。

主流国内厂商均提供 OpenAI 兼容 API，通过 base_url 区分。
"""

from app.services.llm.providers.openai_compat import OpenAiCompatProvider

PROVIDERS: dict[str, OpenAiCompatProvider] = {
    "openai": OpenAiCompatProvider("https://api.openai.com/v1", "openai"),
    "doubao": OpenAiCompatProvider("https://ark.cn-beijing.volces.com/api/v3", "doubao"),
    "volc": OpenAiCompatProvider(
        "https://ark.cn-beijing.volces.com/api/coding/v3",
        "volc",
        fixed_models=[
            "deepseek-v4-flash-260425",
            "deepseek-v4-flash-ga-260731",
            "deepseek-v4-pro-260425",
            "kimi-k2-250905",
            "kimi-k2-250711",
            "kimi-k2-thinking-251104",
            "glm-5-2-260617",
        ],
    ),
    "qwen": OpenAiCompatProvider("https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen"),
    "qwen-token": OpenAiCompatProvider(
        "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
        "qwen-token",
    ),
    "deepseek": OpenAiCompatProvider("https://api.deepseek.com/v1", "deepseek"),
    "zhipu": OpenAiCompatProvider("https://open.bigmodel.cn/api/paas/v4", "zhipu"),
    "zhipu-coding": OpenAiCompatProvider(
        "https://open.bigmodel.cn/api/coding/paas/v4",
        "zhipu-coding",
    ),
}


def get_provider(name: str) -> OpenAiCompatProvider | None:
    return PROVIDERS.get(name)


def list_provider_names() -> list[str]:
    return list(PROVIDERS.keys())
