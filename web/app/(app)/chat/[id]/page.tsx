"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatView } from "@/features/chat/chat-view";
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

  return <ChatView convId={params.id} initialMessages={messages} />;
}
