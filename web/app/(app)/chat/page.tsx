"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Conversation {
  id: string;
  character_id: string;
  title: string;
}

export default function ChatEntryPage() {
  const router = useRouter();
  const currentCharacterId = useAuthStore((s) => s.currentCharacterId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentCharacterId) {
      setError("请先在角色页选择一个角色");
      return;
    }
    apiFetch<Conversation[]>("/chat/conversations")
      .then((convs) => {
        const existing = convs.find((c) => c.character_id === currentCharacterId);
        if (existing) {
          router.replace(`/chat/${existing.id}`);
          return;
        }
        apiFetch<Conversation>("/chat/conversations", {
          method: "POST",
          body: JSON.stringify({ character_id: currentCharacterId }),
        })
          .then((c) => router.replace(`/chat/${c.id}`))
          .catch((err: unknown) =>
            setError(err instanceof ApiError ? err.message : "创建会话失败")
          );
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "加载失败")
      );
  }, [currentCharacterId, router]);

  return (
    <div className="flex min-h-[calc(100vh-49px)] items-center justify-center text-white/40">
      {error ?? "加载中..."}
    </div>
  );
}
