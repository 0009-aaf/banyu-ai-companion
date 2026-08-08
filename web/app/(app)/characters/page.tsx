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
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">角色</h1>
        <Link
          href="/characters/new"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm text-white"
        >
          新建
        </Link>
      </div>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-center text-neutral-400">加载中...</p>
      ) : characters.length === 0 ? (
        <p className="text-center text-neutral-400">还没有角色</p>
      ) : (
        <div className="space-y-3">
          {characters.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg bg-white p-4 ${
                currentCharacterId === c.id ? "ring-2 ring-amber-400" : ""
              }`}
            >
              <button
                onClick={() => setCurrentCharacter(c.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {c.is_default && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      默认
                    </span>
                  )}
                  {currentCharacterId === c.id && (
                    <span className="text-xs text-amber-600">当前</span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{c.persona}</p>
              </button>
              <div className="mt-3 flex gap-3 text-sm">
                <button
                  onClick={() => router.push(`/characters/${c.id}/edit`)}
                  className="text-amber-600"
                >
                  编辑
                </button>
                {!c.is_default && (
                  <button onClick={() => handleDelete(c.id)} className="text-red-500">
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
