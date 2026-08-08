"use client";

import { useRef, useState } from "react";
import { readTokenFromStorage } from "@/lib/api";

export type VoiceStatus = "none" | "training" | "ready" | "failed";

interface VoiceUploadProps {
  characterId: string;
  voiceStatus: VoiceStatus;
  onStatusChange: (status: VoiceStatus) => void;
}

const STATUS_LABEL: Record<VoiceStatus, string> = {
  none: "未克隆",
  training: "训练中...",
  ready: "已就绪",
  failed: "克隆失败",
};

export function VoiceUpload({ characterId, voiceStatus, onStatusChange }: VoiceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const statusClass =
    voiceStatus === "ready"
      ? "bg-green-500/20 text-green-300"
      : voiceStatus === "training"
        ? "bg-[#f0c958]/20 text-[#f0c958]"
        : voiceStatus === "failed"
          ? "bg-red-500/20 text-red-400"
          : "bg-white/10 text-white/60";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const token = readTokenFromStorage();
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/voice/clone/${characterId}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "上传失败");
      }
      const data = await res.json();
      onStatusChange(data.voice_status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">声音克隆</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
          {STATUS_LABEL[voiceStatus] ?? voiceStatus}
        </span>
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading || voiceStatus === "training"}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition hover:bg-white/10 disabled:opacity-50"
      >
        {uploading ? "上传中..." : "上传语音样本（WAV/MP3 ≤10MB）"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="audio/wav,audio/mpeg,audio/mp3"
        onChange={handleFile}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
