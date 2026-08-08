"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./message-bubble";
import { streamChat } from "./stream";
import { useAuthStore } from "@/lib/store";

interface ChatMessage {
  id?: string;
  role: string;
  content: string;
}

interface ChatViewProps {
  convId: string;
  initialMessages: ChatMessage[];
}

export function ChatView({ convId, initialMessages }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentProvider = useAuthStore((s) => s.currentProvider);
  const currentModel = useAuthStore((s) => s.currentModel);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || streaming) return;
    if (!currentProvider || !currentModel) {
      setError("请先在设置页选择模型");
      return;
    }
    setError(null);
    setInput("");
    // 乐观加入用户消息 + 空 assistant 消息（流式拼接）
    setMessages((prev) => [
      ...prev,
      { role: "user", content },
      { role: "assistant", content: "" },
    ]);
    setStreaming(true);

    await streamChat(convId, content, currentProvider, currentModel, {
      onToken: (token) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + token };
          }
          return next;
        });
      },
      onError: (err) => {
        setError(err);
        // 移除空 assistant 消息
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setStreaming(false);
      },
      onDone: () => {
        setStreaming(false);
      },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col">
      <div className="flex-1 overflow-y-auto bg-neutral-50 px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-20 text-center text-sm text-neutral-400">
            开始和角色聊聊吧
          </p>
        ) : (
          messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))
        )}
        <div ref={endRef} />
      </div>
      {error && <p className="px-4 text-sm text-red-500">{error}</p>}
      <div className="border-t border-neutral-200 bg-white p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="说点什么..."
            disabled={streaming}
            className="flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {streaming ? "..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
