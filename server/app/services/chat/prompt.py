"""system prompt 组装 - 角色人设 + 对话指引。

Protected Region: 人设注入逻辑是产品核心。
"""

from app.models.character import Character
from app.models.conversation import Message
from app.services.llm.base import Message as LlmMessage

CONTEXT_WINDOW = 20  # 取最近 N 条消息注入上下文


def build_messages(
    character: Character,
    history: list[Message],
    user_content: str,
    memories: list[str] | None = None,
) -> list[LlmMessage]:
    """组装 LLM 消息：system(人设+指引+记忆) + 历史上下文 + 当前用户消息。"""
    system = (
        f"{character.persona}\n\n"
        "你是用户的陪伴者。用短句、生活化的语言，像好朋友一样对话。"
        "倾听用户，给予温暖支持，不刻意说教。"
    )
    if memories:
        from app.services.memory.inject import inject_memories

        system = inject_memories(system, memories)
    messages = [LlmMessage(role="system", content=system)]
    for m in history[-CONTEXT_WINDOW:]:
        messages.append(LlmMessage(role=m.role, content=m.content))
    messages.append(LlmMessage(role="user", content=user_content))
    return messages
