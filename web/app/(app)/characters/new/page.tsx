"use client";

import { useRouter } from "next/navigation";
import { CharacterForm, type CharacterFormData } from "@/features/character/character-form";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface CharacterOut {
  id: string;
  name: string;
  persona: string;
  avatar_url: string | null;
  voice_config: unknown;
  proactive_config: unknown;
  is_default: boolean;
  user_id: string;
  created_at: string;
}

export default function NewCharacterPage() {
  const router = useRouter();
  const setCurrentCharacter = useAuthStore((s) => s.setCurrentCharacter);

  async function handleSubmit(data: CharacterFormData) {
    const created = await apiFetch<CharacterOut>("/characters", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setCurrentCharacter(created.id);
    router.push("/characters");
  }

  return (
    <div className="p-4 md:max-w-2xl md:mx-auto">
      <h1 className="mb-4 text-xl font-bold">新建角色</h1>
      <CharacterForm onSubmit={handleSubmit} submitLabel="创建" />
    </div>
  );
}
