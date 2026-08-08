"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./message-bubble";
import { streamChat } from "./stream";
import { useAuthStore } from "@/lib/store";
import { VoiceInput, isASRSupported } from "@/features/voice/voice-input";
import { VoiceOutput, isTTSSupported } from "@/features/voice/voice-output";
import { VoiceToggle } from "@/features/voice/voice-toggle";

interface ChatMessage {
  id?: string;
  role: string;
  content: string;
}

interface ChatViewProps {
  convId: string;
  initialMessages: ChatMessage[];
}

export function ChatView({ convId, initialMessages }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const currentProvider = useAuthStore((s) => s.currentProvider);
  const currentModel = useAuthStore((s) => s.currentModel);
  const voiceEnabled = useAuthStore((s) => s.voiceEnabled);
  const endRef = useRef<HTMLDivElement>(null);
  const voiceInputRef = useRef<VoiceInput | null>(null);
  const voiceOutputRef = useRef<VoiceOutput | null>(null);
  const msgIdRef = useRef(0);
  const lastAssistantRef = useRef<string>("");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isASRSupported()) {
      voiceInputRef.current = new VoiceInput();
    }
    if (isTTSSupported()) {
      voiceOutputRef.current = new VoiceOutput();
    }
    return () => {
      voiceInputRef.current?.stop();
      voiceOutputRef.current?.stop();
    };
  }, []);

  async function handleSend() {
    const content = input.trim();
    if (!content || streaming) return;
    if (!currentProvider || !currentModel) {
      setError("请先在设置页选择模型");
      return;
    }
    setError(null);
    setInput("");
    lastAssistantRef.current = "";
    // 乐观加入用户消息 + 空 assistant 消息（流式拼接，稳定 key）
    const userKey = `local-${msgIdRef.current++}`;
    const assistantKey = `local-${msgIdRef.current++}`;
    setMessages((prev) => [
      ...prev,
      { id: userKey, role: "user", content },
      { id: assistantKey, role: "assistant", content: "" },
    ]);
    setStreaming(true);

    await streamChat(convId, content, currentProvider, currentModel, {
      onToken: (token) => {
        lastAssistantRef.current += token;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + token };
          }
          return next;
        });
      },
      onError: (err) => {
        setError(err);
        // 移除空 assistant 消息
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setStreaming(false);
      },
      onDone: () => {
        setStreaming(false);
        // TTS 移出 setState updater，避免 StrictMode 重复触发
        if (voiceEnabled && lastAssistantRef.current) {
          voiceOutputRef.current?.speak(lastAssistantRef.current);
        }
      },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleVoiceToggle() {
    if (voiceMode && listening) {
      voiceInputRef.current?.stop();
      setListening(false);
    } else {
      setVoiceMode(true);
      setInput("");
      setListening(true);
      voiceInputRef.current?.start({
        onInterim: (text) => setInput(text),
        onFinal: (text) => {
          setInput((prev) => (prev ? prev + text : text));
          setListening(false);
        },
        onError: (msg) => {
          setError(msg);
          setListening(false);
        },
        onEnd: () => setListening(false),
      });
    }
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">💬</span>
            <p className="text-sm text-white/40">
              开始和角色聊聊吧
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble key={m.id ?? i} role={m.role} content={m.content} />
          ))
        )}
        <div ref={endRef} />
      </div>
      {error && <p className="px-4 text-sm text-red-400">{error}</p>}
      <div className="border-t border-white/10 glass p-3">
        <div className="flex gap-2">
          {isASRSupported() && (
            <VoiceToggle
              voiceMode={voiceMode}
              listening={listening}
              onToggle={handleVoiceToggle}
            />
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={voiceMode ? (listening ? "正在听..." : "点击语音按钮说话") : "说点什么..."}
            disabled={streaming}
            className="flex-1 resize-none rounded-lg border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f0c958]/40"
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="rounded-lg bg-[#f0c958] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {streaming ? "..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
