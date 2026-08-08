"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import {
  isPushSupported,
  registerServiceWorker,
  subscribePush,
  unsubscribePush,
} from "@/features/push/push-subscribe";

export default function NotificationsPage() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isPushSupported());
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
    registerServiceWorker();
    // 检查是否已订阅（刷新后恢复正确状态）
    navigator.serviceWorker?.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(sub !== null))
      .catch(() => {});
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") {
          setError("需要通知权限才能接收主动消息");
          return;
        }
      }
      await subscribePush();
      setSubscribed(true);
      setMsg("通知已开启，角色会主动来找你~");
    } catch (err) {
      setError(err instanceof Error ? err.message : "订阅失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await unsubscribePush();
      setSubscribed(false);
      setMsg("通知已关闭");
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await apiFetch("/push/test", { method: "POST" });
      setMsg("测试推送已发送，请查看通知");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "测试失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleTrigger(period: string) {
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const result = await apiFetch<{ content: string; conversation_id: string }>(
        `/push/trigger/${period}`,
        { method: "POST" }
      );
      setMsg(`角色主动消息：${result.content}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "触发失败");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <div className="p-4">
        <h1 className="mb-4 text-xl font-bold">通知设置</h1>
        <p className="text-sm text-white/50">你的浏览器不支持 Web Push 通知</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">通知设置</h1>

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      {msg && <p className="mb-2 whitespace-pre-wrap text-sm text-green-400">{msg}</p>}

      <div className="mb-4 rounded-lg glass p-4">
        <p className="mb-2 text-sm text-white/50">通知权限</p>
        <p className="mb-3">
          {permission === "granted"
            ? "已授权"
            : permission === "denied"
              ? "已拒绝（请在浏览器设置中开启）"
              : "未授权"}
        </p>

        {!subscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading || permission === "denied"}
            className="w-full rounded-lg bg-[#f0c958] py-2 text-white disabled:opacity-50"
          >
            {loading ? "..." : "开启通知"}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-green-400">通知已开启</p>
            <button
              onClick={handleTest}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 glass py-2 text-sm"
            >
              发送测试推送
            </button>
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 glass py-2 text-sm text-red-400"
            >
              关闭通知
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg glass p-4">
        <p className="mb-3 text-sm font-medium">手动触发主动消息（测试用）</p>
        <div className="space-y-2">
          <button
            onClick={() => handleTrigger("morning")}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 glass py-2 text-sm"
          >
            早安问候
          </button>
          <button
            onClick={() => handleTrigger("evening")}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 glass py-2 text-sm"
          >
            晚安问候
          </button>
          <button
            onClick={() => handleTrigger("random")}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 glass py-2 text-sm"
          >
            随机问候
          </button>
        </div>
        <p className="mt-2 text-xs text-white/40">
          手动触发会立即生成一条主动消息，不等待定时任务。消息会出现在对话页。
        </p>
      </div>
    </div>
  );
}
