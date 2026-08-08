"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CharacterForm, type CharacterFormData } from "@/features/character/character-form";
import type { VoiceStatus } from "@/features/upload/voice-upload";
import { apiFetch, ApiError } from "@/lib/api";

interface CharacterOut {
  id: string;
  name: string;
  persona: string;
  avatar_url: string | null;
  voice_id: string | null;
  voice_status: string;
  voice_config: unknown;
  proactive_config: unknown;
  is_default: boolean;
  user_id: string;
  created_at: string;
}

export default function EditCharacterPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<Partial<CharacterFormData> | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("none");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CharacterOut>(`/characters/${params.id}`)
      .then((c) => {
        setInitial({ name: c.name, persona: c.persona, avatar_url: c.avatar_url ?? "" });
        setVoiceStatus((c.voice_status as VoiceStatus) ?? "none");
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "加载失败")
      );
  }, [params.id]);

  async function handleSubmit(data: CharacterFormData) {
    await apiFetch(`/characters/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    router.push("/characters");
  }

  if (error) return <div className="p-4 text-red-400">{error}</div>;
  if (!initial) return <div className="p-4 text-white/40">加载中...</div>;

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">编辑角色</h1>
      <CharacterForm
        initial={initial}
        onSubmit={handleSubmit}
        submitLabel="保存"
        characterId={params.id}
        voiceStatus={voiceStatus}
      />
    </div>
  );
}
