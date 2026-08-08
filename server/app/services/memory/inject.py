"""记忆注入 - 将检索到的记忆拼入 system prompt。

Protected Region: 注入逻辑（prompt 拼装）。
"""


def inject_memories(system_prompt: str, memories: list[str]) -> str:
    """在 system prompt 中追加用户记忆段。

    无记忆时返回原始 prompt（不变）。
    """
    if not memories:
        return system_prompt

    memory_text = "\n".join(f"- {m}" for m in memories)
    return f"{system_prompt}\n\n[用户记忆]\n{memory_text}"
