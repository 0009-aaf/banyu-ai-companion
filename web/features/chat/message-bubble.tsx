/** 消息气泡 - 用户右对齐暖色，角色左对齐白色。 */

interface MessageBubbleProps {
  role: string;
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  const isProactive = role === "proactive";
  return (
    <div className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isUser ? "bg-[#f0c958] text-[#0a0a1a]" : "glass text-white"
        }`}
      >
        {isProactive && (
          <p className="mb-1 text-xs text-[#f0c958]">主动消息</p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
      </div>
    </div>
  );
}
