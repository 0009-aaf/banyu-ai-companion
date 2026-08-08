/** 语音/文字切换按钮。 */

"use client";

interface VoiceToggleProps {
  voiceMode: boolean;
  onToggle: () => void;
  listening: boolean;
}

export function VoiceToggle({ voiceMode, onToggle, listening }: VoiceToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
        listening
          ? "bg-red-500 text-white animate-pulse"
          : voiceMode
            ? "bg-[#f0c958] text-[#0a0a1a]"
            : "bg-white/10 text-white/60"
      }`}
      title={voiceMode ? "切换到文字输入" : "切换到语音输入"}
    >
      {listening ? "听中" : voiceMode ? "文字" : "语音"}
    </button>
  );
}
