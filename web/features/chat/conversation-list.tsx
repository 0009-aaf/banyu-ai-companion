"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

interface Conversation {
  id: string;
  character_id: string;
  title: string;
  created_at: string;
}

interface ConversationListProps {
  currentConvId: string | null;
}

export function ConversationList({ currentConvId }: ConversationListProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Conversation[]>("/chat/conversations");
      setConversations(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-3">
        <button
          onClick={() => router.push("/chat")}
          className="w-full rounded-lg bg-[#f0c958] py-2 text-sm text-[#0a0a1a]"
        >
          + 新对话
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-4 text-center text-sm text-white/40">加载中...</p>
        ) : error ? (
          <p className="px-2 py-4 text-center text-sm text-red-400">{error}</p>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-white/40">还没有对话</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/chat/${c.id}`)}
                className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm transition ${
                  c.id === currentConvId
                    ? "bg-[#f0c958]/10 text-[#f0c958]"
                    : "text-white/60 hover:bg-white/5"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
