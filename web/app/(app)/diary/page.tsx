"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

interface Diary {
  id: string;
  entry_date: string;
  content: string;
  mood: string;
  is_private: boolean;
  created_at: string;
}

const MOODS = [
  { value: "happy", label: "开心", emoji: "\u{1F60A}" },
  { value: "calm", label: "平静", emoji: "\u{1F610}" },
  { value: "sad", label: "难过", emoji: "\u{1F622}" },
  { value: "anxious", label: "焦虑", emoji: "\u{1F630}" },
  { value: "angry", label: "愤怒", emoji: "\u{1F620}" },
];

export default function DiaryPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [todayDiary, setTodayDiary] = useState<Diary | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("calm");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [list, today] = await Promise.all([
        apiFetch<Diary[]>("/diary"),
        apiFetch<Diary | null>("/diary/today"),
      ]);
      setDiaries(list);
      setTodayDiary(today);
      if (today) {
        setContent(today.content);
        setMood(today.mood);
        setIsPrivate(today.is_private);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      await apiFetch<Diary>("/diary", {
        method: "POST",
        body: JSON.stringify({ content: content.trim(), mood, is_private: isPrivate }),
      });
      setMsg("日记已保存");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/diary/${id}`, { method: "DELETE" });
      setDiaries((prev) => prev.filter((d) => d.id !== id));
      if (todayDiary?.id === id) {
        setTodayDiary(null);
        setContent("");
      }
      setMsg("已删除");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除失败");
    }
  }

  return (
    <div className="p-4 md:max-w-2xl md:mx-auto">
      <h1 className="mb-4 text-xl font-bold">心情日记</h1>

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      {msg && <p className="mb-2 text-sm text-green-400">{msg}</p>}

      <div className="mb-4 rounded-lg glass p-4">
        <p className="mb-2 text-sm font-medium">
          {todayDiary ? "编辑今日日记" : "写今日日记"}
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                mood === m.value
                  ? "bg-[#f0c958] text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="今天心情怎么样？"
          className="mb-2 w-full resize-none rounded-lg border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f0c958]/40"
        />
        <p className="mb-2 text-xs text-white/40">{content.length}/1000</p>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1 text-sm text-white/60">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            私密日记
          </label>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="rounded-lg bg-[#f0c958] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "..." : "保存"}
          </button>
        </div>
      </div>

      <p className="mb-2 text-sm font-medium">历史日记</p>
      {loading ? (
        <p className="text-sm text-white/40">加载中...</p>
      ) : diaries.length === 0 ? (
        <p className="text-sm text-white/40">还没有历史日记</p>
      ) : (
        <div className="space-y-2">
          {diaries.map((d) => {
            const moodInfo = MOODS.find((m) => m.value === d.mood);
            return (
              <div key={d.id} className="rounded-lg glass p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {moodInfo?.emoji} {d.entry_date}
                  </span>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-sm text-red-400"
                  >
                    删除
                  </button>
                </div>
                <p className="text-sm text-white/60">{d.content}</p>
                {d.is_private && (
                  <p className="mt-1 text-xs text-white/40">私密</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
