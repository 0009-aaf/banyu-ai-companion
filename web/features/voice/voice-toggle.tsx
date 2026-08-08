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
            ? "bg-amber-500 text-white"
            : "bg-neutral-100 text-neutral-600"
      }`}
      title={voiceMode ? "切换到文字输入" : "切换到语音输入"}
    >
      {listening ? "听中..." : voiceMode ? "语音" : "文字"}
    </button>
  );
}
