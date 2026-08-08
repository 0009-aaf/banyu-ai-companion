"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

interface Memory {
  id: string;
  content: string;
  created_at: string;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadMemories() {
    setLoading(true);
    try {
      const data = await apiFetch<Memory[]>("/memory");
      setMemories(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemories();
  }, []);

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/memory/${id}`, { method: "DELETE" });
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setMsg("已删除");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除失败");
    }
  }

  return (
    <div className="p-4 md:max-w-2xl md:mx-auto">
      <h1 className="mb-4 text-xl font-bold">记忆管理</h1>

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      {msg && <p className="mb-2 text-sm text-green-400">{msg}</p>}

      {loading ? (
        <p className="text-sm text-white/40">加载中...</p>
      ) : memories.length === 0 ? (
        <div className="rounded-lg glass p-8 text-center">
          <p className="text-sm text-white/40">
            还没有记忆。和角色聊天时，关键信息会自动记住。
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map((m) => (
            <div
              key={m.id}
              className="flex items-start justify-between rounded-lg glass p-3"
            >
              <div className="flex-1">
                <p className="text-sm text-white">{m.content}</p>
                <p className="mt-1 text-xs text-white/40">
                  {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="ml-2 text-sm text-red-400"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
