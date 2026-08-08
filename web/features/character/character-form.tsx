"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { ImageUpload } from "@/features/upload/image-upload";
import { VoiceUpload, type VoiceStatus } from "@/features/upload/voice-upload";

export interface CharacterFormData {
  name: string;
  persona: string;
  avatar_url: string;
}

interface CharacterFormProps {
  initial?: Partial<CharacterFormData>;
  onSubmit: (data: CharacterFormData) => Promise<void>;
  submitLabel: string;
  characterId?: string;
  voiceStatus?: VoiceStatus;
}

export function CharacterForm({
  initial,
  onSubmit,
  submitLabel,
  characterId,
  voiceStatus: initialVoiceStatus = "none",
}: CharacterFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [persona, setPersona] = useState(initial?.persona ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatar_url ?? "");
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(initialVoiceStatus);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("名字不能为空");
      return;
    }
    if (!persona.trim()) {
      setError("人设不能为空");
      return;
    }
    if (persona.length > 2000) {
      setError("人设最多 2000 字");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        persona: persona.trim(),
        avatar_url: avatarUrl.trim(),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm">名字</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={64}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-[#f0c958]/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm">角色形象</label>
        <ImageUpload value={avatarUrl} onChange={setAvatarUrl} />
      </div>
      {characterId && (
        <VoiceUpload
          characterId={characterId}
          voiceStatus={voiceStatus}
          onStatusChange={setVoiceStatus}
        />
      )}
      <div>
        <label className="mb-1 block text-sm">人设（1-2000 字）</label>
        <textarea
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          rows={8}
          maxLength={2000}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-[#f0c958]/40"
        />
        <p className="mt-1 text-xs text-white/40">{persona.length}/2000</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#f0c958] py-2 font-medium text-[#0a0a1a] hover:bg-[#f0c958]/90 disabled:opacity-50"
      >
        {loading ? "提交中..." : submitLabel}
      </button>
    </form>
  );
}
