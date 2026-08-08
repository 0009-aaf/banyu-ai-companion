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
        fixed_models=["deepseek-v4-flash"],
    ),
    "qwen": OpenAiCompatProvider("https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen"),
    "deepseek": OpenAiCompatProvider("https://api.deepseek.com/v1", "deepseek"),
    "zhipu": OpenAiCompatProvider("https://open.bigmodel.cn/api/paas/v4", "zhipu"),
}


def get_provider(name: str) -> OpenAiCompatProvider | None:
    return PROVIDERS.get(name)


def list_provider_names() -> list[str]:
    return list(PROVIDERS.keys())
