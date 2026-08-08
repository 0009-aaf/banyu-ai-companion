"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface ProviderOut {
  provider: string;
  has_key: boolean;
}
interface ModelsOut {
  provider: string;
  models: string[];
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  doubao: "豆包",
  volc: "火山引擎 Coding",
  qwen: "通义千问",
  "qwen-token": "千问 Token Plan",
  deepseek: "DeepSeek",
  zhipu: "智谱",
  "zhipu-coding": "智谱 Coding Plan",
};

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currentModel = useAuthStore((s) => s.currentModel);
  const setCurrentLlm = useAuthStore((s) => s.setCurrentLlm);
  const ttsVoice = useAuthStore((s) => s.ttsVoice);
  const setTtsVoice = useAuthStore((s) => s.setTtsVoice);

  const [providers, setProviders] = useState<ProviderOut[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [voices, setVoices] = useState<{ id: string; label: string }[]>([]);

  async function loadProviders() {
    setLoadingProviders(true);
    try {
      const data = await apiFetch<ProviderOut[]>("/llm/providers");
      setProviders(data);
      // 已配 key 的 provider 自动加载模型列表
      const configured = data.find((p) => p.has_key);
      if (configured) {
        await loadModels(configured.provider, true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败");
    } finally {
      setLoadingProviders(false);
    }
  }

  useEffect(() => {
    loadProviders();
    apiFetch<{ voices: { id: string; label: string }[]; default: string }>("/tts/voices")
      .then((data) => setVoices(data.voices))
      .catch(() => {});
  }, []);

  async function handleSaveKey() {
    if (!activeProvider || !keyInput.trim()) return;
    setSavingKey(true);
    setError(null);
    setMsg(null);
    try {
      await apiFetch("/llm/keys", {
        method: "PUT",
        body: JSON.stringify({ provider: activeProvider, api_key: keyInput.trim() }),
      });
      setKeyInput("");
      setMsg("key 已保存");
      await loadProviders();
      await loadModels(activeProvider);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存失败");
    } finally {
      setSavingKey(false);
    }
  }

  async function loadModels(provider: string, preserveModel = false) {
    setActiveProvider(provider);
    setModels([]);
    setError(null);
    setMsg(null);
    if (!preserveModel) {
      setCurrentLlm(provider, "");
    } else {
      setCurrentLlm(provider, useAuthStore.getState().currentModel ?? "");
    }
    setLoadingModels(true);
    try {
      const data = await apiFetch<ModelsOut>(`/llm/models/${provider}`);
      setModels(data.models);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "获取模型失败");
    } finally {
      setLoadingModels(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="p-4 md:max-w-2xl md:mx-auto">
      <h1 className="mb-4 text-xl font-bold">我的</h1>

      <div className="mb-4 rounded-lg glass p-4">
        <p className="text-sm text-white/50">昵称</p>
        <p className="mb-3">{user?.nickname ?? "伴语用户"}</p>
        <p className="text-sm text-white/50">邮箱</p>
        <p>{user?.email ?? "-"}</p>
      </div>

      <button
        onClick={() => router.push("/settings/notifications")}
        className="mb-4 flex w-full items-center justify-between rounded-lg glass p-4"
      >
        <span className="font-medium">通知设置</span>
        <span className="text-white/40">-></span>
      </button>

      <button
        onClick={() => router.push("/settings/memory")}
        className="mb-4 flex w-full items-center justify-between rounded-lg glass p-4"
      >
        <span className="font-medium">记忆管理</span>
        <span className="text-white/40">-></span>
      </button>

      <h2 className="mb-2 text-lg font-bold">AI 模型配置</h2>
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      {msg && <p className="mb-2 text-sm text-green-400">{msg}</p>}

      <div className="mb-3 space-y-2">
        {loadingProviders ? (
          <p className="text-sm text-white/40">加载中...</p>
        ) : (
          providers.map((p) => (
            <div
              key={p.provider}
              className="flex items-center justify-between rounded-lg glass p-3"
            >
              <span>{PROVIDER_LABELS[p.provider] ?? p.provider}</span>
              <div className="flex items-center gap-2">
                {p.has_key && (
                  <span className="text-xs text-green-400">已配置</span>
                )}
                <button
                  onClick={() => loadModels(p.provider)}
                  className={`text-sm ${
                    activeProvider === p.provider
                      ? "font-medium text-[#f0c958]"
                      : "text-white/50"
                  }`}
                >
                  选择
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {activeProvider && (
        <div className="mb-4 rounded-lg glass p-4">
          <p className="mb-2 text-sm font-medium">
            配置 {PROVIDER_LABELS[activeProvider] ?? activeProvider} API Key
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="粘贴 API key"
              className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f0c958]/40"
            />
            <button
              onClick={handleSaveKey}
              disabled={savingKey || !keyInput.trim()}
              className="rounded-lg bg-[#f0c958] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {savingKey ? "..." : "保存"}
            </button>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-sm text-white/50">选择或输入模型</p>
            {loadingModels ? (
              <p className="text-sm text-white/40">获取模型中...</p>
            ) : (
              <>
                <input
                  list="model-list"
                  value={currentModel ?? ""}
                  onChange={(e) => setCurrentLlm(activeProvider, e.target.value)}
                  placeholder="选择或输入模型名"
                  className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f0c958]/40"
                />
                <datalist id="model-list">
                  {models.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </>
            )}
            {currentModel && (
              <p className="mt-1 text-xs text-[#f0c958]">当前模型：{currentModel}</p>
            )}
          </div>
        </div>
      )}

      <h2 className="mb-2 text-lg font-bold">语音包</h2>
      <div className="mb-4 rounded-lg glass p-4">
        <p className="mb-2 text-sm text-white/50">TTS 语音包（Edge TTS 免费 Neural 语音）</p>
        <select
          value={ttsVoice}
          onChange={(e) => setTtsVoice(e.target.value)}
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f0c958]/40"
        >
          {voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleLogout}
        className="mt-4 w-full rounded-lg border border-white/10 glass py-2 text-red-400"
      >
        退出登录
      </button>
    </div>
  );
}
