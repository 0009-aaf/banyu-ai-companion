"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatView } from "@/features/chat/chat-view";
import { ConversationList } from "@/features/chat/conversation-list";
import { apiFetch, ApiError } from "@/lib/api";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Message[]>(`/chat/conversations/${params.id}/messages`)
      .then(setMessages)
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "加载失败")
      );
  }, [params.id]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!messages) return <div className="p-4 text-neutral-400">加载中...</div>;

  return (
    <div className="flex h-[calc(100vh-49px)] md:h-screen">
      <aside className="hidden md:block md:w-60 md:border-r border-white/10">
        <ConversationList currentConvId={params.id} />
      </aside>
      <div className="flex-1">
        <ChatView convId={params.id} initialMessages={messages} />
      </div>
    </div>
  );
}
