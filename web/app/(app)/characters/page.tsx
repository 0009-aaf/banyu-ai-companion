"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Character {
  id: string;
  name: string;
  persona: string;
  avatar_url: string | null;
  is_default: boolean;
  created_at: string;
}

export default function CharactersPage() {
  const router = useRouter();
  const currentCharacterId = useAuthStore((s) => s.currentCharacterId);
  const setCurrentCharacter = useAuthStore((s) => s.setCurrentCharacter);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Character[]>("/characters");
      setCharacters(data);
      // 首次加载若无选中角色，默认选第一个
      if (data.length > 0 && !useAuthStore.getState().currentCharacterId) {
        setCurrentCharacter(data[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("确定删除这个角色？")) return;
    try {
      await apiFetch(`/characters/${id}`, { method: "DELETE" });
      if (currentCharacterId === id) {
        setCurrentCharacter("");
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除失败");
    }
  }

  return (
    <div className="p-4 md:max-w-4xl md:mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">角色</h1>
        <Link
          href="/characters/new"
          className="rounded-lg bg-[#f0c958] px-4 py-2 text-sm text-white"
        >
          新建
        </Link>
      </div>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="text-center text-white/40">加载中...</p>
      ) : characters.length === 0 ? (
        <p className="text-center text-white/40">还没有角色</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl glass p-4 shadow-sm transition active:scale-[0.98] ${
                currentCharacterId === c.id ? "ring-2 ring-[#f0c958]" : ""
              }`}
            >
              <button
                onClick={() => setCurrentCharacter(c.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-3">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0c958]/15 text-lg font-medium text-[#f0c958]">
                      {c.name.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                  {c.is_default && (
                    <span className="rounded bg-[#f0c958]/15 px-2 py-0.5 text-xs text-[#f0c958]">
                      默认
                    </span>
                  )}
                  {currentCharacterId === c.id && (
                    <span className="text-xs text-[#f0c958]">当前</span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-white/50">{c.persona}</p>
                  </div>
                </div>
              </button>
              <div className="mt-3 flex gap-3 text-sm">
                <button
                  onClick={() => router.push(`/characters/${c.id}/edit`)}
                  className="text-[#f0c958]"
                >
                  编辑
                </button>
                {!c.is_default && (
                  <button onClick={() => handleDelete(c.id)} className="text-red-400">
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
