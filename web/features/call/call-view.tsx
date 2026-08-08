"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { streamChat } from "@/features/chat/stream";
import { useAuthStore } from "@/lib/store";
import { VoiceInput, isASRSupported } from "@/features/voice/voice-input";
import { VoiceOutput, isTTSSupported } from "@/features/voice/voice-output";
import { apiFetch } from "@/lib/api";
import { ParticleBackground } from "@/components/particle-background";

interface CharacterInfo {
  name: string;
  avatar_url: string | null;
}

export function CallView({ convId }: { convId: string }) {
  const router = useRouter();
  const [duration, setDuration] = useState(0);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [lastReply, setLastReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentProvider = useAuthStore((s) => s.currentProvider);
  const currentModel = useAuthStore((s) => s.currentModel);
  const voiceEnabled = useAuthStore((s) => s.voiceEnabled);

  const voiceInputRef = useRef<VoiceInput | null>(null);
  const voiceOutputRef = useRef<VoiceOutput | null>(null);
  const callActiveRef = useRef(true);
  const lastAssistantRef = useRef("");
  const speakingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const chars = await apiFetch<
          { id: string; name: string; avatar_url: string | null }[]
        >("/characters");
        const cid = useAuthStore.getState().currentCharacterId;
        const char = chars.find((c) => c.id === cid) ?? chars[0];
        if (char) setCharacter({ name: char.name, avatar_url: char.avatar_url });
      } catch (err) {
        console.error("获取角色信息失败:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isASRSupported()) voiceInputRef.current = new VoiceInput();
    if (isTTSSupported()) voiceOutputRef.current = new VoiceOutput();
    const startTimer = setTimeout(() => startListening(), 1500);
    return () => {
      clearTimeout(startTimer);
      callActiveRef.current = false;
      voiceInputRef.current?.stop();
      voiceOutputRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startListening() {
    if (!callActiveRef.current || !voiceInputRef.current) return;
    if (speakingRef.current) return;
    setListening(true);
    voiceInputRef.current.start({
      onInterim: () => {},
      onFinal: (text) => {
        setListening(false);
        if (text.trim()) {
          sendMessage(text.trim());
        } else if (callActiveRef.current) {
          setTimeout(() => startListening(), 500);
        }
      },
      onError: (msg) => {
        setListening(false);
        setError(msg);
        if (callActiveRef.current) setTimeout(() => startListening(), 1500);
      },
      onEnd: () => {
        setListening(false);
        if (callActiveRef.current && !speakingRef.current) {
          setTimeout(() => startListening(), 500);
        }
      },
    });
  }

  async function sendMessage(content: string) {
    if (!currentProvider || !currentModel) {
      setError("请先在设置页选择模型");
      return;
    }
    setError(null);
    lastAssistantRef.current = "";
    setLastReply("");
    await streamChat(convId, content, currentProvider, currentModel, {
      onToken: (token) => {
        lastAssistantRef.current += token;
        setLastReply(lastAssistantRef.current);
      },
      onError: (err) => {
        setError(err);
        if (callActiveRef.current) startListening();
      },
      onDone: () => {
        if (voiceEnabled && lastAssistantRef.current && voiceOutputRef.current) {
          speakingRef.current = true;
          setSpeaking(true);
          voiceOutputRef.current.speak(lastAssistantRef.current, () => {
            speakingRef.current = false;
            setSpeaking(false);
            setLastReply("");
            if (callActiveRef.current) startListening();
          });
        } else {
          if (callActiveRef.current) startListening();
        }
      },
    });
  }

  function handleHangup() {
    callActiveRef.current = false;
    voiceInputRef.current?.stop();
    voiceOutputRef.current?.stop();
    router.back();
  }

  const mins = Math.floor(duration / 60).toString().padStart(2, "0");
  const secs = (duration % 60).toString().padStart(2, "0");

  return (
    <div
      className="relative flex h-screen flex-col items-center justify-between md:max-w-md md:mx-auto"
      style={{ background: "linear-gradient(to bottom, #0a0a1a, #1a1a3a)" }}
    >
      <ParticleBackground type="sakura" count={30} />
      <div className="relative z-10 pt-12 text-center">
        <p className="text-sm text-white/50">
          {listening ? "正在听..." : speaking ? "正在说话..." : "通话中"}
        </p>
        <p className="mt-1 text-2xl font-mono text-white">{mins}:{secs}</p>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        {character?.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className={`h-40 w-40 rounded-full object-cover ${speaking ? "breathe" : ""}`}
          />
        ) : (
          <div
            className={`flex h-40 w-40 items-center justify-center rounded-full bg-[#f0c958]/15 text-5xl font-medium text-[#f0c958] ${speaking ? "breathe" : ""}`}
          >
            {character?.name?.charAt(0) ?? "?"}
          </div>
        )}
        <p className="text-lg text-white">{character?.name ?? "角色"}</p>
        {lastReply && (
          <p className="max-w-[80%] rounded-2xl glass px-4 py-2 text-center text-sm text-white/80">
            {lastReply}
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="relative z-10 pb-12">
        <button
          onClick={handleHangup}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95"
          title="挂断"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.27.37 2 2 0 0 1 1.82 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
            <line x1="22" y1="2" x2="2" y2="22" />
          </svg>
        </button>
      </div>
    </div>
  );
}
