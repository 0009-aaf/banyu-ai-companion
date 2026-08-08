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
  volc: "火山引擎",
  qwen: "通义千问",
  deepseek: "DeepSeek",
  zhipu: "智谱",
};

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currentModel = useAuthStore((s) => s.currentModel);
  const setCurrentLlm = useAuthStore((s) => s.setCurrentLlm);

  const [providers, setProviders] = useState<ProviderOut[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadProviders() {
    setLoadingProviders(true);
    try {
      const data = await apiFetch<ProviderOut[]>("/llm/providers");
      setProviders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败");
    } finally {
      setLoadingProviders(false);
    }
  }

  useEffect(() => {
    loadProviders();
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

  async function loadModels(provider: string) {
    setActiveProvider(provider);
    setModels([]);
    setError(null);
    setMsg(null);
    setCurrentLlm(provider, "");
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
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">我的</h1>

      <div className="mb-4 rounded-lg bg-white p-4">
        <p className="text-sm text-neutral-500">昵称</p>
        <p className="mb-3">{user?.nickname ?? "伴语用户"}</p>
        <p className="text-sm text-neutral-500">邮箱</p>
        <p>{user?.email ?? "-"}</p>
      </div>

      <button
        onClick={() => router.push("/settings/notifications")}
        className="mb-4 flex w-full items-center justify-between rounded-lg bg-white p-4"
      >
        <span className="font-medium">通知设置</span>
        <span className="text-neutral-400">-></span>
      </button>

      <button
        onClick={() => router.push("/settings/memory")}
        className="mb-4 flex w-full items-center justify-between rounded-lg bg-white p-4"
      >
        <span className="font-medium">记忆管理</span>
        <span className="text-neutral-400">-></span>
      </button>

      <h2 className="mb-2 text-lg font-bold">AI 模型配置</h2>
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      {msg && <p className="mb-2 text-sm text-green-600">{msg}</p>}

      <div className="mb-3 space-y-2">
        {loadingProviders ? (
          <p className="text-sm text-neutral-400">加载中...</p>
        ) : (
          providers.map((p) => (
            <div
              key={p.provider}
              className="flex items-center justify-between rounded-lg bg-white p-3"
            >
              <span>{PROVIDER_LABELS[p.provider] ?? p.provider}</span>
              <div className="flex items-center gap-2">
                {p.has_key && (
                  <span className="text-xs text-green-600">已配置</span>
                )}
                <button
                  onClick={() => loadModels(p.provider)}
                  className={`text-sm ${
                    activeProvider === p.provider
                      ? "font-medium text-amber-600"
                      : "text-neutral-500"
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
        <div className="mb-4 rounded-lg bg-white p-4">
          <p className="mb-2 text-sm font-medium">
            配置 {PROVIDER_LABELS[activeProvider] ?? activeProvider} API Key
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="粘贴 API key"
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button
              onClick={handleSaveKey}
              disabled={savingKey || !keyInput.trim()}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {savingKey ? "..." : "保存"}
            </button>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-sm text-neutral-500">选择模型</p>
            {loadingModels ? (
              <p className="text-sm text-neutral-400">获取模型中...</p>
            ) : models.length === 0 ? (
              <p className="text-sm text-neutral-400">暂无模型（需配置有效 key）</p>
            ) : (
              <select
                value={currentModel ?? ""}
                onChange={(e) => setCurrentLlm(activeProvider, e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">选择模型...</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            {currentModel && (
              <p className="mt-1 text-xs text-amber-600">当前模型：{currentModel}</p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="mt-4 w-full rounded-lg border border-neutral-200 bg-white py-2 text-red-500"
      >
        退出登录
      </button>
    </div>
  );
}
