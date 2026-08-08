"""Edge TTS 服务 - 使用微软 Neural 语音引擎，免费、高质量、可商用。

语音包列表：
  zh-CN-XiaoxiaoNeural  晓晓（温柔女声）
  zh-CN-XiaoyiNeural    晓伊（活泼女声）
  zh-CN-YunxiNeural     云希（少年男声）
  zh-CN-YunyangNeural   云扬（解说男声）
  zh-HK-HiuMaanNeural   晓曼（粤语女声）
  zh-HK-WanLungNeural   云龙（粤语男声）
"""

import io
from collections.abc import AsyncIterator

import edge_tts

# 可选语音包
VOICE_OPTIONS: list[dict[str, str]] = [
    {"id": "zh-CN-XiaoxiaoNeural", "label": "晓晓（温柔女声）"},
    {"id": "zh-CN-XiaoyiNeural", "label": "晓伊（活泼女声）"},
    {"id": "zh-CN-YunxiNeural", "label": "云希（少年男声）"},
    {"id": "zh-CN-YunyangNeural", "label": "云扬（解说男声）"},
    {"id": "zh-HK-HiuMaanNeural", "label": "晓曼（粤语女声）"},
    {"id": "zh-HK-WanLungNeural", "label": "云龙（粤语男声）"},
]

DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"


async def synthesize(text: str, voice: str = DEFAULT_VOICE) -> bytes:
    """将文字合成为 MP3 音频，返回完整 bytes。"""
    if not text:
        return b""
    if not voice:
        voice = DEFAULT_VOICE
    communicate = edge_tts.Communicate(text, voice)
    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk.get("data", b""))
    return buf.getvalue()


async def synthesize_stream(text: str, voice: str = DEFAULT_VOICE) -> AsyncIterator[bytes]:
    """流式合成 MP3 音频，逐块 yield。"""
    if not text:
        return
    if not voice:
        voice = DEFAULT_VOICE
    communicate = edge_tts.Communicate(text, voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            yield chunk.get("data", b"")
