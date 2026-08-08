"""模型列表过滤 - 排除非对话类模型（embedding/vision/tts/image 等）。

Protected Region: 过滤规则是产品核心，改动需谨慎。
"""

EXCLUDE_KEYWORDS = [
    "embedding",
    "vision",
    "image",
    "tts",
    "asr",
    "whisper",
    "clip",
    "multimodal",
    "rerank",
    "sd",
    "stable",
    "dall",
    "draw",
    "paint",
    "video",
    "code",
    "preview",
    "lite-i2v",
    "lite-t2v",
    "seaweed",
    "seedance",
    "seedream",
    "seededit",
    "seed3d",
    "wan2",
    "hyper3d",
    "hitem3d",
    "ui-tars",
    "translation",
    "smart-router",
    "evolving",
]


def filter_chat_models(models: list[str]) -> list[str]:
    """过滤出对话类模型，排除 embedding/vision/tts/image 等非对话模型。"""
    return [m for m in models if not any(kw in m.lower() for kw in EXCLUDE_KEYWORDS)]
