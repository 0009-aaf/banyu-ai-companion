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
    <div className="flex min-h-[calc(100vh-49px)] flex-col items-center justify-center gap-4 text-center md:h-screen md:max-w-3xl md:mx-auto">
      {error ? (
        <>
          <p className="text-white/40">{error}</p>
          {!currentCharacterId && (
            <button
              onClick={() => router.push("/characters")}
              className="rounded-lg bg-[#f0c958] px-4 py-2 text-sm text-[#0a0a1a]"
            >
              去选择角色
            </button>
          )}
        </>
      ) : (
        <p className="text-white/40">加载中...</p>
      )}
    </div>
  );
}
